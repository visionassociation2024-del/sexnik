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

document.addEventListener('DOMContentLoaded', () => {
  initWatchPage();
});

function initWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'sample';
  const title = params.get('title') || 'niksex HD Video Stream';
  let embedUrl = params.get('embed') || '';
  const thumb = params.get('thumb') || '/images/logo.png';
  const views = params.get('views') || '18,400';
  const duration = params.get('duration') || '12:00';
  const rating = params.get('rating') || '98%';
  const tagsParam = params.get('tags') || 'niksex,Ultra HD,Popular,Arabic';

  currentVideoObj = {
    id,
    title,
    embed_url: embedUrl,
    video_url: embedUrl,
    thumbnail: thumb,
    duration,
    views,
    rating,
    tags: tagsParam.split(',')
  };

  // If no direct embed param provided, build fallback embed URL
  if (!embedUrl) {
    if (id.startsWith('ph')) {
      embedUrl = `https://www.pornhub.com/embed/${id.replace('ph', '')}`;
    } else {
      embedUrl = `https://www.eporner.com/embed/${id}/`;
    }
    currentVideoObj.embed_url = embedUrl;
  }

  // Inject Autoplay and Unmuted Sound parameters
  const separator = embedUrl.includes('?') ? '&' : '?';
  if (!embedUrl.includes('autoplay=')) {
    embedUrl += `${separator}autoplay=1&muted=0&sound=1&volume=100`;
  }

  // Update Page Elements
  document.title = `${title} - niksex`;
  document.getElementById('watchTitle').innerText = title;
  document.getElementById('watchViews').innerText = views;
  document.getElementById('watchDuration').innerText = duration;
  document.getElementById('watchRating').innerText = rating;
  document.getElementById('cinemaIframe').src = embedUrl;

  // Render Tags
  const tagsContainer = document.getElementById('watchTags');
  tagsContainer.innerHTML = '';
  const tags = tagsParam.split(',');
  tags.forEach(t => {
    const span = document.createElement('a');
    span.href = `/?q=${encodeURIComponent(t.trim())}`;
    span.className = 'cat-btn';
    span.style.padding = '4px 12px';
    span.style.fontSize = '12px';
    span.innerText = `#${t.trim()}`;
    tagsContainer.appendChild(span);
  });

  // Check Favorite State
  checkFavoriteState();

  // Save to Watch History & Preferences
  saveToHistoryAndPrefs(currentVideoObj);

  // Inject Schema.org VideoObject for SEO
  injectVideoSchema(currentVideoObj);

  // Load Recommended Sidebar Videos
  loadRelatedVideos();
}

