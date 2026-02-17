/**
 * RSS Feed Generator for ShowTheNews
 * Generates RSS 2.0 feed from top news events
 */

function generateRSSFeed(events, options = {}) {
  const {
    title = 'ShowTheNews - Top News Events',
    description = 'AI-powered news compression from 150+ stories into glanceable events',
    link = 'https://engineeredeverything.com/apps/showthenews/',
    maxItems = 20
  } = options;

  const now = new Date().toUTCString();
  const items = events.slice(0, maxItems);

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link)}</link>
    <atom:link href="${escapeXml(link)}rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>ShowTheNews RSS Generator v1.0</generator>
    <ttl>15</ttl>
`;

  for (const event of items) {
    const itemTitle = event.digest || event.headline || 'Breaking News';
    const itemLink = event.stories?.[0]?.url || link;
    const itemDescription = buildItemDescription(event);
    const pubDate = event.publishedAt ? new Date(event.publishedAt).toUTCString() : now;
    const guid = `${link}#event-${event.id || Date.now()}`;
    
    // Build categories from sources
    const categories = event.sources?.slice(0, 3).map(source => 
      `    <category>${escapeXml(source)}</category>`
    ).join('\n') || '';

    rss += `
    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${escapeXml(itemLink)}</link>
      <description>${escapeXml(itemDescription)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
${categories}
    </item>
`;
  }

  rss += `  </channel>
</rss>`;

  return rss;
}

function buildItemDescription(event) {
  let desc = event.digest || event.headline || '';
  
  // Add source attribution
  if (event.sources && event.sources.length > 0) {
    const sourceList = event.sources.slice(0, 5).join(', ');
    desc += `\n\nSources: ${sourceList}`;
    
    if (event.sources.length > 5) {
      desc += ` and ${event.sources.length - 5} more`;
    }
  }
  
  // Add story count
  if (event.storyCount) {
    desc += `\n\n${event.storyCount} related ${event.storyCount === 1 ? 'story' : 'stories'}`;
  }
  
  return desc;
}

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { generateRSSFeed };
