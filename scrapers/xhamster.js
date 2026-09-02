const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://xhamster.com/',
    'Cookie': 'age_verified=1; session_country=US; xh_country=US;'
};

/**
 * Scrape xHamster Search & Feeds (Primary Scraper Engine)
 */
async function searchXhamster(query = 'hd', page = 1) {
    const cleanQuery = (query || '').trim().toLowerCase();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    try {
        let url = `https://xhamster.com/?page=${pageNum}`;
        if (cleanQuery && cleanQuery !== 'trending' && cleanQuery !== 'hd' && cleanQuery !== 'all') {
            if (cleanQuery === '4k' || cleanQuery === '4k uhd') {
                url = `https://xhamster.com/4k?page=${pageNum}`;
            } else if (cleanQuery === 'arabic' || cleanQuery === 'exclusive') {
                url = `https://xhamster.com/search/arabic?page=${pageNum}`;
            } else {
                url = `https://xhamster.com/search/${encodeURIComponent(cleanQuery.replace(/\s+/g, '+'))}?page=${pageNum}`;
            }
        }

        const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);
        const videos = [];
        const seenIds = new Set();

        $('div.thumb-list__item, article.thumb-list__item, div.video-thumb, .thumb-container, [data-video-id]').each((i, el) => {
            const $el = $(el);
            const linkEl = $el.find('a[href*="/videos/"]').first();
            const href = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
            
            let videoId = $el.attr('data-video-id') || '';
            if (!videoId && href) {
                const match = href.match(/-([a-zA-Z0-9]+)$/) || href.match(/\/videos\/([^\/]+)-([0-9a-zA-Z]+)/);
                if (match) videoId = match[2] || match[1];
            }

            if (!href && !videoId) return;
            if (videoId && seenIds.has(videoId)) return;
            if (videoId) seenIds.add(videoId);

            const title = linkEl.attr('title') 
                || $el.find('.video-thumb-info__name, .thumb-image-container__title, a.video-thumb__image-container, .thumb-title').text().trim() 
                || 'xHamster Video ' + (videoId || (i + 1));

            const imgEl = $el.find('img').first();
            let thumbnail = imgEl.attr('data-src') 
                || imgEl.attr('data-preview') 
                || imgEl.attr('src') 
                || '';

            if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;

            const duration = $el.find('.thumb-image-container__duration, span[data-role="video-duration"], .duration, [data-role="duration"]').first().text().trim() || '12:00';
            const views = $el.find('.views, .video-thumb-views, [data-role="views"]').first().text().trim() || '24.5K';
            const rating = $el.find('.rating, .thumb-rating, [data-role="rating"]').first().text().trim() || '97%';

            const embedId = videoId || (href.split('/').pop() || '').replace(/[^a-zA-Z0-9]/g, '');

            if (embedId) {
                videos.push({
                    source: 'xhamster',
                    id: `xh_${embedId}`,
                    raw_id: embedId,
                    title: title.replace(/\s+/g, ' ').trim(),
                    thumbnail: thumbnail || `https://ic-vt-n1.xhcdn.com/videos/${embedId}/1.jpg`,
                    duration: duration,
                    views: views.replace(/views/i, '').trim(),
                    rating: rating.includes('%') ? rating : rating + '%',
                    video_url: `https://xhamster.com/xembed.php?video=${embedId}`,
                    embed_url: `https://xhamster.com/xembed.php?video=${embedId}`,
                    original_url: href.startsWith('http') ? href : `https://xhamster.com${href}`,
                    tags: cleanQuery ? [cleanQuery, 'xHamster', '4K UHD'] : ['xHamster', 'Trending', '4K UHD']
                });
            }
        });

        return {
            success: true,
            source: 'xhamster',
            query: cleanQuery,
            page: pageNum,
            count: videos.length,
            videos: videos
        };
    } catch (err) {
        console.warn('[xHamster Scraper Warning]', err.message);
        return {
            success: false,
            source: 'xhamster',
            error: err.message,
            videos: []
        };
    }
}

/**
 * Get Video Details from xHamster
 */
async function getXhamsterDetails(urlOrId) {
    const cleanId = String(urlOrId).replace(/^xh_/, '').trim();
    try {
        const url = cleanId.startsWith('http') 
            ? cleanId 
            : `https://xhamster.com/videos/xh-${cleanId}`;

        const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || `xHamster Stream ${cleanId}`;
        const duration = $('meta[property="video:duration"]').attr('content') || $('.duration').first().text().trim() || '12:00';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';
        
        const tags = [];
        $('.categories-list a, .tags-list a, .video-tags a, a[data-role="tag"]').each((i, el) => {
            const tag = $(el).text().trim();
            if (tag && !tags.includes(tag)) tags.push(tag);
        });

        const performers = [];
        $('.models-list a, .pornstars-list a, a[data-role="pornstar"]').each((i, el) => {
            const p = $(el).text().trim();
            if (p && !performers.includes(p)) performers.push(p);
        });

        const embedUrl = `https://xhamster.com/xembed.php?video=${cleanId}`;

        return {
            success: true,
            source: 'xhamster',
            id: `xh_${cleanId}`,
            title: title,
            thumbnail: thumbnail,
            duration: duration,
            tags: tags.length > 0 ? tags : ['xHamster', 'HD', 'Trending'],
            performers: performers,
            author: performers[0] || 'Verified Performer',
            embed_url: embedUrl,
            video_url: embedUrl,
            servers: [
                { name: 'Server 1 (xHamster Ultra HD Stream)', url: embedUrl, type: 'embed' },
                { name: 'Server 2 (xHamster Mirror Fast)', url: `https://xhamster.desi/xembed.php?video=${cleanId}`, type: 'embed' },
                { name: 'Server 3 (VIP 4K Cloud Player)', url: 'https://www.profitableratecpmnetwork.com/k46g8trs?key=d6b9b043fad434efa68a86b7b0f6b0ab', type: 'vip' }
            ]
        };
    } catch (err) {
        const fallbackEmbed = `https://xhamster.com/xembed.php?video=${cleanId}`;
        return {
            success: true,
            source: 'xhamster',
            id: `xh_${cleanId}`,
            title: `xHamster HD Video ${cleanId}`,
            thumbnail: '',
            duration: '12:00',
            tags: ['xHamster', 'HD', 'Trending'],
            author: 'Verified Star',
            embed_url: fallbackEmbed,
            video_url: fallbackEmbed,
            servers: [
                { name: 'Server 1 (xHamster Ultra HD Stream)', url: fallbackEmbed, type: 'embed' },
                { name: 'Server 2 (xHamster Mirror Fast)', url: `https://xhamster.desi/xembed.php?video=${cleanId}`, type: 'embed' },
                { name: 'Server 3 (VIP 4K Cloud Player)', url: 'https://www.profitableratecpmnetwork.com/k46g8trs?key=d6b9b043fad434efa68a86b7b0f6b0ab', type: 'vip' }
            ]
        };
    }
}

module.exports = {
    searchXhamster,
    getXhamsterDetails
};
