# Contributing

Thanks for your interest in contributing! This is a small personal project but improvements are welcome.

## Ways to contribute

- 🐛 **Report bugs** via Issues
- 💡 **Suggest features** via Issues
- 🔧 **Submit fixes** via Pull Requests
- 🌍 **Add translations** (currently EN/ES — Portuguese, French, etc. welcome)
- 📚 **Improve docs**

## Local development

### Frontend only
```bash
# Just open the HTML file in a browser
open frontend/usam-world-cup-2026.html
```

For live reload during development, use any simple static server:
```bash
cd frontend
python3 -m http.server 8000
# Open http://localhost:8000/usam-world-cup-2026.html
```

### Backend
```bash
cd backend
npm install
vercel dev    # Runs the cron + endpoints locally
```

You'll need `.env.local` with:
```
FOOTBALL_DATA_API_KEY=your_key_here
ADMIN_TOKEN=your_admin_token
KV_REST_API_URL=...   # from Vercel KV dashboard
KV_REST_API_TOKEN=... # from Vercel KV dashboard
```

## Code style

- **HTML/JS/CSS**: 2-space indentation, no trailing whitespace
- **No build step**: keep the frontend as a single file
- **Comments in English** in code, doc strings can be bilingual
- **Test your changes** before submitting — manual testing on mobile + desktop

## Submitting a PR

1. Fork the repo
2. Create a branch: `git checkout -b fix/your-fix-name`
3. Make your changes
4. Test locally
5. Commit with a clear message: `git commit -m "fix: dropdown options not visible on Windows Chrome"`
6. Push and open a PR

## Adding a new language

In `usam-world-cup-2026.html`, find the `I18N` object:
```javascript
const I18N = {
  en: { ... },
  es: { ... },
  // Add your language here:
  pt: { joinTitle: '...', ... }
};
```

Then update the language switcher buttons in the header.

## Questions?

Open an Issue and tag it `question`.
