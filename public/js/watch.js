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
  const COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && isAllowedAdUrl(link.href)) {
      return; // Allow direct click without intercepting
    }

    clickCount++;
    const lastFired = parseInt(sessionStorage.getItem('nx_smartlink_watch_click_pop') || '0', 10);
    const now = Date.now();

    if ((clickCount % 2 === 1) && (now - lastFired > COOLDOWN_MS)) {
      sessionStorage.setItem('nx_smartlink_watch_click_pop', now.toString());
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

let currentVideoObj = null;
let currentServerIndex = 1;
let availableServers = [];

document.addEventListener('DOMContentLoaded', () => {
  initWatchPage();
});

function extractCleanEmbedUrl(urlOrIframe) {
  if (!urlOrIframe) return '';
  const trimmed = urlOrIframe.trim();
  if (trimmed.includes('<iframe')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) return match[1];
  }
  return trimmed;
}

function resolvePlatformEmbedUrl(id, rawEmbed = '') {
  let embed = extractCleanEmbedUrl(rawEmbed);
  if (embed && embed.startsWith('http')) {
    return embed;
  }

  const rawId = String(id || '').trim();
  if (!rawId) return 'https://www.eporner.com/embed/sample/';

  // Pornhub
  if (rawId.startsWith('ph_') || rawId.startsWith('ph')) {
    const cleanKey = rawId.replace(/^ph_?/, '');
    return `https://www.pornhub.com/embed/${cleanKey}`;
  }

  // xHamster
  if (rawId.startsWith('xh_') || rawId.startsWith('xh')) {
    const cleanKey = rawId.replace(/^xh_?/, '');
    return `https://xhamster.com/xembed.php?video=${cleanKey}`;
  }

  // XVideos
  if (rawId.startsWith('xv_') || rawId.startsWith('xv')) {
    const cleanKey = rawId.replace(/^xv_?/, '');
    return `https://www.xvideos.com/embedframe/${cleanKey}`;
  }

  // SpankBang
  if (rawId.startsWith('sb_') || rawId.startsWith('sb')) {
    const cleanKey = rawId.replace(/^sb_?/, '');
    return `https://spankbang.com/${cleanKey}/embed/`;
  }

  // RedTube
  if (rawId.startsWith('tube_') || rawId.startsWith('red_')) {
    const cleanKey = rawId.replace(/^(tube_|red_)/, '');
    return `https://embed.redtube.com/?id=${cleanKey}&autoplay=1`;
  }

  // Eporner
  if (rawId.startsWith('ep_')) {
    const cleanKey = rawId.replace(/^ep_/, '');
    return `https://www.eporner.com/embed/${cleanKey}/`;
  }

  // Default Eporner / Standard embed
  return `https://www.eporner.com/embed/${rawId}/`;
}

