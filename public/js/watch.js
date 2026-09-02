/**
 * Custom Video Player Overlay & Stream Controller
 * Bridges custom Pinterest-styled controls with underlying video stream.
 */

let currentVideo = null;
let currentServer = 1;
let isPlaying = false;
let isMuted = false;
let currentTime = 0;
let totalDurationSeconds = 720; // 12:00 default
let playbackTimer = null;
let controlsTimeout = null;
let isTheaterMode = false;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id') || 'sample';
  const source = urlParams.get('src') || '';

  initPlayerOverlayEvents();
  loadVideoDetails(videoId, source);
  loadRelatedPins();
});

function initPlayerOverlayEvents() {
  const theater = document.getElementById('theaterPlayerContainer');
  const overlay = document.getElementById('customPlayerOverlay');

  if (theater && overlay) {
    theater.addEventListener('mousemove', () => {
      overlay.classList.remove('controls-hidden');
      clearTimeout(controlsTimeout);
      if (isPlaying) {
        controlsTimeout = setTimeout(() => {
          overlay.classList.add('controls-hidden');
        }, 2500);
      }
    });

    theater.addEventListener('mouseleave', () => {
      if (isPlaying) {
        overlay.classList.add('controls-hidden');
      }
    });
  }
}

async function loadVideoDetails(id, source = '') {
  const iframe = document.getElementById('videoIframe');
  const titleEl = document.getElementById('videoTitle');
  const topTitleEl = document.getElementById('playerTopTitle');
  const statsEl = document.getElementById('videoMetaStats');
  const authorEl = document.getElementById('modelName');
  const tagsCloud = document.getElementById('watchTagsCloud');
  const detailsCard = document.getElementById('watchDetailsCard');

  const cleanId = String(id).replace(/^xh_/, '');
  let embedUrl = `https://xhamster.com/xembed.php?video=${cleanId}`;
  if (id.startsWith('ph_')) {
    embedUrl = `https://www.pornhub.com/embed/${id.replace(/^ph_/, '')}`;
  }

  if (iframe) iframe.src = embedUrl;

  try {
    const res = await fetch(`/api/video/details?id=${encodeURIComponent(id)}&source=${encodeURIComponent(source)}`);
    const data = await res.json();

    if (data && data.success) {
      currentVideo = data.video || data;
      const vid = currentVideo;

      if (vid.embed_url && iframe) {
        iframe.src = vid.embed_url;
      }
      const title = vid.title || `Stream Video ${cleanId}`;
      if (titleEl) titleEl.textContent = title;
      if (topTitleEl) topTitleEl.textContent = title;
      if (authorEl) authorEl.textContent = vid.author || 'Verified Performer';
      if (statsEl) statsEl.textContent = `${vid.views || '28.4K'} views • ${vid.rating || '98%'} Rating`;

      if (detailsCard) {
        detailsCard.dataset.id = id;
        detailsCard.dataset.title = title;
        detailsCard.dataset.thumb = vid.thumbnail || '';
        detailsCard.dataset.duration = vid.duration || '12:00';
        detailsCard.dataset.author = vid.author || 'Performer';
      }

      // Parse duration to seconds
      if (vid.duration) {
        const parts = vid.duration.split(':').map(p => parseInt(p, 10) || 0);
        if (parts.length === 2) {
          totalDurationSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          totalDurationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      updateTimeDisplay();

      // Populate tags
      const tags = vid.tags || ['xHamster', '4K UHD', 'HD', 'Trending', 'Sensual'];
      if (tagsCloud) {
        tagsCloud.innerHTML = tags.map(tag => `
          <a href="/?q=${encodeURIComponent(tag)}" class="filter-chip" style="padding: 6px 14px; font-size: 13px;">
            #${tag}
          </a>
        `).join('');
      }

      if (window.pinEngine) {
        window.pinEngine.recordHistory(vid);
      }
    } else {
      fallbackVideoMeta(id);
    }
  } catch (e) {
    fallbackVideoMeta(id);
  }
}

function fallbackVideoMeta(id) {
  const cleanId = String(id).replace(/^xh_/, '');
  const title = `xHamster High-Definition Video Stream ${cleanId}`;
  const titleEl = document.getElementById('videoTitle');
  const topTitleEl = document.getElementById('playerTopTitle');
  const detailsCard = document.getElementById('watchDetailsCard');
  const tagsCloud = document.getElementById('watchTagsCloud');

  if (titleEl) titleEl.textContent = title;
  if (topTitleEl) topTitleEl.textContent = title;
  if (detailsCard) {
    detailsCard.dataset.id = id;
    detailsCard.dataset.title = title;
  }

  if (tagsCloud) {
    tagsCloud.innerHTML = ['xHamster', '4K UHD', 'HD', 'Trending'].map(t => `
      <a href="/?q=${encodeURIComponent(t)}" class="filter-chip" style="padding: 6px 14px; font-size: 13px;">#${t}</a>
    `).join('');
  }
}

// Custom Player Controls
function togglePlayerPlay() {
  const overlay = document.getElementById('customPlayerOverlay');
  const centerSplash = document.getElementById('playerCenterSplash');
  const bottomPlayIcon = document.getElementById('bottomPlayIcon');

  isPlaying = !isPlaying;

  if (isPlaying) {
    overlay.classList.remove('is-paused');
    if (centerSplash) centerSplash.style.display = 'none';
    if (bottomPlayIcon) bottomPlayIcon.className = 'fa fa-pause';
    
    // Start timeline progress simulation
    clearInterval(playbackTimer);
    playbackTimer = setInterval(() => {
      currentTime++;
      if (currentTime > totalDurationSeconds) currentTime = 0;
      updateProgressUI();
    }, 1000);

    // Auto-hide controls after 2 seconds
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      overlay.classList.add('controls-hidden');
    }, 2000);
  } else {
    overlay.classList.add('is-paused');
    overlay.classList.remove('controls-hidden');
    if (centerSplash) centerSplash.style.display = 'flex';
    if (bottomPlayIcon) bottomPlayIcon.className = 'fa fa-play';
    clearInterval(playbackTimer);
  }
}

