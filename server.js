require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { searchPornhub, getPornhubDetails } = require('./scrapers/pornhub');
const { searchXhamster, getXhamsterDetails } = require('./scrapers/xhamster');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'custom_videos.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '202620272028';

// In-Memory Fast Cache for Sub-Second Response Times
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

function getCached(key) {
    const entry = cache.get(key);
    if (entry && (Date.now() - entry.timestamp < CACHE_TTL_MS)) {
        return entry.data;
    }
    return null;
}

function setCache(key, data) {
    cache.set(key, { timestamp: Date.now(), data });
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-key'] || req.query.key;
    if (authHeader === ADMIN_PASSWORD || authHeader === `Bearer ${ADMIN_PASSWORD}`) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin password.' });
}

// Persistent Storage Helpers
function loadPersistentVideos() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(raw) || [];
        }
    } catch (e) {
        console.warn('[Storage Load]', e.message);
    }
    return [];
}

function savePersistentVideos(videos) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), 'utf8');
    } catch (e) {
        console.warn('[Storage Save]', e.message);
    }
}

let persistentVideos = loadPersistentVideos();

// Ultra-fast CDN Tube Feed Fetcher with Short Timeout (3000ms)
async function fetchOpenTubeVideos(query = 'hd', page = 1) {
    try {
        const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=24&page=${page}&thumbsize=big`;
        const res = await axios.get(url, { timeout: 3500 });
        if (res.data && res.data.videos) {
            return res.data.videos.map(v => ({
                id: v.id,
                source: 'open_tube',
                title: v.title,
                thumbnail: v.default_thumb ? v.default_thumb.src : '',
                duration: v.length_min || '12:00',
                views: v.views ? (parseInt(v.views, 10).toLocaleString()) : '15,200',
                rating: (v.rate ? v.rate : '96') + '%',
                embed_url: v.embed,
                video_url: v.embed,
                tags: query ? [query, 'HD', 'niksex'] : ['HD', 'niksex']
            }));
        }
    } catch (e) {
        console.warn('[FastFeed Error]', e.message);
    }
    return [];
}

// 0. API: Admin Login Verification
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            token: ADMIN_PASSWORD,
            message: 'Admin authenticated successfully.'
        });
    }
    return res.status(401).json({
        success: false,
        message: 'Invalid admin password. Access denied.'
    });
});

// 1. API: Blazing-Fast Videos Feed (Sub-200ms with Memory Cache & Parallel Resolvers)
app.get('/api/videos', async (req, res) => {
    let { category = 'trending', page = 1 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const normalizedCat = category.toLowerCase().trim();
    const cacheKey = `feed_${normalizedCat}_${pageNum}`;

    // Return instant memory cache if available
    const cachedData = getCached(cacheKey);
    if (cachedData) {
        return res.json(cachedData);
    }

    let videos = [];
    let queryTerm = normalizedCat;
    if (normalizedCat === 'sex_arabic' || normalizedCat === 'sex arabic' || normalizedCat === 'arabic') {
        queryTerm = 'arabic';
    } else if (normalizedCat === 'trending' || normalizedCat === 'all') {
        queryTerm = 'hd';
    }

    // A. Prepend persistent custom videos
    if (persistentVideos.length > 0 && pageNum === 1) {
        if (normalizedCat === 'trending' || normalizedCat === 'all') {
            videos = videos.concat(persistentVideos);
        } else {
            const filtered = persistentVideos.filter(v => {
                const titleMatch = v.title && v.title.toLowerCase().includes(queryTerm);
                const tagMatch = v.tags && v.tags.some(t => t.toLowerCase().includes(queryTerm));
                return titleMatch || tagMatch;
            });
            videos = videos.concat(filtered);
        }
    }

    // B. Parallel Non-Blocking Fetchers with Strict 2500ms Timeouts
    const fetchPromises = [
        // Fast CDN Video Feed
        fetchOpenTubeVideos(queryTerm, pageNum),
        // Pornhub Fast Search
        axios.get(`https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(queryTerm)}&page=${pageNum}&thumbsize=large`, { timeout: 2500 })
            .then(phRes => {
                if (phRes.data && phRes.data.videos) {
                    return phRes.data.videos.map(pv => ({
                        id: 'ph_' + pv.video_id,
                        source: 'pornhub',
                        title: pv.title,
                        thumbnail: pv.default_thumb || (pv.thumbs && pv.thumbs[0]?.src) || '',
                        duration: pv.duration || '10:00',
                        views: pv.views ? parseInt(pv.views, 10).toLocaleString() : '20,000',
                        rating: (pv.rating || '96') + '%',
                        embed_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                        video_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                        tags: pv.tags ? pv.tags.map(t => t.tag_name) : ['pornhub', queryTerm, 'niksex']
                    }));
                }
                return [];
            }).catch(() => [])
    ];

    const results = await Promise.allSettled(fetchPromises);
    results.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            videos = videos.concat(r.value);
        }
    });

    // Deduplicate by ID
    const seen = new Set();
    const uniqueVideos = videos.filter(v => {
        if (!v || !v.id || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
    });

    const responsePayload = {
        success: true,
        category,
        page: pageNum,
        count: uniqueVideos.length,
        videos: uniqueVideos
    };

    // Cache results for instant loading on subsequent requests
    if (uniqueVideos.length > 0) {
        setCache(cacheKey, responsePayload);
    }

    return res.json(responsePayload);
});

// 1.5 API: Hot Adult GIFs Feed with Hidden Smartlink Monetization Support
const { fetchAdultGifs, CURATED_GIFS } = require('./scrapers/gifs');

app.get('/api/gifs', async (req, res) => {
    const { q = 'hot', page = 1 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const cacheKey = `gifs_${q}_${pageNum}`;

    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
        const gifData = await fetchAdultGifs(q, pageNum);
        const payload = {
            success: true,
            category: 'gifs',
            page: pageNum,
            count: gifData.gifs.length,
            gifs: gifData.gifs
        };
        setCache(cacheKey, payload);
        return res.json(payload);
    } catch (err) {
        return res.json({
            success: true,
            category: 'gifs',
            page: pageNum,
            count: CURATED_GIFS.length,
            gifs: CURATED_GIFS
        });
    }
});


// 2. API: Fast Search across sources
app.get('/api/search', async (req, res) => {
    const { q = 'hd', page = 1 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const queryLower = q.toLowerCase();
    const cacheKey = `search_${queryLower}_${pageNum}`;

    const cachedData = getCached(cacheKey);
    if (cachedData) return res.json(cachedData);

    let results = [];

    // Check stored persistent videos first
    if (persistentVideos.length > 0 && pageNum === 1) {
        const storedMatches = persistentVideos.filter(v => 
            (v.title && v.title.toLowerCase().includes(queryLower)) ||
            (v.tags && v.tags.some(t => t.toLowerCase().includes(queryLower)))
        );
        results = results.concat(storedMatches);
    }

    const fetchPromises = [
        fetchOpenTubeVideos(q, pageNum),
        axios.get(`https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(q)}&page=${pageNum}&thumbsize=large`, { timeout: 2500 })
            .then(phRes => {
                if (phRes.data && phRes.data.videos) {
                    return phRes.data.videos.map(pv => ({
                        id: 'ph_' + pv.video_id,
                        source: 'pornhub',
                        title: pv.title,
                        thumbnail: pv.default_thumb || (pv.thumbs && pv.thumbs[0]?.src) || '',
                        duration: pv.duration || '10:00',
                        views: pv.views ? parseInt(pv.views, 10).toLocaleString() : '20,000',
                        rating: (pv.rating || '96') + '%',
                        embed_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                        video_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                        tags: pv.tags ? pv.tags.map(t => t.tag_name) : [q, 'niksex']
                    }));
                }
                return [];
            }).catch(() => [])
    ];

    const allRes = await Promise.allSettled(fetchPromises);
    allRes.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            results = results.concat(r.value);
        }
    });

    const seen = new Set();
    const uniqueResults = results.filter(v => {
        if (!v || !v.id || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
    });

    const responsePayload = {
        success: true,
        query: q,
        page: pageNum,
        count: uniqueResults.length,
        videos: uniqueResults
    };

    if (uniqueResults.length > 0) {
        setCache(cacheKey, responsePayload);
    }

    return res.json(responsePayload);
});

// 3. API: Universal Deep Scraper (Handles BOTH Single Video URLs & Full Page/Category URLs)
app.post('/api/admin/scrape-url', requireAdminAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const trimmedUrl = url.trim();
    console.log(`[Universal Scraper] Processing URL: ${trimmedUrl}`);

    // --- A. FAST SINGLE VIDEO DIRECT PATTERN RECOGNIZERS ---

    // 1. Pornhub Single Video Link
    if (trimmedUrl.includes('pornhub.com') && (trimmedUrl.includes('viewkey=') || trimmedUrl.includes('/view_video.php') || trimmedUrl.includes('/embed/'))) {
        const match = trimmedUrl.match(/viewkey=([a-zA-Z0-9]+)/) || trimmedUrl.match(/embed\/([a-zA-Z0-9]+)/);
        const vkey = match ? match[1] : trimmedUrl.split('/').pop().replace(/[^a-zA-Z0-9]/g, '');
        if (vkey) {
            try {
                const details = await getPornhubDetails(vkey);
                if (details.success && details.title && !details.title.toLowerCase().includes('age verification')) {
                    return res.json({ success: true, type: 'single', count: 1, videos: [details] });
                }
            } catch (e) {}
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'ph_' + vkey,
                    source: 'pornhub',
                    title: 'Pornhub HD Stream ' + vkey,
                    thumbnail: `https://ci.phncdn.com/videos/${vkey}/original/1.jpg`,
                    duration: '12:00',
                    views: '25,000',
                    rating: '98%',
                    embed_url: `https://www.pornhub.com/embed/${vkey}`,
                    video_url: `https://www.pornhub.com/embed/${vkey}`,
                    tags: ['pornhub', 'trending', 'niksex']
                }]
            });
        }
    }

    // 2. Eporner Single Video Link (Direct API Metadata Fetcher - Zero Age Verification Blocks)
    if (trimmedUrl.includes('eporner.com') && (trimmedUrl.includes('video-') || trimmedUrl.includes('hd-porn') || trimmedUrl.includes('embed') || trimmedUrl.includes('/video/'))) {
        const match = trimmedUrl.match(/(?:video-|hd-porn\/|embed\/|video\/)([a-zA-Z0-9]{4,20})/i);
        const vidId = match ? match[1] : '';
        if (vidId) {
            try {
                const epRes = await axios.get(`https://www.eporner.com/api/v2/video/id/?id=${vidId}&thumbsize=big`, { timeout: 5000 });
                if (epRes.data && epRes.data.id) {
                    const d = epRes.data;
                    return res.json({
                        success: true,
                        type: 'single',
                        count: 1,
                        videos: [{
                            id: 'ep_' + d.id,
                            source: 'eporner',
                            title: d.title,
                            thumbnail: (d.default_thumb && d.default_thumb.src) ? d.default_thumb.src : (d.thumbs && d.thumbs[0] ? d.thumbs[0].src : '/images/logo.png'),
                            duration: d.length_min || '12:00',
                            views: d.views ? parseInt(d.views, 10).toLocaleString() : '22,000',
                            rating: (d.rate || '98') + '%',
                            embed_url: d.embed || `https://www.eporner.com/embed/${d.id}/`,
                            video_url: d.embed || `https://www.eporner.com/embed/${d.id}/`,
                            category: (d.keywords && d.keywords.includes('arab')) ? 'sex_arabic' : 'trending',
                            is_trending: true,
                            tags: d.keywords ? d.keywords.split(',').map(t => t.trim()) : ['eporner', 'trending', 'niksex']
                        }]
                    });
                }
            } catch (e) {}

            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'ep_' + vidId,
                    source: 'eporner',
                    title: 'Eporner Ultra HD Stream ' + vidId,
                    thumbnail: `https://static-ca-cdn.eporner.com/thumbs/static4/1/${vidId}/15_360.jpg`,
                    duration: '15:00',
                    views: '25,000',
                    rating: '99%',
                    embed_url: `https://www.eporner.com/embed/${vidId}/`,
                    video_url: `https://www.eporner.com/embed/${vidId}/`,
                    tags: ['eporner', 'trending', 'niksex']
                }]
            });
        }
    }

    // 3. xHamster Single Video Link
    if (trimmedUrl.includes('xhamster.com') && (trimmedUrl.includes('/videos/') || trimmedUrl.includes('/xembed.php'))) {
        const match = trimmedUrl.match(/videos\/([^\/]+)-([0-9]+)/) || trimmedUrl.match(/-([a-zA-Z0-9]+)$/) || trimmedUrl.match(/video=([a-zA-Z0-9]+)/);
        const vidId = match ? (match[2] || match[1]) : '';
        if (vidId) {
            try {
                const details = await getXhamsterDetails(trimmedUrl);
                if (details.success && details.title && !details.title.toLowerCase().includes('age verification')) {
                    return res.json({ success: true, type: 'single', count: 1, videos: [details] });
                }
            } catch (e) {}
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'xh_' + vidId,
                    source: 'xhamster',
                    title: 'xHamster Video ' + vidId,
                    thumbnail: '/images/logo.png',
                    duration: '14:00',
                    views: '18,000',
                    rating: '97%',
                    embed_url: `https://xhamster.com/xembed.php?video=${vidId}`,
                    video_url: `https://xhamster.com/xembed.php?video=${vidId}`,
                    tags: ['xhamster', 'trending', 'niksex']
                }]
            });
        }
    }

    // 4. XVideos Single Video Link
    if (trimmedUrl.includes('xvideos.com') && (trimmedUrl.includes('/video') || trimmedUrl.includes('embedframe'))) {
        const match = trimmedUrl.match(/video([0-9]+)/) || trimmedUrl.match(/embedframe\/([0-9]+)/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'xv_' + vidId,
                    source: 'xvideos',
                    title: 'XVideos HD Stream ' + vidId,
                    thumbnail: `https://img-hw.xvideos-cdn.com/videos/thumbs169/${vidId.substring(0, 3)}/${vidId.substring(3, 6)}/${vidId}/1.jpg`,
                    duration: '15:00',
                    views: '32,000',
                    rating: '98%',
                    embed_url: `https://www.xvideos.com/embedframe/${vidId}`,
                    video_url: `https://www.xvideos.com/embedframe/${vidId}`,
                    tags: ['xvideos', 'trending', 'niksex']
                }]
            });
        }
    }

    // 5. SpankBang Single Video Link
    if (trimmedUrl.includes('spankbang.com') && (trimmedUrl.includes('/video/') || trimmedUrl.includes('/embed/'))) {
        const match = trimmedUrl.match(/spankbang\.com\/([a-zA-Z0-9]+)\/video/) || trimmedUrl.match(/spankbang\.com\/([a-zA-Z0-9]+)\/embed/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'sb_' + vidId,
                    source: 'spankbang',
                    title: 'SpankBang Video ' + vidId,
                    thumbnail: '/images/logo.png',
                    duration: '16:00',
                    views: '20,000',
                    rating: '97%',
                    embed_url: `https://spankbang.com/${vidId}/embed/`,
                    video_url: `https://spankbang.com/${vidId}/embed/`,
                    tags: ['spankbang', 'trending', 'niksex']
                }]
            });
        }
    }

    // 6. RedTube / YouPorn Single Video Link
    if (trimmedUrl.includes('redtube.com/') || trimmedUrl.includes('youporn.com/')) {
        const match = trimmedUrl.match(/redtube\.com\/([0-9]+)/) || trimmedUrl.match(/youporn\.com\/watch\/([0-9]+)/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'tube_' + vidId,
                    source: 'tube',
                    title: 'RedTube Video ' + vidId,
                    thumbnail: `https://img02.redtubefiles.com/_thumbs/${vidId}/1.jpg`,
                    duration: '12:00',
                    views: '15,000',
                    rating: '96%',
                    embed_url: `https://embed.redtube.com/?id=${vidId}&autoplay=1`,
                    video_url: `https://embed.redtube.com/?id=${vidId}`,
                    tags: ['redtube', 'trending', 'niksex']
                }]
            });
        }
    }

    // --- B. DEEP HTML SCRAPING FOR CHANNELS, CATEGORIES, MODELS, SEARCH PAGES & CUSTOM SITES ---
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Cookie': 'age_verified=1; accessAgeDisclaimerPH=1; platform=pc;'
        };

        const pageRes = await axios.get(trimmedUrl, { headers, timeout: 12000 });
        const html = pageRes.data;
        const $ = cheerio.load(html);
        const scrapedVideos = [];
        const seenIds = new Set();

        // 1. Specialized Scraper for Pornhub Pages
        if (trimmedUrl.includes('pornhub.com')) {
            $('ul.videos li.pcVideoListItem, .videoBlock, .wrap, .phimage, li[data-video-vkey]').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a[href*="viewkey="]').first();
                const href = link.attr('href') || $el.attr('data-video-vkey') || '';
                const match = href.match(/viewkey=([a-zA-Z0-9]+)/) || [null, href];
                const vkey = match[1];

                if (vkey && !seenIds.has(vkey)) {
                    seenIds.add(vkey);
                    const title = $el.find('.title a, .titleText, span.title a, a.linkVideoThumbDetails').first().text().trim() || link.attr('title') || 'Pornhub HD ' + vkey;
                    const img = $el.find('img').first();
                    const thumb = img.attr('data-thumb_url') || img.attr('data-mediumthumb') || img.attr('data-src') || img.attr('src') || '';
                    const duration = $el.find('.duration, var.duration').first().text().trim() || '12:00';
                    const views = $el.find('.views var, .views').first().text().trim() || '15,000';

                    scrapedVideos.push({
                        id: 'ph_' + vkey,
                        source: 'pornhub',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: views,
                        rating: '98%',
                        embed_url: `https://www.pornhub.com/embed/${vkey}`,
                        video_url: `https://www.pornhub.com/embed/${vkey}`,
                        tags: ['pornhub', 'trending', 'niksex']
                    });
                }
            });

            // If HTML was blocked by age gate, fallback to API search
            if (scrapedVideos.length === 0) {
                const termMatch = trimmedUrl.match(/video\/search\?search=([^&]+)/) || trimmedUrl.match(/category\/([^/?]+)/) || trimmedUrl.match(/channels\/([^/?]+)/);
                const queryTerm = termMatch ? decodeURIComponent(termMatch[1].replace(/\+/g, ' ')) : 'trending';
                try {
                    const apiRes = await axios.get(`https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(queryTerm)}&thumbsize=large`, { timeout: 4000 });
                    if (apiRes.data && apiRes.data.videos) {
                        apiRes.data.videos.slice(0, 40).forEach(pv => {
                            scrapedVideos.push({
                                id: 'ph_' + pv.video_id,
                                source: 'pornhub',
                                title: pv.title,
                                thumbnail: pv.default_thumb,
                                duration: pv.duration || '12:00',
                                views: pv.views ? parseInt(pv.views, 10).toLocaleString() : '20,000',
                                rating: (pv.rating || '96') + '%',
                                embed_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                                video_url: pv.embed_url || `https://www.pornhub.com/embed/${pv.video_id}`,
                                tags: ['pornhub', queryTerm, 'niksex']
                            });
                        });
                    }
                } catch (e) {}
            }
        }

        // 2. Specialized Scraper for xHamster Category / Channel / Search Pages
        else if (trimmedUrl.includes('xhamster.com')) {
            $('div.thumb-list__item, article.thumb-list__item, div.video-thumb, .thumb-image-container').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a[href*="/videos/"]').first();
                const href = link.attr('href') || '';
                let videoId = $el.attr('data-video-id') || '';
                if (!videoId && href) {
                    const match = href.match(/-([a-zA-Z0-9]+)$/) || href.match(/\/videos\/([^\/]+)-([0-9]+)/);
                    if (match) videoId = match[2] || match[1];
                }
                if ((videoId || href) && !seenIds.has(videoId || href)) {
                    const id = videoId || href.split('/').pop();
                    seenIds.add(id);
                    const title = link.attr('title') || $el.find('.video-thumb-info__name, .thumb-image-container__title').text().trim() || 'xHamster Video ' + id;
                    const img = $el.find('img').first();
                    const thumb = img.attr('data-src') || img.attr('data-preview') || img.attr('src') || '';
                    const duration = $el.find('.thumb-image-container__duration, .duration').first().text().trim() || '11:30';

                    scrapedVideos.push({
                        id: 'xh_' + id,
                        source: 'xhamster',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: '12,000',
                        rating: '96%',
                        embed_url: `https://xhamster.com/xembed.php?video=${id}`,
                        video_url: `https://xhamster.com/xembed.php?video=${id}`,
                        tags: ['xhamster', 'trending', 'niksex']
                    });
                }
            });
        }

        // 3. Specialized Scraper for XVideos Category / Search Pages
        else if (trimmedUrl.includes('xvideos.com')) {
            $('div.mozaique div.thumb-block, div.thumb-block').each((i, el) => {
                const $el = $(el);
                const id = $el.attr('data-id') || $el.attr('id')?.replace('video_', '');
                const link = $el.find('p.title a, .thumb-under a').first();
                const title = link.attr('title') || link.text().trim() || 'XVideos ' + id;
                const img = $el.find('img').first();
                const thumb = img.attr('data-src') || img.attr('src') || '';
                const duration = $el.find('span.duration').first().text().trim() || '10:00';

                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    scrapedVideos.push({
                        id: 'xv_' + id,
                        source: 'xvideos',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: '22,000',
                        rating: '97%',
                        embed_url: `https://www.xvideos.com/embedframe/${id}`,
                        video_url: `https://www.xvideos.com/embedframe/${id}`,
                        tags: ['xvideos', 'trending', 'niksex']
                    });
                }
            });
        }

        // 4. Specialized Scraper for Eporner (Bypasses Age Verification via Direct High-Speed API)
        else if (trimmedUrl.includes('eporner.com')) {
            // Check HTML grid first
            $('div.mb, div.mbunter').each((i, el) => {
                const $el = $(el);
                const link = $el.find('.mbtit a, .mbimage a').first();
                const href = link.attr('href') || '';
                const match = href.match(/\/hd-porn\/([a-zA-Z0-9]+)\//) || href.match(/\/video-([a-zA-Z0-9]+)\//);
                const id = match ? match[1] : '';
                const title = link.text().trim() || $el.find('.mbtit').text().trim() || 'Eporner Video ' + id;
                const img = $el.find('img').first();
                const thumb = img.attr('src') || img.attr('data-src') || '';
                const duration = $el.find('.mblg, .mbdur').first().text().trim() || '12:00';

                if (id && !seenIds.has(id) && !title.toLowerCase().includes('age verification')) {
                    seenIds.add(id);
                    scrapedVideos.push({
                        id: 'ep_' + id,
                        source: 'eporner',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: '18,000',
                        rating: '98%',
                        embed_url: `https://www.eporner.com/embed/${id}/`,
                        video_url: `https://www.eporner.com/embed/${id}/`,
                        tags: ['eporner', 'trending', 'niksex']
                    });
                }
            });

            // If HTML returned 0 videos (due to Age Gate), extract term and call Eporner API directly
            if (scrapedVideos.length === 0) {
                const termMatch = trimmedUrl.match(/\/category\/([^/?]+)/) || trimmedUrl.match(/\/search\/([^/?]+)/) || trimmedUrl.match(/\/cat\/([^/?]+)/);
                const queryTerm = termMatch ? decodeURIComponent(termMatch[1].replace(/[-_]/g, ' ')) : 'arabic';
                
                try {
                    const epApiUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(queryTerm)}&per_page=60&thumbsize=big`;
                    const epApiRes = await axios.get(epApiUrl, { timeout: 5000 });
                    if (epApiRes.data && epApiRes.data.videos && epApiRes.data.videos.length > 0) {
                        epApiRes.data.videos.forEach(v => {
                            if (!seenIds.has(v.id)) {
                                seenIds.add(v.id);
                                scrapedVideos.push({
                                    id: 'ep_' + v.id,
                                    source: 'eporner',
                                    title: v.title,
                                    thumbnail: v.default_thumb ? v.default_thumb.src : '/images/logo.png',
                                    duration: v.length_min || '12:00',
                                    views: v.views ? parseInt(v.views, 10).toLocaleString() : '25,000',
                                    rating: (v.rate || '98') + '%',
                                    embed_url: v.embed,
                                    video_url: v.embed,
                                    category: queryTerm.includes('arabic') ? 'sex_arabic' : 'trending',
                                    is_trending: true,
                                    tags: [queryTerm, 'trending', 'eporner', 'niksex']
                                });
                            }
                        });
                    }
                } catch (e) {}
            }
        }

        // 5. Specialized Scraper for SpankBang Pages
        else if (trimmedUrl.includes('spankbang.com')) {
            $('div.video-item, div.item').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a.n, a.thumb').first();
                const href = link.attr('href') || '';
                const match = href.match(/\/([a-zA-Z0-9]+)\/video\//);
                const id = match ? match[1] : '';
                const title = link.attr('title') || $el.find('a.n').text().trim() || 'SpankBang Video ' + id;
                const img = $el.find('img').first();
                const thumb = img.attr('data-src') || img.attr('src') || '';
                const duration = $el.find('.l').text().trim() || '10:00';

                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    scrapedVideos.push({
                        id: 'sb_' + id,
                        source: 'spankbang',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: '14,000',
                        rating: '97%',
                        embed_url: `https://spankbang.com/${id}/embed/`,
                        video_url: `https://spankbang.com/${id}/embed/`,
                        tags: ['spankbang', 'trending', 'niksex']
                    });
                }
            });
        }

        // 6. Universal HTML5 & Embed Link Scraper for ANY Webpage
        if (scrapedVideos.length === 0) {
            const ogVideo = $('meta[property="og:video:url"]').attr('content') || $('meta[property="og:video"]').attr('content') || $('meta[name="twitter:player"]').attr('content');
            const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
            const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || 'Web Video Stream';

            // Filter out junk Age Verification / Disclaimer titles
            const isJunkTitle = /age verification|disclaimer|just a moment|cloudflare|robot/i.test(pageTitle);

            if (ogVideo && !isJunkTitle) {
                scrapedVideos.push({
                    id: 'url_' + Date.now().toString(36),
                    source: 'universal',
                    title: pageTitle,
                    thumbnail: ogImage || '/images/logo.png',
                    duration: '12:00',
                    views: '10,000',
                    rating: '98%',
                    embed_url: ogVideo,
                    video_url: ogVideo,
                    tags: ['universal', 'trending', 'niksex']
                });
            }

            $('iframe').each((i, el) => {
                const src = $(el).attr('src') || '';
                if (src && (src.includes('embed') || src.includes('player') || src.includes('video') || src.includes('.mp4') || src.includes('html'))) {
                    const embedUrl = src.startsWith('//') ? 'https:' + src : (src.startsWith('http') ? src : new URL(src, trimmedUrl).href);
                    scrapedVideos.push({
                        id: 'embed_' + Date.now().toString(36) + '_' + i,
                        source: 'custom_embed',
                        title: isJunkTitle ? `Video Stream (Clip ${i + 1})` : `${pageTitle} (Player ${i + 1})`,
                        thumbnail: ogImage || '/images/logo.png',
                        duration: '10:00',
                        views: '5,000',
                        rating: '97%',
                        embed_url: embedUrl,
                        video_url: embedUrl,
                        tags: ['embed', 'trending', 'niksex']
                    });
                }
            });
        }

        if (scrapedVideos.length > 0) {
            return res.json({
                success: true,
                type: 'page_batch',
                count: scrapedVideos.length,
                page_url: trimmedUrl,
                videos: scrapedVideos
            });
        }

        // 7. Last Resort Fallback: If not a junk page, create direct stream
        const rawTitle = $('title').text().trim();
        const isJunk = /age verification|disclaimer|just a moment|cloudflare|robot/i.test(rawTitle);

        if (!isJunk && rawTitle) {
            return res.json({
                success: true,
                type: 'single',
                count: 1,
                videos: [{
                    id: 'direct_' + Date.now().toString(36),
                    source: 'web_stream',
                    title: rawTitle,
                    thumbnail: $('meta[property="og:image"]').attr('content') || '/images/logo.png',
                    duration: '10:00',
                    views: '10,000',
                    rating: '98%',
                    embed_url: trimmedUrl,
                    video_url: trimmedUrl,
                    tags: ['direct', 'trending', 'niksex']
                }]
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Unable to bypass page security or no videos found. Please try another category or search link.'
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Scraping failed: ' + err.message
        });
    }
});

