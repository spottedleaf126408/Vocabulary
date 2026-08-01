[README.md](https://github.com/user-attachments/files/30616667/README.md)
# My Vocabulary

A vocab-learning webtool for three students, each with their own word list,
progress, and theme — Jie gets a Brawl Stars look, Fay gets a Morandi
palette, Huna gets an apothecary/herbalist look. Data lives in a Google
Sheet; the frontend is a static React app deployed on Netlify.

## 1. Upload this to GitHub

Create an empty repository on GitHub, then open it → "Add file" → "Upload
files" → drag in everything inside this folder (README.md,
google-apps-script, index.html, netlify.toml, package.json,
package-lock.json, src, .gitignore, .env.example) → "Commit changes."

## 2. Connect it to Netlify

1. Netlify → Add new site → Import an existing project → pick this repo.
2. Build command and publish folder are already set in `netlify.toml`, so Netlify should pick them up automatically (`npm run build`, folder `dist`).
3. Site settings → Environment variables → add one:
   - `VITE_APPS_SCRIPT_URL` = `https://script.google.com/macros/s/AKfycbwHQC6r8ws2u0pkfeFb5tVyUEORWP_hEnu5KLXiQgFs0Sp8iJSg3O55KRp2H7q9wEP6/exec`
4. Deploy. You'll get a live `.netlify.app` link — open it and log in as Jie (PIN 0888), Fay (PIN 2026), or Huna (PIN 0222).

Every future upload to this repo's `main` branch auto-redeploys the site.

## Backend (already deployed, nothing to do)

`google-apps-script/Code.gs` is the backend code, already deployed at the
URL above. Only touch this if you ever want to change how the backend
behaves — then: open the Sheet → Extensions → Apps Script → paste the
updated code → Deploy → Manage deployments → edit the existing deployment →
New version → Deploy (keeps the same URL, so you won't need to update
Netlify's environment variable).

## Adding a 4th student later

1. In `google-apps-script/Code.gs`, add their name to the `STUDENTS` list near the top, then redeploy as above and run the `setup()` function once (Apps Script editor → select `setup` → Run) — this creates their Sheet tabs automatically.
2. In `src/students.js`, add their entry: name, PIN, a theme (reuse one of the three in `src/styles.css`, or add a new one), matching Sheet tab name, and an avatar icon.
3. Upload the changed files to GitHub — Netlify redeploys, Jie/Fay/Huna's data is untouched.

## Project structure

```
src/
  api.js          — talks to the Apps Script backend
  students.js      — student config: name, PIN, theme, Sheet tab
  wordFields.js     — shared list of vocab entry fields
  styles.css        — all three themes + shared component styles
  App.jsx           — top-level state, layout, page routing
  pages/
    Login.jsx        — avatar picker + PIN pad
    Home.jsx          — dashboard
    Entry.jsx          — add-word form
    WordList.jsx        — sortable list, expand for full detail, edit/delete
    Flashcards.jsx        — setup (familiarity/time/count) + review + self-rating
    Quiz.jsx                — setup (familiarity/count/format/direction) + scoring
    Stats.jsx                 — familiarity distribution, streak, level
google-apps-script/
  Code.gs — backend (word CRUD, XP/streak/leveling)
```
