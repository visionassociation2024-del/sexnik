/**
 * Main Application Frontend Logic
 * Pinterest Discovery Architecture, Masonry Feeds, Live Autocomplete & State Management
 */

// State Management
const AppState = {
  category: 'trending',
  page: 1,
  searchQuery: '',
  isLoading: false,
  hasMore: true,
  renderedIds: new Set(),
  videos: []
};

// English Categories Directory
const CATEGORIES = [
  { id: 'trending', name: 'Trending', icon: 'fa-fire' },
  { id: '4k', name: '4K Ultra HD', icon: 'fa-tv' },
  { id: 'stars', name: 'Top Stars', icon: 'fa-crown', link: '/models.html' },
  { id: 'reels', name: 'Reels (+18)', icon: 'fa-clapperboard', link: '/reels.html' },
  { id: 'photos', name: 'Photos & GIFs', icon: 'fa-camera-retro', link: '/photos.html' },
  { id: 'health', name: 'Health & Safety', icon: 'fa-shield-heart', link: '/health.html' },
  { id: 'amateur', name: 'Amateur Couples', icon: 'fa-user' },
  { id: 'milf', name: 'MILF & Mature', icon: 'fa-heart' },
  { id: 'lesbian', name: 'Lesbian & Solo', icon: 'fa-venus-double' },
  { id: 'teen', name: '18+ Youth', icon: 'fa-star' },
  { id: 'anal', name: 'Anal Passion', icon: 'fa-circle-notch' },
  { id: 'blowjob', name: 'Oral & Sensual', icon: 'fa-kiss' },
  { id: 'hardcore', name: 'Hardcore Action', icon: 'fa-bolt' },
  { id: 'japanese', name: 'Asian & Japanese', icon: 'fa-globe' },
  { id: 'vr', name: 'VR 360° Experience', icon: 'fa-vr-cardboard' },
  { id: 'exclusive', name: 'Exclusive HD', icon: 'fa-gem' }
];

