require('dotenv').config();
const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { generateRSSFeed } = require('./rss-generator');
const { generateSitemap } = require('./sitemap-generator');

const app = express();
const parser = new Parser({
  timeout: 10000,
  headers: {'User-Agent': 'ShowTheNews/1.0'}
});

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// News sources - curated for quality, diversity, and copyright compliance
const sources = [
  // World/General news
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml', region: 'uk', category: 'world' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', region: 'us', category: 'world' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', region: 'uk', category: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', region: 'global', category: 'world' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', region: 'us', category: 'world' },
  { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', region: 'us', category: 'world' },
  { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world', region: 'us', category: 'world' },
  { name: 'The Hill', url: 'https://thehill.com/feed/', region: 'us', category: 'world' },
  { name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/main', region: 'us', category: 'world' },
  { name: 'The Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', region: 'asia', category: 'world' },
  { name: 'The Independent', url: 'https://www.independent.co.uk/news/world/rss', region: 'uk', category: 'world' },
  { name: 'France24', url: 'https://www.france24.com/en/rss', region: 'europe', category: 'world' },
  { name: 'DW (Germany)', url: 'https://rss.dw.com/xml/rss-en-all', region: 'europe', category: 'world' },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml', region: 'uk', category: 'world' },
  { name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', region: 'us', category: 'world' },

  // Tech news
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', region: 'us', category: 'tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', region: 'us', category: 'tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', region: 'us', category: 'tech' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', region: 'us', category: 'tech' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', region: 'us', category: 'tech' },

  // Finance news
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', region: 'us', category: 'finance' },
  { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', region: 'us', category: 'finance' },
  { name: 'Financial Times', url: 'https://www.ft.com/rss/home/uk', region: 'uk', category: 'finance' },
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', region: 'us', category: 'finance' },
  { name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', region: 'us', category: 'finance' },

  // Sports news
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', region: 'us', category: 'sports' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', region: 'uk', category: 'sports' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/', region: 'us', category: 'sports' },
  { name: 'Sports Illustrated', url: 'https://www.si.com/rss/si_topstories.rss', region: 'us', category: 'sports' },
  { name: 'The Athletic', url: 'https://theathletic.com/rss/news', region: 'us', category: 'sports' },
];

const REGIONS = ['global', 'us', 'uk', 'europe', 'asia'];

// Region fallback map — if filtering by region yields too few results, fall back
const REGION_FALLBACK = {
  us: ['us', 'global'],
  uk: ['uk', 'global'],
  europe: ['europe', 'global'],
  asia: ['asia', 'global'],
  global: ['global', 'us', 'uk', 'europe', 'asia'],
};

let cachedNews = { stories: [], events: [], sources: [], lastUpdate: null };
let analytics = {
  totalRequests: 0,
  uniqueVisitors: new Set(),
  eventClicks: {},
  lastReset: new Date().toISOString()
};

// Category keyword mapping for auto-classification
const categoryKeywords = {
  tech: ['ai', 'artificial', 'intelligence', 'technology', 'tech', 'software', 'hardware', 'apple', 'google', 'microsoft', 'meta', 'amazon', 'tesla', 'startup', 'silicon', 'cyber', 'hack', 'chip', 'semiconductor', 'robot', 'automation', 'cloud', 'data', 'privacy', 'algorithm', 'machine', 'learning', 'openai', 'chatgpt', 'elon', 'spacex', 'internet', 'smartphone', 'bitcoin', 'crypto', 'blockchain', 'nvidia', 'samsung', 'social', 'twitter', 'facebook', 'instagram', 'tiktok'],
  finance: ['market', 'stock', 'economy', 'economic', 'inflation', 'interest', 'rate', 'bank', 'banking', 'federal', 'reserve', 'wall', 'street', 'finance', 'financial', 'trade', 'trading', 'investment', 'investor', 'gdp', 'recession', 'debt', 'deficit', 'budget', 'tax', 'tariff', 'dollar', 'euro', 'currency', 'bond', 'commodity', 'oil', 'price', 'earnings', 'profit', 'revenue', 'nasdaq', 'dow', 'fund', 'mortgage', 'housing', 'real', 'estate', 'wealth', 'billion', 'trillion'],
  sports: ['sport', 'game', 'match', 'championship', 'tournament', 'league', 'team', 'player', 'coach', 'nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'olympic', 'world', 'cup', 'win', 'loss', 'score', 'season', 'playoff', 'final', 'athlete', 'injury', 'transfer', 'contract', 'trade', 'draft', 'stadium', 'fan', 'superbowl', 'super', 'bowl', 'series', 'championship', 'fifa', 'ufc', 'boxing', 'swimming', 'racing', 'formula', 'nascar']
};

function detectCategory(source, title, snippet) {
  if (source.category && source.category !== 'world') {
    return source.category;
  }
  const text = (title + ' ' + (snippet || '')).toLowerCase();
  const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/);
  const scores = { tech: 0, finance: 0, sports: 0 };
  for (const word of words) {
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.includes(word)) scores[cat]++;
    }
  }
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore >= 2) {
    return Object.keys(scores).find(k => scores[k] === maxScore);
  }
  return 'world';
}

function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'says', 'said']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

function calculateSimilarity(story1, story2) {
  const keywords1 = extractKeywords(story1.title);
  const keywords2 = extractKeywords(story2.title);
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function clusterStories(stories) {
  const events = [];
  const processed = new Set();
  stories.forEach((story, i) => {
    if (processed.has(i)) return;
    const cluster = {
      stories: [story],
      keywords: extractKeywords(story.title),
      score: 1
    };
    stories.forEach((otherStory, j) => {
      if (i !== j && !processed.has(j)) {
        const similarity = calculateSimilarity(story, otherStory);
        if (similarity > 0.3) {
          cluster.stories.push(otherStory);
          cluster.keywords = [...cluster.keywords, ...extractKeywords(otherStory.title)];
          cluster.score += 1;
          processed.add(j);
        }
      }
    });
    processed.add(i);
    events.push(cluster);
  });
  return events
    .sort((a, b) => {
      const scoreA = a.score + (new Date(a.stories[0].pubDate) / 1000000000);
      const scoreB = b.score + (new Date(b.stories[0].pubDate) / 1000000000);
      return scoreB - scoreA;
    })
    .slice(0, 40)
    .map(event => {
      const lead = event.stories[0];
      const categoryCounts = {};
      event.stories.forEach(s => {
        const cat = detectCategory(s.sourceObj || { category: 'world' }, s.title, s.contentSnippet);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      const category = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'world');
      return {
        title: lead.title,
        digest: lead.contentSnippet?.slice(0, 150) || '',
        sources: event.stories.map(s => ({ name: s.source, url: s.link })),
        pubDate: lead.pubDate,
        score: event.score,
        category,
        region: lead.sourceObj ? lead.sourceObj.region : 'global',
        url: lead.link,
        source: lead.source,
        summary: lead.contentSnippet?.slice(0, 300) || ''
      };
    });
}

async function fetchNews() {
  console.log('Fetching news from sources...');
  const allStories = [];
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      const stories = feed.items.slice(0, 20).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        source: source.name,
        sourceObj: source
      }));
      allStories.push(...stories);
      console.log(`✓ ${source.name}: ${stories.length} stories`);
    } catch (err) {
      console.log(`✗ ${source.name}: ${err.message}`);
    }
  }
  const events = clusterStories(allStories);
  cachedNews = {
    stories: allStories,
    events,
    sources: sources.map(s => s.name),
    lastUpdate: new Date().toISOString()
  };
  console.log(`Clustered ${allStories.length} stories into ${events.length} events`);
}

