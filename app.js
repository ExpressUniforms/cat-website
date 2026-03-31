/* ============================================================
   Cat Lab — Shared Utilities & Navigation
   ============================================================ */

// ── Active nav link ─────────────────────────────────────────
(function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ── Mobile hamburger ────────────────────────────────────────
(function initHamburger() {
  const btn   = document.getElementById('nav-hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    links.classList.toggle('open');
    btn.setAttribute('aria-expanded', links.classList.contains('open'));
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
    }
  });
})();

// ── Toast notifications ──────────────────────────────────────
let toastTimer = null;
function showToast(message, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast' + (type ? ' toast-' + type : '');
  // Force reflow then add show class
  toast.offsetHeight;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Favourites storage ────────────────────────────────────────
const Favourites = {
  _key: 'catlab_favourites',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this._key)) || [];
    } catch {
      return [];
    }
  },

  has(id) {
    return this.getAll().some(c => c.id === id);
  },

  add(cat) {
    const favs = this.getAll();
    if (!this.has(cat.id)) {
      favs.unshift(cat); // newest first
      localStorage.setItem(this._key, JSON.stringify(favs));
    }
  },

  remove(id) {
    const favs = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(this._key, JSON.stringify(favs));
  },

  toggle(cat) {
    if (this.has(cat.id)) {
      this.remove(cat.id);
      return false; // now un-favourited
    } else {
      this.add(cat);
      return true; // now favourited
    }
  },

  count() {
    return this.getAll().length;
  }
};

// ── Expose globally ──────────────────────────────────────────
window.showToast  = showToast;
window.Favourites = Favourites;
