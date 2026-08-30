// Top Pornstars & Models Engine
let allModelsList = [];
let currentEthnicity = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadModels('all');

  // Check if a specific model was requested in the URL (e.g. /models.html?star=mia-khalifa)
  const urlParams = new URLSearchParams(window.location.search);
  const starParam = urlParams.get('star');
  if (starParam) {
    setTimeout(() => openModelProfile(starParam), 500);
  }
});

async function loadModels(ethnicity = 'all') {
  currentEthnicity = ethnicity;
  const grid = document.getElementById('modelsGrid');
  const countLabel = document.getElementById('modelsCountLabel');
  if (!grid) return;

  grid.innerHTML = getModelsSkeleton(12);

  try {
    const res = await fetch(`/api/models?limit=300&ethnicity=${encodeURIComponent(ethnicity)}`);
    const data = await res.json();
    if (data.success && data.models) {
      allModelsList = data.models;
      renderModelsGrid(allModelsList);
      if (countLabel) countLabel.innerText = `${data.total || allModelsList.length} Verified Stars (eporner.com Live Index)`;
    }
  } catch (err) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 50px;">Failed to load models. Please refresh.</div>';
  }
}

function renderModelsGrid(list) {
  const grid = document.getElementById('modelsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No models match your search.</div>';
    return;
  }

  const followedModels = getFollowedModels();

  list.forEach(m => {
    const isFollowed = followedModels.includes(m.id);
    const card = document.createElement('div');
    card.className = 'model-card animate-fade';
    card.onclick = () => openModelProfile(m.slug || m.id);

    card.innerHTML = `
      <div class="model-card-cover-wrap">
        <img src="${m.avatar || '/images/logo.png'}" alt="${m.name}" class="model-card-img" loading="lazy" onerror="this.src='/images/logo.png'">
        <div class="model-card-gradient"></div>
        <div class="model-rank-badge">
          <i class="fa fa-crown"></i> Rank #${m.rank}
        </div>
        <div class="model-verified-badge">
          <i class="fa fa-check-circle"></i> VERIFIED
        </div>
      </div>
      <div class="model-card-body">
        <div>
          <h3 class="model-name-title">${m.name}</h3>
          <div class="model-nationality-label">${m.nationality || 'International Star'}</div>
          
          <div class="model-stats-row">
            <span><i class="fa fa-eye" style="color: var(--accent-pink);"></i> <strong>${m.views}</strong> Views</span>
            <span><i class="fa fa-film" style="color: #00f2fe;"></i> <strong>${m.videoCount}</strong> Videos</span>
            <span><i class="fa fa-thumbs-up" style="color: #ffd700;"></i> <strong>${m.rating}</strong></span>
          </div>
        </div>

        <div class="model-card-actions">
          <button class="btn-view-profile" onclick="event.stopPropagation(); openModelProfile('${m.slug || m.id}')">
            <i class="fa fa-play-circle"></i> Watch Videos
          </button>
          <button class="btn-follow-model ${isFollowed ? 'following' : ''}" onclick="toggleFollowModel('${m.id}', event, this)" title="Follow Star">
            <i class="fa ${isFollowed ? 'fa-heart' : 'fa-heart-o'}"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function filterModelsList(e) {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    renderModelsGrid(allModelsList);
    return;
  }

  const filtered = allModelsList.filter(m => 
    m.name.toLowerCase().includes(term) ||
    (m.tags && m.tags.some(t => t.toLowerCase().includes(term))) ||
    (m.nationality && m.nationality.toLowerCase().includes(term))
  );

  renderModelsGrid(filtered);
}

function switchModelEthnicity(eth, btn) {
  document.querySelectorAll('.btn-model-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titleEl = document.getElementById('modelsSectionTitle');
  if (titleEl) titleEl.innerText = `Verified Stars (${btn.innerText.trim()})`;
  loadModels(eth);
}

// Open Interactive Model Profile Modal
async function openModelProfile(slug) {
  const modal = document.getElementById('modelProfileModal');
  if (!modal) return;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const coverImg = document.getElementById('profileCoverImg');
  const avatarImg = document.getElementById('profileAvatarImg');
  const nameEl = document.getElementById('profileName');
  const natEl = document.getElementById('profileNationality');
  const bioEl = document.getElementById('profileBioText');
  const starNameEl = document.getElementById('profileVideosStarName');
  const vGrid = document.getElementById('profileVideosGrid');

  vGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;"><div class="spinner-neon"></div> Loading videos...</div>';

  try {
    const res = await fetch(`/api/model/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (data.success && data.model) {
      const m = data.model;
      if (coverImg) coverImg.src = m.cover || m.avatar || '/images/logo.png';
      if (avatarImg) avatarImg.src = m.avatar || '/images/logo.png';
      if (nameEl) nameEl.innerHTML = `${m.name} <i class="fa fa-check-circle" style="color: #00f2fe; font-size: 18px;"></i>`;
      if (natEl) natEl.innerHTML = `${m.nationality} &bull; Rank #${m.rank} &bull; ${m.views} Total Views &bull; ${m.rating} Rating`;
      if (bioEl) bioEl.innerText = m.bio || 'Top world-class verified adult performer.';
      if (starNameEl) starNameEl.innerText = m.name;

      renderModelVideos(data.videos || [], m);
    }
  } catch (err) {
    vGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">Failed to load performer videos.</div>';
  }
}

function renderModelVideos(videos, model) {
  const vGrid = document.getElementById('profileVideosGrid');
  if (!vGrid) return;

  vGrid.innerHTML = '';

  if (videos.length === 0) {
    vGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">
      <p>No direct video stream found for ${model.name}.</p>
      <a href="/?q=${encodeURIComponent(model.name)}" class="btn-pill" style="margin-top: 10px; display: inline-block;">
        <i class="fa fa-search"></i> Search Network for ${model.name}
      </a>
    </div>`;
    return;
  }

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
        views: v.views || '25K',
        rating: v.rating || '98%',
        tags: (v.tags || [model.name, 'model', 'pornstar']).join(',')
      });
      window.location.href = `/watch.html?${params.toString()}`;
    };

    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${v.thumbnail || '/images/logo.png'}" alt="${v.title}" loading="lazy" onerror="this.src='/images/logo.png'">
        <span class="badge-hd">1080p HD</span>
        <span class="badge-duration">${v.duration || '10:00'}</span>
      </div>
      <div class="card-details">
        <h4 class="video-title" title="${v.title}" style="font-size: 13px;">${v.title}</h4>
        <div class="video-meta">
          <span><i class="fa fa-eye"></i> ${v.views || '20K'}</span>
          <span class="meta-rating"><i class="fa fa-thumbs-up"></i> ${v.rating || '98%'}</span>
        </div>
      </div>
    `;

    vGrid.appendChild(card);
  });
}

