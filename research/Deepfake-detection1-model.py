# SPDX-License-Identifier: Apache-2.0
"""CNN-RNN hybrid and Binary Focal Loss for spatiotemporal deepfake detection.

Architecture
------------
* Spatial extractor : pretrained ResNeXt-50 (32x4d) or EfficientNet-B3 with the
  classification head stripped. Each aligned 224x224 face becomes a D-dimensional
  embedding (D=2048 for ResNeXt-50, D=1536 for EfficientNet-B3).
* Temporal modeler  : 2-layer LSTM over the frame sequence, capturing identity
  flicker, blending discontinuities and other time-domain artefacts.
* Classifier        : MLP that emits a **single raw logit**. No sigmoid — the
  loss (and inference) apply the sigmoid themselves for numerical stability.

Label convention: logit > 0 favours FAKE (class 1), the minority class that
Focal Loss is tuned to emphasise.
"""

from __future__ import annotations

from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import Tensor


BACKBONE_SPECS = {
    "resnext50": {
        "builder": "resnext50_32x4d",
        "weights": "ResNeXt50_32X4D_Weights",
        "feat_dim": 2048,
        "pool_attr": None,  # replace `.fc`
    },
    "efficientnet_b3": {
        "builder": "efficientnet_b3",
        "weights": "EfficientNet_B3_Weights",
        "feat_dim": 1536,
        "pool_attr": "classifier",
    },
    "resnet18": {
        "builder": "resnet18",
        "weights": "ResNet18_Weights",
        "feat_dim": 512,
        "pool_attr": None,
    },
}


def _build_spatial_backbone(name: str, pretrained: bool) -> tuple[nn.Module, int]:
    """Return (backbone_without_head, feature_dim)."""
    from torchvision import models

    key = name.lower().replace("-", "_")
    if key not in BACKBONE_SPECS:
        raise ValueError(f"Unknown backbone '{name}'. Choose from {list(BACKBONE_SPECS)}")

    spec = BACKBONE_SPECS[key]
    builder = getattr(models, spec["builder"])
    weights = None
    if pretrained:
        weights_enum = getattr(models, spec["weights"])
        weights = weights_enum.DEFAULT

    net = builder(weights=weights)

    if key.startswith("efficientnet"):
        feat_dim = net.classifier[1].in_features
        net.classifier = nn.Identity()
    else:
        feat_dim = net.fc.in_features
        net.fc = nn.Identity()

    return net, int(feat_dim)


