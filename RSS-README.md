# ShowTheNews RSS Feed

## Overview
ShowTheNews now offers an RSS feed for easy subscription via RSS readers (Feedly, NewsBlur, etc.).

**Feed URL:** `http://localhost:3042/rss.xml`  
**Public URL:** `https://engineeredeverything.com/apps/showthenews/rss.xml`

---

## Features

✅ **RSS 2.0 Standard** - Compatible with all major RSS readers  
✅ **Top 20 Events** - Most important clustered news events  
✅ **Auto-refresh** - Updates every 15 minutes  
✅ **Source Attribution** - Shows all corroborating sources  
✅ **Rich Metadata** - Title, description, pub date, categories  
✅ **Smart Caching** - 15-minute browser cache for performance  

---

## RSS Feed Structure

Each RSS item includes:
- **Title** - Event headline or digest (150 chars max)
- **Link** - URL to first source story (click-through)
- **Description** - Event summary + source list + story count
- **Publication Date** - Timestamp of original story
- **Categories** - Up to 3 source names (BBC, NPR, etc.)
- **GUID** - Unique identifier for deduplication

---

## Example RSS Item

```xml
<item>
  <title>Trump administration reverses Biden-era clean energy policies</title>
  <link>https://www.bbc.com/news/example</link>
  <description>Trump administration reverses Biden-era clean energy policies

Sources: BBC, NPR, The Guardian, CNN, Al Jazeera

5 related stories</description>
  <pubDate>Sun, 15 Feb 2026 04:52:05 GMT</pubDate>
  <guid isPermaLink="false">https://engineeredeverything.com/apps/showthenews/#event-0</guid>
  <category>BBC</category>
  <category>NPR</category>
  <category>The Guardian</category>
</item>
```

---

## Use Cases

### 1. **Individual Readers**
Subscribe in your favorite RSS reader (Feedly, Inoreader, etc.) to get AI-compressed news updates.

### 2. **Developers**
Parse the RSS feed for programmatic access to top news events.

```bash
curl https://engineeredeverything.com/apps/showthenews/rss.xml
```

### 3. **Content Curators**
Embed ShowTheNews feed into newsletters, dashboards, or aggregation tools.

### 4. **News Monitoring**
Set up automated alerts when specific keywords appear in top events.

---

## B2B Value Proposition

**For Publishers:**
- Direct click-through links to original articles
- Clear source attribution builds trust
- Non-substitutive summaries drive traffic

**For Businesses:**
- Easy integration into internal dashboards
- No API key required (open access)
- Standard RSS format works with existing tools

**For Developers:**
- Clean, validated RSS 2.0 XML
- Consistent structure for parsing
- Reliable 15-minute update cycle

---

## Technical Details

### Update Frequency
- Backend fetches news every 15 minutes
- RSS feed reflects latest clustered events
- Browser cache: 15 minutes (CDN-friendly)

### Performance
- Generated on-demand (no pre-rendering)
- Response time: <50ms (in-memory events)
- Bandwidth: ~5-10KB per request

### SEO Benefits
- RSS feeds indexed by Google News
- Improved discoverability
- Social sharing via feed aggregators

---

## Integration Examples

### Subscribe in Feedly
1. Copy feed URL: `https://engineeredeverything.com/apps/showthenews/rss.xml`
2. Go to Feedly → Add Content → Paste URL
3. Click "Follow"

### Fetch with cURL
```bash
curl -s https://engineeredeverything.com/apps/showthenews/rss.xml | head -50
```

### Parse with Python
```python
import feedparser
feed = feedparser.parse('https://engineeredeverything.com/apps/showthenews/rss.xml')

for entry in feed.entries:
    print(f"{entry.title} - {entry.link}")
```

### Parse with Node.js
```javascript
const Parser = require('rss-parser');
const parser = new Parser();

(async () => {
  const feed = await parser.parseURL('https://engineeredeverything.com/apps/showthenews/rss.xml');
  feed.items.forEach(item => {
    console.log(`${item.title} - ${item.link}`);
  });
})();
```

---

## Roadmap

**Future Enhancements:**
- [ ] Category-specific feeds (Politics, Sports, Tech, etc.)
- [ ] Regional feeds (US, UK, Global)
- [ ] Custom filters via query params (`?category=politics`)
- [ ] Atom feed format support
- [ ] JSON Feed format support

---

## Support

Questions or issues with the RSS feed?
- Check server health: `http://localhost:3042/api/health`
- View analytics: `http://localhost:3042/analytics.html`
- Report bugs: Open issue on GitHub
