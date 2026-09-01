// 1,000+ Top Pornstars & Models Infinite Indexing Engine
let modelsPage = 1;
let isModelsLoading = false;
let hasMoreModels = true;
let currentEthnicity = 'all';
let currentLetter = 'all';
let currentSort = 'rank';
let searchQuery = '';
let isFollowedOnly = false;
let allLoadedModels = [];
const seenModelSlugs = new Set();

document.addEventListener('DOMContentLoaded', () => {
  updateFollowedBadge();
  initModelsInfiniteScroll();
  loadModelsBatch(true);

  // Check if a specific model was requested in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const starParam = urlParams.get('star') || urlParams.get('slug');
  if (starParam) {
    window.location.href = `/model.html?star=${encodeURIComponent(starParam)}`;
  }
});

function updateFollowedBadge() {
  const badge = document.getElementById('followedCountBadge');
  if (badge) {
    const followed = getFollowedModels();
    badge.innerText = followed.length;
  }
}

function initModelsInfiniteScroll() {
  const sentinel = document.getElementById('modelsSentinel');
  if (!sentinel) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isModelsLoading && hasMoreModels && !isFollowedOnly) {
      loadModelsBatch(false);
    }
  }, {
    rootMargin: '500px'
  });

  observer.observe(sentinel);
}

async function loadModelsBatch(isInitial = false) {
  if (isModelsLoading) return;
  if (!hasMoreModels && !isInitial) return;

  isModelsLoading = true;
  const grid = document.getElementById('modelsGrid');
  const loader = document.getElementById('modelsLoader');
  const countLabel = document.getElementById('modelsCountLabel');

  if (isInitial) {
    modelsPage = 1;
    seenModelSlugs.clear();
    allLoadedModels = [];
    hasMoreModels = true;
    if (grid) grid.innerHTML = getModelsSkeleton(12);
  } else {
    if (loader) loader.style.display = 'block';
  }

  // If user selected "Followed Only" filter
  if (isFollowedOnly) {
    const followedIds = getFollowedModels();
    if (followedIds.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <i class="fa fa-heart fa-3x" style="color: #ff007f; margin-bottom: 14px; opacity: 0.7;"></i>
            <h3 style="color: #fff; margin-bottom: 6px;">No Followed Stars Yet</h3>
            <p style="font-size: 13px;">Click the heart icon on any model card to follow them and save them here!</p>
          </div>
        `;
      }
      if (countLabel) countLabel.innerText = '0 Followed Stars';
      isModelsLoading = false;
      if (loader) loader.style.display = 'none';
      return;
    }
  }

  try {
    const url = `/api/models?page=${modelsPage}&limit=36&ethnicity=${encodeURIComponent(currentEthnicity)}&letter=${encodeURIComponent(currentLetter)}&sort=${encodeURIComponent(currentSort)}&q=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (isInitial && grid) {
      grid.innerHTML = '';
    }

    if (data.success && data.models && data.models.length > 0) {
      let modelsToRender = data.models;

      if (isFollowedOnly) {
        const followedIds = getFollowedModels();
        modelsToRender = modelsToRender.filter(m => followedIds.includes(m.id || m.slug));
      }

      const newModels = [];
      modelsToRender.forEach(m => {
        const slugKey = m.slug || m.id;
        if (!seenModelSlugs.has(slugKey)) {
          seenModelSlugs.add(slugKey);
          newModels.push(m);
          allLoadedModels.push(m);
        }
      });

      appendModelsToGrid(newModels);

      if (countLabel) {
        countLabel.innerText = `Showing ${allLoadedModels.length} of ${data.total || 1033} Verified Stars`;
      }

      modelsPage++;
      hasMoreModels = data.hasMore !== false && !isFollowedOnly;
    } else {
      hasMoreModels = false;
      if (isInitial && grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No models found matching your filters.</div>';
      }
      if (countLabel && isInitial) {
        countLabel.innerText = '0 Stars Found';
      }
    }
  } catch (err) {
    console.error('Error loading models:', err);
    if (isInitial && grid) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 50px;">Failed to load models. Please refresh.</div>';
    }
  } finally {
    isModelsLoading = false;
    if (loader) loader.style.display = 'none';
  }
}

function appendModelsToGrid(list) {
  const grid = document.getElementById('modelsGrid');
  if (!grid) return;

  const followedModels = getFollowedModels();

  list.forEach(m => {
    const isFollowed = followedModels.includes(m.id || m.slug);
    const card = document.createElement('div');
    card.className = 'model-card animate-fade';
    card.onclick = () => openModelProfile(m.slug || m.id);

    const avatarUrl = m.avatar || '/images/logo.png';

    card.innerHTML = `
      <div class="model-card-cover-wrap">
        <img src="${avatarUrl}" alt="${m.name}" class="model-card-img" referrerpolicy="no-referrer" loading="lazy" onerror="this.src='/images/logo.png'">
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
          <div class="model-nationality-label">${m.nationality || 'Verified Adult Performer'}</div>
          
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
          <button class="btn-follow-model ${isFollowed ? 'following' : ''}" onclick="toggleFollowModel('${m.id || m.slug}', event, this)" title="Follow Star">
            <i class="fa ${isFollowed ? 'fa-heart' : 'fa-heart-o'}"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

let searchDebounce = null;
function filterModelsList(e) {
  searchQuery = e.target.value.trim();
  const clearBtn = document.getElementById('clearModelSearchBtn');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';

  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    isFollowedOnly = false;
    loadModelsBatch(true);
  }, 200);
}

function clearModelSearch() {
  const input = document.getElementById('modelFilterInput');
  if (input) input.value = '';
  searchQuery = '';
  const clearBtn = document.getElementById('clearModelSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  loadModelsBatch(true);
}

function switchModelEthnicity(eth, btn) {
  isFollowedOnly = false;
  document.querySelectorAll('.btn-model-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titleEl = document.getElementById('modelsSectionTitle');
  if (titleEl) titleEl.innerText = `Verified Performers (${btn.innerText.trim()})`;
  currentEthnicity = eth;
  loadModelsBatch(true);
}

function switchAlphabet(letter, btn) {
  isFollowedOnly = false;
  document.querySelectorAll('.btn-alphabet').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentLetter = letter;
  loadModelsBatch(true);
}

function changeModelSort(sortVal) {
  currentSort = sortVal;
  loadModelsBatch(true);
}

function filterFollowedOnly(btn) {
  isFollowedOnly = true;
  document.querySelectorAll('.btn-model-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titleEl = document.getElementById('modelsSectionTitle');
  if (titleEl) titleEl.innerText = 'My Followed Superstars';
  loadModelsBatch(true);
}

function openModelProfile(slug) {
  window.location.href = `/model.html?star=${encodeURIComponent(slug)}`;
}

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
  updateFollowedBadge();
}

function handleModelSearch(e) {
  if (e.key === 'Enter') executeModelSearch();
}

function executeModelSearch() {
  const q = document.getElementById('modelHeaderSearch').value.trim();
  if (q) window.location.href = `/?q=${encodeURIComponent(q)}`;
}

function getModelsSkeleton(count = 12) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="model-card" style="opacity: 0.5;">
        <div class="model-card-cover-wrap" style="background: #1e1e2d;"></div>
        <div class="model-card-body">
          <div style="height: 18px; background: #28283c; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 12px; width: 60%; background: #28283c; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }
  return html;
}
