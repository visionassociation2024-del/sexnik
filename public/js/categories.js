/**
 * Categories Page Engine
 */

const ALL_CATEGORIES = [
  { id: 'trending', name: 'Trending Pins', icon: 'fa-fire', count: '54,200+ Videos', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { id: '4k', name: '4K Ultra HD', icon: 'fa-tv', count: '12,900+ Videos', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: 'amateur', name: 'Amateur Couples', icon: 'fa-user', count: '36,400+ Videos', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80' },
  { id: 'milf', name: 'MILF & Mature', icon: 'fa-heart', count: '29,100+ Videos', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80' },
  { id: 'lesbian', name: 'Lesbian & Solo', icon: 'fa-venus-double', count: '19,800+ Videos', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
  { id: 'teen', name: '18+ Youth Babes', icon: 'fa-star', count: '23,400+ Videos', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 'anal', name: 'Anal Hardcore', icon: 'fa-circle-notch', count: '18,700+ Videos', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: 'blowjob', name: 'Oral & Sensual', icon: 'fa-kiss', count: '26,500+ Videos', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { id: 'hardcore', name: 'Hardcore Rough', icon: 'fa-bolt', count: '31,200+ Videos', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: 'japanese', name: 'Asian & Japanese', icon: 'fa-globe-asia', count: '16,800+ Videos', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80' },
  { id: 'vr', name: 'VR 360° Porn', icon: 'fa-vr-cardboard', count: '6,800+ Videos', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80' },
  { id: 'creampie', name: 'Creampie Internal', icon: 'fa-tint', count: '21,900+ Videos', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' }
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
      <img src="${c.image}" class="category-tile-bg" alt="${c.name}">
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
