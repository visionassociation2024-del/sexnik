document.addEventListener('DOMContentLoaded', () => {
  initWatchPage();
});

function initWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'sample';
  const title = params.get('title') || 'niksex HD Video Stream';
  let embedUrl = params.get('embed') || '';
  const views = params.get('views') || '18,400';
  const duration = params.get('duration') || '12:00';
  const rating = params.get('rating') || '98%';
  const tagsParam = params.get('tags') || 'niksex,Ultra HD,Popular,Arabic';

  // If no direct embed param provided, build fallback embed URL
  if (!embedUrl) {
    if (id.startsWith('ph')) {
      embedUrl = `https://www.pornhub.com/embed/${id.replace('ph', '')}`;
    } else {
      embedUrl = `https://www.eporner.com/embed/${id}/`;
    }
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

  // Load Recommended Sidebar Videos
  loadRelatedVideos();
}

async function loadRelatedVideos() {
  const list = document.getElementById('relatedList');
  list.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Loading recommendations...</div>';

  try {
    const res = await fetch('/api/videos?category=trending&page=1');
    const data = await res.json();

    if (data.success && data.videos && data.videos.length > 0) {
      list.innerHTML = '';
      data.videos.slice(0, 10).forEach(v => {
        const item = document.createElement('div');
        item.className = 'related-item';
        item.onclick = () => {
          window.location.href = `/watch.html?id=${encodeURIComponent(v.id)}&title=${encodeURIComponent(v.title)}&embed=${encodeURIComponent(v.embed_url || v.video_url || '')}&thumb=${encodeURIComponent(v.thumbnail || '')}&duration=${encodeURIComponent(v.duration || '')}&views=${encodeURIComponent(v.views || '')}&rating=${encodeURIComponent(v.rating || '')}&tags=${encodeURIComponent((v.tags || []).join(','))}`;
        };

        item.innerHTML = `
          <div class="related-thumb">
            <img src="${v.thumbnail || '/images/logo.png'}" onerror="this.src='/images/logo.png'">
            <span class="badge-duration">${v.duration || '10:00'}</span>
          </div>
          <div class="related-info">
            <h4 class="related-title" title="${v.title}">${v.title}</h4>
            <div class="related-meta">
              <span><i class="fa fa-eye"></i> ${v.views || '12K'}</span>
              <span style="color: #10b981;"><i class="fa fa-thumbs-up"></i> ${v.rating || '96%'}</span>
            </div>
          </div>
        `;
        list.appendChild(item);
      });
    }
  } catch (e) {
    list.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">More videos on home page.</div>';
  }
}

// Interactive Actions
function handleVote(type) {
  alert(type === 'like' ? '❤️ Thanks for liking this video on niksex!' : 'Feedback submitted.');
}

function copyEmbedCode() {
  const iframeSrc = document.getElementById('cinemaIframe').src;
  const embedCode = `<iframe src="${iframeSrc}" width="100%" height="480" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
  navigator.clipboard.writeText(embedCode);
  alert('✅ Embed code copied to clipboard!');
}

function shareVideo() {
  if (navigator.share) {
    navigator.share({
      title: document.getElementById('watchTitle').innerText,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('🔗 Video link copied to clipboard!');
  }
}

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
