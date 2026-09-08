#!/usr/bin/env python3
"""ShortForge — automated short-form video studio."""

from __future__ import annotations

import json
import queue
import threading
from pathlib import Path

from flask import Flask, Response, jsonify, render_template, request, send_from_directory

import pipeline as sf

app = Flask(__name__)
JOBS: dict[str, dict] = {}


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/options")
def options():
    cfg = sf.load_config()
    return jsonify(
        {
            "voices": sf.EDGE_VOICES,
            "subtitle_styles": list(sf.SUBTITLE_STYLES.keys()),
            "music": [{"id": m["id"], "label": m["label"]} for m in sf.MUSIC_TRACKS],
            "formats": ["vertical", "horizontal"],
            "providers": ["auto", "openai", "gemini", "fallback"],
            "keys": {
                "openai": bool(cfg.get("openai_api_key")),
                "gemini": bool(cfg.get("gemini_api_key")),
                "pexels": bool(cfg.get("pexels_api_key")),
            },
        }
    )


@app.post("/api/settings")
def settings():
    data = request.get_json(force=True) or {}
    allowed = ("openai_api_key", "gemini_api_key", "pexels_api_key")
    sf.save_config({k: data[k] for k in allowed if k in data})
    return jsonify({"ok": True})


@app.get("/api/videos")
def list_videos():
    items = []
    for p in sorted(sf.OUTPUT_DIR.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True):
        meta = p.with_suffix(".json")
        info = json.loads(meta.read_text()) if meta.exists() else {}
        items.append(
            {
                "file": p.name,
                "size": p.stat().st_size,
                "title": info.get("title") or p.stem,
                "caption": info.get("caption", ""),
                "format": info.get("format", ""),
            }
        )
    return jsonify(items)


@app.get("/videos/<path:name>")
def video_file(name):
    return send_from_directory(sf.OUTPUT_DIR, name)


@app.post("/api/generate")
def generate():
    opts = request.get_json(force=True) or {}
    job_id = sf.slugify(opts.get("topic") or "job")
    q: queue.Queue = queue.Queue()
    JOBS[job_id] = {"q": q, "status": "running", "result": None, "error": None}

    def worker():
        logs = []

        def log(msg: str):
            logs.append(msg)
            q.put({"type": "log", "message": msg})

        try:
            result = sf.produce(opts, log)
            meta = {
                "title": result["script"].get("title"),
                "caption": result["script"].get("caption"),
                "format": result["format"],
                "script": result["script"],
            }
            (sf.OUTPUT_DIR / f"{result['file'].rsplit('.', 1)[0]}.json").write_text(
                json.dumps(meta, indent=2)
            )
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["result"] = result
            q.put({"type": "done", "result": result})
        except Exception as e:
            JOBS[job_id]["status"] = "error"
            JOBS[job_id]["error"] = str(e)
            q.put({"type": "error", "message": str(e)})
        finally:
            q.put(None)

    threading.Thread(target=worker, daemon=True).start()
    return jsonify({"job_id": job_id})


@app.get("/api/stream/<job_id>")
def stream(job_id):
    job = JOBS.get(job_id)
    if not job:
        return jsonify({"error": "unknown job"}), 404

    def gen():
        q = job["q"]
        while True:
            ev = q.get()
            if ev is None:
                break
            yield f"data: {json.dumps(ev)}\n\n"

    return Response(gen(), mimetype="text/event-stream")


if __name__ == "__main__":
    sf.OUTPUT_DIR.mkdir(exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
