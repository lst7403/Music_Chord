// upload.js — AI Music Upload and Pipeline Tracking for ChordVision

export function initUploadModal({ onProcessingComplete }) {
  const btnOpenModal = document.getElementById('btn-open-upload');
  const modalOverlay = document.getElementById('upload-modal-overlay');
  const btnCloseModal = document.getElementById('btn-close-upload');
  
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('music-file-input');
  const fileDetails = document.getElementById('file-details');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const fileSizeDisplay = document.getElementById('selected-file-size');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const btnStartUpload = document.getElementById('btn-start-upload');
  
  const uploadFormSection = document.getElementById('upload-form-section');
  const progressSection = document.getElementById('upload-progress-section');
  const progressText = document.getElementById('progress-status-text');
  const progressBarFill = document.getElementById('upload-progress-fill');
  const progressPercentText = document.getElementById('upload-progress-percent');
  const progressElapsedTime = document.getElementById('progress-elapsed-time');
  
  const stepItems = {
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

  // Open & Close handlers
  function openModal() {
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
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

  // Drag and drop
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

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

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
    hideError();
  }

  function resetSelectedFile() {
    selectedFile = null;
    fileInput.value = '';
    dropzone.style.display = 'flex';
    fileDetails.style.display = 'none';
    btnStartUpload.disabled = true;
  }

  function resetModalForm() {
    resetSelectedFile();
    uploadFormSection.style.display = 'block';
    progressSection.style.display = 'none';
    hideError();
    resetStepList();
    if (pollTimer) clearInterval(pollTimer);
    isProcessing = false;
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

  // Start upload and trigger processing
  if (btnStartUpload) {
    btnStartUpload.addEventListener('click', async () => {
      if (!selectedFile) return;

      isProcessing = true;
      uploadFormSection.style.display = 'none';
      progressSection.style.display = 'block';
      hideError();
      resetStepList();

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
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/pipeline/status');
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        handlePipelineStatus(data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 800);
  }

  async function checkInitialStatus() {
    try {
      const res = await fetch('/api/pipeline/status');
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'running') {
        isProcessing = true;
        uploadFormSection.style.display = 'none';
        progressSection.style.display = 'block';
        startPollingStatus();
      }
    } catch (e) {
      console.warn(e);
    }
  }

  function handlePipelineStatus(data) {
    const { status, step, progress, message, error, elapsed_seconds } = data;

    updateProgressDisplay(progress, message, elapsed_seconds);

    // Update steps visual checklist
    if (step === 'converting') {
      setStepState('converting', 'active', 'In Progress');
    } else if (step === 'separating') {
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'active', 'Separating Stems...');
    } else if (step === 'combining') {
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'active', 'Synthesizing...');
    } else if (step === 'recognizing') {
      setStepState('converting', 'completed', 'Done');
      setStepState('separating', 'completed', 'Done');
      setStepState('combining', 'completed', 'Done');
      setStepState('recognizing', 'active', 'Analyzing...');
    } else if (status === 'completed') {
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
}