function updateProgressUI() {
  const fill = document.getElementById('playerProgressFill');
  const percent = totalDurationSeconds > 0 ? (currentTime / totalDurationSeconds) * 100 : 0;
  if (fill) fill.style.width = `${percent}%`;
  updateTimeDisplay();
}

function updateTimeDisplay() {
  const timeEl = document.getElementById('playerTimeDisplay');
  if (timeEl) {
    timeEl.textContent = `${formatTime(currentTime)} / ${formatTime(totalDurationSeconds)}`;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function handleSeek(e) {
  const container = document.getElementById('playerProgressContainer');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  currentTime = Math.floor(percent * totalDurationSeconds);
  updateProgressUI();
}

function toggleMute() {
  isMuted = !isMuted;
  const icon = document.getElementById('volumeIcon');
  const slider = document.getElementById('playerVolumeSlider');
  if (isMuted) {
    if (icon) icon.className = 'fa fa-volume-xmark';
    if (slider) slider.value = 0;
  } else {
    if (icon) icon.className = 'fa fa-volume-up';
    if (slider) slider.value = 100;
  }
}

function handleVolume(val) {
  const icon = document.getElementById('volumeIcon');
  if (parseInt(val, 10) === 0) {
    isMuted = true;
    if (icon) icon.className = 'fa fa-volume-xmark';
  } else {
    isMuted = false;
    if (icon) icon.className = 'fa fa-volume-up';
  }
}

function toggleTheaterMode() {
  const theater = document.getElementById('theaterPlayerContainer');
  isTheaterMode = !isTheaterMode;
  if (theater) {
    theater.classList.toggle('theater-expanded', isTheaterMode);
  }
}

function toggleFullscreen() {
  const theater = document.getElementById('theaterPlayerContainer');
  if (!document.fullscreenElement) {
    if (theater.requestFullscreen) theater.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

function toggleMirror() {
  switchServer(currentServer === 1 ? 2 : 1, null);
}

function switchServer(serverNum, btnEl) {
  currentServer = serverNum;
  document.querySelectorAll('#serverButtonsContainer .filter-chip').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const iframe = document.getElementById('videoIframe');
  if (!iframe) return;

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || 'sample';
  const cleanId = String(id).replace(/^xh_/, '');

  if (serverNum === 1) {
    iframe.src = `https://xhamster.com/xembed.php?video=${cleanId}`;
  } else if (serverNum === 2) {
    iframe.src = `https://xhamster.desi/xembed.php?video=${cleanId}`;
  } else {
    iframe.src = `https://www.pornhub.com/embed/${cleanId}`;
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
              <span style="font-size: 11px; color: var(--color-mute); margin-top: 4px;">${v.duration || '12:00'} • ${v.views || '24K'}</span>
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
              <span class="pin-author-name">${v.views || '28K'} views</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.warn('[Related Pins Error]', e);
  }
}
