const axios = require('axios');
const cheerio = require('cheerio');

async function testSingleModel(slug = 'mia-khalifa-rdQpt') {
  try {
    const url = `https://www.eporner.com/pornstar/${slug}/`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(res.data);

    const videoLinks = [];
    $('a[href*="/hd-porn/"]').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).attr('title') || $(el).text().trim();
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (href && title) {
        videoLinks.push({ href, title, img });
      }
    });

    console.log('Total hd-porn links:', videoLinks.length);
    console.log('Sample video links:', videoLinks.slice(0, 5));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSingleModel();
