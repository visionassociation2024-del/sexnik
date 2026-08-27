const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://tik.porn/'
};

/**
 * Clean any reference to original external brand
 */
function cleanTitle(title = '') {
  if (!title) return 'TikTok Hot Short';
  return title
    .replace(/\|\s*Tik\.Porn/gi, '')
    .replace(/Tik\.Porn/gi, 'niksex')
    .replace(/tik\.porn/gi, '')
    .replace(/tikporn/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format ISO 8601 duration (e.g. PT15S, PT1M30S) into mm:ss
 */
function formatDuration(isoDur = 'PT30S') {
  if (!isoDur || typeof isoDur !== 'string') return '00:30';
  let clean = isoDur.replace('PT', '');
  let mins = 0;
  let secs = 0;
  if (clean.includes('M')) {
    const parts = clean.split('M');
    mins = parseInt(parts[0], 10) || 0;
    clean = parts[1] || '';
  }
  if (clean.includes('S')) {
    secs = parseInt(clean.replace('S', ''), 10) || 0;
  }
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Scrape TikTok shorts feed
 */
async function scrapeTikPornFeed(query = '', page = 1) {
  try {
    let targetUrl = 'https://tik.porn/';
    const qLower = (query || '').toLowerCase().trim();

    if (qLower && qLower !== 'trending' && qLower !== 'all' && qLower !== 'tiktok') {
      targetUrl = `https://tik.porn/?s=${encodeURIComponent(qLower)}&page=${page}`;
    } else if (page > 1) {
      targetUrl = `https://tik.porn/?s=tiktok&page=${page}`;
    }

    const response = await axios.get(targetUrl, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    const videos = [];
    const seenIds = new Set();

    // 1. Extract from JSON-LD Schema
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        const list = json['@type'] === 'VideoObject' ? [json] : (json.hasPart || []);
        list.forEach(v => {
          if (v['@type'] === 'VideoObject' && v.url) {
            const match = v.url.match(/\/video\/(\d+)/);
            if (!match) return;
            const vidId = match[1];
            if (seenIds.has(vidId)) return;
            seenIds.add(vidId);

            const prefix = vidId.length > 4 ? vidId.slice(0, 4) : vidId.slice(0, 3);
            const thumb = (Array.isArray(v.thumbnailUrl) ? v.thumbnailUrl[0] : v.thumbnailUrl) 
              || `https://image-cdn.tik.porn/video/${prefix}/${vidId}/list-sm.jpg?ver=2`;
            
            let viewsCount = `${Math.floor(Math.random() * 80 + 20)}.${Math.floor(Math.random() * 9)}K`;
            let likesCount = `${Math.floor(Math.random() * 15 + 2)}.${Math.floor(Math.random() * 9)}K`;
            
            if (Array.isArray(v.interactionStatistic)) {
              v.interactionStatistic.forEach(st => {
                if (st.interactionType && st.interactionType.includes('ViewAction') && st.userInteractionCount) {
                  viewsCount = parseInt(st.userInteractionCount, 10).toLocaleString();
                }
                if (st.interactionType && st.interactionType.includes('LikeAction') && st.userInteractionCount) {
                  likesCount = parseInt(st.userInteractionCount, 10).toLocaleString();
                }
              });
            }

            const cleanT = cleanTitle(v.name || `TikTok Hot Video #${vidId}`);
            const directVideoUrl = v.contentUrl || '';

            videos.push({
              id: `tik_${vidId}`,
              original_id: vidId,
              source: 'tiktok',
              title: cleanT,
              thumbnail: thumb,
              poster: Array.isArray(v.thumbnailUrl) && v.thumbnailUrl[1] ? v.thumbnailUrl[1] : thumb.replace('list-sm', 'poster'),
              preview_video: directVideoUrl,
              duration: formatDuration(v.duration),
              views: viewsCount,
              likes: likesCount,
              rating: '98%',
              direct_video_url: directVideoUrl,
              video_url: directVideoUrl,
              embed_url: directVideoUrl,
              category: 'tiktok',
              is_vertical: true,
              is_tiktok: true,
              tags: Array.isArray(v.genre) ? v.genre.map(g => cleanTitle(g)) : ['TikTok', 'Shorts', 'Vertical', 'Trending']
            });
          }
        });
      } catch (e) {}
    });

    // 2. Extract from HTML video card thumbnails
    const htmlCards = [];
    $('a[href*="/video/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/video\/(\d+)/);
      if (!match) return;
      const vidId = match[1];
      if (seenIds.has(vidId)) return;
      seenIds.add(vidId);

      const parent = $(el).closest('.RelatedSlide-module-scss-module__JlqO6q__video') || $(el).parent();
      let rawTitle = $(el).attr('title') 
        || parent.find('.RelatedSlide-module-scss-module__JlqO6q__videoTitle a').text().trim() 
        || $(el).text().trim()
        || `TikTok Hot Video #${vidId}`;

      const title = cleanTitle(rawTitle);
      const prefix = vidId.length > 4 ? vidId.slice(0, 4) : vidId.slice(0, 3);
      let thumb = $(el).find('img').attr('src') 
        || $(el).find('source[type="image/jpeg"]').attr('srcset') 
        || $(el).find('img').attr('data-src') 
        || `https://image-cdn.tik.porn/video/${prefix}/${vidId}/list-sm.jpg?ver=2`;

      const views = parent.find('.RelatedSlide-module-scss-module__JlqO6q__viewsIcon').text().trim() 
        || `${Math.floor(Math.random() * 50 + 10)}.${Math.floor(Math.random() * 9)}K`;
      
      const likes = parent.find('.RelatedSlide-module-scss-module__JlqO6q__likeIcon').text().trim() 
        || `${Math.floor(Math.random() * 500 + 50)}`;

      htmlCards.push({
        id: `tik_${vidId}`,
        original_id: vidId,
        source: 'tiktok',
        title: title,
        thumbnail: thumb,
        poster: thumb.replace('list-sm', 'poster'),
        duration: '00:30',
        views: views,
        likes: likes,
        rating: '98%',
        video_url: '',
        embed_url: '',
        direct_video_url: '',
        category: 'tiktok',
        is_vertical: true,
        is_tiktok: true,
        tags: ['TikTok', 'Shorts', 'Vertical', qLower || 'Trending']
      });
    });

    // 3. Resolve direct MP4 URLs in parallel for all HTML cards
    if (htmlCards.length > 0) {
      const resolvedList = await Promise.all(
        htmlCards.map(async (card) => {
          try {
            const details = await scrapeTikPornSingle(card.original_id);
            if (details && details.direct_video_url) {
              card.direct_video_url = details.direct_video_url;
              card.video_url = details.direct_video_url;
              card.embed_url = details.direct_video_url;
              card.duration = details.duration || card.duration;
              if (details.title && details.title !== `TikTok Video #${card.original_id}`) {
                card.title = details.title;
              }
              if (details.tags && details.tags.length > 0) {
                card.tags = details.tags;
              }
              return card;
            }
          } catch (err) {}
          return null;
        })
      );

      resolvedList.filter(Boolean).forEach(c => videos.push(c));
    }

    return {
      success: true,
      source: 'tiktok',
      query: query,
      page: parseInt(page, 10) || 1,
      count: videos.length,
      videos: videos.filter(v => !!v.direct_video_url)
    };
  } catch (err) {
    console.error('[TikTok Scraper Error]', err.message);
    return {
      success: false,
      source: 'tiktok',
      error: err.message,
      videos: []
    };
  }
}

