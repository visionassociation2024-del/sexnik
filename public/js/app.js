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
  const COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown between pops

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && isAllowedAdUrl(link.href)) {
      return; // Allow direct click without intercepting
    }

    clickCount++;
    const lastFired = parseInt(sessionStorage.getItem('nx_smartlink_last_click_pop') || '0', 10);
    const now = Date.now();

    if ((clickCount % 2 === 1) && (now - lastFired > COOLDOWN_MS)) {
      sessionStorage.setItem('nx_smartlink_last_click_pop', now.toString());
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



// Global App State
let currentVideos = [];
let currentCategory = 'trending';
let currentSearchQuery = '';
let currentDurationFilter = 'all';
let currentSortFilter = 'trending';
let isSearchMode = false;
let isHistoryMode = false;
let isFavoritesMode = false;
let isForYouMode = false;
let isTikTokMode = false;
let isTikTokReelsView = true;
let tiktokReelsList = [];
let reelsObserver = null;
let isGlobalTikTokMuted = false;
let isAutoScrollNext = true;
let isReelsLoading = false;
let activeReelSlideIndex = 0;
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let renderedVideoIds = new Set();
let scrollObserver = null;

// Categories Database
const CATEGORIES_LIST = [
  { id: 'sex_arabic', title: 'Sex Arabic (عربي)', icon: 'fa-star', special: true, count: '10,000+' },
  { id: 'tiktok', title: 'TikTok 18+ (تيك توك 📱🔞)', icon: 'fa-brands fa-tiktok', specialTikTok: true, count: '25,000+' },
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

const SEARCH_SUGGESTIONS = [
  'arabic', 'egyptian', 'moroccan', 'lebanese', 'syrian', 'iraqi', 'tunisian',
  '4k uhd', 'amateur couple', 'milf stepmom', 'lesbian massage', 'big ass latina',
  'creampie hardcore', 'anal deepthroat', 'japanese uncensored', 'vr 360 virtual reality'
];

// Global Spotlight state
let currentSpotlightVideo = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initSpotlightHero();
  initNikroliStrip();
  initArabicCuratedBlock();

  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const cat = urlParams.get('cat');
  const hist = urlParams.get('history');
  const fav = urlParams.get('fav');

  if (q) {
    document.getElementById('searchInput').value = q;
    executeSearch();
  } else if (cat === 'tiktok' || cat === 'nikroli') {
    loadNikroliView();
  } else if (cat) {
    resetAndLoadCategory(cat);
  } else if (hist) {
    loadWatchHistory();
  } else if (fav) {
    loadFavoritesView();
  } else {
    resetAndLoadCategory('trending');
  }

  initInfiniteScrollObserver();

  // Close autocomplete on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      const box = document.getElementById('searchAutocomplete');
      if (box) box.style.display = 'none';
    }
  });
});

// 1. Initialize Spotlight Hero with top trending video
async function initSpotlightHero() {
  try {
    const res = await fetch('/api/videos?category=trending&page=1');
    const data = await res.json();
    if (data.success && data.videos && data.videos.length > 0) {
      const topVid = data.videos[0];
      currentSpotlightVideo = topVid;

      const titleEl = document.getElementById('heroSpotlightTitle');
      const imgEl = document.getElementById('heroSpotlightImg');
      const viewsEl = document.getElementById('heroSpotlightViews');
      const ratingEl = document.getElementById('heroSpotlightRating');
      const durEl = document.getElementById('heroSpotlightDuration');

      if (titleEl) titleEl.innerText = topVid.title || 'Featured High Definition Video of the Day';
      if (imgEl && topVid.thumbnail) imgEl.src = topVid.thumbnail;
      if (viewsEl) viewsEl.innerText = topVid.views || '185.4K';
      if (ratingEl) ratingEl.innerText = topVid.rating || '99%';
      if (durEl) durEl.innerText = topVid.duration || '24:15';
    }
  } catch (e) {
    console.error('Failed to load spotlight video:', e);
  }
}

function playSpotlightVideo(e) {
  if (e) e.stopPropagation();
  if (currentSpotlightVideo) {
    navigateToWatchPage(currentSpotlightVideo);
  } else {
    window.location.href = '/watch.html';
  }
}

