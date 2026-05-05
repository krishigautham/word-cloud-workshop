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
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (!isLive) return res.status(403).json({ error: 'Session not live' });

  const cleaned = text.trim().slice(0, 60);
  if (!cleaned) return res.status(400).json({ error: 'Empty input' });

  addWord(cleaned);
  io.emit('word_added', { words });
  res.json({ ok: true });
});

app.post('/api/admin/reset', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Wrong PIN' });
  words = [];
  io.emit('reset');
  res.json({ ok: true });
});

app.post('/api/admin/go-live', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Wrong PIN' });
  isLive = true;
  io.emit('session_live');
  res.json({ ok: true });
});

app.post('/api/admin/end-live', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'Wrong PIN' });
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

function addWord(text) {
  const normalized = text.toLowerCase();
  const existing = words.find(w => w.text.toLowerCase() === normalized);
  if (existing) {
    existing.count += 1;
  } else {
    words.push({ text, count: 1 });
  }
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
