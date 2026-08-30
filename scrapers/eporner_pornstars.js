const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEpornerPornstars(maxPages = 3) {
  const allStars = [];
  const seenSlugs = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? 'https://www.eporner.com/pornstar-list/' : `https://www.eporner.com/pornstar-list/${page}/`;
    console.log(`Scraping page ${page}: ${url}...`);

    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
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
          const cleanName = title.replace(/\d+»?$/, '').trim(); // Remove trailing numbers like "Angela White1"

          if (slug && cleanName && !seenSlugs.has(slug) && imgSrc) {
            seenSlugs.add(slug);

            // Extract video count or details if available in parent container
            const parent = $(el).parent();
            const textContent = parent.text();
            
            allStars.push({
              id: slug,
              slug: slug,
              name: cleanName,
              avatar: imgSrc,
              cover: imgSrc.replace(/_190x152\.jpg$/, '_880x660.jpg'),
              href: href,
              rank: allStars.length + 1
            });
          }
        }
      });
    } catch (e) {
      console.error(`Error on page ${page}:`, e.message);
    }
  }

  console.log(`Total scraped unique stars: ${allStars.length}`);
  console.log('Sample stars (1 to 10):', JSON.stringify(allStars.slice(0, 10), null, 2));
  return allStars;
}

scrapeEpornerPornstars(3);
