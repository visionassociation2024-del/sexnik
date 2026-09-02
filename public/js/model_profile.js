/**
 * Performer Individual Profile Page Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || 'angela-white';
  const name = urlParams.get('name') || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  document.title = `${name} — Performer Profile & Videos | Wi9ayah Pro`;

  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = name;

  loadPerformerFeed(name);
});

async function loadPerformerFeed(performerName) {
  const grid = document.getElementById('performerVideosGrid');
  const loading = document.getElementById('modelVideosLoading');

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(performerName)}&page=1`);
    const data = await res.json();
    const videos = data.videos || [];

    if (videos.length > 0) {
      grid.innerHTML = videos.map(v => `
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
              <span class="pin-author-name">${v.views || '24K'} views</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #ffffff; border-radius: 16px;">
          <p style="color: #62625b; font-size: 16px;">No video pins found for this performer yet.</p>
        </div>
      `;
    }
  } catch (e) {
    console.error('[Performer Feed Error]', e);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function shareProfile() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (window.pinEngine) window.pinEngine.showToast('Profile link copied to clipboard! 📋', 'success');
    });
  }
}
