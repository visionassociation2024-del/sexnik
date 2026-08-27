// Anti-External Navigation & Anti-Popup Security Guard
(function initAntiRedirectShield() {
  window.open = function(url, target, features) {
    console.warn('[Anti-Redirect] Blocked popup window:', url);
    return null;
  };

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

// Global App State
let currentVideos = [];
let currentCategory = 'trending';
let currentSearchQuery = '';
let isSearchMode = false;
let isHistoryMode = false;
let isForYouMode = false;
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let renderedVideoIds = new Set();
let scrollObserver = null;

// Categories Database
const CATEGORIES_LIST = [
  { id: 'sex_arabic', title: 'Sex Arabic (عربي)', icon: 'fa-star', special: true, count: '10,000+' },
  { id: 'trending', title: 'Trending', icon: 'fa-fire', count: '50,000+' },
  { id: '4k', title: '4K Ultra HD', icon: 'fa-tv', count: '12,500+' },
  { id: 'amateur', title: 'Amateur (هواة)', icon: 'fa-user', count: '35,000+' },
  { id: 'milf', title: 'MILF (أمهات)', icon: 'fa-heart', count: '28,000+' },
  { id: 'lesbian', title: 'Lesbian (سحاقيات)', icon: 'fa-venus-double', count: '19,000+' },
  { id: 'teen', title: '18+ Teen', icon: 'fa-star-half-alt', count: '22,000+' },
  { id: 'anal', title: 'Anal (خلفي)', icon: 'fa-circle-notch', count: '18,000+' },
  { id: 'blowjob', title: 'Blowjob (مص)', icon: 'fa-kiss', count: '25,000+' },
  { id: 'hardcore', title: 'Hardcore', icon: 'fa-bolt', count: '30,000+' },
  { id: 'asian', title: 'Asian (آسيوي)', icon: 'fa-globe-asia', count: '16,000+' },
  { id: 'ebony', title: 'Ebony (سمراء)', icon: 'fa-moon', count: '14,000+' },
  { id: 'latina', title: 'Latina (لاتيني)', icon: 'fa-sun', count: '17,000+' },
  { id: 'hentai', title: 'Hentai & Anime', icon: 'fa-dragon', count: '11,000+' },
  { id: 'vr', title: 'VR 360°', icon: 'fa-vr-cardboard', count: '6,000+' },
  { id: 'creampie', title: 'Creampie', icon: 'fa-tint', count: '21,000+' },
  { id: 'threesome', title: 'Threesome', icon: 'fa-users', count: '13,000+' },
  { id: 'fetish', title: 'Fetish & BDSM', icon: 'fa-mask', count: '9,000+' },
  { id: 'masturbation', title: 'Solo & Masturbation', icon: 'fa-hand-sparkles', count: '15,000+' },
  { id: 'big_tits', title: 'Big Tits', icon: 'fa-heartbeat', count: '27,000+' },
  { id: 'big_ass', title: 'Big Ass', icon: 'fa-ring', count: '24,000+' }
];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderCategoriesGridModal();

  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const cat = urlParams.get('cat');

  if (q) {
    document.getElementById('searchInput').value = q;
    executeSearch();
  } else if (cat) {
    resetAndLoadCategory(cat);
  } else {
    // If user has a favorite category saved in preferences, prioritize it or default to trending
    const topPref = getUserTopPreference();
    if (topPref && topPref.category && topPref.count >= 3) {
      resetAndLoadCategory(topPref.category);
    } else {
      resetAndLoadCategory('trending');
    }
  }

  initInfiniteScrollObserver();
});