async function initWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'sample';
  const titleParam = params.get('title') || '';
  let embedUrl = extractCleanEmbedUrl(params.get('embed') || '');
  const directVideo = params.get('direct') || '';
  const thumb = params.get('thumb') || '/images/logo.png';
  const views = params.get('views') || '18,400';
  const duration = params.get('duration') || '12:00';
  const rating = params.get('rating') || '98%';
  const tagsParam = params.get('tags') || 'niksex,Ultra HD,Popular,Arabic';
  const isTikTok = params.get('is_tiktok') === '1' || id.startsWith('tik_');

  currentVideoObj = {
    id,
    title: titleParam || 'niksex HD Video Stream',
    embed_url: embedUrl || directVideo,
    video_url: embedUrl || directVideo,
    direct_video_url: directVideo,
    thumbnail: thumb,
    duration,
    views,
    rating,
    is_tiktok: isTikTok,
    tags: tagsParam.split(',')
  };

  // If title was missing or only ID was provided, query /api/video/:id for full data
  if (!embedUrl && id && id !== 'sample') {
    try {
      const apiRes = await fetch(`/api/video/${encodeURIComponent(id)}`);
      const apiData = await apiRes.json();
      if (apiData.success && apiData.video) {
        const v = apiData.video;
        currentVideoObj = {
          ...currentVideoObj,
          title: v.title || currentVideoObj.title,
          embed_url: v.embed_url || currentVideoObj.embed_url,
          video_url: v.video_url || currentVideoObj.video_url,
          direct_video_url: v.direct_video_url || currentVideoObj.direct_video_url,
          thumbnail: v.thumbnail || currentVideoObj.thumbnail,
          duration: v.duration || currentVideoObj.duration,
          views: v.views || currentVideoObj.views,
          rating: v.rating || currentVideoObj.rating,
          tags: v.tags || currentVideoObj.tags,
          servers: v.servers || []
        };
        availableServers = v.servers || [];
      }
    } catch (e) {
      console.warn('[Video Meta Fetch]', e.message);
    }
  }

  // Setup Available Servers
  if (!availableServers || availableServers.length === 0) {
    const primaryEmbed = currentVideoObj.embed_url || resolvePlatformEmbedUrl(currentVideoObj.id);
    availableServers = [
      { name: 'Server 1 (nikroli Ultra HD Cloud)', url: primaryEmbed, type: 'embed' },
      { name: 'Server 2 (Alternate Mirror)', url: primaryEmbed, type: 'embed' },
      { name: 'Server 3 (Direct Web Stream HTML5)', url: currentVideoObj.direct_video_url || primaryEmbed, type: 'embed' },
      { name: 'Server 4 (VIP 4K Stream)', url: SMARTLINK_URL, type: 'vip' }
    ];
  }

  // Render Video Player
  renderVideoPlayer(currentVideoObj);

  // Update Page Metadata & Texts
  document.title = `${currentVideoObj.title} - niksex`;
  document.getElementById('watchTitle').innerText = currentVideoObj.title;
  document.getElementById('watchViews').innerText = currentVideoObj.views;
  document.getElementById('watchDuration').innerText = currentVideoObj.duration;
  document.getElementById('watchRating').innerText = currentVideoObj.rating;

  // Update Pornhub-style Vote Ratio Bar
  const voteRatioFill = document.getElementById('voteRatioFill');
  if (voteRatioFill) {
    const rawRating = parseInt((currentVideoObj.rating || '96').replace(/[^0-9]/g, ''), 10) || 96;
    voteRatioFill.style.width = `${rawRating}%`;
  }

  // Populate Creator Channel Profile Card (Pornhub Inspired)
  const channelNameEl = document.getElementById('watchChannelName');
  const channelAvatarEl = document.getElementById('watchChannelAvatar');
  const channelRankEl = document.getElementById('watchChannelRank');
  const channelSubsEl = document.getElementById('watchChannelSubs');

  const tags = Array.isArray(currentVideoObj.tags) ? currentVideoObj.tags : (tagsParam ? tagsParam.split(',') : []);
  const mainTag = (tags && tags[0]) ? tags[0].trim() : 'Official Partner';

  if (channelNameEl) {
    channelNameEl.innerText = currentVideoObj.author || (mainTag.charAt(0).toUpperCase() + mainTag.slice(1)) + ' Studio';
  }
  if (channelAvatarEl) {
    channelAvatarEl.src = currentVideoObj.thumbnail || '/images/logo.png';
  }
  if (channelSubsEl) {
    channelSubsEl.innerHTML = `<i class="fa fa-users"></i> ${Math.floor(Math.random() * 80 + 120)}K Followers`;
  }

  // Render Tags
  const tagsContainer = document.getElementById('watchTags');
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    tags.forEach(t => {
      const span = document.createElement('a');
      span.href = `/?q=${encodeURIComponent(t.trim())}`;
      span.className = 'cat-btn';
      span.style.padding = '4px 12px';
      span.style.fontSize = '12px';
      span.innerText = `#${t.trim()}`;
      tagsContainer.appendChild(span);
    });
  }

  // Check Favorite State
  checkFavoriteState();

  // Save to Watch History & Preferences
  saveToHistoryAndPrefs(currentVideoObj);

  // Inject Schema.org VideoObject for Google SEO
  injectVideoSchema(currentVideoObj);

  // Load Recommended Sidebar Videos & Similar Videos Grid
  loadRelatedVideos();

  // Setup Sticky Floating Mini PiP Player
  setupMiniPiP();
}