// Curated Top Stars for Carousel
const FEATURED_STARS = [
  { name: 'Angela White', views: '48.2M', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80', slug: 'angela-white' },
  { name: 'Eva Elfie', views: '39.8M', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80', slug: 'eva-elfie' },
  { name: 'Abella Danger', views: '42.1M', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&auto=format&fit=crop&q=80', slug: 'abella-danger' },
  { name: 'Lana Rhoades', views: '54.6M', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&auto=format&fit=crop&q=80', slug: 'lana-rhoades' },
  { name: 'Mia Malkova', views: '36.5M', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80', slug: 'mia-malkova' },
  { name: 'Kendra Lust', views: '31.4M', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80', slug: 'kendra-lust' },
  { name: 'Sweetie Fox', views: '28.9M', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80', slug: 'sweetie-fox' },
  { name: 'Lena Paul', views: '33.2M', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80', slug: 'lena-paul' }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initFilterChips();
  initTopStarsCarousel();
  initSearchAutocomplete();
  initInfiniteScrollObserver();

  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const cat = urlParams.get('cat');

  if (q) {
    AppState.searchQuery = q.trim();
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = AppState.searchQuery;
    loadVideos(true);
  } else if (cat) {
    AppState.category = cat;
    highlightActiveChip(cat);
    loadVideos(true);
  } else {
    loadVideos(true);
  }
});

// Render Filter Chips
function initFilterChips() {
  const container = document.getElementById('filterChipsBar');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const isLink = !!cat.link;
    const activeClass = cat.id === AppState.category ? 'active' : '';
    if (isLink) {
      return `
        <a href="${cat.link}" class="filter-chip">
          <i class="fa ${cat.icon}"></i>
          <span>${cat.name}</span>
        </a>
      `;
    }
    return `
      <button class="filter-chip ${activeClass}" onclick="selectCategory('${cat.id}', this)">
        <i class="fa ${cat.icon}"></i>
        <span>${cat.name}</span>
      </button>
    `;
  }).join('');
}

function selectCategory(catId, btnEl) {
  if (AppState.category === catId && !AppState.searchQuery) return;
  AppState.category = catId;
  AppState.searchQuery = '';
  
  // Update UI
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = '';

  // Update URL state without page refresh
  const newUrl = catId === 'trending' ? '/' : `/?cat=${catId}`;
  window.history.pushState({}, '', newUrl);

  loadVideos(true);
}

function highlightActiveChip(catId) {
  document.querySelectorAll('.filter-chip').forEach(c => {
    const text = c.textContent.trim().toLowerCase();
    if (text.includes(catId.toLowerCase())) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

// Render Top Stars Carousel
function initTopStarsCarousel() {
  const container = document.getElementById('topStarsCarousel');
  if (!container) return;

  container.innerHTML = FEATURED_STARS.map(star => `
    <div class="star-card-compact" onclick="window.location.href='/model.html?slug=${star.slug}'">
      <div class="star-avatar-wrap">
        <img src="${star.avatar}" alt="${star.name}" class="star-avatar-img" loading="lazy">
        <div class="star-verified-check"><i class="fa fa-check"></i></div>
      </div>
      <span class="star-name-label">${star.name}</span>
      <span class="star-meta-count">${star.views} views</span>
    </div>
  `).join('');
}

// Load Videos Feed from API
async function loadVideos(reset = false) {
  if (AppState.isLoading) return;
  if (!reset && !AppState.hasMore) return;

  AppState.isLoading = true;
  const grid = document.getElementById('pinMasonryGrid');
  const loadingIndicator = document.getElementById('gridLoadingIndicator');

  if (reset) {
    AppState.page = 1;
    AppState.hasMore = true;
    AppState.renderedIds.clear();
    AppState.videos = [];
    if (grid) grid.innerHTML = '';
  }

  if (loadingIndicator) loadingIndicator.style.display = 'flex';

  try {
    let url = '';
    if (AppState.searchQuery) {
      url = `/api/search?q=${encodeURIComponent(AppState.searchQuery)}&page=${AppState.page}`;
    } else {
      url = `/api/videos?category=${encodeURIComponent(AppState.category)}&page=${AppState.page}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const videoList = data.videos || (Array.isArray(data) ? data : []);

    if (videoList.length === 0) {
      AppState.hasMore = false;
      if (reset && grid) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 64px 20px; background: #ffffff; border-radius: 16px; margin: 20px 0;">
            <i class="fa fa-search" style="font-size: 42px; color: #91918c; margin-bottom: 16px;"></i>
            <h3 style="font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px;">No Pins Found</h3>
            <p style="color: #62625b; font-size: 15px; margin-bottom: 20px;">Try searching for different keywords or explore our top categories.</p>
            <button class="btn-primary" onclick="selectCategory('trending', null)">Explore Trending</button>
          </div>
        `;
      }
    } else {
      renderPins(videoList, grid);
      AppState.page++;
    }
  } catch (err) {
    console.error('[Feed Error]', err);
    if (reset && grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px;">
          <p style="color: #9e0a0a; font-weight: 600;">Unable to load video pins. Please try again.</p>
          <button class="btn-secondary" style="margin-top: 12px;" onclick="loadVideos(true)">Retry</button>
        </div>
      `;
    }
  } finally {
    AppState.isLoading = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Render Pin Cards into Masonry Grid
function renderPins(videos, container) {
  if (!container) return;

  const fragment = document.createDocumentFragment();

  videos.forEach(video => {
    if (AppState.renderedIds.has(video.id)) return;
    AppState.renderedIds.add(video.id);

    const card = document.createElement('div');
    card.className = 'pin-card';
    card.dataset.id = video.id;
    card.dataset.title = video.title || 'Exclusive Stream';
    card.dataset.thumb = video.thumbnail || '';
    card.dataset.duration = video.duration || '10:00';
    card.dataset.author = video.author || 'Featured Performer';

    const isSaved = window.pinEngine ? window.pinEngine.isPinSaved(video.id) : false;
    const saveBtnText = isSaved ? 'Saved' : 'Save';
    const saveBtnBg = isSaved ? '#262622' : '#e60023';

    card.innerHTML = `
      <div class="pin-media-wrapper" onclick="openPin('${video.id}', '${video.source || ''}')">
        <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" class="pin-image" loading="lazy">
        <div class="pin-overlay-scrim"></div>
        <button class="pin-save-cta js-save-pin" data-id="${video.id}" style="background-color: ${saveBtnBg};" title="Save Pin">${saveBtnText}</button>
        <span class="pin-overlay-pill pin-pill-duration">${video.duration || '12:00'}</span>
        ${video.rating ? `<span class="pin-overlay-pill pin-pill-badge"><i class="fa fa-thumbs-up" style="font-size: 10px; margin-right: 4px;"></i>${video.rating}</span>` : ''}
        <div class="pin-quick-actions">
          <button class="pin-action-btn" onclick="event.stopPropagation(); openPin('${video.id}', '${video.source || ''}');" title="Watch Video">
            <i class="fa fa-play"></i>
          </button>
          <button class="pin-action-btn" onclick="event.stopPropagation(); copyPinLink('${video.id}');" title="Share Pin">
            <i class="fa fa-arrow-up-right-from-square"></i>
          </button>
        </div>
      </div>
      <div class="pin-meta" onclick="openPin('${video.id}', '${video.source || ''}')">
        <h3 class="pin-title">${escapeHtml(video.title)}</h3>
        <div class="pin-author">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=60" class="pin-author-avatar" alt="Star">
          <span class="pin-author-name">${video.author || 'Wi9ayah Star'} • ${video.views || '15.2K'} views</span>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);

  if (window.pinEngine) {
    window.pinEngine.observeImages(container);
  }
}

// Navigation & Actions
function openPin(videoId, source = '') {
  window.location.href = `/watch.html?id=${encodeURIComponent(videoId)}${source ? '&src=' + encodeURIComponent(source) : ''}`;
}

function copyPinLink(videoId) {
  const url = `${window.location.origin}/watch.html?id=${videoId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      if (window.pinEngine) window.pinEngine.showToast('Link copied to clipboard! 📋', 'success');
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Infinite Scroll Observer
function initInfiniteScrollObserver() {
  const sentinel = document.getElementById('gridSentinel');
  if (!sentinel) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !AppState.isLoading && AppState.hasMore) {
      loadVideos(false);
    }
  }, { rootMargin: '400px 0px' });

  observer.observe(sentinel);
}

// Live Predictive Autocomplete
function initSearchAutocomplete() {
  const searchInput = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchAutocompleteDropdown');
  if (!searchInput || !dropdown) return;

  let debounceTimeout = null;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      dropdown.classList.remove('active');
      return;
    }

    debounceTimeout = setTimeout(() => {
      renderAutocompleteSuggestions(query, dropdown);
    }, 180);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

function renderAutocompleteSuggestions(query, dropdown) {
  const suggestions = [
    { text: `${query} in Top Stars`, icon: 'fa-crown', type: 'stars', url: `/models.html?q=${encodeURIComponent(query)}` },
    { text: `${query} in 4K UHD`, icon: 'fa-tv', type: '4k', url: `/?q=${encodeURIComponent(query + ' 4k')}` },
    { text: `${query} in Reels`, icon: 'fa-clapperboard', type: 'reels', url: `/reels.html?q=${encodeURIComponent(query)}` },
    { text: `Search for "${query}"`, icon: 'fa-search', type: 'search', url: `/?q=${encodeURIComponent(query)}` }
  ];

  dropdown.innerHTML = `
    <div class="autocomplete-section-title">Quick Search</div>
    ${suggestions.map(s => `
      <div class="autocomplete-item" onclick="window.location.href='${s.url}'">
        <i class="fa ${s.icon}"></i>
        <span>${escapeHtml(s.text)}</span>
      </div>
    `).join('')}
  `;

  dropdown.classList.add('active');
}

function executeSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  if (!searchInput) return;

  const query = searchInput.value.trim();
  if (!query) return;

  const dropdown = document.getElementById('searchAutocompleteDropdown');
  if (dropdown) dropdown.classList.remove('active');

  AppState.searchQuery = query;
  AppState.category = '';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

  window.history.pushState({}, '', `/?q=${encodeURIComponent(query)}`);
  loadVideos(true);
}
