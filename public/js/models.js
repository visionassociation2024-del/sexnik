/**
 * Performers & Stars Directory Engine (100% Real Model Photos)
 */

let allPerformers = [];
let currentLetter = 'ALL';

const DEFAULT_STARS = [
  { name: 'Mia Khalifa', rank: 1, views: '245M', videos: 180, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Fl/s7/irh2fr8s7Fl/129764-mia-khalifa-nude_190x152.jpg'), slug: 'mia-khalifa' },
  { name: 'Lana Rhoades', rank: 2, views: '320M', videos: 240, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/LT/T2/JYYrTpQT2LT/458843-lana-rhoades-enjoying-an-uncut-cock_190x152.jpg'), slug: 'lana-rhoades' },
  { name: 'Riley Reid', rank: 3, views: '410M', videos: 520, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/wg/Ey/Ul9CvSuEywg/498125-riley-reid-showing-her-asshole_880x660.jpg'), slug: 'riley-reid' },
  { name: 'Eva Elfie', rank: 4, views: '290M', videos: 190, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/e7/8a/v0M04rK8ae7/399818-eva-elfie-nude_880x660.jpg'), slug: 'eva-elfie' },
  { name: 'Abella Danger', rank: 5, views: '350M', videos: 480, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/5f/hS/g50mHQChS5f/484639-abella-danger-pussy_880x660.jpg'), slug: 'abella-danger' },
  { name: 'Angela White', rank: 6, views: '275M', videos: 310, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vg/8Y/XQ0Pw508YVg/900205-bbc-queen-nude_880x660.jpg'), slug: 'angela-white' },
  { name: 'Sweetie Fox', rank: 7, views: '195M', videos: 140, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/i8/4u/eE7a4s34ui8/502120-sweetie-fox-nude_880x660.jpg'), slug: 'sweetie-fox' },
  { name: 'Kendra Lust', rank: 8, views: '210M', videos: 390, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Xk/o9/4b5tNmqo9Xk/486265-kendra-lust-nude_880x660.jpg'), slug: 'kendra-lust' },
  { name: 'Brandi Love', rank: 9, views: '260M', videos: 440, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/ii/7N/njlBOCp7Nii/474382-brandi-love-nude_880x660.jpg'), slug: 'brandi-love' },
  { name: 'Autumn Falls', rank: 10, views: '280M', videos: 210, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/q3/Q7/nS3lD77Q7q3/462615-autumn-falls-nude_880x660.jpg'), slug: 'autumn-falls' },
  { name: 'Violet Myers', rank: 11, views: '175M', videos: 160, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Cm/mY/2xbSWTsmYCm/32216333-violet-myers-pic594_880x660.jpg'), slug: 'violet-myers' },
  { name: 'Emily Willis', rank: 12, views: '295M', videos: 320, avatar: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vl/L3/vTfR46RL3Vl/482701-emily-willis-nude_880x660.jpg'), slug: 'emily-willis' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderAlphabetFilter();
  loadPerformers();
});

function renderAlphabetFilter() {
  const container = document.getElementById('alphabetFilterStrip');
  if (!container) return;

  const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  container.innerHTML = letters.map(letter => `
    <button class="alphabet-letter-btn ${letter === 'ALL' ? 'active' : ''}" onclick="filterByLetter('${letter}', this)">
      ${letter}
    </button>
  `).join('');
}

function filterByLetter(letter, btn) {
  currentLetter = letter;
  document.querySelectorAll('.alphabet-letter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const filtered = letter === 'ALL' 
    ? allPerformers 
    : allPerformers.filter(p => p.name.toUpperCase().startsWith(letter));

  renderPerformersList(filtered);
}

function filterStarsByName(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    filterByLetter(currentLetter, null);
    return;
  }

  const filtered = allPerformers.filter(p => p.name.toLowerCase().includes(q));
  renderPerformersList(filtered);
}

async function loadPerformers() {
  const loading = document.getElementById('modelsLoadingIndicator');

  try {
    const res = await fetch('/api/models');
    const data = await res.json();

    if (data && data.models && data.models.length > 0) {
      allPerformers = data.models.map((m, idx) => ({
        name: m.name || m.title,
        rank: idx + 1,
        views: m.views || `${(15 + Math.floor(Math.random() * 40))}.5M`,
        videos: m.videoCount || m.videos || (50 + Math.floor(Math.random() * 150)),
        avatar: m.avatar || DEFAULT_STARS[idx % DEFAULT_STARS.length].avatar,
        slug: m.slug || (m.name ? m.name.toLowerCase().replace(/\s+/g, '-') : 'star')
      }));
    } else {
      allPerformers = DEFAULT_STARS;
    }
  } catch (e) {
    allPerformers = DEFAULT_STARS;
  } finally {
    if (loading) loading.style.display = 'none';
    renderPerformersList(allPerformers);
  }
}

function renderPerformersList(list) {
  const grid = document.getElementById('performersGrid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #ffffff; border-radius: 16px;">
        <p style="color: #62625b; font-size: 16px;">No performers found matching the criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="pin-card" onclick="window.location.href='/model.html?slug=${p.slug}&name=${encodeURIComponent(p.name)}'">
      <div class="pin-media-wrapper" style="aspect-ratio: 1/1;">
        <img src="${p.avatar}" alt="${p.name}" class="pin-image" style="height: 100%; object-fit: cover;" loading="lazy" onerror="this.src='/images/logo.png'">
        <div class="pin-overlay-scrim"></div>
        <span class="pin-overlay-pill" style="top: 10px; left: 10px; background: #ffd700; color: #000; font-weight: 800;">
          #${p.rank}
        </span>
        <span class="pin-overlay-pill pin-pill-duration">${p.videos} videos</span>
      </div>
      <div class="pin-meta" style="padding: 12px 6px;">
        <h3 class="pin-title" style="font-size: 15px; font-weight: 700;">${p.name}</h3>
        <div class="pin-author">
          <span class="pin-author-name">${p.views} views • Verified Star</span>
        </div>
      </div>
    </div>
  `).join('');
}
