// Monetization & Smartlink Configuration
const SMARTLINK_URL = 'https://www.profitableratecpmnetwork.com/k46g8trs?key=d6b9b043fad434efa68a86b7b0f6b0ab';
const ALLOWED_AD_DOMAINS = ['profitableratecpmnetwork.com', 'highrevenueformat.com'];

function isAllowedAdUrl(urlStr) {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr, window.location.origin);
    return ALLOWED_AD_DOMAINS.some(domain => parsed.hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Smart Popunder Handler
(function initSmartlinkMonetization() {
  let clickCount = 0;
  const COOLDOWN_MS = 30 * 1000;

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && isAllowedAdUrl(link.href)) return;

    clickCount++;
    const lastFired = parseInt(sessionStorage.getItem('nx_smartlink_nikroli_pop') || '0', 10);
    const now = Date.now();

    if ((clickCount % 2 === 1) && (now - lastFired > COOLDOWN_MS)) {
      sessionStorage.setItem('nx_smartlink_nikroli_pop', now.toString());
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

// nikroli Global State
let currentNikroliCategory = 'trending';
let nikroliReelsList = [];
let activeNikroliIndex = 0;
let isNikroliLoading = false;
let nikroliCurrentPage = 1;
let isNikroliMuted = false;
let nikroliObserver = null;
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || params.get('cat') || 'trending';
  loadNikroliFeed(q, true);

  // Setup Desktop Keyboard Controls
  document.addEventListener('keydown', handleNikroliKeydown);

  // Setup Touch Gestures for Mobile
  const feed = document.getElementById('nikroliReelsFeed');
  if (feed) {
    feed.addEventListener('touchstart', e => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    feed.addEventListener('touchend', e => {
      touchEndY = e.changedTouches[0].screenY;
      handleTouchSwipe();
    }, { passive: true });
  }
});

async function loadNikroliFeed(category = 'trending', isInitial = false) {
  if (isNikroliLoading) return;
  isNikroliLoading = true;

  currentNikroliCategory = category;
  const feedContainer = document.getElementById('nikroliReelsFeed');
  if (!feedContainer) return;

  if (isInitial) {
    nikroliCurrentPage = 1;
    nikroliReelsList = [];
    activeNikroliIndex = 0;
    feedContainer.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 14px;">
        <div class="spinner-neon"></div>
        <span style="font-weight: 700; color: #00f2fe;"><i class="fa-brands fa-tiktok"></i> Loading nikroli ${category.toUpperCase()} Reels...</span>
      </div>
    `;
  }

  try {
    const res = await fetch(`/api/tiktok?q=${encodeURIComponent(category)}&page=${nikroliCurrentPage}`);
    const data = await res.json();
    const videos = (data.success && data.videos && data.videos.length > 0) ? data.videos : [];

    if (isInitial) feedContainer.innerHTML = '';

    if (videos.length === 0 && isInitial) {
      feedContainer.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 10px; padding: 20px; text-align: center;">
          <i class="fa fa-film" style="font-size: 36px; color: #ff007f;"></i>
          <span style="color: #fff; font-weight: 700;">No nikroli reels found for this category.</span>
          <button class="btn-top-pill" onclick="loadNikroliFeed('trending', true)">Load Trending Reels</button>
        </div>
      `;
      isNikroliLoading = false;
      return;
    }

    const startIndex = nikroliReelsList.length;
    videos.forEach((v, i) => {
      const globalIndex = startIndex + i;
      nikroliReelsList.push(v);
      const slide = createNikroliSlide(v, globalIndex);
      feedContainer.appendChild(slide);
    });

    setupNikroliObserver();

    if (isInitial && feedContainer.firstElementChild) {
      const firstVid = feedContainer.querySelector('.nikroli-video-player');
      if (firstVid) {
        firstVid.muted = isNikroliMuted;
        firstVid.play().catch(() => {
          firstVid.muted = true;
          firstVid.play().catch(() => {});
        });
      }
    }

    nikroliCurrentPage++;
  } catch (err) {
    console.error('Failed to load nikroli reels:', err);
    if (isInitial) {
      feedContainer.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ef4444; gap: 10px;">
          <i class="fa fa-exclamation-circle" style="font-size: 32px;"></i>
          <span>Failed to connect to nikroli server.</span>
          <button class="btn-top-pill" onclick="loadNikroliFeed('trending', true)">Retry</button>
        </div>
      `;
    }
  } finally {
    isNikroliLoading = false;
  }
}

function createNikroliSlide(v, index) {
  const slide = document.createElement('div');
  slide.className = 'nikroli-slide';
  slide.dataset.index = index;

  const videoSrc = v.direct_video_url || v.video_url || '';
  const poster = v.poster || v.thumbnail || '/images/logo.png';
  const title = v.title || 'nikroli 18+ Viral Reel';
  const likes = v.likes || '3.4K';
  const tags = (v.tags || ['nikroli', 'shorts', 'reels']).map(t => `#${t}`).slice(0, 3).join(' ');

  slide.innerHTML = `
    <!-- High-res backdrop blur -->
    <img class="nikroli-bg-blur" src="${poster}" alt="" onerror="this.style.display='none'">

    <!-- Main HTML5 Reel Video Player -->
    <video class="nikroli-video-player" src="${videoSrc}" poster="${poster}" loop playsinline webkit-playsinline x5-playsinline preload="${index < 3 ? 'auto' : 'metadata'}" data-index="${index}" onclick="toggleNikroliPlay(${index})" ondblclick="doubleTapNikroliLike(${index}, event)"></video>

    <!-- Play / Pause Pulse Feedback -->
    <div class="nikroli-play-indicator" id="playPulse_${index}"><i class="fa fa-play"></i></div>

    <!-- Right Sidebar Floating Action Rail -->
    <div class="nikroli-actions-rail">
      <button class="btn-nikroli-action" id="btnLike_${index}" onclick="toggleNikroliLike(${index}, event)" title="Like Reel">
        <i class="fa fa-heart"></i>
        <span class="nikroli-action-count" id="likeTxt_${index}">${likes}</span>
      </button>

      <button class="btn-nikroli-action" onclick="openNikroliInCinema(${index}, event)" title="Watch in Cinema Player">
        <i class="fa fa-expand" style="color: #00f2fe;"></i>
        <span class="nikroli-action-count">HD</span>
      </button>

      <button class="btn-nikroli-action" onclick="shareNikroliReel(${index}, event)" title="Share Reel">
        <i class="fa fa-share" style="color: #c084fc;"></i>
        <span class="nikroli-action-count">Share</span>
      </button>

      <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="btn-nikroli-action" title="VIP Download / Ultra Server" style="border-color: #ffd700; color: #ffd700;">
        <i class="fa fa-bolt"></i>
        <span class="nikroli-action-count" style="color: #ffd700;">VIP</span>
      </a>
    </div>

    <!-- Bottom Metadata Overlay -->
    <div class="nikroli-info-overlay">
      <div class="nikroli-user-badge">
        <span>@nikroli_official</span>
        <i class="fa fa-check-circle" style="color: #00f2fe; font-size: 12px;"></i>
      </div>
      <div class="nikroli-reel-title">${title} <span style="color: #00f2fe; font-weight: 700;">${tags}</span></div>
      <div class="nikroli-sound-ticker">
        <i class="fa fa-music"></i>
        <span>Original Sound - nikroli 18+ Master Audio</span>
      </div>
    </div>
  `;

  return slide;
}

// Observer for Swiping and Auto-Playing active slide
function setupNikroliObserver() {
  const slides = document.querySelectorAll('.nikroli-slide');
  if (!slides || slides.length === 0) return;

  if (nikroliObserver) nikroliObserver.disconnect();

  nikroliObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const slide = entry.target;
      const index = parseInt(slide.dataset.index, 10);
      const vid = slide.querySelector('.nikroli-video-player');

      if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
        activeNikroliIndex = index;
        if (vid) {
          vid.preload = 'auto';
          vid.muted = isNikroliMuted;
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              vid.muted = true;
              vid.play().catch(() => {});
            });
          }
        }

        prebufferUpcomingNikroliReels(index);

        // Fetch next batch when 3 reels remaining
        if (index >= nikroliReelsList.length - 3 && !isNikroliLoading) {
          loadNikroliFeed(currentNikroliCategory, false);
        }
      } else {
        if (vid) {
          vid.pause();
          vid.currentTime = 0;
        }
      }
    });
  }, {
    root: document.getElementById('nikroliReelsFeed'),
    threshold: 0.65
  });

  slides.forEach(s => nikroliObserver.observe(s));
}

