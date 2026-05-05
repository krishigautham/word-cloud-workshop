(function () {
  const MAX = 3;
  const STORAGE_KEY = 'wc_submissions';

  const socket = io();

  const form = document.getElementById('submit-form');
  const input = document.getElementById('word-input');
  const btn = document.getElementById('submit-btn');
  const charNum = document.getElementById('char-num');
  const slotsUsed = document.getElementById('slots-used');

  const waitingSection = document.getElementById('waiting-section');
  const endedSection = document.getElementById('ended-section');
  const formSection = document.getElementById('form-section');
  const doneSection = document.getElementById('done-section');
  const toast = document.getElementById('toast');

  function getCount() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  }

  function setCount(n) {
    localStorage.setItem(STORAGE_KEY, String(n));
  }

  function updateDots(count) {
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`dot-${i}`).classList.toggle('filled', i <= count);
    }
    slotsUsed.textContent = count;
  }

  function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.className = `toast-visible toast-${type}`;
    setTimeout(() => { toast.className = ''; }, 2500);
  }

  function showState(state) {
    waitingSection.style.display = 'none';
    endedSection.style.display   = 'none';
    formSection.style.display    = 'none';
    doneSection.style.display    = 'none';

    if (state === 'waiting') {
      waitingSection.style.display = 'flex';
    } else if (state === 'ended') {
      endedSection.style.display = 'flex';
    } else if (state === 'done') {
      doneSection.style.display = 'flex';
    } else if (state === 'form') {
      formSection.style.display = 'block';
    }
  }

  // ── Socket events ──────────────────────────────

  socket.on('init', ({ isLive }) => {
    if (!isLive) {
      showState('waiting');
      return;
    }
    const count = getCount();
    updateDots(count);
    showState(count >= MAX ? 'done' : 'form');
  });

  socket.on('session_live', () => {
    const count = getCount();
    updateDots(count);
    showState(count >= MAX ? 'done' : 'form');
    showToast('Session is live — submit your idea!', 'success');
  });

  socket.on('session_ended', () => {
    showState('ended');
  });

  socket.on('reset', () => {
    setCount(0);
    updateDots(0);
    showToast('Session reset — you can submit again', 'info');
  });

  // ── Character counter ──────────────────────────

  input.addEventListener('input', () => {
    charNum.textContent = input.value.length;
  });

  // ── Submit ─────────────────────────────────────

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) {
      showToast('Please type something first', 'error');
      return;
    }

    let count = getCount();
    if (count >= MAX) {
      showState('done');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    socket.emit('submit_word', { text });

    count += 1;
    setCount(count);
    updateDots(count);
    input.value = '';
    charNum.textContent = '0';
    showToast('Response added to the cloud!');

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Submit';
      if (count >= MAX) showState('done');
    }, 600);
  });
})();
