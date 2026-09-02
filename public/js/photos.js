/**
 * Photography & GIF Masonry Engine (100% Real Star Photos & Animated GIFs)
 */

let allPhotos = [];
let currentPhotoFilter = 'all';
let currentActiveLightbox = null;

const CURATED_SAMPLE_PHOTOS = [
  { id: 'p1', title: 'Mia Khalifa Glamour Portrait 4K', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Fl/s7/irh2fr8s7Fl/129764-mia-khalifa-nude_880x660.jpg'), aspect: '3/4', author: 'Mia Khalifa', type: 'models' },
  { id: 'p2', title: 'Lana Rhoades Bedroom Shoot', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/LT/T2/JYYrTpQT2LT/458843-lana-rhoades-enjoying-an-uncut-cock_880x660.jpg'), aspect: '2/3', author: 'Lana Rhoades', type: 'models' },
  { id: 'p3', title: 'Riley Reid Sensual Villa Shoot', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/wg/Ey/Ul9CvSuEywg/498125-riley-reid-showing-her-asshole_880x660.jpg'), aspect: '1/1', author: 'Riley Reid', type: '4k' },
  { id: 'p4', title: 'Eva Elfie Blonde Tease Live GIF', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', aspect: '4/5', author: 'Eva Elfie', type: 'gifs' },
  { id: 'p5', title: 'Abella Danger Poolside Tease GIF', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', aspect: '3/4', author: 'Abella Danger', type: 'gifs' },
  { id: 'p6', title: 'Angela White Luxury Studio 4K', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vg/8Y/XQ0Pw508YVg/900205-bbc-queen-nude_880x660.jpg'), aspect: '1/1', author: 'Angela White', type: '4k' },
  { id: 'p7', title: 'Sweetie Fox Viral Cosplay Shoot', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/i8/4u/eE7a4s34ui8/502120-sweetie-fox-nude_880x660.jpg'), aspect: '2/3', author: 'Sweetie Fox', type: 'models' },
  { id: 'p8', title: 'Kendra Lust Queen MILF Portrait', url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Xk/o9/4b5tNmqo9Xk/486265-kendra-lust-nude_880x660.jpg'), aspect: '4/5', author: 'Kendra Lust', type: 'models' }
];

document.addEventListener('DOMContentLoaded', () => {
  loadPhotosFeed();
});

async function loadPhotosFeed() {
  const loading = document.getElementById('photosLoading');

  try {
    const res = await fetch('/api/photos');
    const data = await res.json();
    if (data && data.items && data.items.length > 0) {
      allPhotos = data.items.map(item => ({
        id: item.id,
        title: item.title,
        url: item.image_url || item.thumbnail || item.url,
        aspect: '4/5',
        author: item.tags ? item.tags[0] : 'Verified Star',
        type: item.type || (item.url && item.url.includes('.gif') ? 'gifs' : 'models')
      }));
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
        <img src="${p.url}" alt="${escapeHtml(p.title)}" class="pin-image" loading="lazy" onerror="this.src='/images/logo.png'">
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

function filterPhotos(type, btn) {
  currentPhotoFilter = type;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const filtered = type === 'all' 
    ? allPhotos 
    : allPhotos.filter(p => p.type === type || (type === '4k' && (p.title.includes('4K') || p.title.includes('HD'))));

  renderPhotos(filtered);
}

function openPhotoLightbox(imgUrl, title, id) {
  currentActiveLightbox = { imgUrl, title, id };
  const modal = document.getElementById('photoLightboxModal');
  const img = document.getElementById('lightboxImage');
  const titleEl = document.getElementById('lightboxTitle');

  if (modal && img && titleEl) {
    img.src = imgUrl;
    titleEl.textContent = title;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closePhotoLightbox() {
  const modal = document.getElementById('photoLightboxModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function saveCurrentLightboxPin() {
  if (currentActiveLightbox && window.pinEngine) {
    window.pinEngine.toggleSavePin({
      id: currentActiveLightbox.id,
      title: currentActiveLightbox.title,
      thumbnail: currentActiveLightbox.imgUrl,
      duration: 'PHOTO',
      author: 'Gallery'
    });
  }
}

function shareCurrentPhoto() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (window.pinEngine) window.pinEngine.showToast('Photo link copied to clipboard! 📋', 'success');
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
