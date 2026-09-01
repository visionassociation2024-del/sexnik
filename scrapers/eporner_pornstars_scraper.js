const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'models_database.json');

// In-memory persistent cache for 1000+ pornstars (Sub-1ms instantaneous response)
let inMemoryModels = [];
let isDbLoaded = false;

function loadModelsFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryModels = parsed;
        isDbLoaded = true;
        console.log(`[Models Engine] Loaded ${inMemoryModels.length} models from database into memory.`);
        return inMemoryModels;
      }
    }
  } catch (err) {
    console.warn('[Models Engine] Could not load models database file:', err.message);
  }
  return [];
}

// Initial load
loadModelsFromDisk();

/**
 * Returns all verified models instantly from memory
 */
async function fetchEpornerPornstars(limit = 1000) {
  if (!isDbLoaded || inMemoryModels.length === 0) {
    loadModelsFromDisk();
  }
  return inMemoryModels.slice(0, limit);
}

/**
 * Paginated models provider
 */
async function fetchPornstarsByPage(page = 1, limit = 30) {
  if (!isDbLoaded || inMemoryModels.length === 0) {
    loadModelsFromDisk();
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const start = (pageNum - 1) * limit;
  return inMemoryModels.slice(start, start + limit);
}

/**
 * Find single model by slug or name
 */
function findModelBySlugOrName(slugOrName) {
  if (!slugOrName) return null;
  if (!isDbLoaded || inMemoryModels.length === 0) {
    loadModelsFromDisk();
  }
  const term = slugOrName.toLowerCase().trim();
  const cleanSlug = term.replace(/\s+/g, '-');

  return inMemoryModels.find(m => 
    (m.slug && m.slug.toLowerCase() === cleanSlug) ||
    (m.id && m.id.toLowerCase() === term.replace(/-/g, '_')) ||
    (m.name && m.name.toLowerCase() === term) ||
    (m.name && m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === term.replace(/[^a-z0-9]/g, ''))
  );
}

/**
 * Search models with fuzzy matching
 */
function searchModelsMemory(query = '', ethnicity = 'all', limit = 50) {
  if (!isDbLoaded || inMemoryModels.length === 0) {
    loadModelsFromDisk();
  }
  let results = [...inMemoryModels];

  if (ethnicity && ethnicity !== 'all') {
    results = results.filter(m => m.ethnicity === ethnicity);
  }

  if (query) {
    const term = query.toLowerCase().trim();
    results = results.filter(m => 
      m.name.toLowerCase().includes(term) ||
      (m.slug && m.slug.toLowerCase().includes(term)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(term))) ||
      (m.nationality && m.nationality.toLowerCase().includes(term))
    );
  }

  return results.slice(0, limit);
}

module.exports = {
  fetchEpornerPornstars,
  fetchPornstarsByPage,
  findModelBySlugOrName,
  searchModelsMemory,
  getAllModels: () => inMemoryModels
};
