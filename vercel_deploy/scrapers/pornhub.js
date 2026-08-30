const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://www.pornhub.com/',
    'Cookie': 'accessAgeDisclaimerPH=1; age_verified=1; hasVisited=1; platform=pc; bs=1'
};

/**
 * Scrape or API Search Pornhub Videos
 */
async function searchPornhub(query = '', page = 1) {
    const cleanQuery = (query || '').trim();
    const encodedQuery = encodeURIComponent(cleanQuery || 'hd');
    const pageNum = parseInt(page, 10) || 1;

    // 1. Fast & Reliable Official Webmaster API Search
    try {
        const apiUrl = `https://www.pornhub.com/webmasters/search?search=${encodedQuery}&page=${pageNum}&thumbsize=large`;
        const apiRes = await axios.get(apiUrl, { timeout: 6000 });
        if (apiRes.data && Array.isArray(apiRes.data.videos) && apiRes.data.videos.length > 0) {
            const videos = apiRes.data.videos.map(pv => {
                const vidId = pv.video_id;
                const thumb = pv.default_thumb || (pv.thumbs && pv.thumbs[0]?.src) || `https://ci.phncdn.com/videos/${vidId}/original/1.jpg`;
                const embedUrl = `https://www.pornhub.com/embed/${vidId}`;
                const tags = pv.tags ? pv.tags.map(t => typeof t === 'object' ? t.tag_name : t) : [cleanQuery || 'trending', 'pornhub', 'niksex'];

                return {
                    source: 'pornhub',
                    id: `ph_${vidId}`,
                    video_id: vidId,
                    title: pv.title || `Pornhub Video ${vidId}`,
                    thumbnail: thumb,
                    preview_video: (pv.thumbs && pv.thumbs[1]?.src) || thumb,
                    duration: pv.duration || '10:00',
                    views: pv.views ? parseInt(pv.views, 10).toLocaleString() : '25,000',
                    rating: (pv.rating ? pv.rating : '96') + '%',
                    video_url: embedUrl,
                    embed_url: embedUrl,
                    iframe: `<iframe src="${embedUrl}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
                    original_url: pv.url || `https://www.pornhub.com/view_video.php?viewkey=${vidId}`,
                    video_type: 'embed',
                    tags: tags
                };
            });

            return {
                success: true,
                source: 'pornhub',
                query: cleanQuery,
                page: pageNum,
                count: videos.length,
                videos: videos
            };
        }
    } catch (apiErr) {
        console.warn('[Pornhub Webmaster API Warning]', apiErr.message);
    }

    // 2. HTML Scraper Fallback
    try {
        const url = cleanQuery 
            ? `https://www.pornhub.com/video/search?search=${encodedQuery}&page=${pageNum}`
            : `https://www.pornhub.com/video?page=${pageNum}`;

        const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);
        const videos = [];
        const seenKeys = new Set();

        $('ul.videos li.pcVideoListItem, #videoSearchResult li.pcVideoListItem, .videoBlock, li[data-video-vkey]').each((i, el) => {
            const $el = $(el);
            const viewkey = $el.attr('_vkey') || $el.attr('data-video-vkey') || '';
            const linkEl = $el.find('a[href*="viewkey="]').first();
            const href = linkEl.attr('href') || '';
            
            let finalKey = viewkey;
            if (!finalKey && href.includes('viewkey=')) {
                const match = href.match(/viewkey=([a-zA-Z0-9]+)/);
                if (match) finalKey = match[1];
            }

            if (!finalKey || seenKeys.has(finalKey)) return;
            seenKeys.add(finalKey);

            const title = $el.find('.title a, .titleText, span.title a').first().text().trim() 
                || linkEl.attr('title') 
                || 'Pornhub Video ' + finalKey;

            const imgEl = $el.find('img').first();
            const thumbnail = imgEl.attr('data-thumb_url') 
                || imgEl.attr('data-mediumthumb') 
                || imgEl.attr('data-src') 
                || imgEl.attr('src') 
                || `https://ci.phncdn.com/videos/${finalKey}/original/1.jpg`;

            const duration = $el.find('.duration, var.duration').first().text().trim() || '10:00';
            const views = $el.find('.views var, .views').first().text().trim() || '20,000';
            const rating = $el.find('.value').first().text().trim() || '95%';
            const embedUrl = `https://www.pornhub.com/embed/${finalKey}`;

            videos.push({
                source: 'pornhub',
                id: `ph_${finalKey}`,
                video_id: finalKey,
                title: title,
                thumbnail: thumbnail,
                preview_video: $el.attr('data-mediabook') || imgEl.attr('data-preview') || thumbnail,
                duration: duration,
                views: views,
                rating: rating,
                video_url: embedUrl,
                embed_url: embedUrl,
                iframe: `<iframe src="${embedUrl}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
                original_url: `https://www.pornhub.com/view_video.php?viewkey=${finalKey}`,
                video_type: 'embed',
                tags: cleanQuery ? [cleanQuery, 'pornhub', 'niksex'] : ['pornhub', 'trending', 'niksex']
            });
        });

        if (videos.length > 0) {
            return {
                success: true,
                source: 'pornhub',
                query: cleanQuery,
                page: pageNum,
                count: videos.length,
                videos: videos
            };
        }
    } catch (htmlErr) {
        console.warn('[Pornhub HTML Scraper Fallback]', htmlErr.message);
    }

    return {
        success: false,
        source: 'pornhub',
        query: cleanQuery,
        page: pageNum,
        count: 0,
        videos: []
    };
}

