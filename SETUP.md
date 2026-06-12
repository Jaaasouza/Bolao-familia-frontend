# 🚀 Setup Guide

Complete step-by-step guide to deploying USAM World Cup 2026 for your friend group.

**Estimated time:** 15-20 minutes if you've never used Vercel; 5 minutes if you have.

---

## 📋 What you'll need

- A computer with Node.js installed ([download](https://nodejs.org))
- A GitHub account ([signup](https://github.com/signup))
- A Vercel account ([signup with GitHub](https://vercel.com/signup))
- 5 minutes to register at [football-data.org](https://www.football-data.org/client/register) for a free API key

---

## Part 1: Get your API key (2 minutes)

1. Go to https://www.football-data.org/client/register
2. Sign up with your email
3. Confirm via email
4. Copy your API token from the dashboard

Keep this token handy — you'll paste it in Vercel later.

---

## Part 2: Fork & clone (3 minutes)

### Option A: Fork on GitHub (recommended)
1. Open https://github.com/YOUR-USERNAME/usam-world-cup-2026
2. Click **Fork** (top right)
3. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/usam-world-cup-2026.git
cd usam-world-cup-2026
```

### Option B: Download ZIP
1. Click **Code** → **Download ZIP**
2. Extract to a folder
3. Open a terminal in that folder

---

## Part 3: Deploy backend to Vercel (5 minutes)

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Login
```bash
vercel login
```
Follow the prompts (uses your browser).

### 3.3 Link the project
```bash
cd backend
vercel link
```
- Choose "Create new project"
- Project name: `usam-world-cup-2026` (or whatever you want)
- Directory: `.`
- Want to override the settings? **No**

### 3.4 Add Vercel KV (the database)

Go to https://vercel.com and open your project:
1. Click the **Storage** tab
2. **Create Database** → **KV**
3. Name: `usam-kv`
4. Click **Create**
5. **Connect** to your project (when prompted, select "Production, Preview, Development")

Vercel automatically adds 4 environment variables for KV access.

### 3.5 Add your API keys

In the terminal:
```bash
vercel env add FOOTBALL_DATA_API_KEY
# Paste your football-data.org token
# Select: Production, Preview, Development (use spacebar to toggle all)

vercel env add ADMIN_TOKEN
# Generate a random string. Run this in another terminal:
#   openssl rand -hex 16
# Or just type any 32+ character random string
# Select: Production, Preview, Development
```

### 3.6 Deploy

```bash
vercel --prod
```

After ~30 seconds, you'll see:
```
✅ Production: https://usam-world-cup-2026-xyz.vercel.app
```

**Copy this URL** — you'll need it next.

---

## Part 4: Configure the frontend (2 minutes)

### 4.1 Open `frontend/usam-world-cup-2026.html` in a text editor

### 4.2 Find these lines (near the top of the `<script>` block):

```javascript
const ADMIN_PASS = "2026";
const BACKEND_URL = '';
const ADMIN_TOKEN_CLIENT = '';
```

### 4.3 Update them:

```javascript
const ADMIN_PASS = "your-new-pin";   // change if you want
const BACKEND_URL = 'https://usam-world-cup-2026-xyz.vercel.app';  // your Vercel URL
const ADMIN_TOKEN_CLIENT = 'your-admin-token-from-step-3.5';
```

### 4.4 Save the file

---

## Part 5: Test it (2 minutes)

### 5.1 Open the HTML file

Just double-click `usam-world-cup-2026.html` or drag it into a browser.

### 5.2 Verify backend connection

1. Click **🔧 Admin** at the bottom
2. Enter PIN (default: `2026`)
3. Look at the "Live Data Sync" card — should show "✓ Last sync: ..." within 1-2 minutes

If you see "⚠️ Connection error":
- Double-check `BACKEND_URL` is correct
- Open browser console (F12) and look for CORS/network errors

### 5.3 Test a pick

1. Go to **🎯 Join Pool**
2. Enter test name + phone
3. Pick 1st and 2nd for any group
4. Submit
5. Reload the page → data should persist

✅ **Done!** Your pool is live.

---

## Part 6: Share with your friends

### Option A: Host the HTML on GitHub Pages (free)

1. In your repo, go to **Settings** → **Pages**
2. Source: **Deploy from a branch** → **main** → **/frontend**
3. Click **Save**
4. Wait 1-2 minutes for deployment
5. Share the URL: `https://YOUR-USERNAME.github.io/usam-world-cup-2026/usam-world-cup-2026.html`

### Option B: Host on Netlify/Vercel as a static site

Drag the `frontend/` folder into Netlify or use `vercel --prod` from that folder.

### Option C: Just send the HTML file

Email the HTML file to your friends. Works offline (mostly) but won't sync.

---

## 🔄 Updating the app

When you push changes to GitHub:
- **Backend**: Re-run `vercel --prod` from the `backend/` folder
- **Frontend**: If using GitHub Pages, it auto-deploys on push. Otherwise re-upload.

---

## ❓ Troubleshooting

### "vercel: command not found"
```bash
npm install -g vercel
```

### "Cannot find module @vercel/kv"
```bash
cd backend
npm install
vercel --prod
```

### Cron not running
1. Check **Logs** tab in your Vercel project dashboard
2. Crons only run on deployed (not preview) deployments
3. Make sure you deployed with `--prod` flag

### CORS errors in browser
Already handled in `vercel.json`. If you still see them:
1. Force-refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Verify your Vercel URL doesn't have a typo

### 401 errors on admin endpoints
The `ADMIN_TOKEN` in your HTML must EXACTLY match the one in Vercel env vars.

### "WC may not be in free tier" 403 error
The football-data.org free tier may not include all competitions. Workaround: use the manual score entry in Admin until games start, or upgrade the API plan ($12/month).

### Quota warning showing red
The free tier is 10 reqs/minute. We use 1/min. If you see a warning:
- Check if multiple people are pasting their own API keys (only the cron should call)
- Click "Disable Auto-Sync" in Admin

---

## 🆘 Still stuck?

Open an Issue on GitHub with:
- What you tried
- What error you see (screenshot helps!)
- Your Vercel deployment URL (don't share API keys or tokens!)
