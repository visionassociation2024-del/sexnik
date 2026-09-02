/**
 * Categories Page Engine (100% Real Stream Media)
 */

const ALL_CATEGORIES = [
  { id: 'trending', name: 'Trending Pins', icon: 'fa-fire', count: '54,200+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Fl/s7/irh2fr8s7Fl/129764-mia-khalifa-nude_880x660.jpg') },
  { id: '4k', name: '4K Ultra HD', icon: 'fa-tv', count: '12,900+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/LT/T2/JYYrTpQT2LT/458843-lana-rhoades-enjoying-an-uncut-cock_880x660.jpg') },
  { id: 'amateur', name: 'Amateur Couples', icon: 'fa-user', count: '36,400+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/wg/Ey/Ul9CvSuEywg/498125-riley-reid-showing-her-asshole_880x660.jpg') },
  { id: 'milf', name: 'MILF & Mature', icon: 'fa-heart', count: '29,100+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Xk/o9/4b5tNmqo9Xk/486265-kendra-lust-nude_880x660.jpg') },
  { id: 'lesbian', name: 'Lesbian & Solo', icon: 'fa-venus-double', count: '19,800+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/e7/8a/v0M04rK8ae7/399818-eva-elfie-nude_880x660.jpg') },
  { id: 'teen', name: '18+ Youth Babes', icon: 'fa-star', count: '23,400+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/i8/4u/eE7a4s34ui8/502120-sweetie-fox-nude_880x660.jpg') },
  { id: 'anal', name: 'Anal Hardcore', icon: 'fa-circle-notch', count: '18,700+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/5f/hS/g50mHQChS5f/484639-abella-danger-pussy_880x660.jpg') },
  { id: 'blowjob', name: 'Oral & Sensual', icon: 'fa-kiss', count: '26,500+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/q3/Q7/nS3lD77Q7q3/462615-autumn-falls-nude_880x660.jpg') },
  { id: 'hardcore', name: 'Hardcore Rough', icon: 'fa-bolt', count: '31,200+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vg/8Y/XQ0Pw508YVg/900205-bbc-queen-nude_880x660.jpg') },
  { id: 'japanese', name: 'Asian & Japanese', icon: 'fa-globe-asia', count: '16,800+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Cm/mY/2xbSWTsmYCm/32216333-violet-myers-pic594_880x660.jpg') },
  { id: 'vr', name: 'VR 360° Experience', icon: 'fa-vr-cardboard', count: '6,800+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vl/L3/vTfR46RL3Vl/482701-emily-willis-nude_880x660.jpg') },
  { id: 'creampie', name: 'Creampie Internal', icon: 'fa-tint', count: '21,900+ Videos', image: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/ii/7N/njlBOCp7Nii/474382-brandi-love-nude_880x660.jpg') }
];

document.addEventListener('DOMContentLoaded', () => {
  renderCategories(ALL_CATEGORIES);
});

function renderCategories(list) {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: #ffffff; border-radius: 16px;">
        <p style="color: #62625b;">No categories found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(c => `
    <div class="category-tile" onclick="window.location.href='/?cat=${c.id}'">
      <div style="z-index: 2;">
        <span class="pin-overlay-pill" style="position: static; display: inline-block; margin-bottom: 8px; font-size: 11px;">
          <i class="fa ${c.icon}" style="color: #e60023;"></i> ${c.count}
        </span>
        <h3 class="heading-md" style="color: var(--color-ink);">${c.name}</h3>
      </div>
      <img src="${c.image}" class="category-tile-bg" alt="${c.name}" onerror="this.src='/images/logo.png'">
    </div>
  `).join('');
}

function filterCategories(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderCategories(ALL_CATEGORIES);
    return;
  }
  const filtered = ALL_CATEGORIES.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q));
  renderCategories(filtered);
}
