/**
 * Watch Page Player & Related Feed Engine
 */

let currentVideo = null;
let currentServer = 1;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id') || 'sample';
  const source = urlParams.get('src') || '';

  loadVideoDetails(videoId, source);
  loadRelatedPins();
});

async function loadVideoDetails(id, source = '') {
  const iframe = document.getElementById('videoIframe');
  const titleEl = document.getElementById('videoTitle');
  const statsEl = document.getElementById('videoMetaStats');
  const authorEl = document.getElementById('modelName');
  const tagsCloud = document.getElementById('watchTagsCloud');
  const detailsCard = document.getElementById('watchDetailsCard');

  // Set default embed URL based on ID
  let embedUrl = `https://www.eporner.com/embed/${id}/`;
  if (id.startsWith('ph_') || id.startsWith('ph')) {
    embedUrl = `https://www.pornhub.com/embed/${id.replace(/^ph_?/, '')}`;
  } else if (id.startsWith('xh_') || id.startsWith('xh')) {
    embedUrl = `https://xhamster.com/xembed.php?video=${id.replace(/^xh_?/, '')}`;
  }

  if (iframe) iframe.src = embedUrl;

  try {
    const res = await fetch(`/api/video/details?id=${encodeURIComponent(id)}&source=${encodeURIComponent(source)}`);
    const data = await res.json();

    if (data && data.success && data.video) {
      currentVideo = data.video;
      if (data.video.embed_url && iframe) {
        iframe.src = data.video.embed_url;
      }
      if (titleEl) titleEl.textContent = data.video.title || 'HD Video Stream';
      if (authorEl) authorEl.textContent = data.video.author || data.video.performer || 'Featured Performer';
      if (statsEl) statsEl.textContent = `${data.video.views || '18.4K'} views • ${data.video.rating || '97%'} Rating`;

      if (detailsCard) {
        detailsCard.dataset.id = data.video.id || id;
        detailsCard.dataset.title = data.video.title;
        detailsCard.dataset.thumb = data.video.thumbnail || '';
        detailsCard.dataset.duration = data.video.duration || '12:00';
        detailsCard.dataset.author = data.video.author || 'Performer';
      }

      // Populate tags
      const tags = data.video.tags || ['HD', 'Trending', '4K UHD', 'Sensual', 'Verified'];
      if (tagsCloud) {
        tagsCloud.innerHTML = tags.map(tag => `
          <a href="/?q=${encodeURIComponent(tag)}" class="filter-chip" style="padding: 6px 14px; font-size: 13px;">
            #${tag}
          </a>
        `).join('');
      }

      if (window.pinEngine) {
        window.pinEngine.recordHistory(data.video);
      }
    } else {
      fallbackVideoMeta(id);
    }
  } catch (e) {
    fallbackVideoMeta(id);
  }
}

function fallbackVideoMeta(id) {
  const titleEl = document.getElementById('videoTitle');
  const detailsCard = document.getElementById('watchDetailsCard');
  const tagsCloud = document.getElementById('watchTagsCloud');

  if (titleEl) titleEl.textContent = 'High Definition Premium Video Stream';
  if (detailsCard) {
    detailsCard.dataset.id = id;
    detailsCard.dataset.title = 'High Definition Video Stream';
  }

  if (tagsCloud) {
    tagsCloud.innerHTML = ['Trending', '4K', 'Verified', 'HD', 'Amateur'].map(t => `
      <a href="/?q=${encodeURIComponent(t)}" class="filter-chip" style="padding: 6px 14px; font-size: 13px;">#${t}</a>
    `).join('');
  }
}

function switchServer(serverNum, btnEl) {
  currentServer = serverNum;
  document.querySelectorAll('#serverButtonsContainer .filter-chip').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const iframe = document.getElementById('videoIframe');
  if (!iframe) return;

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || 'sample';

  if (serverNum === 1) {
    iframe.src = `https://www.eporner.com/embed/${id}/`;
  } else if (serverNum === 2) {
    iframe.src = `https://www.pornhub.com/embed/${id.replace(/^ph_?/, '')}`;
  } else {
    iframe.src = `https://xhamster.com/xembed.php?video=${id.replace(/^xh_?/, '')}`;
  }

  if (window.pinEngine) {
    window.pinEngine.showToast(`Switched to Server Mirror ${serverNum}`, 'info');
  }
}

function shareCurrentPin() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (window.pinEngine) window.pinEngine.showToast('Link copied to clipboard! 📋', 'success');
    });
  }
}

function toggleLike(btn) {
  btn.style.color = '#e60023';
  if (window.pinEngine) window.pinEngine.showToast('Thank you for your feedback! 👍', 'success');
}

async function loadRelatedPins() {
  const sidebarContainer = document.getElementById('sidebarRelatedPins');
  const bottomGrid = document.getElementById('watchRelatedGrid');

  try {
    const res = await fetch('/api/videos?category=trending&page=1');
    const data = await res.json();
    const videos = data.videos || [];

    if (sidebarContainer && videos.length > 0) {
      const topSidebar = videos.slice(0, 5);
      sidebarContainer.innerHTML = topSidebar.map(v => `
        <div class="pin-card" style="margin-bottom: 0;" onclick="window.location.href='/watch.html?id=${v.id}'">
          <div style="display: flex; gap: 12px; background: var(--color-canvas); padding: 8px; border-radius: var(--radius-md);">
            <img src="${v.thumbnail}" style="width: 110px; height: 75px; object-fit: cover; border-radius: var(--radius-sm);" alt="${v.title}">
            <div style="display: flex; flex-direction: column; justify-content: center;">
              <h4 style="font-size: 13px; font-weight: 700; color: var(--color-ink); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${v.title}</h4>
              <span style="font-size: 11px; color: var(--color-mute); margin-top: 4px;">${v.duration || '10:00'} • ${v.views || '12K'}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (bottomGrid && videos.length > 5) {
      const remaining = videos.slice(5);
      bottomGrid.innerHTML = remaining.map(v => `
        <div class="pin-card" data-id="${v.id}" data-title="${v.title}" data-thumb="${v.thumbnail}" data-duration="${v.duration}" onclick="window.location.href='/watch.html?id=${v.id}'">
          <div class="pin-media-wrapper">
            <img src="${v.thumbnail}" alt="${v.title}" class="pin-image" loading="lazy">
            <div class="pin-overlay-scrim"></div>
            <button class="pin-save-cta js-save-pin" data-id="${v.id}" title="Save Pin">Save</button>
            <span class="pin-overlay-pill pin-pill-duration">${v.duration || 'HD'}</span>
          </div>
          <div class="pin-meta">
            <h3 class="pin-title">${v.title}</h3>
            <div class="pin-author">
              <span class="pin-author-name">${v.views || '15K'} views</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.warn('[Related Pins Error]', e);
  }
}