/**
 * Scrape Single TikTok Video details & direct streaming MP4
 */
async function scrapeTikPornSingle(urlOrId) {
  try {
    let vidId = urlOrId;
    if (typeof urlOrId === 'string') {
      const match = urlOrId.match(/(\d+)/);
      if (match) vidId = match[1];
    }

    const url = `https://tik.porn/video/${vidId}`;
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);

    let videoObj = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'VideoObject') videoObj = json;
      } catch (e) {}
    });

    const rawTitle = $('title').text() || videoObj?.name || `TikTok Video #${vidId}`;
    const title = cleanTitle(rawTitle);
    const duration = formatDuration(videoObj?.duration);
    const contentUrl = videoObj?.contentUrl || '';
    
    const prefix = String(vidId).length > 4 ? String(vidId).slice(0, 4) : String(vidId).slice(0, 3);
    const thumb = (Array.isArray(videoObj?.thumbnailUrl) ? videoObj.thumbnailUrl[0] : videoObj?.thumbnailUrl) 
      || `https://image-cdn.tik.porn/video/${prefix}/${vidId}/poster.jpg?ver=2`;

    let views = '25,400';
    let likes = '1,450';
    if (Array.isArray(videoObj?.interactionStatistic)) {
      videoObj.interactionStatistic.forEach(st => {
        if (st.interactionType && st.interactionType.includes('ViewAction') && st.userInteractionCount) {
          views = parseInt(st.userInteractionCount, 10).toLocaleString();
        }
        if (st.interactionType && st.interactionType.includes('LikeAction') && st.userInteractionCount) {
          likes = parseInt(st.userInteractionCount, 10).toLocaleString();
        }
      });
    }

    let tags = [];
    if (Array.isArray(videoObj?.keywords)) {
      tags = videoObj.keywords.map(t => cleanTitle(t));
    } else if (typeof videoObj?.keywords === 'string' && videoObj.keywords) {
      tags = videoObj.keywords.split(',').map(t => cleanTitle(t.trim())).filter(Boolean);
    } else {
      tags = ['TikTok', 'Shorts', '18+'];
    }

    return {
      success: true,
      source: 'tiktok',
      id: `tik_${vidId}`,
      original_id: String(vidId),
      title: title,
      thumbnail: thumb,
      poster: thumb,
      duration: duration,
      views: views,
      likes: likes,
      rating: '98%',
      direct_video_url: contentUrl,
      video_url: contentUrl,
      embed_url: contentUrl,
      category: 'tiktok',
      is_vertical: true,
      is_tiktok: true,
      tags: tags
    };
  } catch (err) {
    console.error('[TikTok Single Scraper Error]', err.message);
    return {
      success: false,
      source: 'tiktok',
      error: err.message
    };
  }
}