// Prebuffer upcoming reels for zero latency
function prebufferUpcomingNikroliReels(currentIndex) {
  for (let offset = 1; offset <= 3; offset++) {
    const nextSlide = document.querySelector(`.nikroli-slide[data-index="${currentIndex + offset}"]`);
    if (nextSlide) {
      const v = nextSlide.querySelector('.nikroli-video-player');
      if (v && v.preload !== 'auto') {
        v.preload = 'auto';
        v.load();
      }
    }
  }
}

// Step next/prev reel
function stepNikroliReel(direction) {
  const feed = document.getElementById('nikroliReelsFeed');
  if (!feed) return;

  const slides = feed.querySelectorAll('.nikroli-slide');
  if (!slides || slides.length === 0) return;

  if (direction === 'next') {
    activeNikroliIndex = Math.min(activeNikroliIndex + 1, slides.length - 1);
  } else {
    activeNikroliIndex = Math.max(activeNikroliIndex - 1, 0);
  }

  if (slides[activeNikroliIndex]) {
    slides[activeNikroliIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Play / Pause Toggle with Feedback
function toggleNikroliPlay(index) {
  const slide = document.querySelector(`.nikroli-slide[data-index="${index}"]`);
  if (!slide) return;

  const vid = slide.querySelector('.nikroli-video-player');
  const indicator = document.getElementById(`playPulse_${index}`);
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

// Sound Mute / Unmute
function toggleNikroliSound() {
  isNikroliMuted = !isNikroliMuted;
  const icon = document.getElementById('iconNikroliSound');
  const btn = document.getElementById('btnNikroliSound');

  if (isNikroliMuted) {
    if (icon) icon.className = 'fa fa-volume-mute';
    if (btn) btn.style.color = '#ef4444';
  } else {
    if (icon) icon.className = 'fa fa-volume-up';
    if (btn) btn.style.color = '#00f2fe';
  }

  document.querySelectorAll('.nikroli-video-player').forEach(v => {
    v.muted = isNikroliMuted;
  });
}

// Switch Category in Sidebar
function switchNikroliCategory(cat, btn) {
  document.querySelectorAll('.nikroli-nav-link').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadNikroliFeed(cat, true);
}

// Like action
function toggleNikroliLike(index, e) {
  if (e) e.stopPropagation();
  const btn = document.getElementById(`btnLike_${index}`);
  const counter = document.getElementById(`likeTxt_${index}`);
  if (!btn) return;

  const isLiked = btn.classList.toggle('liked');
  let count = parseInt((counter.innerText || '2400').replace(/[^0-9]/g, ''), 10);
  if (isLiked) {
    count++;
    counter.innerText = (count > 999 ? (count/1000).toFixed(1) + 'K' : count);
  } else {
    count = Math.max(1, count - 1);
    counter.innerText = (count > 999 ? (count/1000).toFixed(1) + 'K' : count);
  }
}

function doubleTapNikroliLike(index, e) {
  if (e) e.stopPropagation();
  const btn = document.getElementById(`btnLike_${index}`);
  if (btn && !btn.classList.contains('liked')) {
    toggleNikroliLike(index, e);
  }
}

// Open Reel in Cinema Player
function openNikroliInCinema(index, e) {
  if (e) e.stopPropagation();
  const v = nikroliReelsList[index];
  if (!v) return;

  const params = new URLSearchParams({
    id: v.id || '',
    title: v.title || '',
    embed: v.direct_video_url || v.video_url || '',
    direct: v.direct_video_url || '',
    thumb: v.thumbnail || v.poster || '',
    duration: v.duration || '00:30',
    views: v.views || '20K',
    rating: '98%',
    is_tiktok: '1',
    tags: (v.tags || ['nikroli', 'shorts', 'reels']).join(',')
  });

  window.location.href = `/watch.html?${params.toString()}`;
}

// Share Reel
function shareNikroliReel(index, e) {
  if (e) e.stopPropagation();
  const v = nikroliReelsList[index];
  if (!v) return;

  const url = `${window.location.origin}/nikroli.html?id=${v.id || ''}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('🔗 nikroli Reel link copied to clipboard!');
    }).catch(() => {
      prompt('Copy Reel Link:', url);
    });
  } else {
    prompt('Copy Reel Link:', url);
  }
}

// Keyboard controls
function handleNikroliKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    stepNikroliReel('next');
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    stepNikroliReel('prev');
  } else if (e.key === ' ') {
    e.preventDefault();
    toggleNikroliPlay(activeNikroliIndex);
  } else if (e.key.toLowerCase() === 'm') {
    e.preventDefault();
    toggleNikroliSound();
  }
}

function handleTouchSwipe() {
  const threshold = 40;
  if (touchEndY < touchStartY - threshold) {
    stepNikroliReel('next');
  } else if (touchEndY > touchStartY + threshold) {
    stepNikroliReel('prev');
  }
}