class DeepfakeDetector(nn.Module):
    """ResNeXt-50 (spatial) + LSTM (temporal) + linear logit head.

    Parameters
    ----------
    backbone:
        ``resnext50`` (default), ``efficientnet_b3`` or ``resnet18``.
    lstm_hidden:
        Hidden size of the LSTM.
    lstm_layers:
        Number of stacked LSTM layers.
    dropout:
        Applied between LSTM layers and inside the classifier.
    bidirectional:
        If True, the classifier sees a concatenation of both directions.
    pretrained:
        Load ImageNet weights for the spatial extractor.
    """

    def __init__(
        self,
        backbone: str = "resnext50",
        lstm_hidden: int = 512,
        lstm_layers: int = 2,
        dropout: float = 0.5,
        bidirectional: bool = False,
        pretrained: bool = True,
    ) -> None:
        super().__init__()
        self.backbone_name = backbone
        self.lstm_hidden = lstm_hidden
        self.lstm_layers = lstm_layers
        self.bidirectional = bidirectional

        self.spatial, self.feat_dim = _build_spatial_backbone(backbone, pretrained)

        self.lstm = nn.LSTM(
            input_size=self.feat_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0.0,
            bidirectional=bidirectional,
        )

        direction_mult = 2 if bidirectional else 1
        rnn_out = lstm_hidden * direction_mult
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(rnn_out, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.6),
            nn.Linear(128, 1),
        )

        self._init_temporal_heads()

    def _init_temporal_heads(self) -> None:
        """Orthogonal LSTM + small-gain linear heads — keeps logits near 0 at start."""
        for name, param in self.lstm.named_parameters():
            if "weight_ih" in name:
                nn.init.xavier_uniform_(param)
            elif "weight_hh" in name:
                nn.init.orthogonal_(param)
            elif "bias" in name:
                nn.init.zeros_(param)
                # Forget-gate bias = 1 encourages remembering early frames.
                hidden = self.lstm_hidden
                param.data[hidden : 2 * hidden].fill_(1.0)
        for module in self.classifier.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight, gain=0.25)
                nn.init.zeros_(module.bias)

    def extract_spatial(self, frames: Tensor, chunk_size: int = 4) -> Tensor:
        """Encode a flattened batch of faces.

        Parameters
        ----------
        frames:
            ``[N, 3, 224, 224]`` ImageNet-normalised RGB tensors.
        chunk_size:
            Micro-batch size so CPU / low-RAM hosts don't OOM on ResNeXt-50.

        Returns
        -------
        ``[N, feat_dim]`` embeddings.
        """
        chunks: list[Tensor] = []
        n = frames.shape[0]
        for start in range(0, n, chunk_size):
            piece = frames[start : start + chunk_size]
            chunks.append(self.spatial(piece))
        return torch.cat(chunks, dim=0)

    def forward(
        self,
        x: Tensor,
        lengths: Optional[Tensor] = None,
        chunk_size: int = 4,
    ) -> Tensor:
        """
        Parameters
        ----------
        x:
            Face sequence ``[B, T, 3, 224, 224]``.
        lengths:
            Optional true sequence lengths ``[B]`` (used with padding).
        chunk_size:
            Spatial micro-batch.

        Returns
        -------
        logits : ``[B]`` raw scores (no sigmoid).
        """
        if x.dim() != 5:
            raise ValueError(f"expected [B, T, 3, H, W], got {tuple(x.shape)}")

        batch, seq, channels, height, width = x.shape
        flat = x.reshape(batch * seq, channels, height, width)
        feats = self.extract_spatial(flat, chunk_size=chunk_size)
        feats = feats.view(batch, seq, self.feat_dim)

        if lengths is not None:
            lengths_cpu = lengths.detach().cpu().clamp(min=1, max=seq)
            packed = nn.utils.rnn.pack_padded_sequence(
                feats, lengths_cpu, batch_first=True, enforce_sorted=False
            )
            packed_out, (hidden, _cell) = self.lstm(packed)
            # hidden: [num_layers * directions, B, H]
        else:
            _out, (hidden, _cell) = self.lstm(feats)

        if self.bidirectional:
            # Last layer forward + last layer backward.
            directions = 2
            last_layer = hidden.view(self.lstm_layers, directions, batch, self.lstm_hidden)[-1]
            pooled = torch.cat([last_layer[0], last_layer[1]], dim=-1)
        else:
            pooled = hidden[-1]

        logits = self.classifier(pooled).squeeze(-1)
        return logits

    def predict_proba(
        self,
        x: Tensor,
        lengths: Optional[Tensor] = None,
        chunk_size: int = 4,
    ) -> Tensor:
        """Sigmoid probabilities ``P(FAKE | x)`` in ``[0, 1]``."""
        return torch.sigmoid(self.forward(x, lengths=lengths, chunk_size=chunk_size))


class BinaryFocalLoss(nn.Module):
    r"""Binary Focal Loss with logits, for severe real/fake imbalance.

    .. math::

        FL(p_t) = -\alpha_t (1 - p_t)^{\gamma} \log(p_t)

    Implemented via ``binary_cross_entropy_with_logits`` so the ``log(p_t)``
    term is numerically stable (the sigmoid is fused into the CUDA/CPU kernel).

    Defaults follow the project spec: ``γ = 2.0``, ``α = 0.75`` with fakes as
    the minority / positive class (``target == 1``).
    """

    def __init__(
        self,
        gamma: float = 2.0,
        alpha: float = 0.75,
        reduction: str = "mean",
    ) -> None:
        super().__init__()
        if gamma < 0:
            raise ValueError("gamma must be >= 0")
        if not 0.0 <= alpha <= 1.0:
            raise ValueError("alpha must be in [0, 1]")
        if reduction not in {"mean", "sum", "none"}:
            raise ValueError("reduction must be mean|sum|none")
        self.gamma = float(gamma)
        self.alpha = float(alpha)
        self.reduction = reduction

    def forward(self, logits: Tensor, targets: Tensor) -> Tensor:
        """
        Parameters
        ----------
        logits:
            Raw scores ``[N]`` or ``[N, 1]``.
        targets:
            Binary labels ``[N]`` (float or long), 1 = FAKE, 0 = REAL.
        """
        logits = logits.view(-1).float()
        targets = targets.view(-1).float()
        if logits.shape != targets.shape:
            raise ValueError(f"shape mismatch: logits {tuple(logits.shape)} vs targets {tuple(targets.shape)}")

        # bce_i = -log(p_t).  pt = exp(-bce) ∈ (0, 1].
        bce = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        pt = torch.exp(-bce)
        alpha_t = self.alpha * targets + (1.0 - self.alpha) * (1.0 - targets)
        loss = alpha_t * (1.0 - pt).pow(self.gamma) * bce

        if self.reduction == "mean":
            return loss.mean()
        if self.reduction == "sum":
            return loss.sum()
        return loss

    def extra_repr(self) -> str:
        return f"gamma={self.gamma}, alpha={self.alpha}, reduction={self.reduction}"
