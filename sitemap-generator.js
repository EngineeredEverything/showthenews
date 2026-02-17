/**
 * Sitemap Generator for ShowTheNews
 * Generates dynamic XML sitemap for better SEO
 */

function generateSitemap(events, options = {}) {
  const {
    baseUrl = 'https://engineeredeverything.com/apps/showthenews/',
    includeEvents = true,
    maxEvents = 50
  } = options;

  const now = new Date().toISOString();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Homepage -->
  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Analytics Dashboard -->
  <url>
    <loc>${escapeXml(baseUrl)}analytics.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Landing Page -->
  <url>
    <loc>${escapeXml(baseUrl)}landing.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- RSS Feed -->
  <url>
    <loc>${escapeXml(baseUrl)}rss.xml</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  // Add individual news events (Google News sitemap format)
  if (includeEvents && events && events.length > 0) {
    const recentEvents = events.slice(0, maxEvents);
    
    for (let i = 0; i < recentEvents.length; i++) {
      const event = recentEvents[i];
      if (!event.stories || event.stories.length === 0) continue;
      
      const firstSource = event.stories[0];
      const pubDate = event.publishedAt ? new Date(event.publishedAt).toISOString() : now;
      const title = event.digest || event.headline || event.title || 'Breaking News';
      const source = event.sources?.[0]?.name || 'ShowTheNews';
      
      sitemap += `
  <!-- Event ${i + 1}: ${escapeXml(title.slice(0, 50))}... -->
  <url>
    <loc>${escapeXml(baseUrl)}#event-${i}</loc>
    <news:news>
      <news:publication>
        <news:name>ShowTheNews</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
      <news:keywords>${escapeXml(event.sources?.slice(0, 5).map(s => s.name || s).join(', ') || 'news')}</news:keywords>
    </news:news>
    <lastmod>${pubDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  sitemap += `</urlset>`;
  
  return sitemap;
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

module.exports = { generateSitemap };