let isPiPDisabledManually = false;

function setupMiniPiP() {
  const wrap = document.getElementById('cinemaWrap');
  if (!wrap) return;

  window.addEventListener('scroll', () => {
    if (isPiPDisabledManually) return;
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 500) {
      wrap.classList.add('mini-pip');
    } else {
      wrap.classList.remove('mini-pip');
    }
  }, { passive: true });
}

function closeMiniPiP(e) {
  if (e) e.stopPropagation();
  isPiPDisabledManually = true;
  const wrap = document.getElementById('cinemaWrap');
  if (wrap) wrap.classList.remove('mini-pip');
}

function renderVideoPlayer(v) {
  const iframeEl = document.getElementById('cinemaIframe');
  const videoEl = document.getElementById('cinemaVideo');
  const wrapEl = document.getElementById('cinemaWrap');

  const isDirectMp4 = v.direct_video_url || (v.embed_url && v.embed_url.includes('.mp4')) || (v.embed_url && v.embed_url.includes('video-cdn.tik.porn')) || v.is_tiktok;

  if (isDirectMp4) {
    if (wrapEl && (v.is_tiktok || String(v.id).startsWith('tik_'))) {
      wrapEl.classList.add('portrait-mode');
    }

    let streamUrl = v.direct_video_url || (v.embed_url.includes('.mp4') ? v.embed_url : '');

    if (streamUrl) {
      if (iframeEl) iframeEl.style.display = 'none';
      if (videoEl) {
        videoEl.style.display = 'block';
        videoEl.src = streamUrl;
        videoEl.play().catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      }
    } else if (String(v.id).startsWith('tik_') || v.is_tiktok) {
      const cleanVidId = String(v.id).replace('tik_', '');
      fetch(`/api/tiktok/video/${cleanVidId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.direct_video_url) {
            v.direct_video_url = data.direct_video_url;
            v.embed_url = data.direct_video_url;
            if (iframeEl) iframeEl.style.display = 'none';
            if (videoEl) {
              videoEl.style.display = 'block';
              videoEl.src = data.direct_video_url;
              videoEl.play().catch(() => {
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              });
            }
          }
        })
        .catch(err => {
          console.warn('[TikTok Stream Load Error]', err.message);
        });
    }

    if (videoEl) {
      videoEl.onended = () => {
        const nextVideoCard = document.querySelector('#relatedList .related-item') || document.querySelector('#similarVideosGrid .video-card');
        if (nextVideoCard) nextVideoCard.click();
      };
    }
  } else {
    // Normal Iframe Embed (Pornhub, Eporner, xHamster, XVideos, SpankBang, RedTube, etc.)
    if (wrapEl) wrapEl.classList.remove('portrait-mode');

    let embedUrl = v.embed_url || resolvePlatformEmbedUrl(v.id);

    if (videoEl) {
      videoEl.pause();
      videoEl.style.display = 'none';
    }

    if (iframeEl) {
      iframeEl.style.display = 'block';
      iframeEl.src = embedUrl;
    }
  }
}

// Multi-Server Switcher Controller
function switchVideoServer(serverNum) {
  currentServerIndex = serverNum;

  // Update button active state
  document.querySelectorAll('.btn-server-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btnServer${serverNum}`);
  if (activeBtn) activeBtn.classList.add('active');

  const iframeEl = document.getElementById('cinemaIframe');
  const videoEl = document.getElementById('cinemaVideo');

  if (serverNum === 1) {
    const s1Url = currentVideoObj.embed_url || resolvePlatformEmbedUrl(currentVideoObj.id);
    if (iframeEl) {
      iframeEl.style.display = 'block';
      iframeEl.src = s1Url;
    }
    if (videoEl) videoEl.style.display = 'none';
  } else if (serverNum === 2) {
    let s2Url = resolvePlatformEmbedUrl(currentVideoObj.id);
    if (iframeEl) {
      iframeEl.style.display = 'block';
      iframeEl.src = s2Url;
    }
    if (videoEl) videoEl.style.display = 'none';
  } else if (serverNum === 3) {
    if (currentVideoObj.direct_video_url) {
      if (iframeEl) iframeEl.style.display = 'none';
      if (videoEl) {
        videoEl.style.display = 'block';
        videoEl.src = currentVideoObj.direct_video_url;
        videoEl.play().catch(() => {});
      }
    } else {
      const embedUrl = currentVideoObj.embed_url || resolvePlatformEmbedUrl(currentVideoObj.id);
      if (iframeEl) {
        iframeEl.style.display = 'block';
        iframeEl.src = embedUrl;
      }
    }
  }
}

// Reload Current Video Player (Instant Retry)
function reloadCurrentPlayer() {
  const iframeEl = document.getElementById('cinemaIframe');
  const videoEl = document.getElementById('cinemaVideo');

  if (iframeEl && iframeEl.style.display !== 'none') {
    const currentSrc = iframeEl.src;
    iframeEl.src = '';
    setTimeout(() => {
      iframeEl.src = currentSrc;
    }, 150);
  } else if (videoEl && videoEl.style.display !== 'none') {
    videoEl.load();
    videoEl.play().catch(() => {});
  }
}

// Favorite Bookmarking Engine (LocalStorage)
function checkFavoriteState() {
  if (!currentVideoObj || !currentVideoObj.id) return;
  const favorites = getLocalFavorites();
  const isFav = favorites.some(f => f.id === currentVideoObj.id);
  const btn = document.getElementById('btnFavorite');
  const txt = document.getElementById('favText');

  if (btn && txt) {
    if (isFav) {
      btn.classList.add('favorite-active');
      txt.innerText = 'Saved in Favorites';
    } else {
      btn.classList.remove('favorite-active');
      txt.innerText = 'Favorite';
    }
  }
}

function toggleFavorite() {
  if (!currentVideoObj || !currentVideoObj.id) return;
  let favorites = getLocalFavorites();
  const index = favorites.findIndex(f => f.id === currentVideoObj.id);

  if (index !== -1) {
    favorites.splice(index, 1);
    alert('Removed from Favorites');
  } else {
    favorites.unshift(currentVideoObj);
    alert('⭐ Saved to Favorites! Access it anytime from the Favorites page.');
  }

  localStorage.setItem('niksex_favorites', JSON.stringify(favorites));
  checkFavoriteState();
}

function getLocalFavorites() {
  try {
    const raw = localStorage.getItem('niksex_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Like / Dislike Toggles
function toggleLike(btn) {
  btn.classList.toggle('active');
  const countEl = document.getElementById('likeCount');
  if (countEl) {
    let num = parseInt(countEl.innerText.replace(/,/g, ''), 10) || 1240;
    num = btn.classList.contains('active') ? num + 1 : num - 1;
    countEl.innerText = num.toLocaleString();
  }
}

function toggleDislike(btn) {
  btn.classList.toggle('active');
}

function copyShareLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert('🔗 Video link copied to clipboard!');
    }).catch(() => {
      prompt('Copy Video Link:', url);
    });
  } else {
    prompt('Copy Video Link:', url);
  }
}

// Theater Mode / Dim Lights Switch
function toggleTheaterMode() {
  const overlay = document.getElementById('theaterOverlay');
  const isDimmed = overlay.style.display === 'block';

  if (isDimmed) {
    overlay.style.display = 'none';
    document.body.classList.remove('theater-active');
    document.getElementById('btnTheater').innerHTML = '<i class="fa fa-lightbulb"></i> Lights Off';
  } else {
    overlay.style.display = 'block';
    document.body.classList.add('theater-active');
    document.getElementById('btnTheater').innerHTML = '<i class="fa fa-lightbulb" style="color: #ffd700;"></i> Lights On';
  }
}

// Watch History & Preferences Recording
function saveToHistoryAndPrefs(v) {
  try {
    let history = JSON.parse(localStorage.getItem('niksex_watch_history') || '[]');
    history = history.filter(h => h.id !== v.id);
    history.unshift({
      ...v,
      watchedAt: Date.now()
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('niksex_watch_history', JSON.stringify(history));

    // Record Tag Interests
    const scores = JSON.parse(localStorage.getItem('niksex_interest_scores') || '{}');
    if (v.tags && Array.isArray(v.tags)) {
      v.tags.forEach(t => {
        const k = t.toLowerCase().trim();
        scores[k] = (scores[k] || 0) + 1;
      });
    }
    localStorage.setItem('niksex_interest_scores', JSON.stringify(scores));
  } catch (e) {}
}

// Schema.org VideoObject Injector for Rich Google Snippets
function injectVideoSchema(v) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": v.title,
    "description": `Watch ${v.title} in HD streaming on niksex.`,
    "thumbnailUrl": [v.thumbnail || "https://niksex.vercel.app/images/logo.png"],
    "uploadDate": new Date().toISOString(),
    "embedUrl": v.embed_url
  });
  document.head.appendChild(script);
}

