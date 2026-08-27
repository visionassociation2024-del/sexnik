const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://www.pornhub.com/',
    'Cookie': 'accessAgeDisclaimerPH=1; age_verified=1; platform=pc;'
};

// Massive Curated High-Definition Photos & Animated GIFs Dataset
const CURATED_MEDIA = [
    // --- Arabian & Middle Eastern Models ---
    {
        id: 'pic-arab-1',
        type: 'photo',
        title: '🔥 Gorgeous Arabic Glamour Model Portrait HD',
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        views: '412.5K',
        likes: '38.2K',
        tags: ['arabic', 'glamour', 'portrait', 'hot']
    },
    {
        id: 'gif-arab-1',
        type: 'gif',
        title: '🔥 Hot Arabian Model Sensual Live Tease',
        image_url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy_s.gif',
        views: '380.9K',
        likes: '29.4K',
        tags: ['arabic', 'hot', 'sexy', 'gif']
    },
    {
        id: 'pic-arab-2',
        type: 'photo',
        title: '💋 Sensual Arabic Bedroom Photo Shoot 4K',
        image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        views: '295.4K',
        likes: '21.7K',
        tags: ['arabic', 'bedroom', 'model']
    },
    {
        id: 'gif-arab-2',
        type: 'gif',
        title: '🔥 Sexy Brunette Bedroom Tease GIF',
        image_url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy_s.gif',
        views: '450.2K',
        likes: '34.8K',
        tags: ['brunette', 'sexy', 'gif']
    },

    // --- Bikini & Beach Babes ---
    {
        id: 'pic-beach-1',
        type: 'photo',
        title: '🏖️ Sun-Kissed Bikini Beach Babe 4K Ultra HD',
        image_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
        views: '580.1K',
        likes: '49.6K',
        tags: ['bikini', 'beach', 'blonde', 'summer']
    },
    {
        id: 'gif-beach-1',
        type: 'gif',
        title: '💋 Hot Blonde Bikini Seduction Dance GIF',
        image_url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy_s.gif',
        views: '520.4K',
        likes: '42.1K',
        tags: ['bikini', 'blonde', 'tease', 'gif']
    },
    {
        id: 'pic-beach-2',
        type: 'photo',
        title: '🔥 Exotic Tropic Island Swimwear Model',
        image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        views: '340.8K',
        likes: '28.3K',
        tags: ['swimwear', 'island', 'exotic']
    },

    // --- Shower & Sensual Wet Moments ---
    {
        id: 'pic-shower-1',
        type: 'photo',
        title: '🚿 Wet Sensual Shower Drops Photo HD',
        image_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
        views: '610.7K',
        likes: '55.3K',
        tags: ['shower', 'wet', 'sensual']
    },
    {
        id: 'gif-shower-1',
        type: 'gif',
        title: '🔥 Steamy Hot Shower Moment GIF',
        image_url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy_s.gif',
        views: '720.5K',
        likes: '63.9K',
        tags: ['shower', 'wet', 'hot', 'gif']
    },

    // --- Asian & Exotic Models ---
    {
        id: 'pic-asian-1',
        type: 'photo',
        title: '🌸 Cute Asian Fashion & Glamour Model',
        image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        views: '430.0K',
        likes: '36.5K',
        tags: ['asian', 'cute', 'glamour']
    },
    {
        id: 'gif-asian-1',
        type: 'gif',
        title: '🔥 Gorgeous Asian Babe Live Cam Wink GIF',
        image_url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy_s.gif',
        views: '388.2K',
        likes: '31.0K',
        tags: ['asian', 'cams', 'gif']
    },

    // --- Latina & Passionate Dancers ---
    {
        id: 'pic-latina-1',
        type: 'photo',
        title: '🔥 Hot Curvy Latina Portrait & Curves 1080p',
        image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        views: '512.9K',
        likes: '44.1K',
        tags: ['latina', 'curvy', 'portrait']
    },
    {
        id: 'gif-latina-1',
        type: 'gif',
        title: '🔥 Curvy Latin Dancer Sexy Rhythm GIF',
        image_url: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy_s.gif',
        views: '490.6K',
        likes: '39.8K',
        tags: ['latina', 'dance', 'curvy', 'gif']
    },

    // --- Redheads & VIP Cams ---
    {
        id: 'pic-redhead-1',
        type: 'photo',
        title: '💋 Stunning Redhead Model Sensual Gaze',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        views: '370.4K',
        likes: '29.2K',
        tags: ['redhead', 'sensual', 'portrait']
    },
    {
        id: 'gif-redhead-1',
        type: 'gif',
        title: '💋 Redhead Passionate Kiss & Tease GIF',
        image_url: 'https://media.giphy.com/media/26AHONQJhMhRX5GBG/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/26AHONQJhMhRX5GBG/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/26AHONQJhMhRX5GBG/giphy_s.gif',
        views: '360.8K',
        likes: '27.4K',
        tags: ['redhead', 'kiss', 'gif']
    },
    {
        id: 'pic-lingerie-1',
        type: 'photo',
        title: '🖤 Luxury Silk Black Lingerie Model 4K',
        image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        views: '690.3K',
        likes: '59.0K',
        tags: ['lingerie', 'silk', 'luxury', 'hot']
    },
    {
        id: 'gif-vip-1',
        type: 'gif',
        title: '🔥 VIP Private Studio Live Webcam Show GIF',
        image_url: 'https://media.giphy.com/media/l2Je2M4Nfrit0L7sQ/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/l2Je2M4Nfrit0L7sQ/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/l2Je2M4Nfrit0L7sQ/giphy_s.gif',
        views: '890.1K',
        likes: '78.5K',
        tags: ['vip', 'webcam', 'private', 'gif']
    }
];

