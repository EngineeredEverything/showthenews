// Email Digest Generator for ShowTheNews
// Generates HTML email with top daily news events

const fs = require('fs');
const path = require('path');
const http = require('http');

// Fetch news data from local server API
async function fetchNewsData() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3042/api/news', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Generate HTML email digest from cached news data
async function generateDailyDigest() {
  let data;
  
  try {
    data = await fetchNewsData();
  } catch (err) {
    console.error('Failed to fetch news data:', err.message);
    return null;
  }
  
  const { events, lastUpdate } = data;
  
  if (!events || events.length === 0) {
    console.error('No events in cache');
    return null;
  }

  // Take top 10 events for email (not overwhelming)
  const topEvents = events.slice(0, 10);
  
  // Add derived fields (priority, corroboration, publishedAt)
  topEvents.forEach(event => {
    event.corroboration = event.sources ? event.sources.length : 1;
    event.priority = event.corroboration >= 4 ? 'high' : 'medium';
    event.publishedAt = event.pubDate || new Date().toISOString();
  });
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShowTheNews Daily Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.95;
      font-size: 14px;
    }
    .content {
      background: white;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .event {
      margin-bottom: 30px;
      padding-bottom: 25px;
      border-bottom: 1px solid #e5e7eb;
    }
    .event:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .event-rank {
      display: inline-block;
      background: #3b82f6;
      color: white;
      width: 28px;
      height: 28px;
      line-height: 28px;
      text-align: center;
      border-radius: 50%;
      font-weight: 700;
      font-size: 14px;
      margin-right: 10px;
    }
    .event-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 8px 0;
      line-height: 1.4;
    }
    .event-digest {
      color: #4b5563;
      margin: 8px 0;
      font-size: 15px;
    }
    .event-meta {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      font-size: 13px;
      color: #6b7280;
    }
    .priority-high {
      color: #dc2626;
      font-weight: 600;
    }
    .priority-medium {
      color: #d97706;
      font-weight: 600;
    }
    .sources {
      margin-top: 8px;
      font-size: 13px;
    }
    .source-link {
      display: inline-block;
      margin-right: 10px;
      margin-top: 5px;
      color: #2563eb;
      text-decoration: none;
      padding: 4px 10px;
      background: #eff6ff;
      border-radius: 4px;
      font-size: 12px;
    }
    .source-link:hover {
      background: #dbeafe;
    }
    .footer {
      margin-top: 30px;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 8px;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .button {
      display: inline-block;
      margin-top: 15px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
    .button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📰 ShowTheNews</h1>
    <p>Your Daily News Intelligence Digest</p>
    <p style="font-size: 12px; opacity: 0.85;">${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
  </div>
  
  <div class="content">
    <p style="margin-top: 0; color: #4b5563;">
      Here are today's top ${topEvents.length} news events, compressed from ${data.totalStories || 0} stories across ${data.sourceCount || 0} trusted outlets.
    </p>
    
    ${topEvents.map((event, index) => `
      <div class="event">
        <div>
          <span class="event-rank">${index + 1}</span>
          <span class="${event.priority === 'high' ? 'priority-high' : 'priority-medium'}">
            ${event.priority.toUpperCase()}
          </span>
          ${event.corroboration > 1 ? `<span style="color: #059669; font-weight: 600;">${event.corroboration} sources</span>` : ''}
        </div>
        
        <div class="event-title">${event.title}</div>
        
        <div class="event-digest">${event.digest}</div>
        
        <div class="event-meta">
          <span>📅 ${formatTimeAgo(event.publishedAt)}</span>
          ${event.image ? '<span>📸 Image available</span>' : ''}
        </div>
        
        ${event.sources && event.sources.length > 0 ? `
          <div class="sources">
            <strong style="font-size: 12px; color: #6b7280;">Read more:</strong><br>
            ${event.sources.slice(0, 3).map(source => 
              `<a href="${source.url}" class="source-link" target="_blank">${source.source}</a>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb;">
      <p style="color: #4b5563; margin-bottom: 10px;">
        See all ${events.length} events on our live news wall
      </p>
      <a href="https://engineeredeverything.com/apps/showthenews/" class="button">
        View Full News Wall →
      </a>
    </div>
  </div>
  
  <div class="footer">
    <p>
      <strong>ShowTheNews</strong> delivers AI-powered news intelligence without replacing journalism.
      <br>Every story links to the original publisher.
    </p>
    <p style="margin-top: 15px;">
      <a href="#">Unsubscribe</a> • 
      <a href="#">Update Preferences</a> • 
      <a href="#">Privacy Policy</a>
    </p>
    <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
      You're receiving this because you subscribed to ShowTheNews Daily Digest.
    </p>
  </div>
</body>
</html>
`;

  return html;
}

// Generate plain text version for email clients that don't support HTML
async function generatePlainTextDigest() {
  let data;
  
  try {
    data = await fetchNewsData();
  } catch (err) {
    console.error('Failed to fetch news data:', err.message);
    return null;
  }
  
  const { events } = data;
  
  if (!events || events.length === 0) {
    return null;
  }

  const topEvents = events.slice(0, 10);
  
  // Add derived fields
  topEvents.forEach(event => {
    event.corroboration = event.sources ? event.sources.length : 1;
    event.priority = event.corroboration >= 4 ? 'high' : 'medium';
    event.publishedAt = event.pubDate || new Date().toISOString();
  });
  
  let text = `SHOWTHENEWS DAILY DIGEST\n`;
  text += `${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n`;
  text += `${'='.repeat(60)}\n\n`;
  
  text += `Today's top ${topEvents.length} news events from ${data.totalStories || 0} stories:\n\n`;
  
  topEvents.forEach((event, index) => {
    text += `${index + 1}. ${event.title.toUpperCase()}\n`;
    text += `   Priority: ${event.priority.toUpperCase()} | ${event.corroboration} sources\n`;
    text += `   ${event.digest}\n`;
    text += `   Published: ${formatTimeAgo(event.publishedAt)}\n`;
    
    if (event.sources && event.sources.length > 0) {
      text += `   Read more:\n`;
      event.sources.slice(0, 3).forEach(source => {
        text += `   - ${source.source}: ${source.url}\n`;
      });
    }
    text += `\n`;
  });
  
  text += `${'='.repeat(60)}\n`;
  text += `View all ${events.length} events: https://engineeredeverything.com/apps/showthenews/\n\n`;
  text += `Unsubscribe: [link] | Update Preferences: [link]\n`;
  
  return text;
}

// Helper: format time ago
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Export for use in other scripts
module.exports = {
  generateDailyDigest,
  generatePlainTextDigest
};

// CLI usage
if (require.main === module) {
  (async () => {
    const htmlDigest = await generateDailyDigest();
    const textDigest = await generatePlainTextDigest();
    
    if (htmlDigest) {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Save HTML version
      const htmlPath = path.join(dataDir, 'daily-digest.html');
      fs.writeFileSync(htmlPath, htmlDigest);
      console.log(`✓ HTML digest saved to ${htmlPath}`);
      
      // Save text version
      const textPath = path.join(dataDir, 'daily-digest.txt');
      fs.writeFileSync(textPath, textDigest);
      console.log(`✓ Text digest saved to ${textPath}`);
      
      console.log('\nPreview URL: file://' + htmlPath);
      console.log('Or view in browser: https://engineeredeverything.com/apps/showthenews/data/daily-digest.html');
    } else {
      console.error('Failed to generate digest');
    }
  })();
}
