const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://xhamster.com/',
    'Cookie': 'age_verified=1; session_country=US;'
};

/**
 * Scrape xHamster Search Results
 */
async function searchXhamster(query = '', page = 1) {
    try {
        const encodedQuery = encodeURIComponent(query.replace(/\s+/g, '+'));
        const url = query 
            ? `https://xhamster.com/search/${encodedQuery}?page=${page}`
            : `https://xhamster.com/?page=${page}`;

        const response = await axios.get(url, { headers: HEADERS, timeout: 25000 });
        const $ = cheerio.load(response.data);
        const videos = [];

        // Select video containers
        $('div.thumb-list__item, article.thumb-list__item, div.video-thumb, .thumb-container').each((i, el) => {
            const $el = $(el);
            const linkEl = $el.find('a[href*="/videos/"]').first();
            const href = linkEl.attr('href') || '';
            
            // Extract video ID from URL, e.g., https://xhamster.com/videos/video-title-123456 or data-video-id
            let videoId = $el.attr('data-video-id') || '';
            if (!videoId && href) {
                const match = href.match(/-([a-zA-Z0-9]+)$/) || href.match(/\/videos\/([^\/]+)-([0-9]+)/);
                if (match) videoId = match[2] || match[1];
            }

            if (!href && !videoId) return;

            const title = linkEl.attr('title') 
                || $el.find('.video-thumb-info__name, .thumb-image-container__title, a.video-thumb__image-container').text().trim() 
                || 'xHamster Video ' + (videoId || (i + 1));

            const imgEl = $el.find('img').first();
            let thumbnail = imgEl.attr('data-src') 
                || imgEl.attr('data-preview') 
                || imgEl.attr('src') 
                || '';

            const duration = $el.find('.thumb-image-container__duration, span[data-role="video-duration"], .duration').first().text().trim() || '00:00';
            const views = $el.find('.views, .video-thumb-views').first().text().trim() || '0';
            const rating = $el.find('.rating, .thumb-rating').first().text().trim() || '95%';

            const embedId = videoId || href.split('/').pop();

            videos.push({
                source: 'xhamster',
                id: embedId,
                title: title,
                thumbnail: thumbnail,
                duration: duration,
                views: views,
                rating: rating,
                video_url: `https://xhamster.com/xembed.php?video=${embedId}`,
                embed_url: `https://xhamster.com/xembed.php?video=${embedId}`,
                iframe: `<iframe src="https://xhamster.com/xembed.php?video=${embedId}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
                original_url: href.startsWith('http') ? href : `https://xhamster.com${href}`,
                video_type: 'embed',
                tags: query ? [query, 'xhamster'] : ['xhamster']
            });
        });

        return {
            success: true,
            source: 'xhamster',
            query: query,
            page: page,
            count: videos.length,
            videos: videos
        };
    } catch (err) {
        console.error('[xHamster Scraper Error]', err.message);
        return {
            success: false,
            source: 'xhamster',
            error: err.message,
            videos: []
        };
    }
}

/**
 * Scrape Single xHamster Video Details
 */
async function getXhamsterDetails(urlOrId) {
    try {
        const url = urlOrId.startsWith('http') 
            ? urlOrId 
            : `https://xhamster.com/videos/xh-${urlOrId}`;

        const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim();
        const duration = $('meta[property="video:duration"]').attr('content') || $('.duration').first().text().trim() || '00:00';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';
        const description = $('meta[property="og:description"]').attr('content') || '';
        
        const tags = [];
        $('.categories-list a, .tags-list a, .video-tags a').each((i, el) => {
            const tag = $(el).text().trim();
            if (tag && !tags.includes(tag)) tags.push(tag);
        });

        const performers = [];
        $('.models-list a, .pornstars-list a').each((i, el) => {
            const p = $(el).text().trim();
            if (p && !performers.includes(p)) performers.push(p);
        });

        return {
            success: true,
            source: 'xhamster',
            title: title || 'xHamster Video',
            thumbnail: thumbnail,
            duration: duration,
            description: description,
            tags: tags,
            performers: performers,
            embed_url: `https://xhamster.com/xembed.php?video=${urlOrId}`,
            iframe: `<iframe src="https://xhamster.com/xembed.php?video=${urlOrId}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
            original_url: url
        };
    } catch (err) {
        return {
            success: false,
            source: 'xhamster',
            error: err.message
        };
    }
}

module.exports = {
    searchXhamster,
    getXhamsterDetails
};
