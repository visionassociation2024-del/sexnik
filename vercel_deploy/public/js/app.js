// Anti-External Navigation & Anti-Popup Security Guard
(function initAntiRedirectShield() {
  // 1. Block any attempt to open external popups or popunders
  window.open = function(url, target, features) {
    console.warn('[Anti-Redirect] Blocked popup window:', url);
    return null;
  };

  // 2. Intercept all clicks on links and buttons, ensuring all stays strictly inside niksex
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
      try {
        const targetUrl = new URL(link.href, window.location.origin);
        if (targetUrl.hostname !== window.location.hostname && (targetUrl.protocol === 'http:' || targetUrl.protocol === 'https:')) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[Anti-Redirect] Blocked external navigation:', link.href);
          return false;
        }
      } catch (err) {
        e.preventDefault();
      }
    }
  }, true);
})();

let currentVideos = [];
let currentCategory = 'trending';
let currentSearchQuery = '';
let isSearchMode = false;
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let renderedVideoIds = new Set();
let scrollObserver = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const cat = urlParams.get('cat');

  if (q) {
    document.getElementById('searchInput').value = q;
    executeSearch();
  } else if (cat) {
    resetAndLoadCategory(cat);
  } else {
    resetAndLoadCategory('trending');
  }

  initInfiniteScrollObserver();
});

// Category switcher
function setCategory(btn, category) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  resetAndLoadCategory(category);
}

function resetAndLoadCategory(category) {
  isSearchMode = false;
  currentSearchQuery = '';
  currentCategory = category;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];

  const label = category === 'sex_arabic' ? 'SEX ARABIC (عربي)' : category.toUpperCase();
  document.getElementById('categoryLabel').innerText = label;
  document.getElementById('videoCountLabel').innerText = 'Streaming live videos...';

  const grid = document.getElementById('videosGrid');
  grid.innerHTML = getSkeletonHTML(8);

  loadVideosBatch(true);
}

// Mobile bottom navigation handler
function mobileNav(category, el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  
  document.querySelectorAll('.cat-btn').forEach(b => {
    if (b.innerText.toLowerCase().includes(category)) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  resetAndLoadCategory(category);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function focusMobileSearch(el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  const input = document.getElementById('searchInput');
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus();
}

// Fetch and append a batch of videos (Infinite Pagination)
async function loadVideosBatch(isInitial = false) {
  if (isLoading || (!hasMore && !isInitial)) return;
  isLoading = true;

  const loader = document.getElementById('infiniteLoader');
  if (!isInitial && loader) loader.style.display = 'flex';

  try {
    let url = '';
    if (isSearchMode && currentSearchQuery) {
      url = `/api/search?q=${encodeURIComponent(currentSearchQuery)}&source=all&page=${currentPage}`;
    } else {
      url = `/api/videos?category=${encodeURIComponent(currentCategory)}&page=${currentPage}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.videos && data.videos.length > 0) {
      // Filter out any duplicates
      const uniqueNewVideos = data.videos.filter(v => !renderedVideoIds.has(v.id));

      if (uniqueNewVideos.length > 0) {
        uniqueNewVideos.forEach(v => {
          renderedVideoIds.add(v.id);
          currentVideos.push(v);
        });

        appendVideoCards(uniqueNewVideos, isInitial);
        currentPage++;
        document.getElementById('videoCountLabel').innerText = `${renderedVideoIds.size}+ HD Videos`;
      } else if (currentPage > 1) {
        // Increment page to seek further
        currentPage++;
      }
    } else {
      if (isInitial) {
        document.getElementById('videosGrid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-muted);">No videos found. Try another category or search.</div>';
      }
      hasMore = false;
    }
  } catch (err) {
    if (isInitial) {
      document.getElementById('videosGrid').innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #ef4444;">Failed to load video stream. Check connection.</div>`;
    }
  } finally {
    isLoading = false;
    if (loader) loader.style.display = 'none';
  }
}

// Append video cards to grid
function appendVideoCards(videos, isInitial) {
  const grid = document.getElementById('videosGrid');
  if (isInitial) grid.innerHTML = '';

  videos.forEach((v, index) => {
    const card = document.createElement('div');
    card.className = 'video-card animate-fade';
    card.onclick = () => navigateToWatchPage(v);

    const thumb = v.thumbnail || '/images/logo.png';
    const duration = v.duration || '10:00';
    const title = v.title || `niksex Video ${index + 1}`;
    const views = v.views || '15.2K';
    const rating = v.rating || '96%';

    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='/images/logo.png'">
        <span class="badge-hd">1080p HD</span>
        <span class="badge-duration">${duration}</span>
      </div>
      <div class="card-details">
        <h3 class="video-title" title="${title}">${title}</h3>
        <div class="video-meta">
          <span><i class="fa fa-eye"></i> ${views}</span>
          <span class="meta-rating"><i class="fa fa-thumbs-up"></i> ${rating}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Setup High-Performance Infinite Scroll Observer
function initInfiniteScrollObserver() {
  const sentinel = document.getElementById('scrollSentinel');
  if (!sentinel) return;

  if (scrollObserver) scrollObserver.disconnect();

  scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      loadVideosBatch(false);
    }
  }, { rootMargin: '400px' });

  scrollObserver.observe(sentinel);

  // Fallback window scroll event for older mobile browser compatibility
  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore) return;
    const scrollY = window.scrollY || window.pageYOffset;
    const totalHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    if (scrollY + windowHeight >= totalHeight - 500) {
      loadVideosBatch(false);
    }
  }, { passive: true });
}

// Direct Navigation to Watch Page
function navigateToWatchPage(v) {
  const params = new URLSearchParams({
    id: v.id || '',
    title: v.title || 'niksex Video Stream',
    embed: v.embed_url || v.video_url || '',
    thumb: v.thumbnail || '',
    duration: v.duration || '10:00',
    views: v.views || '15K',
    rating: v.rating || '98%',
    tags: (v.tags || ['niksex', 'HD', 'Popular']).join(',')
  });

  window.location.href = `/watch.html?${params.toString()}`;
}

// Handle Search input
function handleSearch(e) {
  if (e.key === 'Enter') {
    executeSearch();
  }
}

async function executeSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  isSearchMode = true;
  currentSearchQuery = query;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];

  document.getElementById('categoryLabel').innerText = `Search: "${query}"`;
  document.getElementById('videoCountLabel').innerText = 'Searching across sources...';

  const grid = document.getElementById('videosGrid');
  grid.innerHTML = getSkeletonHTML(8);

  loadVideosBatch(true);
}

// Loading Skeleton HTML
function getSkeletonHTML(count = 8) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="video-card" style="opacity: 0.5;">
        <div class="thumb-wrap" style="background: #1e1e2d;"></div>
        <div class="card-details">
          <div style="height: 14px; background: #28283c; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 10px; width: 60%; background: #28283c; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}
