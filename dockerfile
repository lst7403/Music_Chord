# 升級使用官方的 NVIDIA CUDA 13.0 執行環境作為基礎映像檔
FROM nvidia/cuda:13.0.0-runtime-ubuntu22.04

# 設定環境變數：防止安裝過程中出現互動式提示、確保 Python 輸出即時印出、停用 pip 快取節省空間
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 安裝系統依賴項：加入音訊處理核心軟體套件（ffmpeg、libsndfile1 等）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# 將 python3 設為系統預設的 python 指令
RUN ln -s /usr/bin/python3 /usr/bin/python

# 設定容器內部的工作目錄
WORKDIR /workspace

# 步驟 1: 升級 pip，並安裝支援 CUDA 13.0 的官方 PyTorch 與 TorchAudio
RUN pip install --upgrade pip && \
    pip install torch torchaudio --extra-index-url https://download.pytorch.org/whl/cu130

# 步驟 2: 安裝核心 AI 音訊分離與節拍偵測框架
RUN pip install demucs beat-this

# 步驟 3: 安裝其他必要的資料科學、音訊處理及 FastAPI 網頁部署套件
RUN pip install \
    ipykernel \
    numpy \
    soundfile \
    librosa \
    transformers \
    huggingface_hub \
    scipy \
    pandas \
    tqdm \
    fastapi \
    uvicorn \
    python-multipart

# 步驟 4: 複製目前 Windows 目錄下的所有程式碼與檔案（包括 app.py）到容器的 /workspace 中
COPY . /workspace

# 開放 FastAPI / Uvicorn 預設使用的 8000 連接埠
EXPOSE 8000

# 預設不自動執行任何 Python 檔案，而是直接啟動 Bash 終端機進入待命狀態
CMD ["/bin/bash"]