// --- CMS MANAGEMENT ENDPOINTS (FULL INTEGRATED CMS ENGINE) ---

// 4. API: Save Scraped Videos Permanently (Protected - All Saved to Trending by Default)
app.post('/api/admin/save-videos', requireAdminAuth, (req, res) => {
    const { videos } = req.body;
    if (Array.isArray(videos) && videos.length > 0) {
        const existingIds = new Set(persistentVideos.map(v => v.id));
        const newVids = videos
            .filter(v => !existingIds.has(v.id))
            .map(v => ({
                ...v,
                category: v.category || 'trending',
                is_trending: true,
                tags: Array.from(new Set([...(v.tags || []), 'trending', 'featured', 'niksex'])),
                imported_at: Date.now()
            }));

        persistentVideos = newVids.concat(persistentVideos);
        savePersistentVideos(persistentVideos);
        cache.clear(); // Clear cache so they appear instantly

        return res.json({
            success: true,
            message: `Successfully saved & published ${newVids.length} video(s) to CMS!`,
            total_stored: persistentVideos.length
        });
    }
    return res.status(400).json({ success: false, message: 'Invalid video array.' });
});

// 5. API: Get All Stored Videos with Search & Pagination (Protected)
app.get('/api/admin/imported-videos', requireAdminAuth, (req, res) => {
    const { q, category } = req.query;
    let filtered = [...persistentVideos];

    if (q) {
        const term = q.toLowerCase().trim();
        filtered = filtered.filter(v => (v.title && v.title.toLowerCase().includes(term)) || (v.id && v.id.toLowerCase().includes(term)));
    }
    if (category && category !== 'all') {
        const cat = category.toLowerCase().trim();
        filtered = filtered.filter(v => (v.category && v.category.toLowerCase().includes(cat)) || (v.tags && v.tags.some(t => t.toLowerCase().includes(cat))));
    }

    return res.json({
        success: true,
        count: filtered.length,
        total_stored: persistentVideos.length,
        videos: filtered
    });
});

