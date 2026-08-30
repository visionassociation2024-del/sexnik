// Monetization & Smartlink Configuration
const SMARTLINK_URL = 'https://www.profitableratecpmnetwork.com/k46g8trs?key=d6b9b043fad434efa68a86b7b0f6b0ab';
const ALLOWED_AD_DOMAINS = [
  'profitableratecpmnetwork.com',
  'highrevenueformat.com'
];

function isAllowedAdUrl(urlStr) {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr, window.location.origin);
    return ALLOWED_AD_DOMAINS.some(domain => parsed.hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Intensive Smart Popunder Handler for Maximum Monetization
(function initSmartlinkMonetization() {
  let clickCount = 0;
  const COOLDOWN_MS = 30 * 1000;

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && isAllowedAdUrl(link.href)) {
      return;
    }

    clickCount++;
    const lastFired = parseInt(sessionStorage.getItem('nx_smartlink_photos_pop') || '0', 10);
    const now = Date.now();

    if ((clickCount % 2 === 1) && (now - lastFired > COOLDOWN_MS)) {
      sessionStorage.setItem('nx_smartlink_photos_pop', now.toString());
      try {
        const adWin = window.open(SMARTLINK_URL, '_blank');
        if (adWin) {
          adWin.blur();
          window.focus();
        }
      } catch (err) {}
    }
  }, { capture: true });
})();

// Gallery State
let currentPhotoCategory = 'all';
let currentPhotoPage = 1;
let isPhotosLoading = false;
let hasMorePhotos = true;
let renderedMediaKeys = new Set();
let photosObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || 'all';
  loadPhotosFeed(q, true);
  initPhotosInfiniteScroll();
});

async function loadPhotosFeed(category = 'all', isInitial = false) {
  if (isPhotosLoading || (!hasMorePhotos && !isInitial)) return;
  isPhotosLoading = true;

  currentPhotoCategory = category;
  const grid = document.getElementById('photosGrid');
  const loader = document.getElementById('photosLoader');
  const countLabel = document.getElementById('photosCountLabel');

  if (isInitial) {
    currentPhotoPage = 1;
    hasMorePhotos = true;
    renderedMediaKeys.clear();
    grid.innerHTML = getPhotosSkeletonHTML(8);
  } else if (loader) {
    loader.style.display = 'flex';
  }

  try {
    let endpoint = `/api/photos?q=${encodeURIComponent(category)}&page=${currentPhotoPage}`;
    if (category === 'gifs') {
      endpoint = `/api/gifs?q=hot&page=${currentPhotoPage}`;
    }

    const res = await fetch(endpoint);
    const data = await res.json();
    const items = (data.success && (data.items || data.gifs)) ? (data.items || data.gifs) : [];

    if (isInitial) grid.innerHTML = '';

    if (items.length > 0) {
      const uniqueItems = items.filter(item => {
        const key = item.id || item.image_url || item.gif_url || item.thumbnail;
        if (!key || renderedMediaKeys.has(key)) return false;
        renderedMediaKeys.add(key);
        return true;
      });

      if (uniqueItems.length > 0) {
        uniqueItems.forEach(item => {
          grid.appendChild(createPhotoCard(item));
        });
        currentPhotoPage++;
        if (countLabel) countLabel.innerText = `${renderedMediaKeys.size}+ HD Photos & GIFs`;
      } else if (currentPhotoPage > 1) {
        currentPhotoPage++;
      }
    } else {
      if (isInitial) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No photos or GIFs found in this category.</div>';
      }
      hasMorePhotos = false;
    }
  } catch (err) {
    console.error('Failed to load photos:', err);
    if (isInitial) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 50px;">Failed to load media. Check your connection.</div>';
    }
  } finally {
    isPhotosLoading = false;
    if (loader) loader.style.display = 'none';
  }
}

