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
 * Scrape Pornhub Search Results
 */
async function searchPornhub(query = '', page = 1) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = query 
            ? `https://www.pornhub.com/video/search?search=${encodedQuery}&page=${page}`
            : `https://www.pornhub.com/video?page=${page}`;

        const response = await axios.get(url, { headers: HEADERS, timeout: 25000 });
        const $ = cheerio.load(response.data);
        const videos = [];

        // Select video containers
        $('ul.videos.search-video-thumbs li.pcVideoListItem, #videoSearchResult li.pcVideoListItem, .videoBlock').each((i, el) => {
            const $el = $(el);
            const viewkey = $el.attr('_vkey') || $el.attr('data-video-vkey') || '';
            const linkEl = $el.find('a[href*="viewkey="]').first();
            const href = linkEl.attr('href') || '';
            
            // Extract viewkey from href if not in attribute
            let finalKey = viewkey;
            if (!finalKey && href.includes('viewkey=')) {
                const match = href.match(/viewkey=([a-zA-Z0-9]+)/);
                if (match) finalKey = match[1];
            }

            if (!finalKey) return;

            const title = $el.find('.title a, .titleText, span.title a').first().text().trim() 
                || linkEl.attr('title') 
                || 'Pornhub Video ' + finalKey;

            const imgEl = $el.find('img').first();
            let thumbnail = imgEl.attr('data-thumb_url') 
                || imgEl.attr('data-mediumthumb') 
                || imgEl.attr('data-src') 
                || imgEl.attr('src') 
                || '';

            const duration = $el.find('.duration, var.duration').first().text().trim() || '00:00';
            const views = $el.find('.views var, .views').first().text().trim() || '0';
            const rating = $el.find('.value').first().text().trim() || '90%';
            const previewVideo = $el.attr('data-mediabook') 
                || imgEl.attr('data-mediabook') 
                || imgEl.attr('data-preview') 
                || $el.find('video source').attr('src')
                || '';

            videos.push({
                source: 'pornhub',
                id: finalKey,
                title: title,
                thumbnail: thumbnail,
                preview_video: previewVideo,
                duration: duration,
                views: views,
                rating: rating,
                video_url: `https://www.pornhub.com/embed/${finalKey}`,
                embed_url: `https://www.pornhub.com/embed/${finalKey}`,
                iframe: `<iframe src="https://www.pornhub.com/embed/${finalKey}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
                original_url: `https://www.pornhub.com/view_video.php?viewkey=${finalKey}`,
                video_type: 'embed',
                tags: query ? [query, 'pornhub'] : ['pornhub']
            });

        });

        return {
            success: true,
            source: 'pornhub',
            query: query,
            page: page,
            count: videos.length,
            videos: videos
        };
    } catch (err) {
        console.error('[Pornhub Scraper Error]', err.message);
        return {
            success: false,
            source: 'pornhub',
            error: err.message,
            videos: []
        };
    }
}

/**
 * Scrape Single Pornhub Video Details & Tags
 */
async function getPornhubDetails(viewkey) {
    try {
        const url = `https://www.pornhub.com/view_video.php?viewkey=${viewkey}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(response.data);

        const title = $('h1.title span, .video-wrapper h1').first().text().trim();
        const duration = $('meta[property="video:duration"]').attr('content') || $('.duration').first().text().trim() || '00:00';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';
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
            id: viewkey,
            title: title || 'Pornhub Video',
            thumbnail: thumbnail,
            duration: duration,
            description: description,
            tags: tags,
            performers: performers,
            embed_url: `https://www.pornhub.com/embed/${viewkey}`,
            iframe: `<iframe src="https://www.pornhub.com/embed/${viewkey}" frameborder="0" width="100%" height="480" scrolling="no" allowfullscreen></iframe>`,
            original_url: url
        };
    } catch (err) {
        return {
            success: false,
            source: 'pornhub',
            error: err.message
        };
    }
}

module.exports = {
    searchPornhub,
    getPornhubDetails
};
