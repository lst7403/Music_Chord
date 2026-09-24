// upload.js — AI Music Upload & YouTube Pipeline Tracking for ChordVision

export function initUploadModal({ onProcessingComplete }) {
  const btnOpenModal = document.getElementById('btn-open-upload');
  const modalOverlay = document.getElementById('upload-modal-overlay');
  const btnCloseModal = document.getElementById('btn-close-upload');

  // Tabs
  const tabBtnFile = document.getElementById('tab-btn-file');
  const tabBtnYoutube = document.getElementById('tab-btn-youtube');
  const panelFile = document.getElementById('panel-file-upload');
  const panelYoutube = document.getElementById('panel-youtube-upload');

  // File Upload Elements
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('music-file-input');
  const fileDetails = document.getElementById('file-details');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const fileSizeDisplay = document.getElementById('selected-file-size');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const btnStartUpload = document.getElementById('btn-start-upload');

  // YouTube Elements
  const ytUrlInput = document.getElementById('youtube-url-input');
  const btnClearYtUrl = document.getElementById('btn-clear-yt-url');
  const btnStartYt = document.getElementById('btn-start-youtube');

  // Frontend Quick Bar Elements
  const ytFrontendInput = document.getElementById('yt-frontend-input');
  const btnYtFrontendClear = document.getElementById('btn-yt-frontend-clear');
  const btnYtFrontendSubmit = document.getElementById('btn-yt-frontend-submit');

  // Progress Tracking Elements
  const uploadFormSection = document.getElementById('upload-form-section');
  const progressSection = document.getElementById('upload-progress-section');
  const progressText = document.getElementById('progress-status-text');
  const progressBarFill = document.getElementById('upload-progress-fill');
  const progressPercentText = document.getElementById('upload-progress-percent');
  const progressElapsedTime = document.getElementById('progress-elapsed-time');

  const stepItems = {
    downloading: document.getElementById('step-downloading'),
    converting: document.getElementById('step-converting'),
    separating: document.getElementById('step-separating'),
    combining: document.getElementById('step-combining'),
    recognizing: document.getElementById('step-recognizing'),
    completed: document.getElementById('step-completed'),
  };

  const errorBanner = document.getElementById('upload-error-banner');
  const errorMsg = document.getElementById('upload-error-msg');
  const btnRetryUpload = document.getElementById('btn-retry-upload');

  let selectedFile = null;
  let pollTimer = null;
  let isProcessing = false;
  let activeTab = 'youtube'; // 'youtube' | 'file'

  // Open & Close handlers
  function openModal() {
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    if (!isProcessing) {
      switchTab('youtube');
    }
    checkInitialStatus();
  }

  function closeModal() {
    if (isProcessing) {
      if (!confirm('AI processing is currently running in the background. Close window?')) {
        return;
      }
    }
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    if (!isProcessing) {
      resetModalForm();
    }
  }

  if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

  // Close on backdrop click (if not processing)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay && !isProcessing) {
      closeModal();
    }
  });

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active') && !isProcessing) {
      closeModal();
    }
  });

  // Tab switching
  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'file') {
      if (tabBtnFile) tabBtnFile.classList.add('active');
      if (tabBtnYoutube) tabBtnYoutube.classList.remove('active');
      if (panelFile) panelFile.style.display = 'block';
      if (panelYoutube) panelYoutube.style.display = 'none';
    } else {
      if (tabBtnFile) tabBtnFile.classList.remove('active');
      if (tabBtnYoutube) tabBtnYoutube.classList.add('active');
      if (panelFile) panelFile.style.display = 'none';
      if (panelYoutube) panelYoutube.style.display = 'block';
      setTimeout(() => ytUrlInput && ytUrlInput.focus(), 60);
    }
    hideError();
  }

  if (tabBtnFile) tabBtnFile.addEventListener('click', () => switchTab('file'));
  if (tabBtnYoutube) tabBtnYoutube.addEventListener('click', () => switchTab('youtube'));

  const btnSwitchToYt = document.getElementById('btn-switch-to-yt-tab');
  const btnSwitchToFile = document.getElementById('btn-switch-to-file-tab');
  if (btnSwitchToYt) btnSwitchToYt.addEventListener('click', () => switchTab('youtube'));
  if (btnSwitchToFile) btnSwitchToFile.addEventListener('click', () => switchTab('file'));

  // Drag and drop for audio files
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleFileSelected(files[0]);
      }
    });

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', (e) => {
      e.stopPropagation();
      resetSelectedFile();
    });
  }

  function handleFileSelected(file) {
    const validExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.aiff', '.opus'];
    const fileName = file.name.toLowerCase();
    const isValid = validExts.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      showError(`Unsupported file format. Please upload one of: ${validExts.join(', ')}`);
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    dropzone.style.display = 'none';
    fileDetails.style.display = 'flex';
    btnStartUpload.disabled = false;
    const divider = document.querySelector('.upload-or-divider');
    const panelYt = document.getElementById('panel-yt-unified-card') || document.getElementById('panel-yt-quick-bar');
    if (divider) divider.style.display = 'none';
    if (panelYt) panelYt.style.display = 'none';
    hideError();
  }

  function resetSelectedFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    if (dropzone) dropzone.style.display = 'flex';
    if (fileDetails) fileDetails.style.display = 'none';
    if (btnStartUpload) btnStartUpload.disabled = true;
    const divider = document.querySelector('.upload-or-divider');
    const panelYt = document.getElementById('panel-yt-unified-card') || document.getElementById('panel-yt-quick-bar');
    if (divider) divider.style.display = 'flex';
    if (panelYt) panelYt.style.display = 'flex';
  }

  // YouTube URL Validation & Events
  function isValidYouTubeUrl(url) {
    if (!url) return false;
    const str = url.trim().toLowerCase();
    return str.includes('youtube.com/') || str.includes('youtu.be/');
  }

  const btnPasteClip = document.getElementById('btn-paste-clipboard');
  if (btnPasteClip && ytUrlInput) {
    btnPasteClip.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && isValidYouTubeUrl(text)) {
          ytUrlInput.value = text.trim();
          ytUrlInput.dispatchEvent(new Event('input'));
        } else if (text) {
          ytUrlInput.value = text.trim();
          ytUrlInput.dispatchEvent(new Event('input'));
        }
      } catch (err) {
        console.warn('Clipboard read error or not permitted:', err);
      }
    });
  }

  if (ytUrlInput) {
    ytUrlInput.addEventListener('input', () => {
      const val = ytUrlInput.value.trim();
      if (btnClearYtUrl) {
        btnClearYtUrl.style.display = val ? 'block' : 'none';
      }
      if (btnStartYt) {
        btnStartYt.disabled = !isValidYouTubeUrl(val);
      }
      hideError();
    });

    ytUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && isValidYouTubeUrl(ytUrlInput.value.trim()) && !isProcessing) {
        startYouTubeProcess();
      }
    });
  }

  if (btnClearYtUrl) {
    btnClearYtUrl.addEventListener('click', () => {
      ytUrlInput.value = '';
      btnClearYtUrl.style.display = 'none';
      if (btnStartYt) btnStartYt.disabled = true;
      if (ytFrontendInput) ytFrontendInput.value = '';
      if (btnYtFrontendClear) btnYtFrontendClear.style.display = 'none';
      if (btnYtFrontendSubmit) btnYtFrontendSubmit.disabled = true;
      ytUrlInput.focus();
    });
  }

  // Frontend Quick Bar Event Handlers
  if (ytFrontendInput) {
    ytFrontendInput.addEventListener('input', () => {
      const val = ytFrontendInput.value.trim();
      const valid = isValidYouTubeUrl(val);
      if (btnYtFrontendClear) {
        btnYtFrontendClear.style.display = val ? 'block' : 'none';
      }
      if (btnYtFrontendSubmit) {
        btnYtFrontendSubmit.disabled = !valid;
      }
      if (ytUrlInput) {
        ytUrlInput.value = val;
        if (btnClearYtUrl) btnClearYtUrl.style.display = val ? 'block' : 'none';
        if (btnStartYt) btnStartYt.disabled = !valid;
      }
    });

    ytFrontendInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && isValidYouTubeUrl(ytFrontendInput.value.trim()) && !isProcessing) {
        handleFrontendYtSubmit();
      }
    });
  }

  if (btnYtFrontendClear) {
    btnYtFrontendClear.addEventListener('click', () => {
      ytFrontendInput.value = '';
      btnYtFrontendClear.style.display = 'none';
      if (btnYtFrontendSubmit) btnYtFrontendSubmit.disabled = true;
      if (ytUrlInput) ytUrlInput.value = '';
      if (btnClearYtUrl) btnClearYtUrl.style.display = 'none';
      if (btnStartYt) btnStartYt.disabled = true;
      ytFrontendInput.focus();
    });
  }

  function handleFrontendYtSubmit() {
    const val = ytFrontendInput ? ytFrontendInput.value.trim() : '';
    if (!isValidYouTubeUrl(val)) return;
    if (ytUrlInput) ytUrlInput.value = val;
    openModal();
    switchTab('youtube');
    startYouTubeProcess();
  }

  if (btnYtFrontendSubmit) {
    btnYtFrontendSubmit.addEventListener('click', handleFrontendYtSubmit);
  }

  function resetModalForm() {
    resetSelectedFile();
    if (ytUrlInput) ytUrlInput.value = '';
    if (btnClearYtUrl) btnClearYtUrl.style.display = 'none';
    if (btnStartYt) btnStartYt.disabled = true;

    if (ytFrontendInput) {
      ytFrontendInput.value = '';
      if (btnYtFrontendClear) btnYtFrontendClear.style.display = 'none';
      if (btnYtFrontendSubmit) btnYtFrontendSubmit.disabled = true;
    }

    if (stepItems.downloading) stepItems.downloading.style.display = 'none';

    uploadFormSection.style.display = 'block';
    progressSection.style.display = 'none';
    hideError();
    resetStepList();
    if (pollTimer) clearInterval(pollTimer);
    isProcessing = false;
    switchTab('youtube');
  }

  function resetStepList() {
    Object.values(stepItems).forEach(item => {
      if (item) {
        item.classList.remove('active', 'completed', 'failed');
        const badge = item.querySelector('.step-badge');
        if (badge) badge.textContent = 'Pending';
      }
    });
  }

  function showError(msg) {
    if (errorBanner && errorMsg) {
      errorMsg.textContent = msg;
      errorBanner.style.display = 'flex';
    }
  }

  function hideError() {
    if (errorBanner) {
      errorBanner.style.display = 'none';
    }
  }

  if (btnRetryUpload) {
    btnRetryUpload.addEventListener('click', async () => {
      try {
        await fetch('/api/pipeline/reset', { method: 'POST' });
      } catch (e) {
        console.warn(e);
      }
      resetModalForm();
    });
  }

  const btnCancelPipeline = document.getElementById('btn-cancel-pipeline');
  if (btnCancelPipeline) {
    btnCancelPipeline.addEventListener('click', async () => {
      if (confirm('Cancel and reset current audio processing?')) {
        try {
          await fetch('/api/pipeline/reset', { method: 'POST' });
        } catch (e) {
          console.warn(e);
        }
        resetModalForm();
      }
    });
  }

  // 1. Start file upload
  if (btnStartUpload) {
    btnStartUpload.addEventListener('click', async () => {
      if (!selectedFile) return;

      isProcessing = true;
      uploadFormSection.style.display = 'none';
      progressSection.style.display = 'block';
      hideError();
      resetStepList();

      if (stepItems.downloading) stepItems.downloading.style.display = 'none';
      setStepState('converting', 'active', 'In Progress');
      updateProgressDisplay(5, 'Uploading audio file to server...', 0);

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Upload failed with status ${res.status}`);
        }

        startPollingStatus();
      } catch (err) {
        console.error('Upload Error:', err);
        isProcessing = false;
        showError(err.message || 'Failed to start upload.');
        setStepState('converting', 'failed', 'Failed');
      }
    });
  }

  // 2. Start YouTube URL process
  async function startYouTubeProcess() {
    const url = ytUrlInput ? ytUrlInput.value.trim() : '';
    if (!isValidYouTubeUrl(url)) {
      showError('Please enter a valid YouTube video or Shorts link.');
      return;
    }

    isProcessing = true;
    uploadFormSection.style.display = 'none';
    progressSection.style.display = 'block';
    hideError();
    resetStepList();

    if (stepItems.downloading) stepItems.downloading.style.display = 'flex';
    setStepState('downloading', 'active', 'Connecting...');
    updateProgressDisplay(5, 'Connecting to YouTube and extracting audio...', 0);

    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed with status ${res.status}`);
      }

      startPollingStatus();
    } catch (err) {
      console.error('YouTube Processing Error:', err);
      isProcessing = false;
      showError(err.message || 'Failed to start YouTube audio extraction.');
      setStepState('downloading', 'failed', 'Failed');
    }
  }

  if (btnStartYt) {
    btnStartYt.addEventListener('click', startYouTubeProcess);
  }

  function setStepState(stepKey, stateClass, badgeText) {
    const item = stepItems[stepKey];
    if (!item) return;

    item.classList.remove('active', 'completed', 'failed');
    if (stateClass) item.classList.add(stateClass);

    const badge = item.querySelector('.step-badge');
    if (badge && badgeText) badge.textContent = badgeText;
  }

  function updateProgressDisplay(pct, msg, elapsedSec) {
    if (progressBarFill) progressBarFill.style.width = `${pct}%`;
    if (progressPercentText) progressPercentText.textContent = `${pct}%`;
    if (progressText) progressText.textContent = msg;
    if (progressElapsedTime && elapsedSec !== undefined) {
      progressElapsedTime.textContent = `${elapsedSec}s elapsed`;
    }
  }

  function startPollingStatus() {
    if (pollTimer) clearInterval(pollTimer);
    // Poll every 400ms for fluid, synchronous progress updates
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/pipeline/status');
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        handlePipelineStatus(data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 400);
  }

  async function checkInitialStatus(autoOpen = false) {
    try {
      const res = await fetch('/api/pipeline/status');
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'running') {
        // Guard: If pipeline has been running for > 15 minutes, it is likely an orphaned/stuck task
        if (data.elapsed_seconds && data.elapsed_seconds > 900) {
          console.warn('Pipeline appears orphaned (running > 15m). Resetting state.');
          await fetch('/api/pipeline/reset', { method: 'POST' });
          resetModalForm();
          return;
        }

        isProcessing = true;
        uploadFormSection.style.display = 'none';
        progressSection.style.display = 'block';

        if ((data.step === 'downloading' || activeTab === 'youtube') && stepItems.downloading) {
          stepItems.downloading.style.display = 'flex';
        }

        if (autoOpen) {
          modalOverlay.classList.add('active');
          modalOverlay.setAttribute('aria-hidden', 'false');
        }

        startPollingStatus();
      } else {
        isProcessing = false;
        if (pollTimer) clearInterval(pollTimer);
        uploadFormSection.style.display = 'block';
        progressSection.style.display = 'none';
      }
    } catch (e) {
      console.warn(e);
    }
  }

  function handlePipelineStatus(data) {
    const { status, step, progress, message, error, elapsed_seconds } = data;

    if (status === 'idle') {
      if (pollTimer) clearInterval(pollTimer);
      isProcessing = false;
      resetModalForm();
      return;
    }

    updateProgressDisplay(progress, message, elapsed_seconds);

    // Update steps visual checklist
    if (step === 'downloading') {
      if (stepItems.downloading) stepItems.downloading.style.display = 'flex';
      setStepState('downloading', 'active', message || 'Downloading Audio...');
    } else if (step === 'converting') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'active', message || 'In Progress');
    } else if (step === 'separating') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'active', message || 'Separating Stems...');
    } else if (step === 'combining') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'active', message || 'Synthesizing...');
    } else if (step === 'recognizing') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'completed', 'Done');
      setStepState('recognizing', 'active', message || 'Analyzing Chords...');
    } else if (step === 'tracking_beats' || step === 'aligning') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'completed', 'Done');
      setStepState('recognizing', 'active', step === 'tracking_beats' ? 'Tracking Beats AI...' : 'Aligning Rhythm & Chords...');
    } else if (status === 'completed') {
      if (stepItems.downloading && stepItems.downloading.style.display !== 'none') {
        setStepState('downloading', 'completed', 'Done');
      }
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'completed', 'Done');
      setStepState('recognizing', 'completed', 'Done');
      setStepState('completed', 'completed', 'Ready! ✨');

      if (pollTimer) clearInterval(pollTimer);
      isProcessing = false;

      // Trigger automatic reload in main application
      if (onProcessingComplete) {
        onProcessingComplete();
      }

      // Auto close after brief success celebration
      setTimeout(() => {
        if (modalOverlay.classList.contains('active')) {
          modalOverlay.classList.remove('active');
          resetModalForm();
        }
      }, 2200);
    } else if (status === 'error') {
      if (pollTimer) clearInterval(pollTimer);
      isProcessing = false;
      showError(error || message || 'Processing error occurred.');

      if (step && stepItems[step]) {
        setStepState(step, 'failed', 'Error');
      }
    }
  }

  // Initial check on page load to restore state or detect active background tasks
  checkInitialStatus(false);
}
