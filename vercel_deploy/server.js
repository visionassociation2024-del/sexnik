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

// 3. API: Deep Page & Site Scraper (Extracts ALL videos from any Channel / Category / Search Page URL)
app.post('/api/admin/scrape-url', requireAdminAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: 'Page URL is required.' });
    }

    const trimmedUrl = url.trim();
    console.log(`[Deep Page Scraper] Extracting all videos from: ${trimmedUrl}`);

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

        // 1. Specialized Deep Scraper for Pornhub Category / Model / Search Pages
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
                        tags: ['pornhub', 'scraped', 'arabic', 'niksex']
                    });
                }
            });
        }

        // 2. Specialized Deep Scraper for xHamster Category / Channel / Search Pages
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
                        tags: ['xhamster', 'scraped', 'niksex']
                    });
                }
            });
        }

        // 3. Specialized Deep Scraper for XVideos Pages
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
                        tags: ['xvideos', 'scraped', 'niksex']
                    });
                }
            });
        }

        // 4. Specialized Deep Scraper for Eporner Pages
        else if (trimmedUrl.includes('eporner.com')) {
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

                if (id && !seenIds.has(id)) {
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
                        tags: ['eporner', 'scraped', 'arabic', 'niksex']
                    });
                }
            });
        }

        // 5. Specialized Deep Scraper for SpankBang Pages
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
                        tags: ['spankbang', 'scraped', 'niksex']
                    });
                }
            });
        }

        // 4. Universal HTML5 & Embed Link Scraper for ANY Webpage
        if (scrapedVideos.length === 0) {
            // Check OpenGraph tag
            const ogVideo = $('meta[property="og:video:url"]').attr('content') || $('meta[property="og:video"]').attr('content') || $('meta[name="twitter:player"]').attr('content');
            const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
            const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || 'Web Video Stream';

            if (ogVideo) {
                scrapedVideos.push({
                    id: 'url_' + Date.now().toString(36),
                    source: 'universal_page',
                    title: pageTitle,
                    thumbnail: ogImage || '/images/logo.png',
                    duration: '12:00',
                    views: '10,000',
                    rating: '98%',
                    embed_url: ogVideo,
                    video_url: ogVideo,
                    tags: ['universal', 'scraped', 'niksex']
                });
            }

            // Extract all video iframes on the page
            $('iframe').each((i, el) => {
                const src = $(el).attr('src') || '';
                if (src && (src.includes('embed') || src.includes('player') || src.includes('video') || src.includes('.mp4'))) {
                    const embedUrl = src.startsWith('//') ? 'https:' + src : src;
                    scrapedVideos.push({
                        id: 'embed_' + Date.now().toString(36) + '_' + i,
                        source: 'custom_page',
                        title: `${pageTitle} (Clip ${i + 1})`,
                        thumbnail: ogImage || '/images/logo.png',
                        duration: '10:00',
                        views: '5,000',
                        rating: '97%',
                        embed_url: embedUrl,
                        video_url: embedUrl,
                        tags: ['scraped', 'niksex']
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

        return res.status(404).json({
            success: false,
            message: 'Could not detect video streams on this page. Try linking directly to a category, model, channel, or search results page.'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Page Scraper failed: ' + err.message
        });
    }
});

// 4. API: Save Scraped Videos Permanently (Protected - All Saved to Trending by Default)
app.post('/api/admin/save-videos', requireAdminAuth, (req, res) => {
    const { videos } = req.body;
    if (Array.isArray(videos) && videos.length > 0) {
        const existingIds = new Set(persistentVideos.map(v => v.id));
        const newVids = videos
            .filter(v => !existingIds.has(v.id))
            .map(v => ({
                ...v,
                category: 'trending',
                is_trending: true,
                tags: Array.from(new Set([...(v.tags || []), 'trending', 'trending_now', 'featured', 'niksex'])),
                imported_at: Date.now()
            }));

        persistentVideos = newVids.concat(persistentVideos);
        savePersistentVideos(persistentVideos);
        cache.clear(); // Clear cache so they appear instantly in Trending

        return res.json({
            success: true,
            message: `Successfully saved & published ${newVids.length} video(s) directly to Trending!`,
            total_stored: persistentVideos.length
        });
    }
    return res.status(400).json({ success: false, message: 'Invalid video array.' });
});

// 5. API: Get All Stored Videos (Protected)
app.get('/api/admin/imported-videos', requireAdminAuth, (req, res) => {
    return res.json({
        success: true,
        count: persistentVideos.length,
        videos: persistentVideos
    });
});

// 6. API: Delete Stored Video (Protected)
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
