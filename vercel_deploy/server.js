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

// Fallback high-speed video fetcher from open tube feeds
async function fetchOpenTubeVideos(query = 'hd', page = 1) {
    try {
        const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=24&page=${page}&thumbsize=big`;
        const res = await axios.get(url, { timeout: 7000 });
        if (res.data && res.data.videos) {
            return res.data.videos.map(v => ({
                id: v.id,
                source: 'open_tube',
                title: v.title,
                thumbnail: v.default_thumb ? v.default_thumb.src : '',
                duration: v.length_min || '12:00',
                views: v.views ? (parseInt(v.views, 10).toLocaleString()) : '12,500',
                rating: (v.rate ? v.rate : '96') + '%',
                embed_url: v.embed,
                video_url: v.embed,
                tags: query ? [query, 'HD', 'niksex'] : ['HD', 'niksex']
            }));
        }
    } catch (e) {
        console.warn('[OpenTube Fetch]', e.message);
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

// 1. API: Get Videos Feed (Home / Categories / Sex Arabic)
app.get('/api/videos', async (req, res) => {
    let { category = 'trending', page = 1 } = req.query;
    let videos = [];
    const normalizedCat = category.toLowerCase().trim();

    let queryTerm = normalizedCat;
    if (normalizedCat === 'sex_arabic' || normalizedCat === 'sex arabic' || normalizedCat === 'arabic') {
        queryTerm = 'arabic';
    } else if (normalizedCat === 'trending' || normalizedCat === 'all') {
        queryTerm = 'hd';
    }

    if (persistentVideos.length > 0) {
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

    try {
        const phRes = await searchPornhub(queryTerm, page);
        if (phRes.success && phRes.videos && phRes.videos.length > 0) {
            videos = videos.concat(phRes.videos);
        }
    } catch (e) {}

    try {
        const xhRes = await searchXhamster(queryTerm, page);
        if (xhRes.success && xhRes.videos && xhRes.videos.length > 0) {
            videos = videos.concat(xhRes.videos);
        }
    } catch (e) {}

    if (videos.length < 16) {
        const openVids = await fetchOpenTubeVideos(queryTerm, page);
        videos = videos.concat(openVids);
    }

    return res.json({
        success: true,
        category,
        page: parseInt(page, 10) || 1,
        count: videos.length,
        videos
    });
});

// 2. API: Search across all sources
app.get('/api/search', async (req, res) => {
    const { q = 'hd', source = 'all', page = 1 } = req.query;
    let results = [];
    const queryLower = q.toLowerCase();

    if (persistentVideos.length > 0) {
        const storedMatches = persistentVideos.filter(v => 
            (v.title && v.title.toLowerCase().includes(queryLower)) ||
            (v.tags && v.tags.some(t => t.toLowerCase().includes(queryLower)))
        );
        results = results.concat(storedMatches);
    }

    if (source === 'pornhub' || source === 'all') {
        try {
            const ph = await searchPornhub(q, page);
            if (ph.success && ph.videos) results = results.concat(ph.videos);
        } catch (e) {}
    }

    if (source === 'xhamster' || source === 'all') {
        try {
            const xh = await searchXhamster(q, page);
            if (xh.success && xh.videos) results = results.concat(xh.videos);
        } catch (e) {}
    }

    if (results.length < 12) {
        const openVids = await fetchOpenTubeVideos(q, page);
        results = results.concat(openVids);
    }

    return res.json({
        success: true,
        query: q,
        source,
        page: parseInt(page, 10) || 1,
        count: results.length,
        videos: results
    });
});

// 3. API: Universal Smart URL-Based Scraper (Protected)
app.post('/api/admin/scrape-url', requireAdminAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const trimmedUrl = url.trim();
    console.log(`[Universal Scraper] Analyzing URL: ${trimmedUrl}`);

    // Pornhub Single Video
    if (trimmedUrl.includes('pornhub.com') && (trimmedUrl.includes('viewkey=') || trimmedUrl.includes('/view_video.php'))) {
        const match = trimmedUrl.match(/viewkey=([a-zA-Z0-9]+)/);
        const viewkey = match ? match[1] : trimmedUrl.split('/').pop();
        const details = await getPornhubDetails(viewkey);
        if (details.success) {
            return res.json({ success: true, type: 'single', video: details });
        }
    }

    // xHamster Single Video
    if (trimmedUrl.includes('xhamster.com') && trimmedUrl.includes('/videos/')) {
        const details = await getXhamsterDetails(trimmedUrl);
        if (details.success) {
            return res.json({ success: true, type: 'single', video: details });
        }
    }

    // XVideos Single Video
    if (trimmedUrl.includes('xvideos.com/video') || trimmedUrl.includes('xvideos.com/prof-video-click')) {
        const match = trimmedUrl.match(/video([0-9]+)/) || trimmedUrl.match(/video_id=([0-9]+)/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                video: {
                    id: 'xv_' + vidId,
                    source: 'xvideos',
                    title: 'XVideos Stream ' + vidId,
                    thumbnail: `https://img-hw.xvideos-cdn.com/videos/thumbs169/${vidId.substring(0, 3)}/${vidId.substring(3, 6)}/${vidId}/1.jpg`,
                    duration: '12:00',
                    views: '25,000',
                    rating: '98%',
                    embed_url: `https://www.xvideos.com/embedframe/${vidId}`,
                    video_url: `https://www.xvideos.com/embedframe/${vidId}`,
                    tags: ['xvideos', 'stream', 'niksex']
                }
            });
        }
    }

    // SpankBang Single Video
    if (trimmedUrl.includes('spankbang.com') && trimmedUrl.includes('/video/')) {
        const match = trimmedUrl.match(/spankbang\.com\/([a-zA-Z0-9]+)\/video/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                video: {
                    id: 'sb_' + vidId,
                    source: 'spankbang',
                    title: 'SpankBang Video ' + vidId,
                    thumbnail: '/images/logo.png',
                    duration: '15:00',
                    views: '18,400',
                    rating: '97%',
                    embed_url: `https://spankbang.com/${vidId}/embed/`,
                    video_url: `https://spankbang.com/${vidId}/embed/`,
                    tags: ['spankbang', 'niksex']
                }
            });
        }
    }

    // RedTube Single Video
    if (trimmedUrl.includes('redtube.com/')) {
        const match = trimmedUrl.match(/redtube\.com\/([0-9]+)/);
        const vidId = match ? match[1] : '';
        if (vidId) {
            return res.json({
                success: true,
                type: 'single',
                video: {
                    id: 'rt_' + vidId,
                    source: 'redtube',
                    title: 'RedTube Video ' + vidId,
                    thumbnail: `https://img02.redtubefiles.com/_thumbs/${vidId}/1.jpg`,
                    duration: '14:20',
                    views: '20,000',
                    rating: '96%',
                    embed_url: `https://embed.redtube.com/?id=${vidId}&autoplay=1`,
                    video_url: `https://embed.redtube.com/?id=${vidId}`,
                    tags: ['redtube', 'niksex']
                }
            });
        }
    }

    // Universal Deep Scraper
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Cookie': 'age_verified=1; accessAgeDisclaimerPH=1; platform=pc;'
        };

        const pageRes = await axios.get(trimmedUrl, { headers, timeout: 15000 });
        const $ = cheerio.load(pageRes.data);
        const scrapedVideos = [];

        const ogVideo = $('meta[property="og:video:url"]').attr('content') || $('meta[property="og:video"]').attr('content') || $('meta[name="twitter:player"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
        const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || 'Scraped Video';

        if (ogVideo) {
            return res.json({
                success: true,
                type: 'single',
                video: {
                    id: 'url_' + Date.now().toString(36),
                    source: 'universal_scraper',
                    title: pageTitle,
                    thumbnail: ogImage || '/images/logo.png',
                    duration: '10:00',
                    views: '5,000',
                    rating: '98%',
                    embed_url: ogVideo,
                    video_url: ogVideo,
                    tags: ['universal', 'scraped', 'niksex']
                }
            });
        }

        if (trimmedUrl.includes('pornhub.com')) {
            $('ul.videos li.pcVideoListItem, .videoBlock, .wrap').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a[href*="viewkey="]').first();
                const href = link.attr('href') || '';
                const match = href.match(/viewkey=([a-zA-Z0-9]+)/);
                if (match) {
                    const vkey = match[1];
                    const title = $el.find('.title a, .titleText, span.title a').first().text().trim() || link.attr('title') || 'Pornhub Video ' + vkey;
                    const img = $el.find('img').first();
                    const thumb = img.attr('data-thumb_url') || img.attr('data-mediumthumb') || img.attr('data-src') || img.attr('src') || '';
                    const duration = $el.find('.duration, var.duration').first().text().trim() || '10:00';
                    const views = $el.find('.views var, .views').first().text().trim() || '5,000';

                    scrapedVideos.push({
                        id: vkey,
                        source: 'pornhub',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: views,
                        rating: '97%',
                        embed_url: `https://www.pornhub.com/embed/${vkey}`,
                        video_url: `https://www.pornhub.com/embed/${vkey}`,
                        tags: ['pornhub', 'arabic', 'niksex']
                    });
                }
            });
        } else if (trimmedUrl.includes('xhamster.com')) {
            $('div.thumb-list__item, article.thumb-list__item, div.video-thumb').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a[href*="/videos/"]').first();
                const href = link.attr('href') || '';
                let videoId = $el.attr('data-video-id') || '';
                if (!videoId && href) {
                    const match = href.match(/-([a-zA-Z0-9]+)$/) || href.match(/\/videos\/([^\/]+)-([0-9]+)/);
                    if (match) videoId = match[2] || match[1];
                }
                if (videoId || href) {
                    const id = videoId || href.split('/').pop();
                    const title = link.attr('title') || $el.find('.video-thumb-info__name, .thumb-image-container__title').text().trim() || 'xHamster Video ' + id;
                    const img = $el.find('img').first();
                    const thumb = img.attr('data-src') || img.attr('data-preview') || img.attr('src') || '';
                    const duration = $el.find('.thumb-image-container__duration, .duration').first().text().trim() || '10:00';

                    scrapedVideos.push({
                        id: id,
                        source: 'xhamster',
                        title: title,
                        thumbnail: thumb,
                        duration: duration,
                        views: '10,000',
                        rating: '95%',
                        embed_url: `https://xhamster.com/xembed.php?video=${id}`,
                        video_url: `https://xhamster.com/xembed.php?video=${id}`,
                        tags: ['xhamster', 'arabic', 'niksex']
                    });
                }
            });
        } else {
            $('iframe').each((i, el) => {
                const src = $(el).attr('src') || '';
                if (src && (src.includes('embed') || src.includes('player') || src.includes('video') || src.includes('.mp4'))) {
                    const embedUrl = src.startsWith('//') ? 'https:' + src : src;
                    scrapedVideos.push({
                        id: 'embed_' + Date.now().toString(36) + '_' + i,
                        source: 'custom_url',
                        title: `${pageTitle} (Clip ${i + 1})`,
                        thumbnail: ogImage || '/images/logo.png',
                        duration: '10:00',
                        views: '1,500',
                        rating: '98%',
                        embed_url: embedUrl,
                        video_url: embedUrl,
                        tags: ['scraped', 'arabic', 'niksex']
                    });
                }
            });
        }

        if (scrapedVideos.length > 0) {
            return res.json({
                success: true,
                type: 'batch',
                count: scrapedVideos.length,
                videos: scrapedVideos
            });
        }

        return res.status(404).json({
            success: false,
            message: 'Could not extract video streams from this URL.'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Universal Scraper Error: ' + err.message
        });
    }
});

// 4. API: Save Scraped Videos Permanently (Protected)
app.post('/api/admin/save-videos', requireAdminAuth, (req, res) => {
    const { videos } = req.body;
    if (Array.isArray(videos) && videos.length > 0) {
        const existingIds = new Set(persistentVideos.map(v => v.id));
        const newVids = videos.filter(v => !existingIds.has(v.id));

        persistentVideos = newVids.concat(persistentVideos);
        savePersistentVideos(persistentVideos);

        return res.json({
            success: true,
            message: `Successfully saved & published ${newVids.length} video(s) permanently to niksex!`,
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
        console.log(`🚀 niksex Modern Web Platform running on port ${PORT}`);
        console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
        console.log(`🔒 Admin Panel:  http://localhost:${PORT}/admin`);
        console.log(`🔑 Admin Password: [PROTECTED: 202620272028]`);
        console.log(`✨ Ready for Vercel Deployment`);
        console.log(`====================================================`);
    });
}

module.exports = app;