// ── Image generation helper ────────────────────────────────────────────────
let imageGeneratorModule = null;
function getImageGenerator() {
  if (!imageGeneratorModule) {
    imageGeneratorModule = require('./image-generator');
  }
  return imageGeneratorModule;
}

// ── API endpoints ──────────────────────────────────────────────────────────

app.get('/api/news', (req, res) => {
  analytics.totalRequests++;
  const visitorId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  analytics.uniqueVisitors.add(visitorId);
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(cachedNews);
});

// /api/events — supports ?region=us&category=world&limit=20
app.get('/api/events', (req, res) => {
  analytics.totalRequests++;
  const { region, category, limit } = req.query;
  let events = [...cachedNews.events];

  if (region && region !== 'global') {
    const allowedRegions = REGION_FALLBACK[region] || [region, 'global'];
    const filtered = events.filter(e => allowedRegions.includes(e.region));
    // If too few results, fall back to all events
    events = filtered.length >= 3 ? filtered : events;
  }

  if (category) {
    events = events.filter(e => e.category === category);
  }

  const maxResults = Math.min(parseInt(limit) || 20, 40);
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({
    events: events.slice(0, maxResults),
    region: region || 'global',
    lastUpdate: cachedNews.lastUpdate,
    total: events.length
  });
});

// /api/regions — list of supported regions
app.get('/api/regions', (req, res) => {
  res.json(REGIONS);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    lastUpdate: cachedNews.lastUpdate,
    totalStories: cachedNews.stories.length,
    totalEvents: cachedNews.events.length,
    activeSources: cachedNews.sources.length
  });
});

