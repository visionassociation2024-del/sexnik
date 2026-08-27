require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { searchPornhub } = require('./scrapers/pornhub');
const { searchXhamster } = require('./scrapers/xhamster');

// Target search queries across different categories
const SEARCH_KEYWORDS = [
    'hd', '4k', 'trending', 'popular', 'amateur',
    'vr', 'blowjob', 'teen', 'milf', 'lesbian'
];

function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '') || 'video-' + Date.now();
}

function escapeSql(str) {
    if (!str) return "''";
    return "'" + str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0": return "\\0";
            case "\x08": return "\\b";
            case "\x09": return "\\t";
            case "\x1a": return "\\z";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
            default:
                return char;
        }
    }) + "'";
}

async function runBulkImport() {
    console.log('====================================================');
    console.log('🚀 Starting niksex Bulk Video Scraper & Importer');
    console.log('====================================================');

    const scrapedVideos = [];
    const seenIds = new Set();

    // 1. Scrape from Pornhub & xHamster across keywords
    for (const kw of SEARCH_KEYWORDS) {
        console.log(`\n🔍 Scraping keyword: "${kw}"...`);

        // Pornhub
        try {
            console.log(`   -> Fetching Pornhub (${kw})...`);
            const phRes = await searchPornhub(kw, 1);
            if (phRes.success && phRes.videos) {
                for (const v of phRes.videos) {
                    const uniqueKey = `ph_${v.id}`;
                    if (!seenIds.has(uniqueKey) && v.title && v.thumbnail) {
                        seenIds.add(uniqueKey);
                        scrapedVideos.push(v);
                    }
                }
                console.log(`      + Found ${phRes.videos.length} videos from Pornhub`);
            }
        } catch (e) {
            console.warn(`      ! Pornhub error: ${e.message}`);
        }

        // xHamster
        try {
            console.log(`   -> Fetching xHamster (${kw})...`);
            const xhRes = await searchXhamster(kw, 1);
            if (xhRes.success && xhRes.videos) {
                for (const v of xhRes.videos) {
                    const uniqueKey = `xh_${v.id}`;
                    if (!seenIds.has(uniqueKey) && v.title && v.thumbnail) {
                        seenIds.add(uniqueKey);
                        scrapedVideos.push(v);
                    }
                }
                console.log(`      + Found ${xhRes.videos.length} videos from xHamster`);
            }
        } catch (e) {
            console.warn(`      ! xHamster error: ${e.message}`);
        }

        // 3. Fallback to Open Tube Feed (Eporner / Open Tube Embeds) to guarantee rich content
        try {
            console.log(`   -> Fetching Open Tube Feed (${kw})...`);
            const axios = require('axios');
            const openRes = await axios.get(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(kw)}&per_page=20&page=1`, { timeout: 8000 });
            if (openRes.data && openRes.data.videos) {
                for (const v of openRes.data.videos) {
                    const uniqueKey = `ep_${v.id}`;
                    if (!seenIds.has(uniqueKey)) {
                        seenIds.add(uniqueKey);
                        scrapedVideos.push({
                            source: 'eporner',
                            id: v.id,
                            title: v.title,
                            thumbnail: v.default_thumb ? v.default_thumb.src : '',
                            duration: v.length_min || '10:00',
                            views: v.views || '1500',
                            rating: v.rate || '95%',
                            embed_url: v.embed,
                            video_url: v.embed,
                            tags: [kw, 'hd', 'niksex']
                        });
                    }
                }
                console.log(`      + Found ${openRes.data.videos.length} videos from Open Tube Feed`);
            }
        } catch (e) {
            // Ignore if offline
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n📦 Total unique videos collected: ${scrapedVideos.length}`);

    // 2. Prepare SQL Statements and direct DB insertion
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'xstreamer_lite_test'
    };

    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log(`✅ Connected directly to MySQL database: ${dbConfig.database}`);
    } catch (err) {
        console.warn(`⚠️ MySQL Connection note: ${err.message}`);
        console.log(`ℹ️ An SQL dump file will be generated in database/imported_videos.sql for manual or automated import.`);
    }

    const sqlLines = [
        '-- niksex Bulk Scraped Videos',
        'SET NAMES utf8mb4;',
        'SET FOREIGN_KEY_CHECKS = 0;\n'
    ];

    let insertedCount = 0;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (let i = 0; i < scrapedVideos.length; i++) {
        const item = scrapedVideos[i];
        const stringId = String(Math.floor(100000000 + Math.random() * 900000000));
        const title = item.title.trim().slice(0, 250);
        const slug = generateSlug(title).slice(0, 250);
        const poster = item.thumbnail || '';
        const embedUrl = item.embed_url || item.video_url || '';
        const duration = item.duration || '10:00';
        const views = parseInt(item.views, 10) || Math.floor(50 + Math.random() * 5000);
        const rating = Math.floor(80 + Math.random() * 19);
        const tag = (Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || 'niksex,tube')).slice(0, 250);
        const catId = (i % 5) + 1; // Assign categories 1 to 5
        const categoriesId = `${catId}_Category`;

        const insertVideoSql = `INSERT INTO table_video (string_Id, buy_this, is_subscription, categories_Id, cat_id, title_name, post_name, video_src, video_sd, video_url, video_type, poster, duration, description, status, total_view, rating, tag, form_name, allowedTypes, subscriptionTypeId, created_at, updated_at) VALUES (${escapeSql(stringId)}, 0, 0, ${escapeSql(categoriesId)}, ${escapeSql(String(catId))}, ${escapeSql(title)}, ${escapeSql(slug)}, ${escapeSql(embedUrl)}, '', ${escapeSql(embedUrl)}, 'embed', ${escapeSql(poster)}, ${escapeSql(duration)}, ${escapeSql(title)}, 1, ${views}, ${rating}, ${escapeSql(tag)}, '', '', '', ${escapeSql(now)}, ${escapeSql(now)});`;

        const insertCatSql = `INSERT INTO table_video_cat (video_id, cat_id, created_at, updated_at) VALUES (${escapeSql(stringId)}, ${catId}, ${escapeSql(now)}, ${escapeSql(now)});`;

        sqlLines.push(insertVideoSql);
        sqlLines.push(insertCatSql);

        if (connection) {
            try {
                // Check if title already exists in DB
                const [existing] = await connection.query('SELECT ID FROM table_video WHERE title_name = ? LIMIT 1', [title]);
                if (existing.length === 0) {
                    await connection.query(insertVideoSql);
                    await connection.query(insertCatSql);
                    insertedCount++;
                }
            } catch (err) {
                // Ignore single insert errors
            }
        }
    }

    // Write SQL file
    const sqlFilePath = path.join(__dirname, '../../database/imported_videos.sql');
    fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
    console.log(`\n💾 Saved SQL export to: database/imported_videos.sql (${scrapedVideos.length} videos)`);

    if (connection) {
        console.log(`🎉 Successfully inserted ${insertedCount} new videos directly into MySQL table_video!`);
        await connection.end();
    }

    console.log('\n====================================================');
    console.log('✅ Scrape & Import process completed successfully!');
    console.log('====================================================');
}

runBulkImport().catch(console.error);
