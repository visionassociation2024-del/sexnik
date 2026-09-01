// Categories Data — images will be injected from random models
const ALL_CATEGORIES = [
  { id: 'models',       title: 'Top Pornstars & Models',     icon: 'fa-crown',             count: '1,000+ Stars', link: '/models.html',     special: 'models' },
  { id: 'sex_arabic',   title: 'Sex Arabic (Exclusive)',      icon: 'fa-star',              count: '15,400+',      link: '/arabic.html',     special: 'arabic' },
  { id: 'nikroli',      title: 'nikroli Reels (18+ Shorts)',  icon: 'fa-brands fa-tiktok',  count: '25,800+',      link: '/nikroli.html',    special: 'tiktok' },
  { id: 'trending',     title: 'Trending (Top Rated)',        icon: 'fa-fire',              count: '54,200+',      link: '/?cat=trending' },
  { id: '4k',           title: '4K Ultra HD (2160p)',         icon: 'fa-tv',                count: '12,900+',      link: '/4k.html' },
  { id: 'photos',       title: 'Photos & GIFs',              icon: 'fa-camera-retro',      count: '18,500+',      link: '/photos.html' },
  { id: 'amateur',      title: 'Amateur Couples',            icon: 'fa-user',              count: '36,400+',      link: '/?cat=amateur' },
  { id: 'milf',         title: 'MILF & Mature',              icon: 'fa-heart',             count: '29,100+',      link: '/?cat=milf' },
  { id: 'lesbian',      title: 'Lesbian & Girls',            icon: 'fa-venus-double',      count: '19,800+',      link: '/?cat=lesbian' },
  { id: 'teen',         title: '18+ Teen Babes',             icon: 'fa-star-half-alt',     count: '23,400+',      link: '/?cat=teen' },
  { id: 'anal',         title: 'Anal Hardcore',              icon: 'fa-circle-notch',      count: '18,700+',      link: '/?cat=anal' },
  { id: 'blowjob',      title: 'Blowjob & Deepthroat',      icon: 'fa-kiss',              count: '26,500+',      link: '/?cat=blowjob' },
  { id: 'hardcore',     title: 'Hardcore & Rough',           icon: 'fa-bolt',              count: '31,200+',      link: '/?cat=hardcore' },
  { id: 'asian',        title: 'Asian & Japanese',           icon: 'fa-globe-asia',        count: '16,800+',      link: '/?cat=asian' },
  { id: 'ebony',        title: 'Ebony Babes',                icon: 'fa-moon',              count: '14,900+',      link: '/?cat=ebony' },
  { id: 'latina',       title: 'Latina Hotties',             icon: 'fa-sun',               count: '17,600+',      link: '/?cat=latina' },
  { id: 'hentai',       title: 'Hentai & 3D Anime',         icon: 'fa-dragon',            count: '11,400+',      link: '/?cat=hentai' },
  { id: 'vr',           title: 'VR 360° Porn',              icon: 'fa-vr-cardboard',      count: '6,800+',       link: '/?cat=vr' },
  { id: 'creampie',     title: 'Creampie Internal',          icon: 'fa-tint',              count: '21,900+',      link: '/?cat=creampie' },
  { id: 'threesome',    title: 'Threesome & Group',          icon: 'fa-users',             count: '13,500+',      link: '/?cat=threesome' },
  { id: 'fetish',       title: 'Fetish & BDSM',             icon: 'fa-mask',              count: '9,400+',       link: '/?cat=fetish' },
  { id: 'masturbation', title: 'Solo & Masturbation',        icon: 'fa-hand-sparkles',     count: '15,800+',      link: '/?cat=masturbation' },
  { id: 'big_tits',     title: 'Big Tits & Boobs',          icon: 'fa-heartbeat',         count: '28,100+',      link: '/?cat=big_tits' },
  { id: 'big_ass',      title: 'Big Ass & Booty',           icon: 'fa-ring',              count: '24,900+',      link: '/?cat=big_ass' },
  { id: 'squirt',       title: 'Squirting Orgasm',           icon: 'fa-water',             count: '10,700+',      link: '/?cat=squirt' }
];

// Store the random model images once fetched
let randomModelImages = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadRandomModelImages();
  renderCategoriesGrid(ALL_CATEGORIES);
});

// Fetch random models from the in-memory database to use as category backgrounds
async function loadRandomModelImages() {
  try {
    const res = await fetch(`/api/models/random?count=${ALL_CATEGORIES.length}`);
    const data = await res.json();
    if (data.success && data.models && data.models.length > 0) {
      randomModelImages = data.models;
    }
  } catch (err) {
    console.warn('[Categories] Could not load random models for backgrounds:', err.message);
  }
}

function renderCategoriesGrid(list) {
  const container = document.getElementById('standaloneCategoriesGrid');
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;"><i class="fa fa-search" style="font-size: 28px; display: block; margin-bottom: 10px; opacity: 0.4;"></i>No categories match your search.</div>';
    return;
  }

  list.forEach((c, index) => {
    const card = document.createElement('a');
    card.href = c.link;
    card.className = `category-card-standalone ${c.special === 'models' ? 'special-models-card' : (c.special === 'arabic' ? 'special-arabic-card' : (c.special === 'tiktok' ? 'special-tiktok-card' : ''))}`;

    // Pick a random model image for this category
    const model = randomModelImages[index % randomModelImages.length] || null;
    const coverImg = model ? (model.cover || model.avatar || '/images/logo.png') : '/images/logo.png';
    const modelName = model ? model.name : '';
    const fallbackImg = '/images/logo.png';

    // Use proxy for external CDN images
    const imgSrc = coverImg.startsWith('http')
      ? `/api/proxy/image?url=${encodeURIComponent(coverImg)}`
      : coverImg;

    card.innerHTML = `
      <img src="${imgSrc}" alt="${c.title}" class="category-card-bg" loading="lazy" onerror="this.src='${fallbackImg}'" referrerpolicy="no-referrer">
      <div class="category-card-gradient"></div>
      <div class="cat-text-info">
        <h3><i class="fa ${c.icon}"></i> ${c.title}</h3>
        <span><i class="fa fa-play-circle"></i> ${c.count} Videos</span>
        ${modelName ? `<span class="cat-model-name"><i class="fa fa-star" style="color: #ffd700; font-size: 9px;"></i> ${modelName}</span>` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

function filterCategoriesList(e) {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    renderCategoriesGrid(ALL_CATEGORIES);
    return;
  }

  const filtered = ALL_CATEGORIES.filter(c =>
    c.title.toLowerCase().includes(term) ||
    c.id.toLowerCase().includes(term)
  );

  renderCategoriesGrid(filtered);
}

function handleHeaderSearch(e) {
  if (e.key === 'Enter') executeHeaderSearch();
}

function executeHeaderSearch() {
  const q = document.getElementById('headerSearch').value.trim();
  if (q) window.location.href = `/?q=${encodeURIComponent(q)}`;
}
