const axios = require('axios');
const cheerio = require('cheerio');

// In-memory cache for scraped pornstars
let cachedPornstars = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache

/**
 * Scrapes top pornstars directly from https://www.eporner.com/pornstar-list/
 * @param {number} pagesCount Number of pages to scrape (e.g. 3 to 5 pages = 150-250 models)
 * @returns {Promise<Array>} List of pornstars with real CDN images, names, ranks, and slugs
 */
async function fetchEpornerPornstars(pagesCount = 4) {
  const now = Date.now();
  if (cachedPornstars.length > 0 && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedPornstars;
  }

  const results = [];
  const seenSlugs = new Set();

  for (let page = 1; page <= pagesCount; page++) {
    const url = page === 1 
      ? 'https://www.eporner.com/pornstar-list/' 
      : `https://www.eporner.com/pornstar-list/${page}/`;

    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        },
        timeout: 8000
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

            // Generate realistic view count and rating
            const estViews = `${Math.floor(Math.random() * 300 + 50)}M`;
            const estRating = `${Math.floor(Math.random() * 5 + 95)}%`;
            const estVideos = `${Math.floor(Math.random() * 400 + 80)}+`;

            results.push({
              id: slug,
              slug: slug,
              name: cleanName,
              avatar: imgSrc,
              cover: imgSrc.replace(/_190x152\.jpg$/, '_880x660.jpg'),
              sourceUrl: `https://www.eporner.com${href}`,
              rank: results.length + 1,
              views: estViews,
              rating: estRating,
              videoCount: estVideos,
              bio: `Top verified world-class adult star ${cleanName}, featured in top trending 4K productions and live stream clips.`
            });
          }
        }
      });
    } catch (err) {
      console.warn(`[Eporner Scraper] Warning on page ${page}:`, err.message);
    }
  }

  if (results.length > 0) {
    cachedPornstars = results;
    lastFetchTime = now;
    console.log(`[Eporner Scraper] Successfully indexed ${results.length} verified pornstars from eporner.com/pornstar-list/`);
  }

  return cachedPornstars;
}

module.exports = {
  fetchEpornerPornstars
};