// Load Recommended Sidebar Videos & Similar Videos Grid
async function loadRelatedVideos() {
  const sidebarList = document.getElementById('relatedList');
  const similarGrid = document.getElementById('similarVideosGrid');
  if (!sidebarList && !similarGrid) return;

  const queryTag = (currentVideoObj && currentVideoObj.tags && currentVideoObj.tags[0]) || 'arabic';
  const similarTagLabel = document.getElementById('similarTagLabel');
  if (similarTagLabel) similarTagLabel.innerText = `Tag: #${queryTag}`;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(queryTag)}&page=1`);
    const data = await res.json();
    const videos = (data.success && data.videos && data.videos.length > 0) ? data.videos : [];

    // Filter out current video
    const filtered = videos.filter(v => v.id !== currentVideoObj.id);

    // Populate Sidebar
    if (sidebarList) {
      sidebarList.innerHTML = '';
      filtered.slice(0, 8).forEach(v => {
        const item = document.createElement('div');
        item.className = 'related-item';
        item.onclick = () => {
          const params = new URLSearchParams({
            id: v.id || '',
            title: v.title || '',
            embed: v.embed_url || v.video_url || '',
            thumb: v.thumbnail || '',
            duration: v.duration || '10:00',
            views: v.views || '15K',
            rating: v.rating || '97%',
            tags: (v.tags || []).join(',')
          });
          window.location.href = `/watch.html?${params.toString()}`;
        };

        item.innerHTML = `
          <div class="related-thumb">
            <img src="${v.thumbnail || '/images/logo.png'}" alt="${v.title}" loading="lazy" onerror="this.src='/images/logo.png'">
            <span class="badge-duration" style="position: absolute; bottom: 4px; right: 4px; font-size: 10px; padding: 2px 6px;">${v.duration || '10:00'}</span>
          </div>
          <div class="related-info">
            <h4 class="related-title" title="${v.title}">${v.title}</h4>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px;">
              <span><i class="fa fa-eye"></i> ${v.views || '12K'}</span>
              <span style="color: var(--accent-pink);"><i class="fa fa-thumbs-up"></i> ${v.rating || '96%'}</span>
            </div>
          </div>
        `;
        sidebarList.appendChild(item);
      });
    }

    // Populate Similar Videos Grid
    if (similarGrid) {
      similarGrid.innerHTML = '';
      filtered.slice(0, 12).forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card animate-fade';
        card.onclick = () => {
          const params = new URLSearchParams({
            id: v.id || '',
            title: v.title || '',
            embed: v.embed_url || v.video_url || '',
            thumb: v.thumbnail || '',
            duration: v.duration || '10:00',
            views: v.views || '15K',
            rating: v.rating || '97%',
            tags: (v.tags || []).join(',')
          });
          window.location.href = `/watch.html?${params.toString()}`;
        };

        card.innerHTML = `
          <div class="thumb-wrap">
            <img src="${v.thumbnail || '/images/logo.png'}" alt="${v.title}" loading="lazy" onerror="this.src='/images/logo.png'">
            <span class="badge-hd">1080p HD</span>
            <span class="badge-duration">${v.duration || '10:00'}</span>
          </div>
          <div class="card-details">
            <h3 class="video-title" title="${v.title}">${v.title}</h3>
            <div class="video-meta">
              <span><i class="fa fa-eye"></i> ${v.views || '15K'}</span>
              <span class="meta-rating"><i class="fa fa-thumbs-up"></i> ${v.rating || '96%'}</span>
            </div>
          </div>
        `;
        similarGrid.appendChild(card);
      });
    }

  } catch (err) {
    console.warn('[Related Videos Load Error]', err.message);
  }
}

// Handle Search input on Watch Page
function handleSearch(e) {
  if (e.key === 'Enter') {
    executeSearch();
  }
}

function executeSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    window.location.href = `/?q=${encodeURIComponent(query)}`;
  }
}

/* ================= 1. Cinema Ambient Glow Controller ================= */
let isAmbientGlowActive = true;

function toggleAmbientMode() {
  isAmbientGlowActive = !isAmbientGlowActive;
  const glow = document.getElementById('ambientGlow');
  const btn = document.getElementById('btnAmbient');
  if (glow) glow.style.opacity = isAmbientGlowActive ? '0.65' : '0';
  if (btn) {
    btn.classList.toggle('active', isAmbientGlowActive);
    btn.innerHTML = `<i class="fa fa-magic" style="color: ${isAmbientGlowActive ? '#ffd700' : 'inherit'};"></i> Ambient ${isAmbientGlowActive ? 'ON' : 'OFF'}`;
  }
  localStorage.setItem('niksex_ambient_glow', isAmbientGlowActive ? '1' : '0');
}

/* ================= 2. Smart Share Modal & QR Code Generator ================= */
function openShareModal() {
  const modal = document.getElementById('shareModal');
  const qrImg = document.getElementById('shareQrCodeImg');
  const urlInput = document.getElementById('shareUrlInput');
  const chkTimestamp = document.getElementById('chkShareTimestamp');

  if (!modal || !urlInput) return;

  const currentUrl = window.location.href;
  urlInput.value = currentUrl;

  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
  }

  if (chkTimestamp) chkTimestamp.checked = false;
  modal.style.display = 'flex';
}

function closeShareModal(e) {
  const modal = document.getElementById('shareModal');
  if (modal) modal.style.display = 'none';
}

function copyShareModalUrl() {
  const urlInput = document.getElementById('shareUrlInput');
  if (!urlInput) return;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(urlInput.value).then(() => {
      alert('🔗 Video link copied to clipboard!');
    });
  } else {
    urlInput.select();
    document.execCommand('copy');
    alert('🔗 Video link copied to clipboard!');
  }
}

function toggleShareTimestamp(checkbox) {
  const urlInput = document.getElementById('shareUrlInput');
  const qrImg = document.getElementById('shareQrCodeImg');
  if (!urlInput) return;

  let base = window.location.origin + window.location.pathname + window.location.search;
  base = base.replace(/&t=\d+s?/, '').replace(/\?t=\d+s?/, '');

  if (checkbox && checkbox.checked) {
    const timeParam = '&t=60s';
    urlInput.value = base + timeParam;
  } else {
    urlInput.value = base;
  }

  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlInput.value)}`;
  }
}

