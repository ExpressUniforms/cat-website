/* ============================================================
   Cat Lab — Gallery Logic
   Cat API fetching · AI naming via Claude vision · Favourites
   ============================================================ */

const CAT_API_BASE     = 'https://api.thecatapi.com/v1/images/search';
const CAT_API_BREEDS   = 'https://api.thecatapi.com/v1/breeds';
const ANTHROPIC_BASE   = 'http://localhost:3001/v1/messages';
const CLAUDE_MODEL     = 'claude-haiku-4-5-20251001';
const PAGE_SIZE        = 12;

let catApiKey      = '';
let anthropicKey   = '';
let isLoading      = false;
let activeBreedId   = '';
let activeBreedName = '';

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  checkApiBanner();
  fetchBreeds();

  document.getElementById('load-more-btn').addEventListener('click', () => {
    if (!isLoading) fetchCats();
  });

  document.getElementById('breed-select').addEventListener('change', function () {
    activeBreedId   = this.value;
    activeBreedName = this.value ? this.options[this.selectedIndex].text : '';
    document.getElementById('gallery-grid').innerHTML = '';
    fetchCats();
  });
});

// ── Config ───────────────────────────────────────────────────
function loadConfig() {
  try {
    if (typeof CONFIG !== 'undefined') {
      catApiKey    = CONFIG.CAT_API_KEY    || '';
      anthropicKey = CONFIG.ANTHROPIC_API_KEY || '';
    }
  } catch (e) {
    console.warn('config.js not found or invalid. Running without API keys.');
  }
  // Treat placeholder strings as empty
  if (catApiKey    === 'YOUR_CAT_API_KEY_HERE')    catApiKey    = '';
  if (anthropicKey === 'YOUR_ANTHROPIC_API_KEY_HERE') anthropicKey = '';
}

function checkApiBanner() {
  const banner = document.getElementById('api-banner');
  if (!banner) return;
  if (!catApiKey || !anthropicKey) {
    banner.style.display = 'flex';
  }
}

