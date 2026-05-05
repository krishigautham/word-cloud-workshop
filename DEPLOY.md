# How to Deploy — Step by Step

No technical experience needed. Follow each step exactly.

---

## Part 1 — Put the code on GitHub (5 minutes)

GitHub is a free website that stores your code so Render can access it.

### Step 1 — Create a GitHub account
1. Go to **github.com**
2. Click **Sign up** and create a free account
3. Verify your email

### Step 2 — Create a new repository
1. Once logged in, click the **+** icon in the top right corner
2. Click **New repository**
3. Name it: `word-cloud-workshop`
4. Leave everything else as default
5. Click **Create repository**

### Step 3 — Upload your files
1. On the repository page that appears, click **uploading an existing file** (it's a link in the middle of the page)
2. Open Finder on your Mac and navigate to:
   `Gautham → Automation → LinkedIn_Writer → word_cloud`
3. Select ALL files and folders **except** the `node_modules` folder
   - Select everything, then hold **Cmd** and click `node_modules` to deselect it
4. Drag them into the GitHub upload area in your browser
5. Wait for them all to upload (you'll see a list appear)
6. Scroll down and click **Commit changes**

Your code is now on GitHub. ✓

---

## Part 2 — Deploy on Render (5 minutes)

Render is a free hosting platform that will run your app 24/7.

### Step 4 — Create a Render account
1. Go to **render.com**
2. Click **Get Started for Free**
3. Sign up using your GitHub account (click **Continue with GitHub** — easiest option)
4. Authorise Render to access GitHub when prompted

### Step 5 — Create a new Web Service
1. Once logged into Render, click **New +** in the top right
2. Click **Web Service**
3. You'll see your GitHub repos listed — click **Connect** next to `word-cloud-workshop`

### Step 6 — Configure the service
Fill in these fields exactly:

| Field | Value |
|---|---|
| **Name** | `word-cloud-workshop` (or anything you like) |
| **Region** | Frankfurt (EU Central) — closest to Munich |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

Leave everything else as default.

### Step 7 — Deploy
1. Click **Create Web Service**
2. Render will now build and deploy your app — this takes about 2–3 minutes
3. You'll see logs scrolling — wait until you see **"Live"** in green at the top

### Step 8 — Get your link
1. At the top of the page you'll see a URL like:
   `https://word-cloud-workshop.onrender.com`
2. That's your live app link
3. Copy it — this is what you put in the QR code

---

## Part 3 — Before every workshop

### 2 minutes before you start
1. Open `https://your-app.onrender.com` in your browser
2. Wait for it to load (may take 30 seconds on first open — this is normal, Render free tier "wakes up")
3. Open `https://your-app.onrender.com/admin` in a second tab — this is your control panel

### During the workshop
1. On your laptop, project `https://your-app.onrender.com` (the word cloud)
2. Tell participants to scan the QR code on screen (or go to `your-app.onrender.com/submit`)
3. When ready, go to your admin tab → enter PIN **1234** → click **Go Live**
4. The word cloud activates and participants can now submit
5. Click the QR code on the presenter screen to go fullscreen so people can scan it easily
6. When done, click **End Session** in the admin tab

### Running multiple rounds in the same workshop
- Use **Clear Word Cloud** in admin to wipe words mid-session without ending it
- Use **End Session** only when completely done (resets everything)

---

## If something goes wrong

**App won't load:**
Open the URL in your browser and wait 60 seconds. Render free tier sleeps when unused — it just needs to wake up.

**Words not appearing:**
Refresh the presenter screen. If still nothing, open `/admin`, check the session is Live (green dot).

**Need to change the PIN:**
In Render → your service → Environment → add variable `ADMIN_PIN` with your new PIN value → Save → the service will redeploy automatically.