// 2. Initialize nikroli Viral Reels Strip
async function initNikroliStrip() {
  const container = document.getElementById('nikroliStripContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/tiktok?q=trending&page=1');
    const data = await res.json();
    const reels = (data.success && data.videos && data.videos.length > 0) ? data.videos : [];

    if (reels.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: var(--text-muted);">nikroli reels streaming soon...</div>';
      return;
    }

    container.innerHTML = '';
    reels.slice(0, 14).forEach(r => {
      const card = document.createElement('a');
      card.href = '/nikroli.html';
      card.className = 'nikroli-strip-card';

      const thumb = r.poster || r.thumbnail || '/images/logo.png';
      const title = r.title || 'nikroli 18+ Viral Reel';
      const likes = r.likes || '3.2K';

      card.innerHTML = `
        <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='/images/logo.png'">
        <div class="nikroli-strip-gradient"></div>
        <span class="nikroli-strip-badge"><i class="fa-brands fa-tiktok"></i> nikroli</span>
        <div class="nikroli-strip-play-icon"><i class="fa fa-play"></i></div>
        <div class="nikroli-strip-info">
          <h4>${title}</h4>
          <span><i class="fa fa-heart" style="color: #ff007f;"></i> ${likes}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = '<div style="padding: 20px; color: #ef4444;">Failed to load nikroli reels.</div>';
  }
}

// 3. Initialize Sex Arabic Curated Block
async function initArabicCuratedBlock() {
  const container = document.getElementById('arabicFeaturedGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/videos?category=arabic&page=1');
    const data = await res.json();
    const arabicVids = (data.success && data.videos && data.videos.length > 0) ? data.videos.slice(0, 4) : [];

    container.innerHTML = '';
    if (arabicVids.length > 0) {
      arabicVids.forEach(v => {
        const card = createVideoCardElement(v);
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<div style="grid-column: 1/-1; color: var(--text-muted); text-align: center; padding: 20px;">No Arabic videos found.</div>';
    }
  } catch (e) {
    container.innerHTML = '<div style="grid-column: 1/-1; color: #ef4444; text-align: center; padding: 20px;">Failed to load Arabic section.</div>';
  }
}

// Dedicated Standalone Page Routing Functions
function loadNikroliView() {
  window.location.href = '/nikroli.html';
}

function loadTikTokView() {
  window.location.href = '/nikroli.html';
}

function loadPhotosView() {
  window.location.href = '/photos.html';
}

function loadGifsView() {
  window.location.href = '/photos.html';
}

function loadFavoritesView() {
  window.location.href = '/favorites.html';
}

function loadWatchHistory() {
  window.location.href = '/history.html';
}

function openCategoriesModal() {
  window.location.href = '/categories.html';
}

function loadFavoritesView() {
  window.location.href = '/favorites.html';
}

function loadWatchHistory() {
  window.location.href = '/history.html';
}

function openCategoriesModal() {
  window.location.href = '/categories.html';
}

// Category switcher
function setCategory(btn, category) {
  if (category === 'tiktok' || category === 'shorts') {
    window.location.href = '/scroll.html';
    return;
  }
  if (category === 'sex_arabic' || category === 'arabic') {
    window.location.href = '/arabic.html';
    return;
  }
  if (category === 'photos' || category === 'gifs') {
    window.location.href = '/photos.html';
    return;
  }
  if (category === '4k') {
    window.location.href = '/4k.html';
    return;
  }

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

  const catObj = CATEGORIES_LIST.find(c => c.id === category);
  const label = catObj ? catObj.title.toUpperCase() : category.toUpperCase();
  const catLabelEl = document.getElementById('categoryLabel');
  if (catLabelEl) catLabelEl.innerText = label;

  const countLabelEl = document.getElementById('videoCountLabel');
  if (countLabelEl) countLabelEl.innerText = 'Streaming live videos...';

  const grid = document.getElementById('videosGrid');
  if (grid) {
    grid.innerHTML = getSkeletonHTML(8);
  }
  loadVideosBatch(true);
}

// Fetch and Render TikTok Vertical Reels Feed
async function fetchAndRenderTikTokReels(isInitial = false) {
  if (isReelsLoading) return;
  isReelsLoading = true;

  const feed = document.getElementById('tiktokReelsFeed');
  if (!feed) return;

  if (isInitial) {
    feed.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 14px;">
        <div class="spinner-neon"></div>
        <span style="font-weight: 700; color: #00f2fe;"><i class="fa-brands fa-tiktok"></i> Loading TikTok 18+ Reels...</span>
      </div>
    `;
    currentPage = 1;
    tiktokReelsList = [];
  }

  try {
    const res = await fetch(`/api/tiktok?q=trending&page=${currentPage}`);
    const data = await res.json();
    const videos = (data.success && data.videos && data.videos.length > 0) ? data.videos : [];

    if (isInitial) feed.innerHTML = '';

    if (videos.length === 0 && isInitial) {
      feed.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 10px;">
          <i class="fa fa-film" style="font-size: 36px; color: #ff007f;"></i>
          <span>No TikTok reels found at the moment.</span>
        </div>
      `;
      isReelsLoading = false;
      return;
    }

    const startIndex = tiktokReelsList.length;
    videos.forEach((v, i) => {
      const globalIndex = startIndex + i;
      tiktokReelsList.push(v);
      const slide = createTikTokReelSlideElement(v, globalIndex);
      feed.appendChild(slide);
    });

    setupReelsIntersectionObserver();

    if (isInitial && feed.firstElementChild) {
      const firstVid = feed.querySelector('.tiktok-reel-video');
      if (firstVid) {
        firstVid.muted = isGlobalTikTokMuted;
        firstVid.play().catch(() => {
          firstVid.muted = true;
          firstVid.play().catch(() => {});
        });
      }
    }

    currentPage++;
  } catch (e) {
    console.error('Failed to load TikTok reels:', e);
  } finally {
    isReelsLoading = false;
  }
}

function createTikTokReelSlideElement(v, index) {
  const slide = document.createElement('div');
  slide.className = 'tiktok-reel-slide';
  slide.dataset.index = index;

  const videoSrc = v.direct_video_url || v.video_url || '';
  const poster = v.poster || v.thumbnail || '/images/logo.png';
  const title = v.title || 'niksex TikTok 18+ Short';
  const likes = v.likes || '2.4K';
  const tags = (v.tags || ['tiktok', 'shorts', 'hot', 'niksex']).map(t => `#${t}`).slice(0, 3).join(' ');

  slide.innerHTML = `
    <img class="tiktok-reel-bg" src="${poster}" alt="" onerror="this.style.display='none'">
    <video class="tiktok-reel-video" src="${videoSrc}" poster="${poster}" loop playsinline webkit-playsinline x5-playsinline preload="${index < 3 ? 'auto' : 'metadata'}" data-index="${index}" onclick="toggleTikTokPlay(${index})"></video>
    <div class="tiktok-reel-play-btn" id="playIndicator_${index}"><i class="fa fa-play"></i></div>

    <!-- Right Sidebar Floating Actions -->
    <div class="tiktok-reel-sidebar">
      <button class="tiktok-action-btn" id="btnLike_${index}" onclick="toggleTikTokReelLike(${index}, event)">
        <div class="tiktok-action-icon"><i class="fa fa-heart"></i></div>
        <span class="tiktok-action-label" id="likeCount_${index}">${likes}</span>
      </button>

      <button class="tiktok-action-btn" onclick="openTikTokReelWatch(${index}, event)" title="Watch in Full Cinema Player">
        <div class="tiktok-action-icon"><i class="fa fa-expand"></i></div>
        <span class="tiktok-action-label">HD</span>
      </button>

      <button class="tiktok-action-btn" onclick="shareTikTokReel(${index}, event)" title="Share Reel">
        <div class="tiktok-action-icon"><i class="fa fa-share"></i></div>
        <span class="tiktok-action-label">Share</span>
      </button>

      <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="tiktok-action-btn" title="Download HD / VIP Stream">
        <div class="tiktok-action-icon" style="border-color: #ffd700; color: #ffd700;"><i class="fa fa-download"></i></div>
        <span class="tiktok-action-label" style="color: #ffd700;">VIP</span>
      </a>

      <div class="tiktok-sound-disc">
        <img src="/images/logo.png" alt="">
      </div>
    </div>

    <!-- Bottom Metadata Overlay -->
    <div class="tiktok-reel-overlay">
      <div class="tiktok-author-tag">
        <span>@niksex_shorts</span>
        <i class="fa fa-check-circle verified-badge"></i>
      </div>
      <div class="tiktok-reel-title">${title} <span style="color: #00f2fe; font-weight: 700;">${tags}</span></div>
      <div class="tiktok-sound-track">
        <i class="fa fa-music"></i>
        <span style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">Original Sound - niksex TikTok Live</span>
      </div>
    </div>
  `;

  const videoEl = slide.querySelector('.tiktok-reel-video');
  if (videoEl) {
    videoEl.addEventListener('ended', () => {
      if (isAutoScrollNext && isTikTokMode && isTikTokReelsView) {
        scrollTikTokReel('next');
      }
    });
  }

  return slide;
}

// Prebuffer upcoming reels for 0-second lag
function prebufferUpcomingReels(currentIndex) {
  const nextSlide1 = document.querySelector(`.tiktok-reel-slide[data-index="${currentIndex + 1}"]`);
  if (nextSlide1) {
    const v1 = nextSlide1.querySelector('.tiktok-reel-video');
    if (v1 && v1.preload !== 'auto') {
      v1.preload = 'auto';
      v1.load();
    }
  }

  const nextSlide2 = document.querySelector(`.tiktok-reel-slide[data-index="${currentIndex + 2}"]`);
  if (nextSlide2) {
    const v2 = nextSlide2.querySelector('.tiktok-reel-video');
    if (v2 && v2.preload !== 'auto') {
      v2.preload = 'auto';
      v2.load();
    }
  }
}

// Observer for Swiping and Auto-Playing active slide
function setupReelsIntersectionObserver() {
  const slides = document.querySelectorAll('.tiktok-reel-slide');
  if (!slides || slides.length === 0) return;

  if (reelsObserver) reelsObserver.disconnect();

  reelsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const slide = entry.target;
      const index = parseInt(slide.dataset.index, 10);
      const vid = slide.querySelector('.tiktok-reel-video');

      if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
        activeReelSlideIndex = index;
        if (vid) {
          vid.preload = 'auto';
          vid.muted = isGlobalTikTokMuted;
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              vid.muted = true;
              vid.play().catch(() => {});
            });
          }
        }

        prebufferUpcomingReels(index);

        // Check if near the end, prefetch next batch
        if (index >= tiktokReelsList.length - 3 && !isReelsLoading) {
          fetchAndRenderTikTokReels(false);
        }
      } else {
        if (vid) {
          vid.pause();
          vid.currentTime = 0;
        }
      }
    });
  }, {
    root: document.getElementById('tiktokReelsFeed'),
    threshold: 0.65
  });

  slides.forEach(s => reelsObserver.observe(s));
}