app.get('/api/analytics', (req, res) => {
  res.json({
    totalRequests: analytics.totalRequests,
    uniqueVisitors: analytics.uniqueVisitors.size,
    topEvents: Object.entries(analytics.eventClicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    since: analytics.lastReset
  });
});

app.post('/api/track-click', (req, res) => {
  const { eventTitle } = req.body;
  if (eventTitle) {
    analytics.eventClicks[eventTitle] = (analytics.eventClicks[eventTitle] || 0) + 1;
  }
  res.json({ success: true });
});

// ── Image API endpoints ────────────────────────────────────────────────────

// GET /api/image/daily?region=global — returns today's image metadata (generates if missing)
app.get('/api/image/daily', async (req, res) => {
  const region = req.query.region || 'global';
  const today = new Date().toISOString().split('T')[0];
  const metaPath = path.join(__dirname, 'images', region, 'daily', `${today}.json`);

  // Return cached metadata if it exists
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return res.json(meta);
    } catch (e) {
      // fall through to generate
    }
  }

  // Generate on demand
  try {
    const generator = getImageGenerator();
    const meta = await generator.generateForRegion(region, cachedNews.events);
    res.json(meta);
  } catch (err) {
    console.error('Image generation error:', err.message);
    res.status(500).json({ error: err.message, generating: false });
  }
});

// GET /api/image/archive?region=global&type=daily — list archived images
app.get('/api/image/archive', (req, res) => {
  const region = req.query.region || 'global';
  const type = req.query.type || 'daily';
  const dirPath = path.join(__dirname, 'images', region, type);

  if (!fs.existsSync(dirPath)) {
    return res.json({ region, type, images: [] });
  }

  try {
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 30);

    const images = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
      } catch (e) {
        return { date: f.replace('.json', ''), error: true };
      }
    });

    res.json({ region, type, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/image/generate?region=global&type=daily|monthly|yearly — manual trigger
app.post('/api/image/generate', async (req, res) => {
  const region = req.query.region || req.body?.region || 'global';
  const type = req.query.type || req.body?.type || 'daily';
  console.log(`Manual image generation triggered for region: ${region}, type: ${type}`);

  // Respond immediately and generate in background
  res.json({ success: true, message: `Generating ${type} image for region: ${region}`, region, type });

  try {
    const generator = getImageGenerator();
    let meta;
    if (type === 'monthly') {
      meta = await generator.generateMonthlyForRegion(region);
    } else if (type === 'yearly') {
      meta = await generator.generateYearlyForRegion(region);
    } else {
      meta = await generator.generateForRegion(region, cachedNews.events);
    }
    console.log(`✓ ${type} image generated for ${region}: ${meta.imageUrl}`);
  } catch (err) {
    console.error(`✗ ${type} image generation failed for ${region}:`, err.message);
  }
});

// ── RSS / Sitemap ──────────────────────────────────────────────────────────

app.get('/rss.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900');
  const rssEvents = cachedNews.events.map((event, index) => ({
    id: index,
    headline: event.title,
    digest: event.digest,
    sources: event.sources.map(s => s.name),
    storyCount: event.sources.length,
    publishedAt: event.pubDate,
    stories: event.sources
  }));
  const rss = generateRSSFeed(rssEvents, {
    title: 'ShowTheNews - Top News Events',
    description: 'AI-powered news compression from 150+ stories into glanceable events. Updated every 15 minutes.',
    link: 'https://engineeredeverything.com/apps/showthenews/'
  });
  res.send(rss);
});

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const sitemapEvents = cachedNews.events.map((event, index) => ({
    id: index,
    title: event.title,
    digest: event.digest,
    sources: event.sources.map(s => s.name),
    publishedAt: event.pubDate,
    stories: event.sources
  }));
  const sitemap = generateSitemap(sitemapEvents, {
    baseUrl: 'https://engineeredeverything.com/apps/showthenews/',
    includeEvents: true,
    maxEvents: 50
  });
  res.send(sitemap);
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`# ShowTheNews - Robots.txt
User-agent: *
Allow: /
Allow: /rss.xml
Allow: /sitemap.xml
Allow: /analytics.html
Allow: /landing.html

Sitemap: https://engineeredeverything.com/apps/showthenews/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 10
`);
});

// ── Cron: Daily image generation at 6:00 AM UTC ───────────────────────────
try {
  const cron = require('node-cron');
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Starting daily image generation for all regions...');
    const generator = getImageGenerator();
    for (const region of REGIONS) {
      try {
        const meta = await generator.generateForRegion(region, cachedNews.events);
        console.log(`[CRON] ✓ Generated image for ${region}: ${meta.imageUrl}`);
      } catch (err) {
        console.error(`[CRON] ✗ Failed for ${region}:`, err.message);
      }
    }
    console.log('[CRON] Daily image generation complete.');
  }, { timezone: 'UTC' });
  console.log('[CRON] Daily image generation scheduled at 6:00 AM UTC');
} catch (err) {
  console.warn('[CRON] node-cron not available, skipping scheduler:', err.message);
}

// ── Start server ──────────────────────────────────────────────────────────
fetchNews();
setInterval(fetchNews, 15 * 60 * 1000);

const PORT = process.env.PORT || 3042;
app.listen(PORT, () => {
  console.log(`ShowTheNews server running on http://localhost:${PORT}`);
});
