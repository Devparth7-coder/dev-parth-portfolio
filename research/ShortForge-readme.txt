# ShortForge

A local Python studio that turns a topic into a TikTok / YouTube Shorts–style video.

1. Writes a spoken script (OpenAI, Gemini, or a built-in template)
2. Pulls free Pexels stock clips when you add a Pexels key (otherwise motion backgrounds)
3. Narrates with Microsoft Edge neural TTS (`edge-tts`), falling back to gTTS
4. Burns captions and mixes looping background music
5. Exports **1080×1920 (9:16)** or **1920×1080 (16:9)** H.264 MP4

## Run

```bash
cd shortforge
pip install -r requirements.txt
# ffmpeg/ffprobe are in ./bin (static build) — the app uses them automatically
python app.py
```

Open the web UI (port 5000). Paste API keys under **API keys** if you have them:

| Key | Used for |
| --- | --- |
| OpenAI | Script JSON (`gpt-4o-mini`) |
| Gemini | Script JSON (`gemini-2.0-flash`) |
| Pexels | Free stock video search |

Without keys, generation still completes using the local script and generated B-roll.

## UI options

- Format: vertical 9:16 or horizontal 16:9
- Voice: several `en-*` neural voices
- Subtitle style: TikTok punch, YouTube box, minimal, neon
- Music bed + volume slider

Renders land in `output/` and show up in the Recent list.
