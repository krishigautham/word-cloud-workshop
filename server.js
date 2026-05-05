const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// In-memory store
let words = [];
let isLive = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- REST endpoints ---

app.post('/api/submit', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Ungültige Eingabe' });
  if (!isLive) return res.status(403).json({ error: 'Sitzung nicht live' });
  const cleaned = text.trim().slice(0, 60);
  if (!cleaned) return res.status(400).json({ error: 'Leere Eingabe' });
  addWord(cleaned);
  io.emit('word_added', { words });
  res.json({ ok: true });
});

app.post('/api/admin/reset', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Falsche PIN' });
  words = [];
  io.emit('reset');
  res.json({ ok: true });
});

app.post('/api/admin/go-live', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Falsche PIN' });
  isLive = true;
  io.emit('session_live');
  res.json({ ok: true });
});

app.post('/api/admin/end-live', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Falsche PIN' });
  isLive = false;
  words = [];
  io.emit('session_ended');
  res.json({ ok: true });
});

app.get('/api/status', (req, res) => {
  res.json({ isLive, wordCount: words.reduce((s, w) => s + w.count, 0) });
});

app.get('/api/words', (req, res) => {
  res.json({ words });
});

app.get('/submit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submit.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- Socket.io ---

io.on('connection', (socket) => {
  socket.emit('init', { words, isLive });

  socket.on('submit_word', ({ text }) => {
    if (!isLive || !text || typeof text !== 'string') return;
    const cleaned = text.trim().slice(0, 60);
    if (!cleaned) return;
    addWord(cleaned);
    io.emit('word_added', { words });
  });
});

// --- Helpers ---

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, '').replace(/[.,\-_]/g, '');
}

function findSimilarWord(text) {
  const norm = normalize(text);
  for (const w of words) {
    const wNorm = normalize(w.text);
    if (wNorm === norm) return w;
    const longer = Math.max(norm.length, wNorm.length);
    if (longer >= 5) {
      const threshold = longer >= 10 ? 3 : longer >= 6 ? 2 : 1;
      if (levenshtein(norm, wNorm) <= threshold) return w;
    }
  }
  return null;
}

function addWord(text) {
  const similar = findSimilarWord(text);
  if (similar) {
    similar.count += 1;
  } else {
    words.push({ text, count: 1 });
  }
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