// Render Categories in Modal
function renderCategoriesGridModal() {
  const container = document.getElementById('categoriesGridCards');
  if (!container) return;

  container.innerHTML = '';
  CATEGORIES_LIST.forEach(c => {
    const card = document.createElement('div');
    card.className = `cat-explore-card ${c.special ? 'special-arabic' : ''}`;
    card.onclick = () => {
      closeCategoriesModal();
      resetAndLoadCategory(c.id);
    };

    card.innerHTML = `
      <div class="cat-icon-box">
        <i class="fa ${c.icon}"></i>
      </div>
      <div class="cat-info">
        <h4>${c.title}</h4>
        <span>${c.count} Videos</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function openCategoriesModal() {
  document.getElementById('categoriesModal').style.display = 'flex';
}

function closeCategoriesModal(e) {
  if (!e || e.target.id === 'categoriesModal' || e.target.closest('.btn-close-modal')) {
    document.getElementById('categoriesModal').style.display = 'none';
  }
}

// Category switcher
function setCategory(btn, category) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  resetAndLoadCategory(category);
}

function resetAndLoadCategory(category) {
  isSearchMode = false;
  isHistoryMode = false;
  isForYouMode = false;
  currentSearchQuery = '';
  currentCategory = category;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];

  document.getElementById('btnClearHistory').style.display = 'none';

  const catObj = CATEGORIES_LIST.find(c => c.id === category);
  const label = catObj ? catObj.title.toUpperCase() : category.toUpperCase();
  document.getElementById('categoryLabel').innerText = label;
  document.getElementById('videoCountLabel').innerText = 'Streaming live videos...';

  const grid = document.getElementById('videosGrid');
  grid.innerHTML = getSkeletonHTML(8);

  loadVideosBatch(true);
}

// Smart Browser Recommendation Engine ("For You / مخصص لك")
function loadForYouFeed(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  isSearchMode = false;
  isHistoryMode = false;
  isForYouMode = true;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];

  document.getElementById('btnClearHistory').style.display = 'none';
  document.getElementById('categoryLabel').innerText = 'FOR YOU (مخصص لك حسب اهتماماتك)';
  document.getElementById('videoCountLabel').innerText = 'Personalized live stream...';

  // Get user favorite search tags from browser localStorage
  const topPref = getUserTopPreference();
  const smartQuery = topPref ? topPref.category : 'arabic';

  currentCategory = smartQuery;
  const grid = document.getElementById('videosGrid');
  grid.innerHTML = getSkeletonHTML(8);

  loadVideosBatch(true);
}

function loadForYouFeedMobile(el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  loadForYouFeed();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Watch History Browser Storage Engine (سجل المشاهدة المحفوظ في المتصفح)
function loadWatchHistory(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  isHistoryMode = true;
  isSearchMode = false;
  isForYouMode = false;
  hasMore = false; // No infinite scroll for local history

  document.getElementById('categoryLabel').innerText = 'MY WATCH HISTORY (سجل المشاهدة)';
  document.getElementById('btnClearHistory').style.display = 'inline-flex';

  const history = getLocalWatchHistory();
  const grid = document.getElementById('videosGrid');

  if (history.length === 0) {
    document.getElementById('videoCountLabel').innerText = '0 Videos in History';
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fa fa-history fa-3x" style="color: var(--accent-pink); margin-bottom: 14px; opacity: 0.7;"></i>
        <h3 style="color: #fff; margin-bottom: 6px;">Your Watch History is Empty</h3>
        <p style="font-size: 13px;">Videos you watch will be automatically saved here in your browser for quick access!</p>
        <button class="btn-pill" style="margin-top: 15px;" onclick="resetAndLoadCategory('trending')">Explore Trending Videos</button>
      </div>
    `;
    return;
  }

  document.getElementById('videoCountLabel').innerText = `${history.length} Saved in Browser`;
  grid.innerHTML = '';

  history.forEach(v => {
    const card = createVideoCardElement(v, true);
    grid.appendChild(card);
  });
}

function loadWatchHistoryMobile(el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  loadWatchHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getLocalWatchHistory() {
  try {
    const raw = localStorage.getItem('niksex_watch_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function clearHistory() {
  if (confirm('Are you sure you want to clear your saved watch history?')) {
    localStorage.removeItem('niksex_watch_history');
    localStorage.removeItem('niksex_interest_scores');
    loadWatchHistory();
  }
}

// User Preference Tracking Logic
function recordInterest(categoryOrTag) {
  if (!categoryOrTag) return;
  try {
    const raw = localStorage.getItem('niksex_interest_scores');
    const scores = raw ? JSON.parse(raw) : {};
    const key = categoryOrTag.toLowerCase().trim();
    scores[key] = (scores[key] || 0) + 1;
    localStorage.setItem('niksex_interest_scores', JSON.stringify(scores));
  } catch (e) {}
}

function getUserTopPreference() {
  try {
    const raw = localStorage.getItem('niksex_interest_scores');
    if (!raw) return null;
    const scores = JSON.parse(raw);
    let topCat = null;
    let maxScore = 0;
    for (const [cat, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        topCat = cat;
      }
    }
    return topCat ? { category: topCat, count: maxScore } : null;
  } catch (e) {
    return null;
  }
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

// Fetch and append a batch of videos (Infinite Pagination)
async function loadVideosBatch(isInitial = false) {
  if (isLoading || (!hasMore && !isInitial) || isHistoryMode) return;
  isLoading = true;

  const loader = document.getElementById('infiniteLoader');
  if (!isInitial && loader) loader.style.display = 'flex';

  try {
    let url = '';
    if (isSearchMode && currentSearchQuery) {
      url = `/api/search?q=${encodeURIComponent(currentSearchQuery)}&page=${currentPage}`;
    } else {
      url = `/api/videos?category=${encodeURIComponent(currentCategory)}&page=${currentPage}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.videos && data.videos.length > 0) {
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
        currentPage++;
      }
    } else {
      if (isInitial) {
        document.getElementById('videosGrid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-muted);">No videos found in this category.</div>';
      }
      hasMore = false;
    }
  } catch (err) {
    if (isInitial) {
      document.getElementById('videosGrid').innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #ef4444;">Failed to stream videos. Check connection.</div>`;
    }
  } finally {
    isLoading = false;
    if (loader) loader.style.display = 'none';
  }
}

// Create individual video card element
function createVideoCardElement(v, isHistory = false) {
  const card = document.createElement('div');
  card.className = 'video-card animate-fade';
  card.onclick = () => navigateToWatchPage(v);

  const thumb = v.thumbnail || '/images/logo.png';
  const duration = v.duration || '10:00';
  const title = v.title || 'niksex Stream';
  const views = v.views || '15.2K';
  const rating = v.rating || '96%';

  card.innerHTML = `
    <div class="thumb-wrap">
      <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='/images/logo.png'">
      <span class="badge-hd">1080p HD</span>
      ${isHistory ? '<span class="badge-watched"><i class="fa fa-check"></i> Watched</span>' : ''}
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
  return card;
}

// Append video cards to grid
function appendVideoCards(videos, isInitial) {
  const grid = document.getElementById('videosGrid');
  if (isInitial) grid.innerHTML = '';

  videos.forEach(v => {
    grid.appendChild(createVideoCardElement(v, false));
  });
}

// Setup High-Performance Infinite Scroll Observer
function initInfiniteScrollObserver() {
  const sentinel = document.getElementById('scrollSentinel');
  if (!sentinel) return;

  if (scrollObserver) scrollObserver.disconnect();

  scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore && !isHistoryMode) {
      loadVideosBatch(false);
    }
  }, { rootMargin: '400px' });

  scrollObserver.observe(sentinel);

  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore || isHistoryMode) return;
    const scrollY = window.scrollY || window.pageYOffset;
    const totalHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    if (scrollY + windowHeight >= totalHeight - 500) {
      loadVideosBatch(false);
    }
  }, { passive: true });
}

// Direct Navigation to Watch Page and Record History & Interest
function navigateToWatchPage(v) {
  // Record user preference and watch history in localStorage
  if (currentCategory) recordInterest(currentCategory);
  if (v.tags && Array.isArray(v.tags)) {
    v.tags.forEach(t => recordInterest(t));
  }

  // Save to Watch History
  try {
    let history = getLocalWatchHistory();
    history = history.filter(h => h.id !== v.id); // Deduplicate
    history.unshift({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      embed_url: v.embed_url || v.video_url,
      video_url: v.embed_url || v.video_url,
      duration: v.duration,
      views: v.views,
      rating: v.rating,
      tags: v.tags,
      watchedAt: Date.now()
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('niksex_watch_history', JSON.stringify(history));
  } catch (e) {}

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

  recordInterest(query);

  isSearchMode = true;
  isHistoryMode = false;
  isForYouMode = false;
  currentSearchQuery = query;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];

  document.getElementById('btnClearHistory').style.display = 'none';
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