/**
 * Fetch a massive batch of Photos and GIFs (combining scrape + curated dataset)
 */
async function fetchPhotosAndGifs(query = 'all', page = 1) {
    const queryLower = (query || '').toLowerCase().trim();
    let mediaList = [];

    // 1. Try scraping fresh GIFs from Pornhub
    try {
        const encodedQuery = encodeURIComponent(queryLower === 'all' || queryLower === 'photos' ? 'hot' : queryLower);
        const url = `https://www.pornhub.com/gifs/search?search=${encodedQuery}&page=${page}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 3500 });
        const $ = cheerio.load(response.data);

        $('.gifVideoBlock, .gifList li, .gif-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('.title, .gif-title').text().trim() || `Hot Model GIF ${i + 1}`;
            const videoEl = $el.find('video').first();
            const imgEl = $el.find('img').first();

            let mp4Url = videoEl.attr('data-mp4') || videoEl.attr('src') || $el.attr('data-mp4') || '';
            let gifUrl = $el.attr('data-gif') || imgEl.attr('data-src') || imgEl.attr('src') || mp4Url;
            let thumb = imgEl.attr('data-thumb_url') || imgEl.attr('src') || gifUrl;

            if (mp4Url || gifUrl) {
                mediaList.push({
                    id: `ph-live-${page}-${i}`,
                    type: 'gif',
                    title: `🔥 ${title}`,
                    image_url: gifUrl || mp4Url,
                    mp4_url: mp4Url || gifUrl,
                    thumbnail: thumb,
                    views: `${Math.floor(Math.random() * 80 + 20)}.${Math.floor(Math.random() * 9)}K`,
                    likes: `${Math.floor(Math.random() * 9 + 1)}.${Math.floor(Math.random() * 9)}K`,
                    tags: ['gif', 'pornhub', queryLower]
                });
            }
        });
    } catch (e) {
        // Scrape fallback
    }

    // 2. Add curated library matching query or all
    let curatedFiltered = CURATED_MEDIA;
    if (queryLower && queryLower !== 'all' && queryLower !== 'photos' && queryLower !== 'gifs') {
        curatedFiltered = CURATED_MEDIA.filter(item => 
            item.title.toLowerCase().includes(queryLower) ||
            item.tags.some(t => t.toLowerCase().includes(queryLower)) ||
            (queryLower === 'photo' && item.type === 'photo') ||
            (queryLower === 'gif' && item.type === 'gif')
        );
    }

    mediaList = mediaList.concat(curatedFiltered);

    // Shuffle slightly for fresh variety
    mediaList.sort(() => 0.5 - Math.random());

    return {
        success: true,
        category: 'photos',
        query: queryLower,
        page: parseInt(page, 10) || 1,
        count: mediaList.length,
        items: mediaList
    };
}

module.exports = {
    fetchPhotosAndGifs,
    CURATED_MEDIA
};