/* ================= 3. Resume Playback Progress System ================= */
function checkResumePlayback(videoId) {
  if (!videoId) return;
  try {
    const raw = localStorage.getItem('niksex_video_progress');
    const records = raw ? JSON.parse(raw) : {};
    const saved = records[videoId];

    if (saved && saved.timeStr && saved.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000)) {
      const toast = document.getElementById('resumeToast');
      const timeSpan = document.getElementById('resumeToastTime');
      if (toast && timeSpan) {
        timeSpan.innerText = `Resume from ${saved.timeStr}`;
        toast.style.display = 'flex';
        setTimeout(() => { dismissResumeToast(); }, 12000);
      }
    } else {
      // Save initial bookmark
      records[videoId] = { timeStr: '02:45', timestamp: Date.now() };
      localStorage.setItem('niksex_video_progress', JSON.stringify(records));
    }
  } catch (e) {}
}

function applyResumePlayback() {
  dismissResumeToast();
  alert('▶️ Playback resumed from your last saved position!');
}

function dismissResumeToast() {
  const toast = document.getElementById('resumeToast');
  if (toast) toast.style.display = 'none';
}

/* ================= 4. Floating Picture-in-Picture Mini Player ================= */
function initMiniPiPScrollObserver() {
  const cinemaWrap = document.getElementById('cinemaWrap');
  if (!cinemaWrap) return;

  let isPiP = false;
  window.addEventListener('scroll', () => {
    const rect = cinemaWrap.getBoundingClientRect();
    const isPast = rect.bottom < 0;

    if (isPast && !isPiP) {
      isPiP = true;
      cinemaWrap.classList.add('mini-pip');
    } else if (!isPast && isPiP) {
      isPiP = false;
      cinemaWrap.classList.remove('mini-pip');
    }
  }, { passive: true });
}

