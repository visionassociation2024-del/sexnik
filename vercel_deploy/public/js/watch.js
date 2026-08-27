// Anti-External Navigation & Anti-Popup Security Guard
(function initAntiRedirectShield() {
  window.open = function(url, target, features) {
    console.warn('[Anti-Redirect] Blocked window.open popup attempt:', url);
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
          console.warn('[Anti-Redirect] Blocked external link click:', link.href);
          return false;
        }
      } catch (err) {
        e.preventDefault();
      }
    }
  }, true);
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

// Load Recommended Sidebar Videos
async function loadRelatedVideos() {
  const list = document.getElementById('relatedList');
  list.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Loading recommendations...</div>';

  try {
    const res = await fetch('/api/videos?category=trending&page=1');
    const data = await res.json();

    if (data.success && data.videos && data.videos.length > 0) {
      list.innerHTML = '';
      data.videos.slice(0, 12).forEach(v => {
        const item = document.createElement('div');
        item.className = 'related-item';
        item.onclick = () => {
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
        list.appendChild(item);
      });
    } else {
      list.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">No recommended videos found.</div>';
    }
  } catch (err) {
    list.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Failed to load recommendations.</div>';
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