/**
 * Scrape Single Pornhub Video Details & Tags
 */
async function getPornhubDetails(viewkey) {
    const rawKey = String(viewkey || '').trim();
    const cleanKey = rawKey.replace(/^ph_?/, '');
    const embedUrl = `https://www.pornhub.com/embed/${cleanKey}`;
    const originalUrl = `https://www.pornhub.com/view_video.php?viewkey=${cleanKey}`;

    if (!cleanKey) {
        return { success: false, source: 'pornhub', message: 'Invalid viewkey' };
    }

    try {
        const response = await axios.get(originalUrl, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(response.data);

        const title = $('h1.title span, .video-wrapper h1, meta[property="og:title"]').first().text().trim() || $('meta[property="og:title"]').attr('content') || `Pornhub Video ${cleanKey}`;
        const duration = $('meta[property="video:duration"]').attr('content') || $('.duration').first().text().trim() || '12:00';
        const thumbnail = $('meta[property="og:image"]').attr('content') || `https://ci.phncdn.com/videos/${cleanKey}/original/1.jpg`;
        const description = $('meta[property="og:description"]').attr('content') || $('.videoDescriptionText').text().trim() || '';
        
        const tags = [];
        $('.categoriesWrapper a, .tagsWrapper a').each((i, el) => {
            const tag = $(el).text().trim();
            if (tag && !tags.includes(tag)) tags.push(tag);
        });

        const performers = [];
        $('.pornstarsWrapper a, .pstar-list-btn a').each((i, el) => {
            const p = $(el).text().trim();
            if (p && !performers.includes(p)) performers.push(p);
        });

        return {
            success: true,
            source: 'pornhub',
            id: `ph_${cleanKey}`,
            video_id: cleanKey,
            title: title,
            thumbnail: thumbnail,
            duration: duration,
            description: description,
            tags: tags.length > 0 ? tags : ['pornhub', 'trending', 'niksex'],
            performers: performers,
            video_url: embedUrl,
            embed_url: embedUrl,
            iframe: `<iframe src="${embedUrl}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
            original_url: originalUrl
        };
    } catch (err) {
        // Return structured object with valid embed URL even if page metadata scrape is restricted
        return {
            success: true,
            source: 'pornhub',
            id: `ph_${cleanKey}`,
            video_id: cleanKey,
            title: `Pornhub Stream ${cleanKey}`,
            thumbnail: `https://ci.phncdn.com/videos/${cleanKey}/original/1.jpg`,
            duration: '12:00',
            description: '',
            tags: ['pornhub', 'trending', 'niksex'],
            performers: [],
            video_url: embedUrl,
            embed_url: embedUrl,
            iframe: `<iframe src="${embedUrl}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
            original_url: originalUrl
        };
    }
}

module.exports = {
    searchPornhub,
    getPornhubDetails
};
