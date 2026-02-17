# ShowTheNews - AI-Powered News Intelligence Platform

**Live Demo:** http://localhost:3042

---

## Overview

ShowTheNews is a publisher-friendly news compression platform that clusters global news into glanceable situational awareness while driving traffic to original publishers.

**Target Market:** B2B ambient displays (coworking spaces, offices, maritime, airports, hotels)

---

## Features

### ✅ Implemented
- **Multi-source news aggregation** - 15 trusted news sources (BBC, NPR, Guardian, Al Jazeera, CNN, ABC, Washington Post, The Hill, CBS, Times of India, Independent, France24, DW, Sky News, PBS NewsHour)
- **AI story clustering** - Groups similar stories into stable events using entity extraction and keyword similarity
- **Non-substitutive digests** - 150-character summaries that drive click-through to original sources
- **Automatic image scraping** - Extracts photos from news articles via og:image metadata
- **Publisher attribution** - Every story links to original source with clear source badges
- **Auto-refresh** - Frontend updates every 5 minutes, backend every 15 minutes
- **Fullscreen News Wall** - Optimized for ambient B2B displays
- **Analytics Dashboard** ⭐ - Real-time engagement tracking with click metrics, visitor counts, and system health monitoring
- **Click Tracking** - Measure which stories users actually engage with
- **Performance Monitoring** - Uptime tracking, story counts, and source health checks
- **RSS Feed** 📡 - Standard RSS 2.0 feed for news readers and developer integrations (updated every 15 minutes)
- **SEO Infrastructure** 🔍 - XML sitemap (Google News format), robots.txt, hourly updates for search engine indexing

### 🚧 In Progress
- **Daily image generation** - Visual news compression with interactive hotspots (quality improvements needed)
- **Hotspot editor** - Drag-and-drop tool to adjust clickable regions on daily images

---

## Architecture

```
┌─────────────────┐
│  RSS/API Feeds  │ (10 news sources)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ News Ingestion  │ (rss-parser + cheerio)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Entity Extract  │ (proper nouns, multi-word phrases)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Story Cluster   │ (similarity scoring, recency decay)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Digest + Rank  │ (non-substitutive summaries)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Image Scrape   │ (top 5 events get og:image)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  REST API + UI  │ (Express + Tailwind CSS)
└─────────────────┘
```

---

## API Endpoints

### `GET /api/news`
Returns clustered news events with stories, sources, and images.

**Response:**
```json
{
  "stories": [...],
  "events": [
    {
      "title": "Event headline",
      "digest": "150-char summary",
      "sources": [
        {"name": "BBC", "url": "...", "published": "..."}
      ],
      "sourceCount": 3,
      "image": "https://...",
      "priority": "high"
    }
  ],
  "sources": ["BBC", "NPR", ...],
  "lastUpdate": "2026-02-11T04:52:00.000Z"
}
```

### `GET /api/daily-image`
Returns metadata for the current daily generated image.

**Response:**
```json
{
  "date": "2026-02-10",
  "imageUrl": "/images/daily/2026-02-10.png",
  "hotspots": [
    {
      "x": "15%", "y": "50%", "width": "30%", "height": "40%",
      "headline": "Story headline",
      "url": "https://..."
    }
  ]
}
```

### `POST /api/update-hotspots`
Update hotspot coordinates for daily image (used by adjustment tool).

**Request:**
```json
{
  "date": "2026-02-10",
  "hotspots": [...]
}
```

### `GET /rss.xml` 📡 NEW
Returns RSS 2.0 feed of top 20 news events for RSS readers and developer integrations.

**Response Headers:**
```
Content-Type: application/rss+xml; charset=utf-8
Cache-Control: public, max-age=900
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ShowTheNews - Top News Events</title>
    <description>AI-powered news compression from 150+ stories into glanceable events. Updated every 15 minutes.</description>
    <link>https://engineeredeverything.com/apps/showthenews/</link>
    <lastBuildDate>Sun, 15 Feb 2026 04:55:03 GMT</lastBuildDate>
    <ttl>15</ttl>
    <item>
      <title>Event headline</title>
      <link>https://source-url.com/article</link>
      <description>Event summary with sources and story count</description>
      <pubDate>Sun, 15 Feb 2026 04:52:05 GMT</pubDate>
      <category>BBC</category>
      <category>NPR</category>
    </item>
    ...
  </channel>
</rss>
```

**Use Cases:**
- Subscribe in Feedly, NewsBlur, or any RSS reader
- Parse programmatically for news monitoring
- Embed in newsletters or dashboards
- Integration with automation tools (Zapier, IFTTT)

### `GET /sitemap.xml` 🔍 NEW
Returns XML sitemap for search engine indexing (Google News format).

**Response Headers:**
```
Content-Type: application/xml; charset=utf-8
Cache-Control: public, max-age=3600
```

**Features:**
- Homepage, analytics, landing page, RSS feed
- Top 50 news events with Google News metadata
- Publication dates, keywords, source attribution
- Hourly updates for fresh content signals

**Use Cases:**
- Submit to Google Search Console for indexing
- Enable Google News inclusion
- Improve organic search discoverability
- SEO monitoring and optimization

### `GET /robots.txt` 🔍 NEW
Returns robots.txt directives for search engine crawlers.