// 6. API: Add Video Manually (Protected CMS Action)
app.post('/api/admin/add-video', requireAdminAuth, (req, res) => {
    const { title, embed_url, video_url, thumbnail, duration, views, rating, category, tags, is_trending } = req.body;
    if (!title || (!embed_url && !video_url)) {
        return res.status(400).json({ success: false, message: 'Title and Video/Embed URL are required.' });
    }

    const newVideo = {
        id: 'manual_' + Date.now().toString(36),
        source: 'manual_cms',
        title: title.trim(),
        embed_url: (embed_url || video_url).trim(),
        video_url: (embed_url || video_url).trim(),
        thumbnail: thumbnail ? thumbnail.trim() : '/images/logo.png',
        duration: duration ? duration.trim() : '12:00',
        views: views ? views.trim() : '20,000',
        rating: rating ? rating.trim() : '98%',
        category: category ? category.trim() : 'trending',
        is_trending: is_trending !== false,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['manual', 'featured', 'niksex']),
        imported_at: Date.now()
    };

    persistentVideos.unshift(newVideo);
    savePersistentVideos(persistentVideos);
    cache.clear();

    return res.json({
        success: true,
        message: 'Video added manually to CMS successfully!',
        video: newVideo,
        total_stored: persistentVideos.length
    });
});

