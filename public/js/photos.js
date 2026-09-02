/**
 * Photography & GIF Masonry Engine
 */

let allPhotos = [];
let currentPhotoFilter = 'all';
let currentActiveLightbox = null;

const CURATED_SAMPLE_PHOTOS = [
  { id: 'p1', title: 'Sensual Portrait Photography', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', aspect: '3/4', author: 'Eva Bloom', type: 'models' },
  { id: 'p2', title: 'Golden Hour Aesthetic', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', aspect: '2/3', author: 'Studio X', type: 'art' },
  { id: 'p3', title: 'Editorial Glamour Shot', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80', aspect: '1/1', author: 'Max Vision', type: 'models' },
  { id: 'p4', title: 'Cinematic Visual Set', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80', aspect: '4/5', author: 'Lana R', type: '4k' },
  { id: 'p5', title: 'Monochrome Intimacy', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80', aspect: '3/4', author: 'Noir Art', type: 'art' },
  { id: 'p6', title: 'Animated GIF Motion Loop', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', aspect: '1/1', author: 'GIF Hub', type: 'gifs' },
  { id: 'p7', title: 'Sensual Summer Glow', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', aspect: '2/3', author: 'Kendra L', type: 'models' },
  { id: 'p8', title: 'High-Res Studio Production', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', aspect: '4/5', author: 'Pro 4K', type: '4k' }
];

document.addEventListener('DOMContentLoaded', () => {
  loadPhotosFeed();
});

async function loadPhotosFeed() {
  const loading = document.getElementById('photosLoading');

  try {
    const res = await fetch('/api/photos');
    const data = await res.json();
    if (data && data.photos && data.photos.length > 0) {
      allPhotos = data.photos;
    } else {
      allPhotos = CURATED_SAMPLE_PHOTOS;
    }
  } catch (e) {
    allPhotos = CURATED_SAMPLE_PHOTOS;
  } finally {
    if (loading) loading.style.display = 'none';
    renderPhotos(allPhotos);
  }
}

function renderPhotos(photosList) {
  const grid = document.getElementById('photosMasonryGrid');
  if (!grid) return;

  grid.innerHTML = photosList.map(p => `
    <div class="pin-card" onclick="openPhotoLightbox('${p.url}', '${escapeHtml(p.title)}', '${p.id}')">
      <div class="pin-media-wrapper">
        <img src="${p.url}" alt="${escapeHtml(p.title)}" class="pin-image" loading="lazy">
        <div class="pin-overlay-scrim"></div>
        <button class="pin-save-cta js-save-pin" data-id="${p.id}" data-title="${escapeHtml(p.title)}" data-thumb="${p.url}" title="Save Pin">Save</button>
        <div class="pin-quick-actions">
          <button class="pin-action-btn" title="View Fullscreen"><i class="fa fa-expand"></i></button>
        </div>
      </div>
      <div class="pin-meta">
        <h3 class="pin-title">${escapeHtml(p.title)}</h3>
        <div class="pin-author">
          <span class="pin-author-name">${p.author || 'Wi9ayah Gallery'}</span>
        </div>
      </div>
    </div>
  `).join('');

  if (window.pinEngine) {
    window.pinEngine.observeImages(grid);
  }
}

function filterPhotoTab(type, btn) {
  currentPhotoFilter = type;
  document.querySelectorAll('.filter-chips-row .filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (type === 'all') {
    renderPhotos(allPhotos);
  } else {
    const filtered = allPhotos.filter(p => p.type === type || (p.title && p.title.toLowerCase().includes(type)));
    renderPhotos(filtered.length > 0 ? filtered : allPhotos);
  }
}

function filterPhotosByQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderPhotos(allPhotos);
    return;
  }
  const filtered = allPhotos.filter(p => p.title && p.title.toLowerCase().includes(q));
  renderPhotos(filtered);
}

function openPhotoLightbox(url, title, id) {
  currentActiveLightbox = { url, title, id };
  const modal = document.getElementById('photoLightboxModal');
  const img = document.getElementById('lightboxImage');
  const titleEl = document.getElementById('lightboxTitle');
  const dlBtn = document.getElementById('lightboxDownloadBtn');

  if (img) img.src = url;
  if (titleEl) titleEl.textContent = title;
  if (dlBtn) dlBtn.href = url;
  if (modal) modal.classList.add('active');
}

function closeLightbox(e) {
  if (e.target.id === 'photoLightboxModal') {
    closeLightboxDirect();
  }
}

function closeLightboxDirect() {
  const modal = document.getElementById('photoLightboxModal');
  if (modal) modal.classList.remove('active');
}

function saveCurrentLightboxPin() {
  if (!currentActiveLightbox || !window.pinEngine) return;
  window.pinEngine.toggleSavePin({
    id: currentActiveLightbox.id,
    title: currentActiveLightbox.title,
    thumbnail: currentActiveLightbox.url
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
