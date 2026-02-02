# MLO Test Prep (GitHub Pages)

A simple, modern, offline-ready (PWA-style) web app for SAFE MLO study.

## What's inside
- **Flashcards**: tap to flip, swipe, shuffle, swap which side shows first.
- **Tests**:
  - Random Question
  - Quick 10
  - Mock Exam (120 Q + 4-hour timer, weighted by content area)

## Data files (you own these)
- `data/flashcards.json` → array of `{ "term": "...", "definition": "..." }`
- `data/questions.json`  → array of MCQs (see sample in file)

## Run locally
Open `index.html` with a local server (recommended):
- VS Code → Live Server extension
- or `python -m http.server`

## Deploy on GitHub Pages
1. Create a new repo
2. Upload this folder
3. Repo Settings → Pages → Deploy from branch → `main` / `root`

## Mock exam weighting
The mock exam defaults to the NMLS SAFE MLO outline weights:
Federal laws 24%, Uniform State 11%, General 20%, Origination 27%, Ethics 18%.

To make weighting work, tag questions with `category`:
- `federal`, `state`, `general`, `origination`, `ethics`