// Pause all reels when navigating away
function pauseAllTikTokReels() {
  document.querySelectorAll('.tiktok-reel-video').forEach(v => {
    v.pause();
  });
}

// Scroll to next/prev reel
function scrollTikTokReel(direction) {
  const feed = document.getElementById('tiktokReelsFeed');
  if (!feed) return;

  const slides = feed.querySelectorAll('.tiktok-reel-slide');
  if (!slides || slides.length === 0) return;

  if (direction === 'next') {
    activeReelSlideIndex = Math.min(activeReelSlideIndex + 1, slides.length - 1);
  } else {
    activeReelSlideIndex = Math.max(activeReelSlideIndex - 1, 0);
  }

  if (slides[activeReelSlideIndex]) {
    slides[activeReelSlideIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Play / Pause toggle with animated feedback
function toggleTikTokPlay(index) {
  const slide = document.querySelector(`.tiktok-reel-slide[data-index="${index}"]`);
  if (!slide) return;

  const vid = slide.querySelector('.tiktok-reel-video');
  const indicator = document.getElementById(`playIndicator_${index}`);
  if (!vid) return;

  if (vid.paused) {
    vid.play().catch(() => {});
    if (indicator) {
      indicator.innerHTML = '<i class="fa fa-play"></i>';
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 400);
    }
  } else {
    vid.pause();
    if (indicator) {
      indicator.innerHTML = '<i class="fa fa-pause"></i>';
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 600);
    }
  }
}

// Global Sound Mute / Unmute
function toggleTikTokGlobalSound(e) {
  if (e) e.stopPropagation();
  isGlobalTikTokMuted = !isGlobalTikTokMuted;
  const icon = document.getElementById('iconSoundGlobal');
  const btn = document.getElementById('btnSoundGlobal');

  if (isGlobalTikTokMuted) {
    if (icon) icon.className = 'fa fa-volume-mute';
    if (btn) btn.style.color = '#ef4444';
  } else {
    if (icon) icon.className = 'fa fa-volume-up';
    if (btn) btn.style.color = '#00f2fe';
  }

  document.querySelectorAll('.tiktok-reel-video').forEach(v => {
    v.muted = isGlobalTikTokMuted;
  });
}

// Toggle between Reels Fullscreen View and Grid View
function toggleTikTokDisplayMode() {
  isTikTokReelsView = !isTikTokReelsView;
  const btnToggle = document.getElementById('btnTikTokViewToggle');

  if (btnToggle) {
    btnToggle.innerHTML = isTikTokReelsView ? '<i class="fa fa-th-large"></i> <span class="desktop-only-inline">Grid</span>' : '<i class="fa fa-mobile-alt"></i> <span class="desktop-only-inline">Reels</span>';
  }

  loadTikTokView();
}

// Exit Fullscreen Reels Mode back to standard browsing
function exitTikTokReels() {
  document.body.classList.remove('reels-fullscreen-active');
  pauseAllTikTokReels();
  const reelsContainer = document.getElementById('tiktokReelsContainer');
  if (reelsContainer) reelsContainer.style.display = 'none';

  resetAndLoadCategory('trending');
}

// Like action with heart bounce animation
function toggleTikTokReelLike(index, e) {
  if (e) e.stopPropagation();
  const btn = document.getElementById(`btnLike_${index}`);
  const counter = document.getElementById(`likeCount_${index}`);
  if (!btn) return;

  const isLiked = btn.classList.toggle('liked');
  let count = parseInt((counter.innerText || '2400').replace(/[^0-9]/g, ''), 10);
  if (isLiked) {
    count++;
    counter.innerText = (count > 999 ? (count/1000).toFixed(1) + 'K' : count);
    btn.querySelector('.tiktok-action-icon').style.transform = 'scale(1.35)';
    setTimeout(() => {
      btn.querySelector('.tiktok-action-icon').style.transform = '';
    }, 250);
  } else {
    count = Math.max(1, count - 1);
    counter.innerText = (count > 999 ? (count/1000).toFixed(1) + 'K' : count);
  }
}

// Open TikTok Reel in Cinema Watch Page
function openTikTokReelWatch(index, e) {
  if (e) e.stopPropagation();
  const v = tiktokReelsList[index];
  if (v) navigateToWatchPage(v);
}

// Share TikTok Reel
function shareTikTokReel(index, e) {
  if (e) e.stopPropagation();
  const v = tiktokReelsList[index];
  if (!v) return;

  const url = `${window.location.origin}/watch.html?id=${v.id || ''}&is_tiktok=1&title=${encodeURIComponent(v.title || '')}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('🔗 Reel link copied to clipboard!');
    }).catch(() => {
      prompt('Copy Reel Link:', url);
    });
  } else {
    prompt('Copy Reel Link:', url);
  }
}

// Keyboard shortcuts listener for TikTok Reels (ArrowUp, ArrowDown, Space, M, Esc)
document.addEventListener('keydown', (e) => {
  if (!isTikTokMode || !isTikTokReelsView) return;

  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    scrollTikTokReel('next');
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    scrollTikTokReel('prev');
  } else if (e.key === ' ') {
    e.preventDefault();
    toggleTikTokPlay(activeReelSlideIndex);
  } else if (e.key.toLowerCase() === 'm') {
    e.preventDefault();
    toggleTikTokGlobalSound();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    exitTikTokReels();
  }
});

function hideTikTokReelsFeed() {
  document.body.classList.remove('reels-fullscreen-active');
  pauseAllTikTokReels();
  const reelsContainer = document.getElementById('tiktokReelsContainer');
  const grid = document.getElementById('videosGrid');
  const sentinel = document.getElementById('scrollSentinel');
  if (reelsContainer) reelsContainer.style.display = 'none';
  if (grid) grid.style.display = 'grid';
  if (sentinel) sentinel.style.display = 'block';
}

// Smart Recommendations ("For You / مخصص لك")
function loadForYouFeed(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  hideTikTokReelsFeed();
  isTikTokMode = false;
  isGifsMode = false;
  isSearchMode = false;
  isHistoryMode = false;
  isFavoritesMode = false;
  isForYouMode = true;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();
  currentVideos = [];


  document.getElementById('btnClearHistory').style.display = 'none';
  document.getElementById('categoryLabel').innerText = 'FOR YOU (مخصص لك)';
  document.getElementById('videoCountLabel').innerText = 'Personalized live stream...';

  const topPref = getUserTopPreference();
  currentCategory = topPref ? topPref.category : 'arabic';

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

// Favorites View (المفضلة)
function loadFavoritesView(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  hideTikTokReelsFeed();
  isTikTokMode = false;
  isFavoritesMode = true;
  isHistoryMode = false;
  isSearchMode = false;
  isForYouMode = false;
  hasMore = false;

  document.getElementById('categoryLabel').innerText = 'MY FAVORITES (المفضلة)';
  document.getElementById('btnClearHistory').style.display = 'none';

  const favorites = getLocalFavorites();
  const grid = document.getElementById('videosGrid');

  if (favorites.length === 0) {
    document.getElementById('videoCountLabel').innerText = '0 Favorites';
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fa fa-heart fa-3x" style="color: #ff007f; margin-bottom: 14px; opacity: 0.7;"></i>
        <h3 style="color: #fff; margin-bottom: 6px;">No Favorite Videos Yet</h3>
        <p style="font-size: 13px;">Click the "Favorite" button on any video watch page to save it here!</p>
        <button class="btn-pill" style="margin-top: 15px;" onclick="resetAndLoadCategory('trending')">Explore Trending Videos</button>
      </div>
    `;
    return;
  }

  document.getElementById('videoCountLabel').innerText = `${favorites.length} Saved in Favorites`;
  grid.innerHTML = '';

  favorites.forEach(v => {
    grid.appendChild(createVideoCardElement(v, false));
  });
}