**Response:**
```
User-agent: *
Allow: /
Allow: /rss.xml
Allow: /sitemap.xml
Allow: /analytics.html
Allow: /landing.html

Sitemap: https://engineeredeverything.com/apps/showthenews/sitemap.xml

Crawl-delay: 10
```

### `GET /api/health` ⭐ NEW
System health check and operational metrics.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 4017.87,
  "lastUpdate": "2026-02-13T05:48:15.215Z",
  "totalStories": 244,
  "totalEvents": 20,
  "activeSources": 15
}
```

### `GET /api/analytics` ⭐ NEW
Engagement and usage statistics.

**Response:**
```json
{
  "totalRequests": 1250,
  "uniqueVisitors": 87,
  "topEvents": [
    ["Trump revokes greenhouse gas ruling", 45],
    ["Olympic medals generate chatter", 32]
  ],
  "since": "2026-02-13T04:48:00.000Z"
}
```

### `POST /api/track-click` ⭐ NEW
Track story engagement event (called automatically by frontend).

**Request:**
```json
{
  "eventTitle": "Story headline here"
}
```

**Response:**
```json
{
  "success": true
}
```

### `GET /analytics.html` ⭐ NEW
Beautiful real-time analytics dashboard UI with:
- System health monitoring (status, uptime, story/event counts)
- Engagement metrics (requests, visitors, clicks)
- Top engaged stories (ranked bar chart)
- Active news sources
- Auto-refresh every 30 seconds

---

## Tech Stack

- **Backend:** Node.js, Express
- **Parsing:** rss-parser, cheerio, axios
- **Frontend:** Tailwind CSS (CDN)
- **Process Manager:** PM2
- **Image Generation:** OpenAI DALL-E 3 (experimental)

---

## Deployment

```bash
cd /var/www/dashboard/apps/showthenews
npm install
pm2 start server.js --name showthenews
pm2 save
```

**Port:** 3042  
**Process:** Managed by PM2 (auto-restart on crash)

---

## Competitive Advantage

**🎯 Unique Selling Point:** Only news display platform with built-in engagement analytics.

Most ambient displays are one-way broadcasts with zero feedback. ShowTheNews provides:
- ✅ **Measurable engagement** - not just eyeballs, but clicks
- ✅ **Data-driven optimization** - improve content based on behavior
- ✅ **ROI justification** - prove value to stakeholders
- ✅ **Audience insights** - understand what viewers care about

This enables **premium pricing** and **competitive differentiation** in the B2B ambient display market.

---

## Monetization Strategy

1. **B2B Ambient Display Licensing** - $200-1500/mo per location
   - **Basic Tier** ($200/mo): Standard display + basic health monitoring
   - **Pro Tier** ($500/mo): Full analytics dashboard + engagement tracking + API access
   - **Enterprise** ($1500+/mo): Multi-location analytics + custom reporting + dedicated support
2. **Advertising** - Display ads (clearly separated from editorial)
3. **Hosting Services** - White-label platform for publishers/companies
4. **API Access** - Developers/businesses consuming compressed news data

**Revenue Potential:** $1-5M ARR at 100-500 B2B customers, scalable to $10M+ with prosumer and publisher partnership layers.

---

## Development Roadmap

### Phase 1: MVP (✅ Complete)
- [x] News ingestion from 15+ sources
- [x] Story clustering with entity extraction
- [x] Non-substitutive digest generation
- [x] News Wall UI with auto-refresh
- [x] Publisher attribution and click-through

### Phase 2: Analytics & Monitoring (✅ Complete)
- [x] Real-time analytics dashboard
- [x] Click tracking system
- [x] System health monitoring
- [x] Engagement metrics (requests, visitors, clicks)
- [x] Performance optimization (caching)

### Phase 3: Visual Enhancement (🚧 In Progress)
- [x] Image scraping system
- [x] Daily image generation (quality issues)
- [x] Interactive hotspot system
- [ ] Image quality improvements (awaiting strategy decision)
- [ ] Archive system (daily/weekly/monthly)

### Phase 4: Distribution (🚧 Partial)
- [x] Email digest system (generator built, needs SendGrid integration)
- [x] Landing page with subscription funnel
- [ ] X/Twitter integration (API ready, needs paid tier for reading)
- [x] Fullscreen display mode optimization
- [x] Mobile responsive design

### Phase 5: B2B Launch (✅ Ready)
- [x] B2B pitch deck (PITCH-DECK.md)
- [x] Display layouts guide (DISPLAY-LAYOUTS.md)
- [x] Customer onboarding docs (CUSTOMER-ONBOARDING.md)
- [x] Analytics value proposition (ANALYTICS-VALUE.md)
- [ ] First paying customer (ready to demo)

---

## Cost to Operate

**Current MVP:** $0/mo (RSS feeds free, infrastructure existing)  
**With Daily Images:** ~$2.40/mo (DALL-E 3 at $0.08/image × 30 days)  
**At Scale (1000 API calls/day):** < $50/mo

---

## Automation Score

**9/10** - Fully automatable except for trust audits and publisher relations.

Story ingestion, clustering, ranking, digest generation, and visualization require no human intervention. Only editorial oversight and business development need human involvement.

---

## Contact

**Owner:** Clay Fulk (@clayfulk)  
**Orchestrator:** EngineeredEverything  
**Project:** ShowTheNews autonomous agent

---

## License

Proprietary - EngineeredEverything portfolio project
