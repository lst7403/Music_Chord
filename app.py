import os
import csv
import uuid
import threading
from pathlib import Path
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from pipeline import get_pipeline_status, run_pipeline_task, run_youtube_pipeline_task, update_status

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

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".wma", ".aiff", ".opus"}


def get_safe_data_path(filename: str) -> Path:
    """Ensure requested file resides strictly within DATA_DIR to prevent path traversal."""
    clean_name = Path(filename).name
    file_path = (DATA_DIR / clean_name).resolve()
    if not str(file_path).startswith(str(DATA_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return file_path


@app.get("/api/pipeline/status")
def pipeline_status():
    """Get current status of audio processing pipeline."""
    return get_pipeline_status()


@app.post("/api/upload")
async def upload_music(file: UploadFile = File(...)):
    """Upload new music file and trigger Demucs separation & chord recognition pipeline."""
    current_status = get_pipeline_status()
    if current_status["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="A processing task is already running. Please wait for it to finish."
        )

    # Validate file extension
    orig_filename = file.filename or "uploaded_music.mp3"
    ext = Path(orig_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Save to a temporary file in data directory
    temp_filename = f"upload_temp_{uuid.uuid4().hex[:8]}{ext}"
    temp_file_path = DATA_DIR / temp_filename

    try:
        with open(temp_file_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                f.write(chunk)
    except Exception as e:
        if temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    # Start background processing thread
    thread = threading.Thread(
        target=run_pipeline_task,
        args=(temp_file_path, orig_filename),
        daemon=True
    )
    thread.start()

    return {
        "success": True,
        "message": f"Uploaded {orig_filename}. AI stem separation & chord analysis started.",
        "filename": orig_filename,
    }


class YouTubeRequest(BaseModel):
    url: str


@app.post("/api/youtube")
async def process_youtube(req: YouTubeRequest):
    """Download audio from YouTube and trigger Demucs separation & chord recognition pipeline."""
    current_status = get_pipeline_status()
    if current_status["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="A processing task is already running. Please wait for it to finish."
        )

    url = (req.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="YouTube URL is required.")

    valid_hosts = ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"]
    if not any(host in url.lower() for host in valid_hosts):
        raise HTTPException(
            status_code=400,
            detail="Invalid YouTube URL. Please provide a link from youtube.com or youtu.be"
        )

    # Start background processing thread
    thread = threading.Thread(
        target=run_youtube_pipeline_task,
        args=(url,),
        daemon=True
    )
    thread.start()

    return {
        "success": True,
        "message": "YouTube audio download and AI chord analysis started.",
        "url": url,
    }


@app.post("/api/pipeline/reset")
def reset_pipeline():
    """Reset pipeline state if it was in error."""
    update_status("idle", 0, "Ready", status="idle")
    return {"success": True, "message": "Pipeline state reset."}


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


@app.get("/api/beats")
def get_beats():
    """Parse and return beat and downbeat timestamps from data/beats.csv."""
    csv_path = DATA_DIR / "beats.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="beats.csv not found in data directory")

    beats = []
    downbeats = []
    times = []

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                t = float(row["time"])
                beat_num = int(row.get("beat", 1))
                is_downbeat = str(row.get("is_downbeat", "false")).lower() in ("true", "1", "t")

                item = {
                    "time": round(t, 3),
                    "beat": beat_num,
                    "is_downbeat": is_downbeat
                }
                beats.append(item)
                times.append(t)
                if is_downbeat:
                    downbeats.append(round(t, 3))
            except (ValueError, KeyError):
                continue

    # Estimate BPM from intervals
    bpm = 0.0
    if len(times) > 1:
        import numpy as np
        diffs = np.diff(times)
        valid = diffs[(diffs > 0.2) & (diffs < 2.0)]
        if len(valid) > 0:
            bpm = round(float(60.0 / np.median(valid)), 1)

    return {
        "total_beats": len(beats),
        "total_downbeats": len(downbeats),
        "bpm": bpm,
        "beats": beats,
        "downbeats": downbeats
    }


@app.get("/api/aligned-chords")
def get_aligned_chords():
    """Parse and return beat-aligned chord progression grouped by measures/bars."""
    aligned_csv = DATA_DIR / "aligned_chords.csv"
    chords_csv = DATA_DIR / "chords.csv"
    beats_csv = DATA_DIR / "beats.csv"

    if not chords_csv.exists() or not beats_csv.exists():
        raise HTTPException(status_code=404, detail="chords.csv or beats.csv not found in data directory")

    from pipeline import align_chords_to_beats, save_aligned_chords
    res = align_chords_to_beats(chords_csv, beats_csv)
    if not aligned_csv.exists():
        save_aligned_chords(res, aligned_csv)

    return {
        "total_measures": res["total_measures"],
        "total_beats": res["total_beats"],
        "bpm": res["bpm"],
        "measures": res["measures"],
        "records": res["records"]
    }


@app.get("/api/stems")
def get_stems():
    """List available audio stems in data directory."""
    expected_stems = [
        {"id": "music", "name": "Full Mix (Original)", "file": "music.mp3", "icon": "🎵"},
        {"id": "instrumental", "name": "Instrumental (No Vocals)", "file": "instrumental.wav", "icon": "🎼"},
        {"id": "accompaniment", "name": "Accompaniment (Bass+Other)", "file": "bass_other.wav", "icon": "🎹"},
        {"id": "vocals", "name": "Vocals", "file": "vocals.wav", "icon": "🎤"},
        {"id": "drums", "name": "Drums", "file": "drums.wav", "icon": "🥁"},
        {"id": "bass", "name": "Bass", "file": "bass.wav", "icon": "🎸"},
        {"id": "other", "name": "Other", "file": "other.wav", "icon": "🎺"},
    ]

    available = []
    seen_files = set()

    # 1. Add standard stems first with predefined friendly names and icons
    for stem in expected_stems:
        target_file = DATA_DIR / stem["file"]
        if not target_file.exists() and "fallback" in stem:
            fallback_file = DATA_DIR / stem["fallback"]
            if fallback_file.exists():
                target_file = fallback_file

        # Case-insensitive search fallback
        if not target_file.exists():
            for f in DATA_DIR.iterdir():
                if f.is_file() and f.name.lower() in [stem["file"].lower(), stem.get("fallback", "").lower()]:
                    target_file = f
                    break

        if target_file.exists():
            seen_files.add(target_file.name.lower())
            size_mb = round(target_file.stat().st_size / (1024 * 1024), 2)
            available.append({
                "id": stem["id"],
                "name": stem["name"],
                "display": stem["name"],
                "filename": target_file.name,
                "url": f"/data/{target_file.name}?t={int(target_file.stat().st_mtime)}",
                "size_mb": size_mb,
                "icon": stem["icon"]
            })

    # 2. Dynamically add any additional custom audio files in data/
    AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".wma", ".aiff", ".opus"}
    for f in sorted(DATA_DIR.iterdir()):
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS and f.name.lower() not in seen_files:
            if f.name.startswith("upload_temp_") or f.name.startswith("yt_dl_"):
                continue
            seen_files.add(f.name.lower())
            size_mb = round(f.stat().st_size / (1024 * 1024), 2)
            clean_name = f.stem.replace("_", " ").replace("-", " ").title()
            available.append({
                "id": f.stem.lower(),
                "name": clean_name,
                "display": clean_name,
                "filename": f.name,
                "url": f"/data/{f.name}?t={int(f.stat().st_mtime)}",
                "size_mb": size_mb,
                "icon": "🎧"
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



@app.post("/api/edit/save")
async def save_edits(request: Request):
    """Save user-edited chords, beats, and measures to CSV files."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    chords_csv = DATA_DIR / "chords.csv"
    beats_csv = DATA_DIR / "beats.csv"
    aligned_csv = DATA_DIR / "aligned_chords.csv"

    chords_backup = DATA_DIR / "chords_backup.csv"
    beats_backup = DATA_DIR / "beats_backup.csv"

    # 1. Create backups if not existing yet
    if chords_csv.exists() and not chords_backup.exists():
        import shutil
        shutil.copy2(chords_csv, chords_backup)
    if beats_csv.exists() and not beats_backup.exists():
        import shutil
        shutil.copy2(beats_csv, beats_backup)

    # 2. Save beats if provided
    beats_data = data.get("beats")
    if beats_data and isinstance(beats_data, list):
        import pandas as pd
        df_beats = pd.DataFrame(beats_data)
        # Ensure correct column types
        if not df_beats.empty:
            if "time" in df_beats.columns:
                df_beats["time"] = df_beats["time"].astype(float).round(3)
            if "beat" in df_beats.columns:
                df_beats["beat"] = df_beats["beat"].astype(int)
            if "is_downbeat" in df_beats.columns:
                df_beats["is_downbeat"] = df_beats["is_downbeat"].astype(bool)
            df_beats.to_csv(beats_csv, index=False)

    # 3. Save chords if provided
    chords_data = data.get("chords")
    if chords_data and isinstance(chords_data, list):
        import pandas as pd
        df_chords = pd.DataFrame(chords_data)
        if not df_chords.empty:
            if "start" in df_chords.columns:
                df_chords["start"] = df_chords["start"].astype(float).round(3)
            if "end" in df_chords.columns:
                df_chords["end"] = df_chords["end"].astype(float).round(3)
            if "duration" not in df_chords.columns and "start" in df_chords.columns and "end" in df_chords.columns:
                df_chords["duration"] = (df_chords["end"] - df_chords["start"]).round(3)
            df_chords.to_csv(chords_csv, index=False)

    # 4. Save aligned_chords if directly provided or recalculate
    aligned_records = data.get("aligned_records")
    if aligned_records and isinstance(aligned_records, list):
        import pandas as pd
        df_aligned = pd.DataFrame(aligned_records)
        df_aligned.to_csv(aligned_csv, index=False)
    elif chords_csv.exists() and beats_csv.exists():
        from pipeline import align_chords_to_beats, save_aligned_chords
        res = align_chords_to_beats(chords_csv, beats_csv)
        save_aligned_chords(res, aligned_csv)

    return {
        "success": True,
        "bpm": data.get("bpm"),
        "message": "Successfully saved updated chords, beats, and measures to disk."
    }


@app.post("/api/edit/reset")
def reset_edits():
    """Reset chords and beats back to the original AI generated versions."""
    chords_csv = DATA_DIR / "chords.csv"
    beats_csv = DATA_DIR / "beats.csv"
    aligned_csv = DATA_DIR / "aligned_chords.csv"

    chords_backup = DATA_DIR / "chords_backup.csv"
    beats_backup = DATA_DIR / "beats_backup.csv"

    import shutil
    if chords_backup.exists():
        shutil.copy2(chords_backup, chords_csv)
    if beats_backup.exists():
        shutil.copy2(beats_backup, beats_csv)

    if chords_csv.exists() and beats_csv.exists():
        from pipeline import align_chords_to_beats, save_aligned_chords
        res = align_chords_to_beats(chords_csv, beats_csv)
        save_aligned_chords(res, aligned_csv)

    return {
        "success": True,
        "message": "Successfully reset chords and beats to original AI model outputs."
    }


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
    import socket
    import sys

    # Support UTF-8 emoji output on Windows cp950/Big5 console
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    port = 8080
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        # Check if port is truly bindable
        def port_available(p):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(("0.0.0.0", p))
                    return True
                except OSError:
                    return False

        if not port_available(port):
            print(f"⚠️  Port {port} is currently occupied or in CLOSE_WAIT. Automatically using port 8081...")
            port = 8081

    print(f"🚀 Launching ChordVision web server on http://localhost:{port}")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_excludes=["data/*", "data/**", "*.mp3", "*.wav", "*.csv", "*.tmp", "*.part"]
    )