// 7. API: Edit Stored Video Metadata (Protected)
app.put('/api/admin/edit-video/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { title, thumbnail, embed_url, duration, views, rating, tags, category, is_trending } = req.body;
    const videoIndex = persistentVideos.findIndex(v => v.id === id);

    if (videoIndex !== -1) {
        if (title) persistentVideos[videoIndex].title = title.trim();
        if (thumbnail) persistentVideos[videoIndex].thumbnail = thumbnail.trim();
        if (embed_url) {
            persistentVideos[videoIndex].embed_url = embed_url.trim();
            persistentVideos[videoIndex].video_url = embed_url.trim();
        }
        if (duration) persistentVideos[videoIndex].duration = duration.trim();
        if (views) persistentVideos[videoIndex].views = views.trim();
        if (rating) persistentVideos[videoIndex].rating = rating.trim();
        if (category) persistentVideos[videoIndex].category = category.trim();
        if (is_trending !== undefined) persistentVideos[videoIndex].is_trending = Boolean(is_trending);
        if (tags) {
            persistentVideos[videoIndex].tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        }

        savePersistentVideos(persistentVideos);
        cache.clear();

        return res.json({
            success: true,
            message: 'Video metadata updated successfully in CMS.',
            video: persistentVideos[videoIndex]
        });
    }
    return res.status(404).json({ success: false, message: 'Video not found in stored database.' });
});