/**
 * Universal Scraper Handler for TikTok links (Single or Category/Tag page)
 */
async function scrapeTikPornBatch(url) {
  try {
    const trimmed = url.trim();
    if (trimmed.includes('/video/')) {
      const single = await scrapeTikPornSingle(trimmed);
      if (single.success) {
        return {
          success: true,
          type: 'single',
          count: 1,
          videos: [single]
        };
      }
    }

    // Otherwise scrape as category / search page
    const res = await axios.get(trimmed, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const videos = [];
    const seenIds = new Set();

    $('a[href*="/video/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/video\/(\d+)/);
      if (!match) return;
      const vidId = match[1];
      if (seenIds.has(vidId)) return;
      seenIds.add(vidId);

      const parent = $(el).closest('.RelatedSlide-module-scss-module__JlqO6q__video') || $(el).parent();
      let rawTitle = $(el).attr('title') 
        || parent.find('.RelatedSlide-module-scss-module__JlqO6q__videoTitle a').text().trim() 
        || `TikTok Hot Video #${vidId}`;

      const title = cleanTitle(rawTitle);
      const prefix = vidId.length > 4 ? vidId.slice(0, 4) : vidId.slice(0, 3);
      let thumb = $(el).find('img').attr('src') 
        || $(el).find('source[type="image/jpeg"]').attr('srcset') 
        || `https://image-cdn.tik.porn/video/${prefix}/${vidId}/list-sm.jpg?ver=2`;

      videos.push({
        id: `tik_${vidId}`,
        original_id: vidId,
        source: 'tiktok',
        title: title,
        thumbnail: thumb,
        poster: thumb.replace('list-sm', 'poster'),
        duration: '00:30',
        views: `${Math.floor(Math.random() * 40 + 10)}K`,
        rating: '98%',
        category: 'tiktok',
        is_vertical: true,
        is_tiktok: true,
        tags: ['TikTok', 'Shorts', '18+']
      });
    });

    return {
      success: true,
      type: 'page_batch',
      count: videos.length,
      videos: videos
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      videos: []
    };
  }
}

module.exports = {
  scrapeTikPornFeed,
  scrapeTikPornSingle,
  scrapeTikPornBatch,
  cleanTitle
};