// Favorite Bookmarking Engine (LocalStorage)
function checkFavoriteState() {
  if (!currentVideoObj || !currentVideoObj.id) return;
  const favorites = getLocalFavorites();
  const isFav = favorites.some(f => f.id === currentVideoObj.id);
  const btn = document.getElementById('btnFavorite');
  const txt = document.getElementById('favText');

  if (isFav) {
    btn.classList.add('favorite-active');
    txt.innerText = 'Saved to Favorites';
  } else {
    btn.classList.remove('favorite-active');
    txt.innerText = 'Favorite';
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
    alert('⭐ Saved to Favorites! Access it anytime from the Favorites tab.');
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
  
  if (sidebarList) sidebarList.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Loading recommendations...</div>';
  if (similarGrid) {
    similarGrid.innerHTML = `
      <div class="video-card" style="opacity: 0.5;"><div class="thumb-wrap" style="background: #1e1e2d;"></div></div>
      <div class="video-card" style="opacity: 0.5;"><div class="thumb-wrap" style="background: #1e1e2d;"></div></div>
      <div class="video-card" style="opacity: 0.5;"><div class="thumb-wrap" style="background: #1e1e2d;"></div></div>
      <div class="video-card" style="opacity: 0.5;"><div class="thumb-wrap" style="background: #1e1e2d;"></div></div>
    `;
  }

  // Determine most relevant query based on current video tags or title
  let relevantQuery = 'trending';
  if (currentVideoObj && currentVideoObj.tags && currentVideoObj.tags.length > 0) {
    const validTags = currentVideoObj.tags.filter(t => t && t.trim() && !['niksex', 'hd', 'popular'].includes(t.toLowerCase().trim()));
    if (validTags.length > 0) {
      relevantQuery = validTags[0].trim();
    }
  }

  if (relevantQuery === 'trending' && currentVideoObj && currentVideoObj.title) {
    const words = currentVideoObj.title.split(' ').filter(w => w.length > 3 && !['this', 'make', 'with', 'video'].includes(w.toLowerCase()));
    if (words.length > 0) relevantQuery = words[0];
  }

  const tagLabel = document.getElementById('similarTagLabel');
  if (tagLabel) tagLabel.innerHTML = `Based on: <strong style="color: var(--accent-pink);">#${relevantQuery}</strong>`;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(relevantQuery)}&page=1`);
    const data = await res.json();
    let videos = (data.success && data.videos && data.videos.length > 0) ? data.videos : [];

    // If search didn't return enough videos, fallback to trending
    if (videos.length < 8) {
      const fallbackRes = await fetch('/api/videos?category=trending&page=1');
      const fallbackData = await fallbackRes.json();
      if (fallbackData.success && fallbackData.videos) {
        videos = videos.concat(fallbackData.videos);
      }
    }

    // Filter out the currently playing video
    const filteredVideos = videos.filter(v => v.id !== (currentVideoObj ? currentVideoObj.id : ''));

    // 1. Populate Similar Videos Grid Below the Player with In-Feed Ad Insertion
    if (similarGrid) {
      if (filteredVideos.length === 0) {
        similarGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No similar videos found.</div>';
      } else {
        similarGrid.innerHTML = '';
        filteredVideos.slice(0, 16).forEach((v, idx) => {
          const card = document.createElement('div');
          card.className = 'video-card animate-fade';
          card.onclick = () => {
            // Intensive under-click popunder
            const lastPop = parseInt(sessionStorage.getItem('nx_watch_pop_time') || '0', 10);
            if (Date.now() - lastPop > 45 * 1000) {
              sessionStorage.setItem('nx_watch_pop_time', Date.now().toString());
              try { window.open(SMARTLINK_URL, '_blank'); } catch(e) {}
            }

            const params = new URLSearchParams({
              id: v.id || '',
              title: v.title || 'niksex Video Stream',
              embed: v.embed_url || v.video_url || '',
              thumb: v.thumbnail || '',
              duration: v.duration || '10:00',
              views: v.views || '15K',
              rating: v.rating || '98%',
              tags: (v.tags || ['niksex', 'HD']).join(',')
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
              <h3 class="video-title" style="font-size: 12px; height: 32px;" title="${v.title}">${v.title}</h3>
              <div class="video-meta" style="font-size: 11px;">
                <span><i class="fa fa-eye"></i> ${v.views || '15K'}</span>
                <span class="meta-rating"><i class="fa fa-thumbs-up"></i> ${v.rating || '98%'}</span>
              </div>
            </div>
          `;
          similarGrid.appendChild(card);

          // In-Feed Ad in Similar Videos every 4 videos!
          if ((idx + 1) % 4 === 0) {
            const adCard = document.createElement('div');
            adCard.className = 'in-grid-ad-card animate-fade';
            adCard.innerHTML = `
              <div class="ad-badge">SPONSORED / إعلان</div>
              <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="promo-smartlink-card" style="width: 100%;">
                <span class="promo-badge-hot"><i class="fa fa-fire"></i> PRIVATE HD SHOW</span>
                <h4 class="promo-title">🔥 Direct Live HD Video Stream</h4>
                <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">Uncensored 4K Instant Access</p>
                <span class="promo-btn-action"><i class="fa fa-play-circle"></i> Watch Live</span>
              </a>
            `;
            similarGrid.appendChild(adCard);
          }
        });
      }
    }

    // 2. Populate Right Column Sidebar List with In-Feed Ad Injection
    if (sidebarList) {
      if (filteredVideos.length === 0) {
        sidebarList.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">No recommendations.</div>';
      } else {
        sidebarList.innerHTML = '';
        filteredVideos.slice(0, 10).forEach((v, idx) => {
          const item = document.createElement('div');
          item.className = 'related-item';
          item.onclick = () => {
            const lastPop = parseInt(sessionStorage.getItem('nx_watch_pop_time') || '0', 10);
            if (Date.now() - lastPop > 45 * 1000) {
              sessionStorage.setItem('nx_watch_pop_time', Date.now().toString());
              try { window.open(SMARTLINK_URL, '_blank'); } catch(e) {}
            }

            const params = new URLSearchParams({
              id: v.id || '',
              title: v.title || 'niksex Video Stream',
              embed: v.embed_url || v.video_url || '',
              thumb: v.thumbnail || '',
              duration: v.duration || '10:00',
              views: v.views || '15K',
              rating: v.rating || '98%',
              tags: (v.tags || ['niksex', 'HD']).join(',')
            });
            window.location.href = `/watch.html?${params.toString()}`;
          };

          item.innerHTML = `
            <div class="related-thumb">
              <img src="${v.thumbnail || '/images/logo.png'}" alt="${v.title}" onerror="this.src='/images/logo.png'">
              <span class="badge-duration" style="bottom: 4px; right: 4px; font-size: 9px;">${v.duration || '10:00'}</span>
            </div>
            <div class="related-info">
              <h4 class="related-title" title="${v.title}">${v.title}</h4>
              <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                <span><i class="fa fa-eye"></i> ${v.views || '12K'}</span>
                <span style="color: #10b981;"><i class="fa fa-thumbs-up"></i> ${v.rating || '97%'}</span>
              </div>
            </div>
          `;
          sidebarList.appendChild(item);

          // In-feed Sidebar Promo every 3 items
          if ((idx + 1) % 3 === 0) {
            const promoDiv = document.createElement('div');
            promoDiv.style.margin = '8px 0';
            promoDiv.innerHTML = `
              <a href="${SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" class="promo-smartlink-card" style="padding: 10px; min-height: 110px;">
                <span class="promo-badge-hot" style="font-size: 9px; padding: 2px 6px; margin-bottom: 4px;"><i class="fa fa-star"></i> RECOMMENDED</span>
                <span style="font-size: 12px; font-weight: 700; color: #fff;">⚡ Download Full Video in 4K</span>
                <span class="promo-btn-action" style="font-size: 10px; padding: 4px 10px; margin-top: 6px;"><i class="fa fa-download"></i> Fast Download</span>
              </a>
            `;
            sidebarList.appendChild(promoDiv);
          }
        });
      }
    }

  } catch (err) {
    if (sidebarList) sidebarList.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Failed to load recommendations.</div>';
    if (similarGrid) similarGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Failed to load similar videos.</div>';
  }
}

// User Actions
function toggleLike(btn) {
  btn.classList.toggle('active');
  const countSpan = document.getElementById('likeCount');
  let count = parseInt(countSpan.innerText.replace(',', ''), 10) || 1240;
  if (btn.classList.contains('active')) {
    count++;
    btn.style.color = '#ff007f';
  } else {
    count--;
    btn.style.color = '#fff';
  }
  countSpan.innerText = count.toLocaleString();
}

function toggleDislike(btn) {
  btn.classList.toggle('active');
  btn.style.color = btn.classList.contains('active') ? '#ef4444' : '#fff';
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href);
  alert('🔗 Watch link copied to clipboard!');
}

function handleSearch(e) {
  if (e.key === 'Enter') {
    executeSearch();
  }
}

function executeSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) {
    window.location.href = `/?q=${encodeURIComponent(q)}`;
  }
}