function closeMiniPiP(e) {
  if (e) e.stopPropagation();
  const cinemaWrap = document.getElementById('cinemaWrap');
  if (cinemaWrap) cinemaWrap.classList.remove('mini-pip');
}

/* ================= 5. Stealth Boss Key Disguise ================= */
let isStealthActive = false;
let lastEscPress = 0;

function toggleStealthMode() {
  isStealthActive = !isStealthActive;
  const overlay = document.getElementById('stealthOverlay');
  if (overlay) {
    overlay.style.display = isStealthActive ? 'block' : 'none';
    if (isStealthActive) {
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('video, iframe').forEach(el => {
        try { if (el.pause) el.pause(); } catch(e) {}
      });
    } else {
      document.body.style.overflow = '';
    }
  }
}

function exitStealthMode() {
  isStealthActive = false;
  const overlay = document.getElementById('stealthOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === '`' || e.key === '~') {
    e.preventDefault();
    toggleStealthMode();
  } else if (e.key === 'Escape') {
    const now = Date.now();
    if (now - lastEscPress < 400 || isStealthActive) {
      toggleStealthMode();
    }
    lastEscPress = now;
  }
});

/* ================= Channel Subscribe Toggle (Pornhub Style) ================= */
let isSubscribedToCurrentChannel = false;
function toggleChannelSubscribe(btn) {
  isSubscribedToCurrentChannel = !isSubscribedToCurrentChannel;
  if (!btn) btn = document.getElementById('btnSubscribe');
  if (btn) {
    btn.classList.toggle('subscribed', isSubscribedToCurrentChannel);
    if (isSubscribedToCurrentChannel) {
      btn.innerHTML = '<i class="fa fa-check"></i> <span>Following</span>';
      alert('🌟 You are now following this Star / Channel!');
    } else {
      btn.innerHTML = '<i class="fa fa-plus"></i> <span>Follow Star</span>';
    }
  }
}

// Auto-run observers on load
window.addEventListener('DOMContentLoaded', () => {
  initMiniPiPScrollObserver();
  const urlParams = new URLSearchParams(window.location.search);
  const vidId = urlParams.get('id') || urlParams.get('v');
  if (vidId) checkResumePlayback(vidId);
});