// ── Skeleton loaders ─────────────────────────────────────────
function renderSkeletons(count) {
  const grid = document.getElementById('gallery-grid');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text-sm"></div>
    `;
    frag.appendChild(el);
  }
  grid.appendChild(frag);
}

function removeSkeletons() {
  document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
}

// ── Fetch breeds from The Cat API ────────────────────────────
async function fetchBreeds() {
  const select = document.getElementById('breed-select');
  renderSkeletons(PAGE_SIZE);

  const url = new URL(CAT_API_BREEDS);
  if (catApiKey) url.searchParams.set('api_key', catApiKey);

  try {
    const res    = await fetch(url.toString());
    const breeds = await res.json();

    if (Array.isArray(breeds)) {
      breeds
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(breed => {
          const opt = document.createElement('option');
          opt.value       = breed.id;
          opt.textContent = breed.name;
          select.appendChild(opt);
        });
    }
  } catch (err) {
    console.warn('Could not load breeds:', err);
    document.getElementById('filter-count').textContent = 'Breed filter unavailable';
  } finally {
    select.disabled = false;
    fetchCats();
  }
}

// ── Fetch cats from The Cat API ───────────────────────────────
async function fetchCats() {
  isLoading = true;
  const btn = document.getElementById('load-more-btn');
  btn.textContent = 'Fetching cats…';
  btn.disabled = true;

  renderSkeletons(PAGE_SIZE);

  const url = new URL(CAT_API_BASE);
  url.searchParams.set('limit', PAGE_SIZE);
  if (catApiKey) url.searchParams.set('api_key', catApiKey);
  if (activeBreedId) {
    url.searchParams.set('breed_ids', activeBreedId);
  } else {
    url.searchParams.set('has_breeds', '1');
  }

  try {
    const res  = await fetch(url.toString());
    const cats = await res.json();
    removeSkeletons();

    if (!Array.isArray(cats) || cats.length === 0) {
      showToast('No cats found for this breed. Try another!', '');
      return;
    }

    const grid = document.getElementById('gallery-grid');
    cats.forEach(cat => {
      const card = buildCatCard(cat);
      grid.appendChild(card);
    });

    updateFilterCount();

  } catch (err) {
    removeSkeletons();
    console.error('Cat API error:', err);
    showToast('Failed to fetch cats. Are you online?', '');
  } finally {
    isLoading = false;
    btn.textContent = 'Load More Cats 🐾';
    btn.disabled = false;
  }
}

// ── Build a single cat card ───────────────────────────────────
function buildCatCard(cat) {
  const isLoved = Favourites.has(cat.id);

  const card = document.createElement('div');
  card.className = 'cat-card';
  card.dataset.catId  = cat.id;
  card.dataset.catUrl = cat.url;

  card.innerHTML = `
    <div class="cat-card-img-wrap">
      <img src="${escHtml(cat.url)}" alt="A cat" loading="lazy" />
      <div class="cat-card-actions">
        <button class="heart-btn ${isLoved ? 'loved' : ''}" title="${isLoved ? 'Remove from favourites' : 'Add to favourites'}" aria-label="Favourite">
          ${isLoved ? '❤️' : '🤍'}
        </button>
        <button class="name-btn" title="Name this cat with AI" aria-label="Name this cat">
          ✨
        </button>
      </div>
    </div>
    <div class="cat-card-body">
      ${cat.breeds && cat.breeds[0]
        ? `<span class="breed-tag">${escHtml(cat.breeds[0].name)}</span>`
        : ''}
      <div class="cat-name"></div>
      <div class="cat-personality"></div>
    </div>
  `;

  // Heart button
  card.querySelector('.heart-btn').addEventListener('click', () => toggleHeart(card, cat));

  // Name button
  card.querySelector('.name-btn').addEventListener('click', () => nameCat(card, cat));

  return card;
}

// ── Toggle favourite ──────────────────────────────────────────
function toggleHeart(card, cat) {
  const btn      = card.querySelector('.heart-btn');
  const nameEl   = card.querySelector('.cat-name');
  const persEl   = card.querySelector('.cat-personality');

  const catData = {
    id:          cat.id,
    url:         cat.url,
    name:        nameEl.textContent        || '',
    personality: persEl.textContent        || '',
  };

  const nowLoved = Favourites.toggle(catData);

  if (nowLoved) {
    btn.classList.add('loved');
    btn.innerHTML = '❤️';
    btn.title = 'Remove from favourites';
    showToast('Saved to favourites ❤️', 'love');
  } else {
    btn.classList.remove('loved');
    btn.innerHTML = '🤍';
    btn.title = 'Add to favourites';
    showToast('Removed from favourites', '');
  }
}

// ── Name a cat via Claude vision ──────────────────────────────
async function nameCat(card, cat) {
  if (!anthropicKey) {
    showToast('Add your Anthropic API key to config.js to use AI naming ✨', '');
    return;
  }

  const nameBtn  = card.querySelector('.name-btn');
  const nameEl   = card.querySelector('.cat-name');
  const persEl   = card.querySelector('.cat-personality');

  // Already named? Re-name.
  nameBtn.disabled = true;
  nameBtn.title    = 'Naming…';

  nameEl.innerHTML  = '<div class="cat-name-loading"><div class="spinner"></div> Naming…</div>';
  persEl.textContent = '';

  try {
    const result = await callClaudeVision(cat.url);
    nameEl.textContent  = result.name        || 'Mysterious Cat';
    persEl.textContent  = result.personality || '';

    // Update saved favourite if this cat is already loved
    if (Favourites.has(cat.id)) {
      const catData = {
        id:          cat.id,
        url:         cat.url,
        name:        result.name        || '',
        personality: result.personality || '',
      };
      Favourites.remove(cat.id);
      Favourites.add(catData);
    }

    nameBtn.title    = 'Rename this cat';
    showToast(`Meet ${result.name || 'this cat'} 🐾`, 'info');

  } catch (err) {
    console.error('Claude naming error:', err);
    nameEl.textContent  = '';
    persEl.textContent  = 'Naming failed — check your Anthropic API key.';
    showToast('AI naming failed. Check console for details.', '');
  } finally {
    nameBtn.disabled = false;
  }
}

// ── Claude Haiku vision API call ──────────────────────────────
async function callClaudeVision(imageUrl) {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url:  imageUrl,
            },
          },
          {
            type: 'text',
            text: `Look at this cat photo and respond with ONLY valid JSON in this exact format, no other text:
{
  "name": "A creative, fitting name for this specific cat (1-3 words)",
  "personality": "A single sentence describing this cat's personality based on their appearance and expression."
}

Be creative and specific to what you see — no generic names like "Fluffy" or "Whiskers". Make it feel like you really looked at this particular cat.`,
          },
        ],
      },
    ],
  };

  const res = await fetch(ANTHROPIC_BASE, {
    method:  'POST',
    headers: {
      'Content-Type':                    'application/json',
      'x-api-key':                       anthropicKey,
      'anthropic-version':               '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic API error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const raw  = data.content?.[0]?.text || '{}';

  // Parse the JSON response (strip any accidental markdown fences)
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function updateFilterCount() {
  const el = document.getElementById('filter-count');
  if (!el) return;
  el.textContent = activeBreedName ? `Showing: ${activeBreedName}` : '';
}

// ── Utility ───────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