// 8. API: Delete Single Video (Protected)
app.delete('/api/admin/delete-video/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    persistentVideos = persistentVideos.filter(v => v.id !== id);
    savePersistentVideos(persistentVideos);
    cache.clear();
    return res.json({
        success: true,
        message: 'Video removed from permanent storage.',
        total_stored: persistentVideos.length
    });
});

// 9. API: Bulk Delete Videos (Protected)
app.post('/api/admin/bulk-delete', requireAdminAuth, (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        persistentVideos = persistentVideos.filter(v => !idSet.has(v.id));
        savePersistentVideos(persistentVideos);
        cache.clear();
        return res.json({
            success: true,
            message: `Successfully deleted ${ids.length} videos from CMS!`,
            total_stored: persistentVideos.length
        });
    }
    return res.status(400).json({ success: false, message: 'Invalid IDs array.' });
});

// 10. API: Pin Video to Top of Feed (Protected)
app.post('/api/admin/pin-top/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const index = persistentVideos.findIndex(v => v.id === id);
    if (index !== -1) {
        const [video] = persistentVideos.splice(index, 1);
        video.is_trending = true;
        persistentVideos.unshift(video);
        savePersistentVideos(persistentVideos);
        cache.clear();
        return res.json({
            success: true,
            message: `"${video.title}" is now pinned to the #1 Top position!`,
            video
        });
    }
    return res.status(404).json({ success: false, message: 'Video not found.' });
});

