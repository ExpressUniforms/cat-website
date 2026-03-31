# Cat Lab — Project Documentation

A warm, playful cat website built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools — open `index.html` in a browser and it works.

---

## What it does

**Cat Lab** is a four-page website that:
- Fetches live cat photos from The Cat API (12 at a time)
- Names cats using Claude Haiku vision (via the Anthropic API)
- Lets users heart/favourite cats and view them on a dedicated Favourites page
- Tells the real, researched history of domestic cats through an animated timeline

---

## File Structure

```
Cat Website/
├── index.html          Home page — hero, feature cards, showcase sections
├── history.html        Cat History — animated timeline + fun facts
├── gallery.html        Live gallery — Cat API photos, AI naming, heart buttons
├── favourites.html     Saved cats — reads from localStorage
├── config.js           YOUR API keys go here (see setup below)
├── config.example.js   Template for config.js — safe to share/commit
├── style.css           Full design system — variables, components, layout
├── app.js              Shared utilities — nav, toast notifications, Favourites storage
├── gallery.js          Gallery page logic — Cat API fetch, Claude vision, heart toggle
├── history.js          Timeline scroll animation (IntersectionObserver)
└── CLAUDE.md           This file
```

---

## Setup

### 1. Get your API keys

**Cat API** (free):
1. Go to https://thecatapi.com
2. Click "Get API Key"
3. Copy your key

**Anthropic API**:
1. Go to https://console.anthropic.com
2. Navigate to API Keys
3. Copy your key

### 2. Add them to config.js

Open `config.js` and replace the placeholder values:

```js
const CONFIG = {
  CAT_API_KEY: "your-cat-api-key-here",
  ANTHROPIC_API_KEY: "your-anthropic-key-here",
};
```

### 3. Open index.html

Open `index.html` in any modern browser. No server required.

> ⚠️ The Anthropic API call uses `anthropic-dangerous-allow-browser: true`. This is intentional for a personal/local project, but means your API key is visible in the browser. Do not deploy this publicly without adding a server-side proxy.

---

## How the AI naming works

When you click ✨ on a gallery card:

1. `gallery.js` sends the cat's image URL to the Anthropic API
2. The request uses Claude Haiku (`claude-haiku-4-5-20251001`) with vision
3. The image is passed as a `url` source type in the messages array
4. Claude returns JSON: `{ "name": "...", "personality": "..." }`
5. The card updates with the name and personality description
6. If the cat is already favourited, the saved data is updated too

---

## How favourites work

Favourites are stored in `localStorage` under the key `catlab_favourites` as a JSON array of objects:

```json
[
  {
    "id": "abc123",
    "url": "https://cdn2.thecatapi.com/images/abc123.jpg",
    "name": "Sir Biscuit",
    "personality": "Quietly judges everyone but secretly loves belly rubs."
  }
]
```

The `Favourites` object in `app.js` handles all read/write operations. It's available globally on all pages.

---

## Design System

Defined in `style.css` as CSS custom properties:

| Variable | Value | Use |
|---|---|---|
| `--coral` | `#E8614B` | Primary actions, accents |
| `--teal` | `#2A9D8F` | Secondary actions, timeline |
| `--cream` | `#FFF8F0` | Page background |
| `--charcoal` | `#2C2C2C` | Headings, body text |
| `--font-display` | Playfair Display | All headings |
| `--font-body` | Inter | All body copy |

---

## Extending the project

A few natural next steps if you want to keep building:

- **Cat breed info** — The Cat API supports breed filtering (`/breeds` endpoint) — could add a breed filter to the gallery
- **Share a cat** — Generate a shareable URL with the cat's image and AI name
- **Export favourites** — Download your collection as a JSON file or image grid
- **Server proxy** — Move the Anthropic API call to a small Node/Cloudflare Worker to hide the API key
- **More timeline entries** — The history timeline can easily take more cards; each `.timeline-item` follows the same pattern

---

## Notes

- The gallery works without a Cat API key (falls back to unauthenticated requests, which have a lower rate limit)
- AI naming requires an Anthropic API key — it will show a toast notification if the key is missing
- The `config.js` file should never be committed to a public repository
- `config.example.js` is the safe-to-share template
