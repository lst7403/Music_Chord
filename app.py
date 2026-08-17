import os
import csv
from pathlib import Path
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Chord Vision - Music & Chord Web App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# Mount static assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def get_safe_data_path(filename: str) -> Path:
    """Ensure requested file resides strictly within DATA_DIR to prevent path traversal."""
    # Sanitize and resolve
    clean_name = Path(filename).name
    file_path = (DATA_DIR / clean_name).resolve()
    if not str(file_path).startswith(str(DATA_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return file_path


@app.get("/api/chords")
def get_chords():
    """Parse and return chord progression from data/chords.csv."""
    csv_path = DATA_DIR / "chords.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="chords.csv not found in data directory")

    chords: List[Dict] = []
    total_duration = 0.0
    chord_counts: Dict[str, float] = {}

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                start = float(row["start"])
                end = float(row["end"])
                chord = str(row["chord"]).strip()
                duration = float(row.get("duration", round(end - start, 3)))
                
                chords.append({
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "chord": chord,
                    "duration": round(duration, 3)
                })

                if end > total_duration:
                    total_duration = end

                if chord != "N":
                    chord_counts[chord] = chord_counts.get(chord, 0.0) + duration
            except (ValueError, KeyError):
                continue

    # Sort top chords by duration
    sorted_top_chords = sorted(chord_counts.items(), key=lambda x: x[1], reverse=True)

    return {
        "total_chords": len(chords),
        "total_duration": round(total_duration, 3),
        "chords": chords,
        "top_chords": [{"chord": c, "duration": round(d, 2)} for c, d in sorted_top_chords[:12]],
    }


@app.get("/api/stems")
def get_stems():
    """List available audio stems in data directory."""
    expected_stems = [
        {"id": "music", "name": "Full Mix (Original)", "file": "music.mp3", "icon": "🎵"},
        {"id": "accompaniment", "name": "Accompaniment (Bass+Other)", "file": "bass_other.wav", "fallback": "accompaniment.wav", "icon": "🎹"},
        {"id": "vocals", "name": "Vocals", "file": "vocals.wav", "icon": "🎤"},
        {"id": "drums", "name": "Drums", "file": "drums.wav", "icon": "🥁"},
        {"id": "bass", "name": "Bass", "file": "bass.wav", "icon": "🎸"},
        {"id": "other", "name": "Other Instruments", "file": "other.wav", "icon": "🎺"},
    ]

    available = []
    for stem in expected_stems:
        target_file = DATA_DIR / stem["file"]
        if not target_file.exists() and "fallback" in stem:
            fallback_file = DATA_DIR / stem["fallback"]
            if fallback_file.exists():
                target_file = fallback_file
                stem["file"] = stem["fallback"]

        if target_file.exists():
            size_mb = round(target_file.stat().st_size / (1024 * 1024), 2)
            available.append({
                "id": stem["id"],
                "name": stem["name"],
                "filename": target_file.name,
                "url": f"/data/{target_file.name}",
                "size_mb": size_mb,
                "icon": stem["icon"]
            })

    return {"stems": available}


@app.get("/data/{filename}")
def stream_audio(filename: str):
    """Stream audio files directly from the data folder."""
    file_path = get_safe_data_path(filename)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"File {filename} not found")

    ext = file_path.suffix.lower()
    media_type = "audio/mpeg" if ext == ".mp3" else ("audio/wav" if ext == ".wav" else "application/octet-stream")
    return FileResponse(file_path, media_type=media_type)


@app.get("/", response_class=HTMLResponse)
def read_root():
    """Serve main HTML dashboard."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return HTMLResponse("<h1>Loading Chord Web...</h1>")
    with open(index_file, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