function closeModelProfileModal(e) {
  const modal = document.getElementById('modelProfileModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Follow / Bookmark Model Storage
function getFollowedModels() {
  try {
    const raw = localStorage.getItem('niksex_followed_models');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function toggleFollowModel(modelId, e, btn) {
  if (e) e.stopPropagation();
  let followed = getFollowedModels();
  if (followed.includes(modelId)) {
    followed = followed.filter(id => id !== modelId);
    if (btn) {
      btn.classList.remove('following');
      btn.innerHTML = '<i class="fa fa-heart-o"></i>';
    }
  } else {
    followed.push(modelId);
    if (btn) {
      btn.classList.add('following');
      btn.innerHTML = '<i class="fa fa-heart"></i>';
    }
  }
  localStorage.setItem('niksex_followed_models', JSON.stringify(followed));
}

function handleModelSearch(e) {
  if (e.key === 'Enter') executeModelSearch();
}

function executeModelSearch() {
  const q = document.getElementById('modelHeaderSearch').value.trim();
  if (q) window.location.href = `/?q=${encodeURIComponent(q)}`;
}

function getModelsSkeleton(count = 8) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="model-card" style="opacity: 0.5;">
        <div class="model-card-cover-wrap" style="background: #1e1e2d;"></div>
        <div class="model-card-body">
          <div style="height: 16px; background: #28283c; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 10px; width: 50%; background: #28283c; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}
