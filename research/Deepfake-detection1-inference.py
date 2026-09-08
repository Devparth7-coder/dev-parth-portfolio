"""Model loading, hybrid forward pass, and forensic fallback scoring.

If ``weights/deepfake_detector.pth`` is present the full ResNeXt-50 + LSTM
stack is used. Otherwise the ImageNet-pretrained spatial extractor still
runs and a temporal-consistency forensic head produces the logit — so the
MVP is end-to-end usable before FaceForensics++ / DFDC / Celeb-DF training.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np
import torch
import torch.nn.functional as F

from config import ALLOW_PICKLE_WEIGHTS, BACKBONE, SPATIAL_BATCH, TORCH_THREADS, WEIGHTS_PATH
from model import DeepfakeDetector
from security import assert_safe_weights_path
from pipeline import ExtractionResult, faces_to_tensor

logger = logging.getLogger("sentinel.inference")

_ENGINE: Optional["InferenceEngine"] = None


def configure_torch() -> None:
    torch.set_num_threads(max(1, TORCH_THREADS))
    torch.set_num_interop_threads(1)
    try:
        torch.set_grad_enabled(False)
    except Exception:
        pass


class InferenceEngine:
    def __init__(self, backbone: str = BACKBONE, weights: Path = WEIGHTS_PATH) -> None:
        configure_torch()
        self.device = torch.device("cpu")
        self.backbone = backbone
        self.weights_path = Path(weights)
        try:
            self.weights_path = assert_safe_weights_path(self.weights_path)
        except PermissionError:
            logger.error("Refusing weights path outside weights/: %s", self.weights_path)
            self.weights_path = Path("/nonexistent")
        self.weights_loaded = False
        self.mode = "backbone_forensics"

        logger.info("Building DeepfakeDetector backbone=%s", backbone)
        try:
            self.model = DeepfakeDetector(
                backbone=backbone, lstm_hidden=512, lstm_layers=2, dropout=0.5, pretrained=True
            )
        except Exception as exc:
            logger.warning("Requested backbone %s failed (%s); falling back to resnet18", backbone, exc)
            self.backbone = "resnet18"
            self.model = DeepfakeDetector(
                backbone="resnet18", lstm_hidden=256, lstm_layers=2, dropout=0.5, pretrained=True
            )

        self.model.eval()
        if self.weights_path.exists():
            self._load_weights(self.weights_path)
        else:
            logger.warning(
                "No trained checkpoint at %s — using ImageNet spatial features + "
                "temporal forensic head. Train with scripts/train.py for production accuracy.",
                self.weights_path,
            )

        self.model.to(self.device)
        n_params = sum(p.numel() for p in self.model.parameters())
        logger.info(
            "Engine ready  backbone=%s  params=%.1fM  mode=%s",
            self.backbone,
            n_params / 1e6,
            self.mode,
        )

    def _load_weights(self, path: Path) -> None:
        path = assert_safe_weights_path(path)
        try:
            blob = torch.load(path, map_location="cpu", weights_only=True)
        except Exception as exc:
            if not ALLOW_PICKLE_WEIGHTS:
                raise RuntimeError(
                    "Checkpoint is not a safe tensor state dict. Re-export it or set SENTINEL_ALLOW_PICKLE=1"
                ) from exc
            logger.warning("weights_only load failed (%s); pickle allowed by env", exc)
            blob = torch.load(path, map_location="cpu", weights_only=False)
        state = blob["state_dict"] if isinstance(blob, dict) and "state_dict" in blob else blob
        missing, unexpected = self.model.load_state_dict(state, strict=False)
        self.weights_loaded = True
        self.mode = "trained_hybrid"
        logger.info("Loaded checkpoint %s (missing=%s unexpected=%s)", path, missing, unexpected)

    @torch.inference_mode()
    def run(self, extraction: ExtractionResult) -> dict[str, Any]:
        if extraction.n_faces < 4:
            raise RuntimeError(
                f"Need at least 4 detected faces to classify a clip (got {extraction.n_faces})."
            )

        tensor = faces_to_tensor(extraction.faces_bgr).to(self.device)
        lengths = torch.tensor([tensor.shape[1]], dtype=torch.long)

        spatial_feats = self._spatial_sequence(tensor)  # [T, D]
        forensic = self._forensic_scores(spatial_feats, extraction)

        hybrid_logit = float(
            self.model(tensor, lengths=lengths, chunk_size=SPATIAL_BATCH).view(-1)[0].cpu()
        )

        if self.weights_loaded:
            logit = hybrid_logit
            source = "cnn_rnn"
        else:
            logit = forensic["logit"]
            source = "temporal_forensics"

        probability = float(1.0 / (1.0 + np.exp(-np.clip(logit, -20, 20))))
        label = "FAKE" if probability >= 0.5 else "REAL"
        confidence = probability if label == "FAKE" else (1.0 - probability)

        sims = forensic["cosine_series"]
        return {
            "label": label,
            "probability_fake": round(probability, 4),
            "confidence": round(float(confidence), 4),
            "logit": round(float(logit), 4),
            "hybrid_logit": round(float(hybrid_logit), 4),
            "score_source": source,
            "mode": self.mode,
            "backbone": self.backbone,
            "weights_loaded": self.weights_loaded,
            "forensics": {
                "mean_cosine": forensic["mean_cosine"],
                "std_cosine": forensic["std_cosine"],
                "mean_laplacian": forensic["mean_laplacian"],
                "std_laplacian": forensic["std_laplacian"],
                "flicker": forensic["flicker"],
                "oversmooth": forensic["oversmooth"],
            },
            "cosine_series": sims,
        }

    def _spatial_sequence(self, tensor: torch.Tensor) -> torch.Tensor:
        """[1, T, 3, H, W] → [T, D] L2-normalised embeddings."""
        b, t, c, h, w = tensor.shape
        flat = tensor.reshape(b * t, c, h, w)
        feats = self.model.extract_spatial(flat, chunk_size=SPATIAL_BATCH)
        feats = F.normalize(feats, dim=-1)
        return feats.reshape(t, -1)

    def _forensic_scores(self, feats: torch.Tensor, extraction: ExtractionResult) -> dict[str, Any]:
        """Temporal-consistency prior over ImageNet embeddings + sharpness."""
        f = feats.cpu()
        t = f.shape[0]
        if t < 2:
            return {
                "logit": 0.0,
                "mean_cosine": 1.0,
                "std_cosine": 0.0,
                "mean_laplacian": 0.0,
                "std_laplacian": 0.0,
                "flicker": 0.0,
                "oversmooth": 0.0,
                "cosine_series": [1.0],
            }

        sims = (f[:-1] * f[1:]).sum(dim=-1)  # cosine, already L2-normalised
        sims_np = sims.numpy().astype(np.float64)
        mean_cos = float(sims_np.mean())
        std_cos = float(sims_np.std())

        laps = np.array(
            [m.laplacian_var for m in extraction.frame_meta if m.has_face], dtype=np.float64
        )
        mean_lap = float(laps.mean()) if len(laps) else 0.0
        std_lap = float(laps.std()) if len(laps) else 0.0

        # Identity flicker: real talking-heads sit around high cosine (~0.90–0.98)
        # with modest variance. Face-swaps often dip or spike frame-to-frame.
        flicker = float(np.clip((std_cos - 0.02) / 0.10, 0.0, 1.0))
        # Over-smooth blending (low Laplacian variance on 224 crops).
        oversmooth = float(np.clip((80.0 - mean_lap) / 80.0, 0.0, 1.0))
        # Unnaturally *too* similar (frozen GAN face) — mean cosine extremely high
        # combined with near-zero motion in embeddings.
        frozen = float(np.clip((mean_cos - 0.992) / 0.008, 0.0, 1.0)) if mean_cos > 0.99 else 0.0

        evidence = 0.50 * flicker + 0.30 * oversmooth + 0.20 * frozen
        evidence = float(np.clip(evidence, 0.02, 0.98))
        # Convert to logit so the API is uniform with the trained head.
        logit = float(np.log(evidence / (1.0 - evidence)))

        return {
            "logit": logit,
            "mean_cosine": round(mean_cos, 4),
            "std_cosine": round(std_cos, 4),
            "mean_laplacian": round(mean_lap, 2),
            "std_laplacian": round(std_lap, 2),
            "flicker": round(flicker, 4),
            "oversmooth": round(oversmooth, 4),
            "cosine_series": [round(float(s), 4) for s in sims_np.tolist()],
        }


def get_engine() -> InferenceEngine:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = InferenceEngine()
    return _ENGINE
