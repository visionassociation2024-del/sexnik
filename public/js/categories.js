// Categories Data
const ALL_CATEGORIES = [
  { id: 'sex_arabic', title: 'Sex Arabic (عربي)', icon: 'fa-star', count: '15,000+', link: '/arabic.html', special: 'arabic' },
  { id: 'nikroli', title: 'nikroli Reels (نكرولي 📱🔞)', icon: 'fa-brands fa-tiktok', count: '25,000+', link: '/nikroli.html', special: 'tiktok' },
  { id: 'trending', title: 'Trending (الشائع 🔥)', icon: 'fa-fire', count: '50,000+', link: '/trending.html' },
  { id: '4k', title: '4K Ultra HD (فائق الدقة 📺)', icon: 'fa-tv', count: '12,500+', link: '/4k.html' },
  { id: 'photos', title: 'Photos & GIFs (صور ومتحركة 📸)', icon: 'fa-camera-retro', count: '18,000+', link: '/photos.html' },
  { id: 'amateur', title: 'Amateur (هواة)', icon: 'fa-user', count: '35,000+', link: '/?cat=amateur' },
  { id: 'milf', title: 'MILF (أمهات)', icon: 'fa-heart', count: '28,000+', link: '/?cat=milf' },
  { id: 'lesbian', title: 'Lesbian (سحاقيات)', icon: 'fa-venus-double', count: '19,000+', link: '/?cat=lesbian' },
  { id: 'teen', title: '18+ Teen (مراهقات)', icon: 'fa-star-half-alt', count: '22,000+', link: '/?cat=teen' },
  { id: 'anal', title: 'Anal (خلفي)', icon: 'fa-circle-notch', count: '18,000+', link: '/?cat=anal' },
  { id: 'blowjob', title: 'Blowjob (مص)', icon: 'fa-kiss', count: '25,000+', link: '/?cat=blowjob' },
  { id: 'hardcore', title: 'Hardcore (عنيف)', icon: 'fa-bolt', count: '30,000+', link: '/?cat=hardcore' },
  { id: 'asian', title: 'Asian (آسيوي)', icon: 'fa-globe-asia', count: '16,000+', link: '/?cat=asian' },
  { id: 'ebony', title: 'Ebony (سمراء)', icon: 'fa-moon', count: '14,000+', link: '/?cat=ebony' },
  { id: 'latina', title: 'Latina (لاتيني)', icon: 'fa-sun', count: '17,000+', link: '/?cat=latina' },
  { id: 'hentai', title: 'Hentai & Anime (أنمي)', icon: 'fa-dragon', count: '11,000+', link: '/?cat=hentai' },
  { id: 'vr', title: 'VR 360° (واقع افتراضي)', icon: 'fa-vr-cardboard', count: '6,000+', link: '/?cat=vr' },
  { id: 'creampie', title: 'Creampie (داخلي)', icon: 'fa-tint', count: '21,000+', link: '/?cat=creampie' },
  { id: 'threesome', title: 'Threesome (ثلاثي)', icon: 'fa-users', count: '13,000+', link: '/?cat=threesome' },
  { id: 'fetish', title: 'Fetish & BDSM (فيتيش)', icon: 'fa-mask', count: '9,000+', link: '/?cat=fetish' },
  { id: 'masturbation', title: 'Solo & Masturbation (استمناء)', icon: 'fa-hand-sparkles', count: '15,000+', link: '/?cat=masturbation' },
  { id: 'big_tits', title: 'Big Tits (أثداء كبيرة)', icon: 'fa-heartbeat', count: '27,000+', link: '/?cat=big_tits' },
  { id: 'big_ass', title: 'Big Ass (مؤخرات كبيرة)', icon: 'fa-ring', count: '24,000+', link: '/?cat=big_ass' },
  { id: 'squirt', title: 'Squirting (قذف)', icon: 'fa-water', count: '10,000+', link: '/?cat=squirt' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderCategoriesGrid(ALL_CATEGORIES);
});

function renderCategoriesGrid(list) {
  const container = document.getElementById('standaloneCategoriesGrid');
  if (!container) return;

  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No categories match your search.</div>';
    return;
  }

  list.forEach(c => {
    const card = document.createElement('a');
    card.href = c.link;
    card.className = `category-card-standalone ${c.special === 'arabic' ? 'special-arabic-card' : (c.special === 'tiktok' ? 'special-tiktok-card' : '')}`;

    card.innerHTML = `
      <div class="cat-icon-wrap">
        <i class="fa ${c.icon}"></i>
      </div>
      <div class="cat-text-info">
        <h3>${c.title}</h3>
        <span>${c.count} Videos</span>
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
