(function () {
  const CORRECT_PIN = '1234';
  const socket = io();

  const pinSection = document.getElementById('pin-section');
  const adminSection = document.getElementById('admin-section');
  const pinError = document.getElementById('pin-error');
  const pinDigits = Array.from(document.querySelectorAll('.pin-digit'));

  const sessionStatus = document.getElementById('session-status');
  const statusLabel = document.getElementById('status-label');
  const adminWordCount = document.getElementById('admin-word-count');

  const goLiveBtn = document.getElementById('go-live-btn');
  const endLiveWrap = document.getElementById('end-live-wrap');
  const endLiveBtn = document.getElementById('end-live-btn');
  const resetWrap = document.getElementById('reset-wrap');
  const resetBtn = document.getElementById('reset-btn');
  const resetConfirm = document.getElementById('reset-confirm');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const adminToast = document.getElementById('admin-toast');

  let sessionIsLive = false;

  // ── PIN input ──────────────────────────────────────

  pinDigits.forEach((digit, i) => {
    digit.addEventListener('input', () => {
      digit.value = digit.value.replace(/[^0-9]/g, '').slice(-1);
      if (digit.value && i < 3) pinDigits[i + 1].focus();
      if (pinDigits.every(d => d.value.length === 1)) checkPin();
    });
    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !digit.value && i > 0) pinDigits[i - 1].focus();
    });
  });

  pinDigits[0].focus();

  function checkPin() {
    const entered = pinDigits.map(d => d.value).join('');
    if (entered === CORRECT_PIN) {
      pinError.style.display = 'none';
      pinSection.style.display = 'none';
      adminSection.style.display = 'flex';
      loadStatus();
    } else {
      pinError.style.display = 'block';
      pinDigits.forEach(d => d.value = '');
      pinDigits[0].focus();
    }
  }

  function loadStatus() {
    fetch('/api/status')
      .then(r => r.json())
      .then(({ isLive, wordCount }) => {
        setLiveState(isLive);
        adminWordCount.textContent = wordCount;
      });
  }

  // ── Live state UI ──────────────────────────────────

  function setLiveState(live) {
    sessionIsLive = live;

    if (live) {
      sessionStatus.className = 'session-status online';
      statusLabel.textContent = 'Live';
      goLiveBtn.style.display = 'none';
      endLiveWrap.style.display = 'flex';
      resetWrap.style.display = 'block';
    } else {
      sessionStatus.className = 'session-status offline';
      statusLabel.textContent = 'Not live';
      goLiveBtn.style.display = 'block';
      endLiveWrap.style.display = 'none';
      resetWrap.style.display = 'none';
      resetConfirm.style.display = 'none';
      resetBtn.style.display = 'block';
    }
  }

  // ── Go Live ────────────────────────────────────────

  goLiveBtn.addEventListener('click', () => {
    goLiveBtn.disabled = true;
    goLiveBtn.textContent = 'Starting...';

    fetch('/api/admin/go-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: CORRECT_PIN }),
    })
      .then(r => r.json())
      .then(data => {
        goLiveBtn.disabled = false;
        goLiveBtn.textContent = 'Go Live';
        if (data.ok) showAdminToast('Session is now live!', 'success');
      });
  });

  // ── End Live ───────────────────────────────────────

  endLiveBtn.addEventListener('click', () => {
    endLiveBtn.disabled = true;
    endLiveBtn.textContent = 'Ending...';

    fetch('/api/admin/end-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: CORRECT_PIN }),
    })
      .then(r => r.json())
      .then(data => {
        endLiveBtn.disabled = false;
        endLiveBtn.textContent = 'End Session';
        if (data.ok) {
          adminWordCount.textContent = '0';
          showAdminToast('Session ended and cleared', 'info');
        }
      });
  });

  // ── Reset (mid-session clear) ──────────────────────

  resetBtn.addEventListener('click', () => {
    resetConfirm.style.display = 'block';
    resetBtn.style.display = 'none';
  });

  confirmNo.addEventListener('click', () => {
    resetConfirm.style.display = 'none';
    resetBtn.style.display = 'block';
  });

  confirmYes.addEventListener('click', () => {
    fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: CORRECT_PIN }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          resetConfirm.style.display = 'none';
          resetBtn.style.display = 'block';
          adminWordCount.textContent = '0';
          showAdminToast('Word cloud cleared', 'success');
        }
      });
  });

  // ── Socket events ──────────────────────────────────

  socket.on('init', ({ words, isLive }) => {
    const total = words.reduce((s, w) => s + w.count, 0);
    adminWordCount.textContent = total;
    setLiveState(isLive);
  });

  socket.on('word_added', ({ words }) => {
    const total = words.reduce((s, w) => s + w.count, 0);
    adminWordCount.textContent = total;
  });

  socket.on('session_live', () => setLiveState(true));
  socket.on('session_ended', () => { setLiveState(false); adminWordCount.textContent = '0'; });
  socket.on('reset', () => { adminWordCount.textContent = '0'; });

  // ── Toast ──────────────────────────────────────────

  function showAdminToast(msg, type = 'success') {
    adminToast.textContent = msg;
    adminToast.className = `toast-visible toast-${type}`;
    setTimeout(() => { adminToast.className = ''; }, 3000);
  }
})();
