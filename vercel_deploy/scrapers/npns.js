const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://www.npns.fr/'
};

const NPNS_PAGES = [
    'https://www.npns.fr/gif-porno/',
    'https://www.npns.fr/gif-erotique/',
    'https://www.npns.fr/gif-porno-et-sexe/'
];

/**
 * Scrape all 150+ animated GIFs from npns.fr
 */
async function scrapeNpnsGifs(page = 1) {
    try {
        const targetUrl = NPNS_PAGES[(page - 1) % NPNS_PAGES.length] || 'https://www.npns.fr/gif-porno/';
        const response = await axios.get(targetUrl, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(response.data);
        const allGifs = [];
        const seenUrls = new Set();

        $('img').each((i, element) => {
            const imgEl = $(element);
            let src = imgEl.attr('data-lazy-src') 
                || imgEl.attr('data-src') 
                || imgEl.attr('data-original') 
                || imgEl.attr('src') 
                || '';

            let alt = (imgEl.attr('alt') || '').trim();

            if (!src || src.startsWith('data:image/svg') || src.includes('logo') || src.includes('gravatar') || src.includes('icon')) {
                return;
            }

            if (src.startsWith('/')) {
                src = `https://www.npns.fr${src}`;
            }

            if (!seenUrls.has(src) && (src.includes('.gif') || src.includes('/wp-content/uploads/'))) {
                seenUrls.add(src);

                let title = alt ? `🔥 Hot Model GIF - ${alt.toUpperCase()}` : `🔥 Hot Model GIF #${allGifs.length + 1}`;

                allGifs.push({
                    id: `npns-${page}-${allGifs.length + 1}`,
                    type: 'gif',
                    title: title,
                    image_url: src,
                    gif_url: src,
                    thumbnail: src,
                    views: `${Math.floor(Math.random() * 120 + 30)}.${Math.floor(Math.random() * 9)}K`,
                    likes: `${Math.floor(Math.random() * 20 + 5)}.${Math.floor(Math.random() * 9)}K`,
                    source: 'npns.fr',
                    tags: ['gif', 'women', 'npns', alt || 'hot']
                });
            }
        });

        return {
            success: true,
            source: 'npns.fr',
            category: 'gifs',
            page: parseInt(page, 10) || 1,
            count: allGifs.length,
            gifs: allGifs
        };
    } catch (err) {
        console.warn('[NPNS Scraper Error]', err.message);
        return {
            success: false,
            source: 'npns.fr',
            error: err.message,
            gifs: []
        };
    }
}

module.exports = {
    scrapeNpnsGifs
};