function createPhotoCard(item) {
  const card = document.createElement('div');
  card.className = 'gif-card animate-fade';

  card.onclick = () => {
    try {
      const adWin = window.open(SMARTLINK_URL, '_blank');
      if (adWin) {
        adWin.blur();
        window.focus();
      }
    } catch (err) {}
    openPhotoLightbox(item);
  };

  const mediaSrc = item.image_url || item.gif_url || item.mp4_url || item.thumbnail;
  const isGif = item.type === 'gif' || String(mediaSrc).includes('.gif') || String(mediaSrc).includes('/gif') || (item.tags && item.tags.includes('gif'));
  const isMp4 = String(mediaSrc).endsWith('.mp4');
  const title = item.title || 'HD Model Media';
  const views = item.views || '45K';
  const likes = item.likes || '3.2K';

  card.innerHTML = `
    <div class="gif-thumb-wrap">
      ${isMp4 
        ? `<video src="${mediaSrc}" autoplay loop muted playsinline></video>` 
        : `<img src="${mediaSrc}" alt="${title}" loading="lazy" onerror="this.src='/images/logo.png'">`
      }
      <span class="badge-gif-hot"><i class="fa fa-fire"></i> ${isGif ? 'HOT GIF' : 'HD PHOTO'}</span>
      <span class="badge-gif-type"><i class="${isGif ? 'fa fa-film' : 'fa fa-camera'}"></i> ${isGif ? 'GIF' : 'PHOTO'}</span>
    </div>
    <div class="gif-details">
      <h3 class="gif-title" title="${title}">${title}</h3>
      <div class="gif-meta">
        <span><i class="fa fa-eye"></i> ${views}</span>
        <span style="color: var(--accent-pink);"><i class="fa fa-heart"></i> ${likes}</span>
      </div>
    </div>
  `;

  return card;
}

function openPhotoLightbox(item) {
  const modal = document.getElementById('photoLightboxModal');
  const mediaWrap = document.getElementById('photoLightboxMedia');
  const titleEl = document.getElementById('photoLightboxTitle');
  if (!modal || !mediaWrap) return;

  const mediaSrc = item.image_url || item.gif_url || item.mp4_url || item.thumbnail;
  const isMp4 = String(mediaSrc).endsWith('.mp4');

  if (isMp4) {
    mediaWrap.innerHTML = `<video src="${mediaSrc}" controls autoplay loop playsinline style="max-height: 70vh; width: 100%; object-fit: contain;"></video>`;
  } else {
    mediaWrap.innerHTML = `<img src="${mediaSrc}" alt="${item.title || ''}" style="max-height: 70vh; width: 100%; object-fit: contain;">`;
  }

  if (titleEl) titleEl.innerText = item.title || 'HD Model Photo / GIF';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePhotoLightbox(e) {
  if (e && e.target && e.target.classList.contains('btn-gif-action')) return;
  const modal = document.getElementById('photoLightboxModal');
  const mediaWrap = document.getElementById('photoLightboxMedia');
  if (modal) modal.classList.remove('active');
  if (mediaWrap) mediaWrap.innerHTML = '';
  document.body.style.overflow = '';
}

function switchPhotosTab(cat, btn) {
  document.querySelectorAll('.btn-photo-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadPhotosFeed(cat, true);
}

function initPhotosInfiniteScroll() {
  const sentinel = document.getElementById('photosSentinel');
  if (!sentinel) return;

  if (photosObserver) photosObserver.disconnect();

  photosObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isPhotosLoading && hasMorePhotos) {
      loadPhotosFeed(currentPhotoCategory, false);
    }
  }, { rootMargin: '400px' });

  photosObserver.observe(sentinel);
}

function handlePhotosSearch(e) {
  if (e.key === 'Enter') executePhotosSearch();
}

function executePhotosSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) loadPhotosFeed(q, true);
}

function getPhotosSkeletonHTML(count = 8) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="gif-card" style="opacity: 0.5;">
        <div class="gif-thumb-wrap" style="background: #1e1e2d; min-height: 220px;"></div>
        <div class="gif-details">
          <div style="height: 12px; background: #28283c; border-radius: 4px; margin-bottom: 6px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}
