const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://xhamster.com/'
};

// Real High-Definition Photos & Animated GIFs Dataset (Using Real Star CDNs)
const CURATED_MEDIA = [
    {
        id: 'pic-star-1',
        type: 'photo',
        title: '🔥 Mia Khalifa Sensual Glamour Studio Shoot 4K',
        image_url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Fl/s7/irh2fr8s7Fl/129764-mia-khalifa-nude_880x660.jpg'),
        thumbnail: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Fl/s7/irh2fr8s7Fl/129764-mia-khalifa-nude_190x152.jpg'),
        views: '412.5K',
        likes: '38.2K',
        tags: ['arabic', 'glamour', 'portrait', 'hot']
    },
    {
        id: 'gif-star-1',
        type: 'gif',
        title: '🔥 Sensual Model Live Tease & Orgasm GIF',
        image_url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy_s.gif',
        views: '380.9K',
        likes: '29.4K',
        tags: ['arabic', 'hot', 'sexy', 'gif']
    },
    {
        id: 'pic-star-2',
        type: 'photo',
        title: '💋 Lana Rhoades Breathtaking Bedroom Shoot 4K',
        image_url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/LT/T2/JYYrTpQT2LT/458843-lana-rhoades-enjoying-an-uncut-cock_880x660.jpg'),
        thumbnail: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/LT/T2/JYYrTpQT2LT/458843-lana-rhoades-enjoying-an-uncut-cock_190x152.jpg'),
        views: '495.4K',
        likes: '41.7K',
        tags: ['teen', 'bedroom', 'model', '4k']
    },
    {
        id: 'gif-star-2',
        type: 'gif',
        title: '🔥 Eva Elfie Cute Blonde Bedroom Smile GIF',
        image_url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy_s.gif',
        views: '450.2K',
        likes: '34.8K',
        tags: ['blonde', 'sexy', 'gif']
    },
    {
        id: 'pic-star-3',
        type: 'photo',
        title: '🏖️ Riley Reid Sun-Kissed Villa Shoot Ultra HD',
        image_url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/wg/Ey/Ul9CvSuEywg/498125-riley-reid-showing-her-asshole_880x660.jpg'),
        thumbnail: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/wg/Ey/Ul9CvSuEywg/498125-riley-reid-showing-her-asshole_880x660.jpg'),
        views: '580.1K',
        likes: '49.6K',
        tags: ['villa', 'beach', 'blonde', 'summer']
    },
    {
        id: 'gif-star-3',
        type: 'gif',
        title: '🌊 Abella Danger Poolside Tease GIF',
        image_url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
        mp4_url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.mp4',
        thumbnail: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy_s.gif',
        views: '610.8K',
        likes: '55.3K',
        tags: ['bikini', 'pool', 'latina', 'gif']
    },
    {
        id: 'pic-star-4',
        type: 'photo',
        title: '✨ Angela White Luxury Studio Portrait 4K',
        image_url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vg/8Y/XQ0Pw508YVg/900205-bbc-queen-nude_880x660.jpg'),
        thumbnail: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/Vg/8Y/XQ0Pw508YVg/900205-bbc-queen-nude_880x660.jpg'),
        views: '390.4K',
        likes: '31.9K',
        tags: ['milf', 'big tits', 'glamour']
    },
    {
        id: 'pic-star-5',
        type: 'photo',
        title: '🔥 Sweetie Fox Viral Cosplay Photo Shoot',
        image_url: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/i8/4u/eE7a4s34ui8/502120-sweetie-fox-nude_880x660.jpg'),
        thumbnail: '/api/proxy/image?url=' + encodeURIComponent('https://static-eu-cdn.eporner.com/gallery/i8/4u/eE7a4s34ui8/502120-sweetie-fox-nude_880x660.jpg'),
        views: '445.8K',
        likes: '39.4K',
        tags: ['cosplay', 'teen', 'amateur']
    }
];

async function fetchPhotosAndGifs(query = 'all', page = 1) {
    return {
        success: true,
        source: 'curated_cdn',
        query: query,
        page: page,
        items: CURATED_MEDIA
    };
}

module.exports = {
    fetchPhotosAndGifs,
    CURATED_MEDIA
};
