# Workshop Word Cloud

Live interactive word cloud for workshops. Participants submit words from their phones, they appear on the presenter screen in real time.

## Screens

| URL | Purpose |
|---|---|
| `/` | Presenter screen — full-screen word cloud + QR code |
| `/submit` | Participant screen — mobile submit form (QR points here) |
| `/admin` | Admin screen — PIN-protected reset (PIN: `1234`) |

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Deploy to Render (free)

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set these values:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Click Deploy

Your app will be live at `https://your-app-name.onrender.com`

> **Before your workshop:** open the URL ~2 minutes early to wake the server (Render free tier sleeps after 15 min of inactivity).

## Environment variables (optional)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port (Render sets this automatically) |
| `ADMIN_PIN` | `1234` | PIN for the admin reset screen |

Set these in Render → Environment → Add Environment Variable.

## How it works

- Words submitted via socket appear on the presenter screen within ~200ms
- Repeated words grow larger (frequency-based sizing)
- Words glow when submitted 3+ times
- Each participant can submit up to 3 responses (tracked via browser localStorage)
- Admin reset clears all words and resets submission counts on all connected devices
- QR code on presenter screen is clickable — goes fullscreen for easy projection scanning
