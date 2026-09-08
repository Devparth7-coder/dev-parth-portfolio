# SENTINEL

[![License](https://img.shields.io/badge/license-Apache%202.0-3ee0c5.svg)](LICENSE)

**A scalable, asynchronous microservices framework for spatiotemporal deepfake detection.**  
Author: **Dev Parth**

The API gateway never runs inference. A client `POST`s an `.mp4`, FastAPI writes it to disk, Celery pushes the job onto Redis, and the handler returns a `task_id` immediately. A dedicated worker samples 32 frames with OpenCV, aligns faces with YuNet (MTCNN / Haar fallback), and classifies the sequence with a ResNeXt-50 + LSTM hybrid trained under Binary Focal Loss.

```
client ──POST /api/v1/detect──► FastAPI ──file──► data/uploads/
                                   │
                                   └── task_id ──► Redis / Celery
                                                      │
                                                      ▼
                                              worker.py pipeline
                                              1. uniform 30–40 frames
                                              2. YuNet/MTCNN crop 224×224
                                              3. ResNeXt-50 → LSTM → logit
                                              4. REAL | FAKE + confidence
                                                      │
client ──GET /api/v1/status/{id}──► FastAPI ◄── Redis job dict
```

## Stack

| Layer | Choice |
|---|---|
| API gateway | FastAPI |
| Task queue | Celery + Redis |
| Computer vision | OpenCV + YuNet / MTCNN / Haar |
| Deep learning | PyTorch · ResNeXt-50 + LSTM |
| Loss | `BinaryFocalLoss` γ=2.0, α=0.75 |
| Frontend | Static workbench served by the same API |

## Layout

```
main.py              FastAPI endpoints
worker.py            Celery task + pipeline orchestration
model.py             DeepfakeDetector + BinaryFocalLoss
pipeline.py          Frame sampling, face detect, align
inference.py         Engine (trained hybrid or forensic fallback)
jobstore.py          Redis job dictionary
security.py          Headers, rate limits, upload sandbox
samplegen.py         Bundled talking-head clip
scripts/train.py     FaceForensics++ / DFDC / Celeb-DF trainer
web/                 Workbench UI
weights/             YuNet ONNX + optional .pth checkpoint
LICENSE / NOTICE     Apache 2.0
SECURITY.md          Vulnerability disclosure + threat model
```

## API

**`POST /api/v1/detect`** — multipart field `file`. Returns `202 { task_id, status: "queued" }`.

**`GET /api/v1/status/{task_id}`** — poll until `status` is `completed` or `failed`. On success:

```json
{
  "label": "FAKE",
  "confidence": 0.87,
  "probability_fake": 0.87,
  "logit": 1.91,
  "frames_sampled": 32,
  "faces_detected": 30
}
```

Also: `POST /api/v1/detect/sample`, `GET /api/v1/health`, `GET /api/v1/model`, interactive docs at `/api/docs`.

## Run locally

```bash
python -m pip install -r requirements.txt
# Redis on :6379  (docker run -p 6379:6379 redis:7-alpine)
bash scripts/start.sh
```

Open `http://127.0.0.1:8000`. Drop a video or click **Run bundled sample**.

Without Redis the API falls back to a single in-process worker thread so the MVP still functions.

## Neural net

`DeepfakeDetector` in `model.py`:

1. **Spatial extractor** — `resnext50_32x4d` (or EfficientNet-B3 / ResNet-18). Classification head replaced with `Identity`. Output dim 2048.
2. **Temporal modeler** — 2-layer LSTM, hidden 512, `batch_first=True`.
3. **Classifier** — Dropout → Linear 128 → ReLU → Linear 1. **Raw logit, no sigmoid.**

Input tensor: `[B, T, 3, 224, 224]`, ImageNet mean/std, `T=32`.

## Focal loss

```
FL(p_t) = -α_t (1 - p_t)^γ log(p_t)
```

Implemented with `binary_cross_entropy_with_logits` for stability. Defaults γ=2.0, α=0.75, **fake = 1** (minority / positive class). Easy “real” examples are down-weighted so training concentrates on high-quality manipulations.

## Training

Arrange clips as:

```
data/datasets/train/{real,fake}/*.mp4
data/datasets/val/{real,fake}/*.mp4
```

FaceForensics++ originals → `real/`; Deepfakes, Face2Face, FaceSwap, NeuralTextures → `fake/`. Same idea for DFDC and Celeb-DF.

```bash
python scripts/train.py --data data/datasets --epochs 20 --backbone resnext50
```

The first `--freeze-epochs` (default 3) train only the LSTM + head; then the backbone is unfrozen at 10× lower LR. The best checkpoint is written to `weights/deepfake_detector.pth` and picked up automatically on the next worker boot.

Until that file exists the engine still runs the ImageNet-pretrained spatial extractor and a temporal-consistency forensic head (embedding flicker + Laplacian oversmooth). The UI labels this mode explicitly — it is a demo prior, not a substitute for FF++/DFDC training.

## Tests

```bash
python tests/test_model.py
python tests/test_security.py
```

## License

Copyright 2026 Dev Parth.

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Third-party runtimes (PyTorch, FastAPI, Celery, OpenCV, Redis) remain under their own terms.

## Security

Untrusted video is the main attack surface. The gateway:

- stores uploads under a UUID, never the client filename
- rejects non-video magic bytes, oversize / overlong / over-resolution clips
- rate-limits detect and poll
- returns an allowlisted job JSON (no tracebacks, no absolute paths)
- confines worker paths to `data/uploads` and `sample/`
- loads checkpoints with `torch.load(..., weights_only=True)`
- serialises Celery as JSON only (no pickle)
- emits CSP / nosniff / Referrer-Policy; HSTS + `X-Frame-Options` in production

Set `ENVIRONMENT=production` and `API_KEY` before exposing the API. Full policy, threat model and reporting instructions: [SECURITY.md](SECURITY.md). Machine-readable contact: [/.well-known/security.txt](.well-known/security.txt).

## Docker

```bash
docker compose up --build
```

API on `:8000`, worker attached to Redis, shared `data/` and `weights/` volumes.

## Configuration

| Env | Default | Meaning |
|---|---|---|
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Broker + job store |
| `BACKBONE` | `resnext50` | `resnext50` \| `efficientnet_b3` \| `resnet18` |
| `SEQ_LEN` | `32` | Frames sampled per video (30–40) |
| `SPATIAL_BATCH` | `4` | CNN micro-batch (keep small on CPU) |
| `WEIGHTS_PATH` | `weights/deepfake_detector.pth` | Trained hybrid checkpoint |
| `ENVIRONMENT` | `development` | `production` hides docs, enables HSTS, deletes uploads |
| `API_KEY` | unset | Require `X-API-Key` on detect / status |
| `CORS_ORIGINS` | `*` | Comma-separated origins in production |
| `DELETE_UPLOAD_AFTER` | false (true in prod) | Unlink clips when the job finishes |
