// Standalone Model Profile Controller
let currentModelData = null;
let currentModelSlug = '';

document.addEventListener('DOMContentLoaded', () => {
  // Resolve model slug from URL search or pathname
  const urlParams = new URLSearchParams(window.location.search);
  let slug = urlParams.get('star') || urlParams.get('slug') || urlParams.get('name') || urlParams.get('id');

  if (!slug) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'model' || parts[0] === 'pornstar' || parts[0] === 'star')) {
      slug = parts[1];
    }
  }

  if (!slug) {
    slug = 'valentina-nappi-5RAa3'; // Default featured top star
  }

  currentModelSlug = slug;
  loadDedicatedModelProfile(slug);
  loadRelatedStars(slug);
});

async function loadDedicatedModelProfile(slug) {
  const vGrid = document.getElementById('starVideosGrid');
  if (vGrid) vGrid.innerHTML = getProfileVideoSkeleton(8);

  try {
    const res = await fetch(`/api/model/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (data.success && data.model) {
      currentModelData = data.model;
      renderModelHeader(currentModelData);
      renderModelVideos(data.videos || [], currentModelData);
    } else {
      if (vGrid) vGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">Model profile not found.</div>';
    }
  } catch (err) {
    if (vGrid) vGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">Failed to load model profile. Please refresh.</div>';
  }
}

function renderModelHeader(model) {
  document.title = `${model.name} - HD Videos, Profile & Streams - niksex`;

  const coverImg = document.getElementById('starCoverImg');
  const avatarImg = document.getElementById('starAvatarImg');
  const rankBadge = document.getElementById('starRankBadge');
  const nameTitle = document.getElementById('starNameTitle');
  const sectionName = document.getElementById('starSectionName');
  const metaSub = document.getElementById('starMetaSub');
  const viewsCount = document.getElementById('starViewsCount');
  const videosCount = document.getElementById('starVideosCount');
  const ratingPercent = document.getElementById('starRatingPercent');
  const bioText = document.getElementById('starBioText');

  if (coverImg) coverImg.src = model.cover || model.avatar || '/images/logo.png';
  if (avatarImg) avatarImg.src = model.avatar || '/images/logo.png';
  if (rankBadge) rankBadge.innerHTML = `<i class="fa fa-crown"></i> #${model.rank || 1}`;
  if (nameTitle) nameTitle.innerText = model.name;
  if (sectionName) sectionName.innerText = model.name;
  if (metaSub) metaSub.innerText = `${model.nationality || 'Verified International Performer'} • High-Definition Stream Collections`;
  if (viewsCount) viewsCount.innerText = model.views || '250M+';
  if (videosCount) videosCount.innerText = model.videoCount || '180+';
  if (ratingPercent) ratingPercent.innerText = model.rating || '98%';
  if (bioText) bioText.innerText = model.bio || `${model.name} is one of the top verified adult superstars streaming live HD and 4K video scenes on niksex.`;

  updateFollowButtonState();
}

function renderModelVideos(videos, model) {
  const vGrid = document.getElementById('starVideosGrid');
  const streamCount = document.getElementById('starVideosStreamCount');
  if (!vGrid) return;

  vGrid.innerHTML = '';

  if (videos.length === 0) {
    vGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">
        <p style="font-size: 16px; margin-bottom: 10px;">No exact video stream matches found for ${model.name}.</p>
        <a href="/?q=${encodeURIComponent(model.name)}" class="btn-pill">
          <i class="fa fa-search"></i> Search Network for ${model.name}
        </a>
      </div>
    `;
    if (streamCount) streamCount.innerText = '0 videos found';
    return;
  }

  if (streamCount) streamCount.innerText = `${videos.length} HD Scenes Available`;

  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card animate-fade';
    card.onclick = () => {
      const params = new URLSearchParams({
        id: v.id || '',
        title: v.title || '',
        embed: v.embed_url || v.video_url || '',
        thumb: v.thumbnail || '',
        duration: v.duration || '12:00',
        views: v.views || '35K',
        rating: v.rating || '98%',
        tags: (v.tags || [model.name, 'model', 'pornstar']).join(',')
      });
      window.location.href = `/watch.html?${params.toString()}`;
    };

    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${v.thumbnail || '/images/logo.png'}" alt="${v.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='/images/logo.png'">
        <span class="badge-hd">1080p HD</span>
        <span class="badge-duration">${v.duration || '12:00'}</span>
      </div>
      <div class="card-details">
        <h4 class="video-title" title="${v.title}">${v.title}</h4>
        <div class="video-meta">
          <span><i class="fa fa-eye"></i> ${v.views || '20K'}</span>
          <span class="meta-rating"><i class="fa fa-thumbs-up"></i> ${v.rating || '98%'}</span>
        </div>
      </div>
    `;

    vGrid.appendChild(card);
  });
}

async function loadRelatedStars(currentSlug) {
  const rGrid = document.getElementById('relatedStarsGrid');
  if (!rGrid) return;

  try {
    const res = await fetch('/api/models?limit=12');
    const data = await res.json();
    if (data.success && data.models) {
      const filtered = data.models.filter(m => m.slug !== currentSlug).slice(0, 8);
      rGrid.innerHTML = '';

      filtered.forEach(m => {
        const a = document.createElement('a');
        a.href = `/model.html?star=${encodeURIComponent(m.slug || m.id)}`;
        a.className = 'related-star-card';
        a.innerHTML = `
          <img src="${m.avatar || '/images/logo.png'}" alt="${m.name}" class="related-star-thumb" referrerpolicy="no-referrer" loading="lazy" onerror="this.src='/images/logo.png'">
          <div class="related-star-info">
            <h4>${m.name}</h4>
            <span><i class="fa fa-crown" style="color: #ffd700;"></i> #${m.rank} &bull; ${m.views}</span>
          </div>
        `;
        rGrid.appendChild(a);
      });
    }
  } catch (e) {}
}

// Follow / Bookmark Star Storage
function getFollowedModels() {
  try {
    const raw = localStorage.getItem('niksex_followed_models');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function updateFollowButtonState() {
  const btn = document.getElementById('btnFollowStar');
  const text = document.getElementById('btnFollowText');
  if (!btn || !currentModelData) return;

  const followed = getFollowedModels();
  const isFollowed = followed.includes(currentModelData.id || currentModelSlug);

  if (isFollowed) {
    btn.classList.add('active');
    if (text) text.innerText = 'Following Star';
  } else {
    btn.classList.remove('active');
    if (text) text.innerText = 'Follow Star';
  }
}

function toggleFollowCurrentStar() {
  if (!currentModelData) return;
  const starId = currentModelData.id || currentModelSlug;
  let followed = getFollowedModels();

  if (followed.includes(starId)) {
    followed = followed.filter(id => id !== starId);
  } else {
    followed.push(starId);
  }

  localStorage.setItem('niksex_followed_models', JSON.stringify(followed));
  updateFollowButtonState();
}

function shareStarProfile() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Model profile link copied to clipboard!');
  }
}

function handleSearch(e) {
  if (e.key === 'Enter') executeSearch();
}

function executeSearch() {
  const q = document.getElementById('modelSearchInput').value.trim();
  if (q) window.location.href = `/?q=${encodeURIComponent(q)}`;
}

function getProfileVideoSkeleton(count = 8) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="video-card" style="opacity: 0.5;">
        <div class="thumb-wrap" style="background: #1e1e2d;"></div>
        <div class="card-details"><div style="height: 14px; background: #28283c; border-radius: 4px; margin-bottom: 8px;"></div></div>
      </div>
    `;
  }
  return html;
}
