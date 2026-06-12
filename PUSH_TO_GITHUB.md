# 📤 Pushing to GitHub — Quick Reference

Step-by-step commands to push this repo to GitHub.

---

## First-time setup

### 1. Create the repo on GitHub
1. Go to https://github.com/new
2. Repository name: `usam-world-cup-2026`
3. Description: `World Cup 2026 prediction pool for friend groups`
4. Visibility: **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have them)
6. Click **Create repository**

### 2. From your local folder
```bash
# Go into the folder where you extracted everything
cd usam-world-cup-2026

# Initialize git
git init

# Stage all files
git add .

# First commit
git commit -m "Initial commit: USAM World Cup 2026 pool app"

# Set main branch
git branch -M main

# Link to your GitHub repo (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/usam-world-cup-2026.git

# Push
git push -u origin main
```

---

## Subsequent updates

```bash
# See what changed
git status

# Stage changes
git add .

# Commit with a message
git commit -m "fix: dropdown not showing teams on Windows Chrome"

# Push
git push
```

---

## Common workflows

### Update just the frontend
```bash
git add frontend/
git commit -m "frontend: update scoring display"
git push
```

### Update just the backend (then redeploy to Vercel)
```bash
git add backend/
git commit -m "backend: increase cache duration"
git push

# Then redeploy to Vercel:
cd backend
vercel --prod
```

### Add docs
```bash
git add docs/
git commit -m "docs: clarify scoring tiebreakers"
git push
```

---

## Branching (optional, for collaborators)

```bash
# Create a feature branch
git checkout -b feature/dark-mode

# ... make changes ...

git add .
git commit -m "feat: add dark mode toggle"
git push -u origin feature/dark-mode

# Then open a Pull Request on GitHub
```

---

## ⚠️ Before pushing — make sure these aren't committed

The `.gitignore` should handle these, but double-check you don't have:

- ❌ `.env` files with API keys
- ❌ `node_modules/` folder
- ❌ `.vercel/` folder (contains project IDs)
- ❌ Any file with your `ADMIN_TOKEN` written in plain text
- ❌ Backup files (`*.bak`)

To check what will be committed:
```bash
git status
git diff --cached
```

If you accidentally committed secrets, see https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

## 🔐 Security notes

The `BACKEND_URL` and `ADMIN_TOKEN_CLIENT` in `usam-world-cup-2026.html` will be **public** if your repo is public. This means:

- **Anyone can call your admin endpoints** if they know the URL + token
- For a **friend group**: acceptable risk if your token is long & random
- For **higher security**: keep the repo private, OR use a server-side proxy

**Better approach for production**:
1. Make the repo private
2. Use environment-based config (build step that injects tokens)
3. Or: keep the HTML local, only push backend + docs to GitHub

---

## 🌐 Hosting the frontend via GitHub Pages

1. Go to repo **Settings** → **Pages**
2. Source: **Deploy from a branch** → **main**
3. Folder: **/frontend**
4. Click **Save**
5. Wait ~1 min
6. Visit: `https://YOUR-USERNAME.github.io/usam-world-cup-2026/usam-world-cup-2026.html`

Updates auto-deploy when you push to `main`.