// 11. API: Toggle Trending State (Protected)
app.post('/api/admin/toggle-trending/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const video = persistentVideos.find(v => v.id === id);
    if (video) {
        video.is_trending = !video.is_trending;
        savePersistentVideos(persistentVideos);
        cache.clear();
        return res.json({
            success: true,
            message: `Trending state updated to: ${video.is_trending}`,
            is_trending: video.is_trending
        });
    }
    return res.status(404).json({ success: false, message: 'Video not found.' });
});

// 12. API: 1-Click Keyword Batch Auto-Scraper (Protected)
app.post('/api/admin/batch-auto-scrape', requireAdminAuth, async (req, res) => {
    const { keyword = 'arabic', count = 30 } = req.body;
    const targetCount = Math.min(parseInt(count, 10) || 30, 60);

    try {
        const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(keyword)}&per_page=${targetCount}&thumbsize=big`;
        const apiRes = await axios.get(url, { timeout: 6000 });

        if (apiRes.data && apiRes.data.videos && apiRes.data.videos.length > 0) {
            const existingIds = new Set(persistentVideos.map(v => v.id));
            const newVideos = apiRes.data.videos
                .filter(v => !existingIds.has(v.id))
                .map(v => ({
                    id: 'ep_' + v.id,
                    source: 'batch_scraper',
                    title: v.title,
                    thumbnail: v.default_thumb ? v.default_thumb.src : '/images/logo.png',
                    duration: v.length_min || '12:00',
                    views: v.views ? parseInt(v.views, 10).toLocaleString() : '25,000',
                    rating: (v.rate ? v.rate : '98') + '%',
                    embed_url: v.embed,
                    video_url: v.embed,
                    category: keyword.toLowerCase().includes('arabic') ? 'sex_arabic' : 'trending',
                    is_trending: true,
                    tags: [keyword, 'trending', 'batch', 'niksex'],
                    imported_at: Date.now()
                }));

            persistentVideos = newVideos.concat(persistentVideos);
            savePersistentVideos(persistentVideos);
            cache.clear();

            return res.json({
                success: true,
                message: `Successfully auto-scraped & imported ${newVideos.length} fresh HD videos for keyword "${keyword}"!`,
                imported_count: newVideos.length,
                total_stored: persistentVideos.length
            });
        }
        return res.status(404).json({ success: false, message: 'No videos found for this keyword.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Batch Auto-Scrape failed: ' + e.message });
    }
});

// 13. API: Dashboard CMS Analytics & System Stats (Protected)
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
    const totalStored = persistentVideos.length;
    const categoryCounts = {};
    persistentVideos.forEach(v => {
        const cat = v.category || 'trending';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const memoryUsage = process.memoryUsage();
    return res.json({
        success: true,
        stats: {
            total_videos: totalStored,
            category_breakdown: categoryCounts,
            cache_entries: cache.size,
            memory_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            node_version: process.version,
            uptime_seconds: Math.round(process.uptime()),
            platform: 'Vercel Serverless / Express'
        }
    });
});

// 14. API: Site Settings & SEO Config Management (Protected)
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {
        site_name: 'niksex',
        site_title: 'niksex - WATCH • EXPLORE • ENJOY | Next-Gen Video Streaming',
        meta_description: 'Watch high-definition videos with ultra-fast streaming, Sex Arabic collection, categories, smart personalization, and infinite scrolling on niksex.',
        meta_keywords: 'niksex, adult streaming, sex arabic, 4k uhd, hd videos, video search engine',
        footer_copyright: '© 2026 niksex. All rights reserved.',
        anti_redirect_enabled: true,
        default_category: 'trending',
        cache_ttl_minutes: 15
    };
}

function saveSettings(settings) {
    try {
        const dir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    } catch (e) {}
}

app.get('/api/admin/settings', requireAdminAuth, (req, res) => {
    return res.json({ success: true, settings: loadSettings() });
});

app.post('/api/admin/settings', requireAdminAuth, (req, res) => {
    const current = loadSettings();
    const updated = { ...current, ...(req.body.settings || req.body) };
    saveSettings(updated);
    cache.clear();
    return res.json({ success: true, message: 'Site configuration saved successfully!', settings: updated });
});

// 15. API: Database Backup Export & Restore Import (Protected)
app.get('/api/admin/export-database', requireAdminAuth, (req, res) => {
    const backup = {
        exported_at: new Date().toISOString(),
        site_name: 'niksex',
        total_videos: persistentVideos.length,
        settings: loadSettings(),
        videos: persistentVideos
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=niksex_backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backup, null, 2));
});

app.post('/api/admin/import-database', requireAdminAuth, (req, res) => {
    const { videos, mode = 'merge' } = req.body;
    if (!Array.isArray(videos)) {
        return res.status(400).json({ success: false, message: 'Invalid JSON database file.' });
    }

    if (mode === 'replace') {
        persistentVideos = videos;
    } else {
        const existingIds = new Set(persistentVideos.map(v => v.id));
        const newOnes = videos.filter(v => !existingIds.has(v.id));
        persistentVideos = newOnes.concat(persistentVideos);
    }

    savePersistentVideos(persistentVideos);
    cache.clear();

    return res.json({
        success: true,
        message: `Database imported successfully! Total videos in CMS: ${persistentVideos.length}`,
        total_stored: persistentVideos.length
    });
});

// 16. API: Instant Cache Flush (Protected)
app.post('/api/admin/clear-cache', requireAdminAuth, (req, res) => {
    const count = cache.size;
    cache.clear();
    return res.json({ success: true, message: `System In-Memory Cache Flushed! (${count} entries cleared)` });
});

// 17. API: Reset / Clear All Stored Videos (Protected)
app.post('/api/admin/clear-all-videos', requireAdminAuth, (req, res) => {
    const count = persistentVideos.length;
    persistentVideos = [];
    savePersistentVideos(persistentVideos);
    cache.clear();
    return res.json({ success: true, message: `All ${count} stored videos have been removed from CMS.` });
});

// 8. Dynamic XML Sitemap for SEO & Search Engine Indexing
app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    const baseUrl = 'https://niksex.vercel.app';
    const categories = ['trending', 'sex_arabic', '4k', 'amateur', 'milf', 'lesbian', 'teen', 'anal', 'blowjob', 'hardcore', 'asian', 'ebony', 'latina', 'vr'];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Homepage & Static Pages
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/dmca.html</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/terms.html</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/privacy.html</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/2257.html</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/contact.html</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;

    // Category Pages
    categories.forEach(cat => {
        xml += `  <url><loc>${baseUrl}/?cat=${cat}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    });

    // Stored Videos
    persistentVideos.forEach(v => {
        xml += `  <url><loc>${baseUrl}/watch.html?id=${encodeURIComponent(v.id)}&amp;title=${encodeURIComponent(v.title || 'HD+Video')}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    });

    xml += `</urlset>`;
    return res.send(xml);
});

// Admin Routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admincp', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// SPA Fallback to index.html for all frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only listen when executed directly (not in Vercel serverless lambda)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 niksex High-Speed Engine running on port ${PORT}`);
        console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
        console.log(`🔒 Admin Panel:  http://localhost:${PORT}/admin`);
        console.log(`⚡ In-Memory Fast Cache: Active`);
        console.log(`✨ Ready for Vercel Deployment`);
        console.log(`====================================================`);
    });
}

module.exports = app;