function loadFavoritesMobile(el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  loadFavoritesView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getLocalFavorites() {
  try {
    const raw = localStorage.getItem('niksex_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Watch History Browser Storage Engine (سجل المشاهدة)
function loadWatchHistory(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  hideTikTokReelsFeed();
  isTikTokMode = false;
  isHistoryMode = true;
  isFavoritesMode = false;
  isSearchMode = false;
  isForYouMode = false;
  hasMore = false;

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
    grid.appendChild(createVideoCardElement(v, true));
  });
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

// Filters & Sorting Handlers
function setDurationFilter(btn, filter) {
  document.querySelectorAll('.filter-group:first-child .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentDurationFilter = filter;
  reRenderFilteredVideos();
}

function setSortFilter(btn, sort) {
  document.querySelectorAll('.filter-group:last-child .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentSortFilter = sort;
  reRenderFilteredVideos();
}

function reRenderFilteredVideos() {
  if (currentVideos.length === 0) return;
  let filtered = [...currentVideos];

  // Duration Filter
  if (currentDurationFilter !== 'all') {
    filtered = filtered.filter(v => {
      const minutes = parseDurationToMinutes(v.duration);
      if (currentDurationFilter === 'short') return minutes < 10;
      if (currentDurationFilter === 'medium') return minutes >= 10 && minutes <= 20;
      if (currentDurationFilter === 'long') return minutes > 20;
      return true;
    });
  }

  // Sort Filter
  if (currentSortFilter === 'views') {
    filtered.sort((a, b) => parseViewsToNumber(b.views) - parseViewsToNumber(a.views));
  } else if (currentSortFilter === 'rating') {
    filtered.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
  }

  const grid = document.getElementById('videosGrid');
  grid.innerHTML = '';
  filtered.forEach(v => grid.appendChild(createVideoCardElement(v, false)));
  document.getElementById('videoCountLabel').innerText = `${filtered.length} Filtered HD Videos`;
}

function parseDurationToMinutes(durStr = '10:00') {
  const parts = durStr.split(':').map(p => parseInt(p, 10) || 0);
  if (parts.length === 2) return parts[0] + (parts[1] / 60);
  if (parts.length === 3) return (parts[0] * 60) + parts[1] + (parts[2] / 60);
  return 10;
}

function parseViewsToNumber(viewsStr = '15K') {
  let clean = String(viewsStr).replace(/,/g, '').trim().toUpperCase();
  if (clean.includes('M')) return parseFloat(clean) * 1000000;
  if (clean.includes('K')) return parseFloat(clean) * 1000;
  return parseFloat(clean) || 1000;
}

// Live Search Autocomplete Input Handler
function handleSearchInput(e) {
  const q = e.target.value.trim().toLowerCase();
  const dropdown = document.getElementById('searchAutocomplete');

  if (q.length < 2) {
    dropdown.style.display = 'none';
    return;
  }

  const matches = SEARCH_SUGGESTIONS.filter(s => s.includes(q)).slice(0, 6);
  if (matches.length > 0) {
    dropdown.innerHTML = '';
    matches.forEach(m => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `<i class="fa fa-search" style="color: var(--accent-pink);"></i> <span>${m}</span>`;
      div.onclick = () => {
        document.getElementById('searchInput').value = m;
        dropdown.style.display = 'none';
        executeSearch();
      };
      dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

// Mobile bottom navigation handler
function mobileNav(category, el) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');
  resetAndLoadCategory(category);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fetch and append a batch of videos (Infinite Pagination)
async function loadVideosBatch(isInitial = false) {
  if (isLoading || (!hasMore && !isInitial) || isHistoryMode || isFavoritesMode) return;
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

// Instant Hover & Touch Video Preview Controller
function attachVideoPreviewHandlers(card, v) {
  const thumbWrap = card.querySelector('.thumb-wrap');
  if (!thumbWrap) return;

  const videoEl = thumbWrap.querySelector('.preview-video-el');
  const progressFill = thumbWrap.querySelector('.preview-progress-fill');
  const mobilePreviewBtn = thumbWrap.querySelector('.btn-mobile-preview');

  let previewTimer = null;
  let progressInterval = null;
  let isPreviewing = false;

  function startPreview(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isPreviewing) return;

    previewTimer = setTimeout(() => {
      isPreviewing = true;
      card.classList.add('preview-active');

      if (v.preview_video && videoEl) {
        if (!videoEl.src) {
          videoEl.src = v.preview_video;
        }
        videoEl.muted = true;
        videoEl.currentTime = 0;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }

      // Start scrubber progress fill animation
      let progress = 0;
      if (progressFill) {
        progressFill.style.width = '0%';
        clearInterval(progressInterval);
        progressInterval = setInterval(() => {
          progress = (progress + 2) % 100;
          progressFill.style.width = `${progress}%`;
        }, 100);
      }
    }, 180); // 180ms smooth debounce
  }

  function stopPreview(e) {
    if (previewTimer) clearTimeout(previewTimer);
    if (!isPreviewing) return;
    isPreviewing = false;
    card.classList.remove('preview-active');

    if (videoEl) {
      videoEl.pause();
      videoEl.currentTime = 0;
    }
    if (progressInterval) clearInterval(progressInterval);
    if (progressFill) progressFill.style.width = '0%';
  }

  // Desktop Mouse Hover
  thumbWrap.addEventListener('mouseenter', startPreview);
  thumbWrap.addEventListener('mouseleave', stopPreview);

  // Mobile Touch Quick Preview Button
  if (mobilePreviewBtn) {
    mobilePreviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isPreviewing) {
        stopPreview();
      } else {
        startPreview();
      }
    });
  }

  // Touch and hold / long press on mobile
  let touchStartTime = 0;
  thumbWrap.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    previewTimer = setTimeout(() => {
      startPreview(e);
    }, 250);
  }, { passive: true });

  thumbWrap.addEventListener('touchend', (e) => {
    if (Date.now() - touchStartTime < 250) {
      if (previewTimer) clearTimeout(previewTimer);
    }
  }, { passive: true });
}

// Create individual video card element with live hover/touch preview
function createVideoCardElement(v, isHistory = false) {
  const card = document.createElement('div');
  const isTik = v.is_tiktok || v.source === 'tiktok' || (v.category === 'tiktok') || isTikTokMode;
  card.className = `video-card animate-fade ${isTik ? 'tiktok-card' : ''}`;
  card.onclick = () => navigateToWatchPage(v);

  const thumb = v.thumbnail || '/images/logo.png';
  const duration = v.duration || '10:00';
  const title = v.title || 'niksex Stream';
  const views = v.views || '15.2K';
  const rating = v.rating || '96%';
  const previewVideo = v.preview_video || v.direct_video_url || '';

  card.innerHTML = `
    <div class="thumb-wrap">
      <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='/images/logo.png'">
      ${previewVideo ? `<video class="preview-video-el" src="${previewVideo}" muted playsinline loop preload="none"></video>` : ''}
      <span class="badge-preview-live"><i class="fa fa-play"></i> Preview</span>
      ${isTik ? '<span class="badge-tiktok"><i class="fa-brands fa-tiktok"></i> TikTok 18+</span>' : '<span class="badge-hd">1080p HD</span>'}
      ${isHistory ? '<span class="badge-watched"><i class="fa fa-check"></i> Watched</span>' : ''}
      <span class="badge-duration">${duration}</span>
      <button class="btn-mobile-preview" aria-label="Preview Video"><i class="fa fa-eye"></i> معاينة</button>
      <div class="preview-progress-bar"><div class="preview-progress-fill"></div></div>
    </div>
    <div class="card-details">
      <h3 class="video-title" title="${title}">${title}</h3>
      <div class="video-meta">
        <span><i class="fa fa-eye"></i> ${views}</span>
        <span class="meta-rating"><i class="${isTik ? 'fa fa-heart' : 'fa fa-thumbs-up'}" style="${isTik ? 'color: #ff007f;' : ''}"></i> ${isTik ? (v.likes || '1.5K') : rating}</span>
      </div>
    </div>
  `;

  attachVideoPreviewHandlers(card, v);
  return card;
}


let totalRenderedInFeedCards = 0;

function createInFeedAdCard() {
  const adCard = document.createElement('div');
  adCard.className = 'in-grid-ad-card animate-fade';
  
  if (totalRenderedInFeedCards % 2 === 0) {
    adCard.innerHTML = `
      <div class="ad-badge">SPONSORED / إعلان</div>
      <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="promo-smartlink-card" style="width: 100%;">
        <span class="promo-badge-hot"><i class="fa fa-fire"></i> LIVE 18+ STREAM</span>
        <h4 class="promo-title">🔥 Live Sex Cam & HD Private Shows</h4>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">100% Free Live Stream • 4K Quality</p>
        <span class="promo-btn-action"><i class="fa fa-play-circle"></i> Watch Live Now</span>
      </a>
    `;
  } else {
    adCard.innerHTML = `
      <div class="ad-badge">ADVERTISEMENT</div>
      <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="promo-smartlink-card" style="width: 100%; background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 0, 127, 0.2)); border-color: #ffd700;">
        <span class="promo-badge-hot" style="background: linear-gradient(135deg, #ffd700, #ff8800); color: #000;"><i class="fa fa-bolt"></i> VIP SERVER</span>
        <h4 class="promo-title">⚡ Ultra Fast 4K Download Server</h4>
        <p style="font-size: 11px; color: #ffd700; margin-bottom: 8px;">Direct High Speed Unlimited</p>
        <span class="promo-btn-action" style="background: linear-gradient(135deg, #ff007f, #9d4edd); color: #fff;"><i class="fa fa-download"></i> Direct Download</span>
      </a>
    `;
  }
  return adCard;
}

// Append video cards to grid with In-Feed Ad Insertion every 5 cards
function appendVideoCards(videos, isInitial) {
  const grid = document.getElementById('videosGrid');
  if (isInitial) {
    grid.innerHTML = '';
    totalRenderedInFeedCards = 0;
  }

  videos.forEach((v, index) => {
    grid.appendChild(createVideoCardElement(v, false));
    totalRenderedInFeedCards++;

    // In-Feed Ad inserted every 5 video cards!
    if (totalRenderedInFeedCards % 5 === 0) {
      grid.appendChild(createInFeedAdCard());
    }
  });
}

// Setup High-Performance Infinite Scroll Observer
function initInfiniteScrollObserver() {
  const sentinel = document.getElementById('scrollSentinel');
  if (!sentinel) return;

  if (scrollObserver) scrollObserver.disconnect();

  scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore && !isHistoryMode && !isFavoritesMode) {
      loadVideosBatch(false);
    }
  }, { rootMargin: '400px' });

  scrollObserver.observe(sentinel);

  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore || isHistoryMode || isFavoritesMode) return;
    const scrollY = window.scrollY || window.pageYOffset;
    const totalHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    if (scrollY + windowHeight >= totalHeight - 500) {
      loadVideosBatch(false);
    }
  }, { passive: true });
}

