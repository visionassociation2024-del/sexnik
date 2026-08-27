require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
const { searchPornhub, getPornhubDetails } = require('./scrapers/pornhub');
const { searchXhamster, getXhamsterDetails } = require('./scrapers/xhamster');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to initialize Apify client
function getApifyClient(customToken) {
    const token = customToken || process.env.APIFY_API_TOKEN;
    if (!token || token === 'your_apify_token_here') {
        throw new Error('Apify API token is not configured. Please supply a valid token.');
    }
    return new ApifyClient({ token });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'niksex Native Scraper Engine',
        supported_sources: ['pornhub', 'xhamster'],
        apify_enabled: Boolean(process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN !== 'your_apify_token_here'),
        timestamp: new Date().toISOString()
    });
});

// List supported scraper sources
app.get('/api/sources', (req, res) => {
    res.json({
        success: true,
        sources: [
            { id: 'pornhub', name: 'Pornhub (Direct Native Scraper)' },
            { id: 'xhamster', name: 'xHamster (Direct Native Scraper)' }
        ]
    });
});

// Direct Search endpoint (Pornhub & xHamster)
app.get('/api/search', async (req, res) => {
    const { source = 'pornhub', query = '', page = 1 } = req.query;

    console.log(`[Scraper] Searching "${query}" on [${source}] (page: ${page})`);

    let result;
    if (source.toLowerCase() === 'xhamster') {
        result = await searchXhamster(query, parseInt(page, 10) || 1);
    } else {
        // Default to Pornhub
        result = await searchPornhub(query, parseInt(page, 10) || 1);
    }

    return res.json(result);
});

// Direct Video Details endpoint
app.get('/api/video-details', async (req, res) => {
    const { source = 'pornhub', id = '', url = '' } = req.query;

    let result;
    if (source.toLowerCase() === 'xhamster') {
        result = await getXhamsterDetails(url || id);
    } else {
        result = await getPornhubDetails(id || url);
    }

    return res.json(result);
});

// Apify Scraper Endpoint for Pornhub models / profiles / videos
app.post('/api/apify/scrape', async (req, res) => {
    const {
        token,
        profile_url = 'https://pornhub.com/model/sweetie-fox',
        profile_type = 'about',
        url_videos = '',
        url_profiles = '',
        max_page = 1,
        actor = 'saswave/pornhub-scraper'
    } = req.body;

    try {
        const client = getApifyClient(token);

        const input = {
            url_videos: url_videos || '',
            url_profiles: url_profiles || '',
            url_get_profile_infos: profile_url,
            get_profile_type: profile_type,
            max_page: parseInt(max_page, 10) || 1,
            proxyConfiguration: {
                useApifyProxy: true,
                apifyProxyGroups: []
            }
        };

        console.log(`[Apify] Starting Actor "${actor}" with input:`, input);

        // Run the Actor and wait for it to finish
        const run = await client.actor(actor).call(input);
        console.log(`[Apify] Run completed. Dataset ID: ${run.defaultDatasetId}`);

        // Fetch dataset results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return res.json({
            success: true,
            actor,
            datasetId: run.defaultDatasetId,
            datasetUrl: `https://console.apify.com/storage/datasets/${run.defaultDatasetId}`,
            count: items.length,
            items: items
        });
    } catch (err) {
        console.error('[Apify Error]', err);
        return res.status(500).json({
            success: false,
            message: err.message,
            error: err.toString()
        });
    }
});

// Apify Generic Actor Runner
app.post('/api/apify/actor-run', async (req, res) => {
    const { token, actor, input } = req.body;

    if (!actor || !input) {
        return res.status(400).json({ success: false, message: 'Actor name and input object are required.' });
    }

    try {
        const client = getApifyClient(token);
        const run = await client.actor(actor).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return res.json({
            success: true,
            actor,
            datasetId: run.defaultDatasetId,
            items
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 niksex Native Scraper Engine running on port ${PORT}`);
    console.log(`🔍 Direct Scrapers: [Pornhub, xHamster]`);
    console.log(`⚡ Apify Client: Ready (Actor: saswave/pornhub-scraper)`);
    console.log(`🔌 Health check available at: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
