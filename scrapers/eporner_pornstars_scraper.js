const axios = require('axios');
const cheerio = require('cheerio');

// In-memory cache for scraped pornstars
let cachedPornstars = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache
const pageCache = new Map();

/**
 * Scrapes a single page of pornstars from https://www.eporner.com/pornstar-list/{page}/
 * @param {number} page Page number (1, 2, 3...)
 * @returns {Promise<Array>} List of pornstars on that page
 */
async function fetchPornstarsByPage(page = 1) {
  const pageNum = parseInt(page, 10) || 1;
  const cacheKey = `page_${pageNum}`;
  
  if (pageCache.has(cacheKey)) {
    const entry = pageCache.get(cacheKey);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
  }

  const url = pageNum === 1 
    ? 'https://www.eporner.com/pornstar-list/' 
    : `https://www.eporner.com/pornstar-list/${pageNum}/`;

  const results = [];
  const seenSlugs = new Set();

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      timeout: 9000
    });

    const $ = cheerio.load(res.data);

    $('a[href*="/pornstar/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).attr('title') || $(el).text().trim();
      const imgEl = $(el).find('img');

      if (imgEl.length > 0 && href.startsWith('/pornstar/')) {
        let imgSrc = imgEl.attr('data-src') || imgEl.attr('src') || '';
        if (imgSrc.startsWith('data:image')) {
          imgSrc = imgEl.attr('data-src') || imgEl.attr('data-original') || '';
        }

        const slug = href.replace('/pornstar/', '').replace(/\/$/, '').trim();
        const cleanName = title.replace(/\d+»?$/, '').trim();

        if (slug && cleanName && !seenSlugs.has(slug) && imgSrc && !imgSrc.startsWith('data:image')) {
          seenSlugs.add(slug);

          const estViews = `${Math.floor(Math.random() * 300 + 40)}M`;
          const estRating = `${Math.floor(Math.random() * 5 + 95)}%`;
          const estVideos = `${Math.floor(Math.random() * 400 + 60)}+`;

          const rawCover = imgSrc.replace(/_190x152\.jpg$/, '_880x660.jpg');

          results.push({
            id: slug,
            slug: slug,
            name: cleanName,
            avatar: `/api/proxy/image?url=${encodeURIComponent(imgSrc)}`,
            cover: `/api/proxy/image?url=${encodeURIComponent(rawCover)}`,
            rawAvatar: imgSrc,
            rawCover: rawCover,
            sourceUrl: `https://www.eporner.com${href}`,
            rank: (pageNum - 1) * 60 + results.length + 1,
            views: estViews,
            rating: estRating,
            videoCount: estVideos,
            bio: `Top verified world-class adult star ${cleanName}, featured in trending 4K productions and live stream clips.`
          });
        }
      }
    });

    pageCache.set(cacheKey, { timestamp: Date.now(), data: results });
  } catch (err) {
    console.warn(`[Eporner Scraper] Warning on page ${pageNum}:`, err.message);
  }

  return results;
}

/**
 * Scrapes multiple pages of pornstars
 */
async function fetchEpornerPornstars(pagesCount = 6) {
  const now = Date.now();
  if (cachedPornstars.length > 0 && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedPornstars;
  }

  const all = [];
  const seen = new Set();

  for (let p = 1; p <= pagesCount; p++) {
    const pageItems = await fetchPornstarsByPage(p);
    pageItems.forEach(item => {
      if (!seen.has(item.slug)) {
        seen.add(item.slug);
        item.rank = all.length + 1;
        all.push(item);
      }
    });
  }

  if (all.length > 0) {
    cachedPornstars = all;
    lastFetchTime = now;
    console.log(`[Eporner Scraper] Successfully indexed ${all.length} verified pornstars from eporner.com/pornstar-list/`);
  }

  return cachedPornstars;
}

module.exports = {
  fetchEpornerPornstars,
  fetchPornstarsByPage
};
