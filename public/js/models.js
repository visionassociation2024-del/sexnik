/**
 * Performers & Stars Directory Engine
 */

let allPerformers = [];
let currentLetter = 'ALL';

const DEFAULT_STARS = [
  { name: 'Angela White', rank: 1, views: '48.2M', videos: 280, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80', slug: 'angela-white' },
  { name: 'Eva Elfie', rank: 2, views: '39.8M', videos: 190, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80', slug: 'eva-elfie' },
  { name: 'Abella Danger', rank: 3, views: '42.1M', videos: 310, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&auto=format&fit=crop&q=80', slug: 'abella-danger' },
  { name: 'Lana Rhoades', rank: 4, views: '54.6M', videos: 140, avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=240&auto=format&fit=crop&q=80', slug: 'lana-rhoades' },
  { name: 'Mia Malkova', rank: 5, views: '36.5M', videos: 220, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80', slug: 'mia-malkova' },
  { name: 'Kendra Lust', rank: 6, views: '31.4M', videos: 260, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80', slug: 'kendra-lust' },
  { name: 'Sweetie Fox', rank: 7, views: '28.9M', videos: 110, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80', slug: 'sweetie-fox' },
  { name: 'Lena Paul', rank: 8, views: '33.2M', videos: 205, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80', slug: 'lena-paul' },
  { name: 'Gabbie Carter', rank: 9, views: '25.4M', videos: 95, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&auto=format&fit=crop&q=80', slug: 'gabbie-carter' },
  { name: 'Riley Reid', rank: 10, views: '61.8M', videos: 410, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80', slug: 'riley-reid' },
  { name: 'Emily Willis', rank: 11, views: '37.1M', videos: 180, avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=240&auto=format&fit=crop&q=80', slug: 'emily-willis' },
  { name: 'Brandi Love', rank: 12, views: '34.9M', videos: 290, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80', slug: 'brandi-love' }
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
        views: m.views || `${(10 + Math.floor(Math.random() * 40))}.5M`,
        videos: m.videos_count || m.videos || (50 + Math.floor(Math.random() * 150)),
        avatar: m.thumbnail || m.avatar || DEFAULT_STARS[idx % DEFAULT_STARS.length].avatar,
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
        <img src="${p.avatar}" alt="${p.name}" class="pin-image" style="height: 100%; object-fit: cover;" loading="lazy">
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
