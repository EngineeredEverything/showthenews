const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');
const { generateRSSFeed } = require('./rss-generator');
const { generateSitemap } = require('./sitemap-generator');

const app = express();
const parser = new Parser({
  timeout: 10000,
  headers: {'User-Agent': 'ShowTheNews/1.0'}
});

app.use(cors());
app.use(express.static('.'));

// News sources - curated for quality, diversity, and copyright compliance
const sources = [
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml', region: 'UK' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', region: 'US' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', region: 'UK' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', region: 'Qatar' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', region: 'US' },
  { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', region: 'US' },
  { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world', region: 'US' },
  { name: 'The Hill', url: 'https://thehill.com/feed/', region: 'US' },
  { name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/main', region: 'US' },
  // { name: 'AP News', url: 'https://apnews.com/index.rss', region: 'US' }, // Disabled: requires authentication (401)
  // { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', region: 'International' }, // Disabled: 404
  { name: 'The Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', region: 'India' },
  { name: 'The Independent', url: 'https://www.independent.co.uk/news/world/rss', region: 'UK' },
  { name: 'France24', url: 'https://www.france24.com/en/rss', region: 'France' },
  { name: 'DW (Germany)', url: 'https://rss.dw.com/xml/rss-en-all', region: 'Germany' },
  { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml', region: 'UK' },
  { name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', region: 'US' }
];

let cachedNews = { stories: [], events: [], sources: [], lastUpdate: null };
let analytics = {
  totalRequests: 0,
  uniqueVisitors: new Set(),
  eventClicks: {},
  lastReset: new Date().toISOString()
};

// Extract keywords from text
function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'says', 'said']);
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

// Calculate similarity between two stories
function calculateSimilarity(story1, story2) {
  const keywords1 = extractKeywords(story1.title);
  const keywords2 = extractKeywords(story2.title);
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Cluster stories into events
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
    
    // Find similar stories
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
  
  // Sort by score and recency
  return events
    .sort((a, b) => {
      const scoreA = a.score + (new Date(a.stories[0].pubDate) / 1000000000);
      const scoreB = b.score + (new Date(b.stories[0].pubDate) / 1000000000);
      return scoreB - scoreA;
    })
    .slice(0, 20)
    .map(event => ({
      title: event.stories[0].title,
      digest: event.stories[0].contentSnippet?.slice(0, 150) || '',
      sources: event.stories.map(s => ({ name: s.source, url: s.link })),
      pubDate: event.stories[0].pubDate,
      score: event.score
    }));
}

// Fetch all news
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
        source: source.name
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

// API endpoints
app.get('/api/news', (req, res) => {
  analytics.totalRequests++;
  const visitorId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  analytics.uniqueVisitors.add(visitorId);
  
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.json(cachedNews);
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

app.post('/api/track-click', express.json(), (req, res) => {
  const { eventTitle } = req.body;
  if (eventTitle) {
    analytics.eventClicks[eventTitle] = (analytics.eventClicks[eventTitle] || 0) + 1;
  }
  res.json({ success: true });
});

// RSS feed endpoint
app.get('/rss.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900'); // 15 min cache
  
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

// Sitemap endpoint (SEO)
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  
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

// Robots.txt endpoint (SEO)
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

// Initial fetch and periodic updates
fetchNews();
setInterval(fetchNews, 15 * 60 * 1000); // Every 15 minutes

const PORT = 3042;
app.listen(PORT, () => {
  console.log(`ShowTheNews server running on http://localhost:${PORT}`);
});