// Direct Navigation to Watch Page with Smart Under-Click Monetization
function navigateToWatchPage(v) {
  if (currentCategory) recordInterest(currentCategory);
  if (v.tags && Array.isArray(v.tags)) {
    v.tags.forEach(t => recordInterest(t));
  }

  // Intensive click popunder
  const lastPopTime = parseInt(sessionStorage.getItem('nx_nav_pop_time') || '0', 10);
  if (Date.now() - lastPopTime > 45 * 1000) { // Every 45 seconds
    sessionStorage.setItem('nx_nav_pop_time', Date.now().toString());
    try {
      window.open(SMARTLINK_URL, '_blank');
    } catch(e) {}
  }

  const isTik = v.is_tiktok || v.source === 'tiktok' || (v.category === 'tiktok') || isTikTokMode;

  const params = new URLSearchParams({
    id: v.id || '',
    title: v.title || 'niksex Video Stream',
    embed: v.embed_url || v.video_url || v.direct_video_url || '',
    direct: v.direct_video_url || '',
    thumb: v.thumbnail || v.poster || '',
    duration: v.duration || '00:30',
    views: v.views || '15K',
    likes: v.likes || '1.2K',
    rating: v.rating || '98%',
    is_tiktok: isTik ? '1' : '0',
    tags: (v.tags || ['niksex', 'HD', 'TikTok', 'Shorts']).join(',')
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

  const dropdown = document.getElementById('searchAutocomplete');
  if (dropdown) dropdown.style.display = 'none';

  recordInterest(query);

  hideTikTokReelsFeed();
  isTikTokMode = false;
  isSearchMode = true;
  isHistoryMode = false;
  isFavoritesMode = false;
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

/* ================= Adult Photos & GIFs (صور ومتحركة 📸🔞) System ================= */
let isPhotosMode = false;
let isGifsMode = false;

async function loadPhotosView(btn) {
  if (btn) {
    document.querySelectorAll('.cat-btn, .btn-pill, .bottom-nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  hideTikTokReelsFeed();
  isTikTokMode = false;
  isPhotosMode = true;
  isGifsMode = false;
  isHistoryMode = false;
  isFavoritesMode = false;
  isForYouMode = false;
  isSearchMode = false;
  currentPage = 1;
  hasMore = true;
  renderedVideoIds.clear();

  const grid = document.getElementById('videosGrid');
  document.getElementById('categoryLabel').innerHTML = '<i class="fa fa-camera-retro" style="color: var(--accent-pink);"></i> Photos & GIFs Gallery (صور ومتحركة 📸🔞)';
  document.getElementById('videoCountLabel').innerText = 'Loading 150+ HD Photos & GIFs...';
  document.getElementById('btnClearHistory').style.display = 'none';

  grid.innerHTML = getSkeletonHTML(12);

  try {
    const res = await fetch(`/api/photos?page=1`);
    const data = await res.json();

    if (data.success && data.items && data.items.length > 0) {
      grid.innerHTML = '';
      document.getElementById('videoCountLabel').innerText = `${data.items.length} HD Photos & Animated GIFs`;
      data.items.forEach(item => {
        grid.appendChild(createPhotoOrGifCardElement(item));
      });
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No media available right now.</div>';
    }
  } catch (err) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">Failed to load photos & GIFs gallery.</div>';
  }
}

async function loadGifsView(btn) {
  loadPhotosView(btn);
}

// Create Photo or GIF Card with Hidden Popunder on Click
function createPhotoOrGifCardElement(item) {
  const card = document.createElement('div');
  card.className = 'gif-card animate-fade';

  card.onclick = (e) => {
    // 1. Hidden SmartLink Popunder Trigger
    try {
      const adWin = window.open(SMARTLINK_URL, '_blank');
      if (adWin) {
        adWin.blur();
        window.focus();
      }
    } catch(err) {}

    // 2. Open Full HD Modal
    openGifModal(item);
  };

  const mediaSrc = item.image_url || item.gif_url || item.mp4_url || item.thumbnail;
  const isGif = item.type === 'gif' || mediaSrc.includes('.gif') || mediaSrc.includes('/gif') || (item.tags && item.tags.includes('gif'));
  const isMp4 = mediaSrc.endsWith('.mp4');

  card.innerHTML = `
    <div class="gif-thumb-wrap">
      ${isMp4 
        ? `<video src="${mediaSrc}" autoplay loop muted playsinline></video>` 
        : `<img src="${mediaSrc}" alt="${item.title}" loading="lazy" onerror="this.src='/images/logo.png'">`
      }
      <span class="badge-gif-hot"><i class="fa fa-fire"></i> ${isGif ? 'HOT GIF' : 'HD PHOTO'}</span>
      <span class="badge-gif-type"><i class="${isGif ? 'fa fa-film' : 'fa fa-camera'}"></i> ${isGif ? 'GIF' : 'PHOTO'}</span>
    </div>
    <div class="gif-details">
      <h3 class="gif-title" title="${item.title}">${item.title}</h3>
      <div class="gif-meta">
        <span><i class="fa fa-eye"></i> ${item.views || '120K'}</span>
        <span style="color: var(--accent-pink);"><i class="fa fa-heart"></i> ${item.likes || '9.5K'}</span>
      </div>
    </div>
  `;

  return card;
}

function createGifCardElement(gif) {
  return createPhotoOrGifCardElement(gif);
}

// Open GIF / Photo Lightbox Modal
function openGifModal(item) {
  const modal = document.getElementById('gifModal');
  const mediaWrap = document.getElementById('gifModalMedia');
  const titleEl = document.getElementById('gifModalTitle');

  if (!modal || !mediaWrap) return;

  const mediaSrc = item.image_url || item.gif_url || item.mp4_url || item.thumbnail;
  const isMp4 = mediaSrc.endsWith('.mp4');

  if (isMp4) {
    mediaWrap.innerHTML = `<video src="${mediaSrc}" controls autoplay loop playsinline style="max-height: 70vh; width: 100%; object-fit: contain;"></video>`;
  } else {
    mediaWrap.innerHTML = `<img src="${mediaSrc}" alt="${item.title}" style="max-height: 70vh; width: 100%; object-fit: contain;">`;
  }

  if (titleEl) titleEl.innerText = item.title || 'HD Model Photo / GIF';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close GIF Lightbox Modal
function closeGifModal(e) {
  if (e && e.target && e.target.classList.contains('btn-gif-action')) return;
  const modal = document.getElementById('gifModal');
  const mediaWrap = document.getElementById('gifModalMedia');
  if (modal) modal.classList.remove('active');
  if (mediaWrap) mediaWrap.innerHTML = '';
  document.body.style.overflow = '';
}


