const axios = require('axios');
const fs = require('fs').promises;

// Layout templates for different story counts
const LAYOUTS = {
  // 3 stories: foreground, midground, background
  // Improved coordinates based on actual DALL-E 3 composition patterns
  3: [
    { zone: 'foreground', x: 15, y: 50, width: 50, height: 40, weight: 3, 
      description: 'Lower third - primary subject/main action' },
    { zone: 'midground', x: 25, y: 20, width: 50, height: 35, weight: 2,
      description: 'Middle band - secondary elements/sky/background action' },
    { zone: 'background', x: 50, y: 15, width: 45, height: 30, weight: 1,
      description: 'Upper right - distant/contextual elements' }
  ],
  // 4 stories: quad layout
  4: [
    { zone: 'top-left', x: 10, y: 15, width: 35, height: 35, weight: 3 },
    { zone: 'top-right', x: 55, y: 15, width: 35, height: 35, weight: 2 },
    { zone: 'bottom-left', x: 10, y: 55, width: 35, height: 35, weight: 2 },
    { zone: 'bottom-right', x: 55, y: 55, width: 35, height: 35, weight: 1 }
  ],
  // 5 stories: center + corners
  5: [
    { zone: 'center', x: 30, y: 30, width: 40, height: 40, weight: 5 },
    { zone: 'top-left', x: 5, y: 5, width: 20, height: 20, weight: 2 },
    { zone: 'top-right', x: 75, y: 5, width: 20, height: 20, weight: 2 },
    { zone: 'bottom-left', x: 5, y: 75, width: 20, height: 20, weight: 1 },
    { zone: 'bottom-right', x: 75, y: 75, width: 20, height: 20, weight: 1 }
  ]
};

// Depth-based layout (current default)
const DEPTH_LAYOUT = {
  foreground: { depth: 'close', prominence: 'dominant', weight: 3 },
  midground: { depth: 'middle distance', prominence: 'supporting', weight: 2 },
  background: { depth: 'far background/horizon', prominence: 'contextual', weight: 1 }
};

async function generateDailyImage() {
  try {
    console.log('🎨 Starting daily image generation...');
    
    // 1. Fetch top news events
    const response = await axios.get('http://localhost:3042/api/news');
    const { events } = response.data;
    const topEvents = events.slice(0, 3); // Top 3 stories
    
    console.log(`📰 Processing ${topEvents.length} top events`);
    
    // 2. Get layout for story count
    const layout = LAYOUTS[topEvents.length] || LAYOUTS[3];
    
    // 3. Build detailed prompt with regions
    const regionDescriptions = topEvents.map((event, i) => {
      const region = layout[i];
      const imageRef = event.image ? `(reference: ${event.image})` : '';
      
      return `
In the ${region.zone} (${region.depth || 'zone'}):
- ${event.title}
- Visual prominence: ${region.prominence || 'important'}
- Image reference: ${imageRef}
- Sources: ${event.sources.map(s => s.name).join(', ')}
      `.trim();
    }).join('\n\n');
    
    const unifiedPrompt = `
Professional editorial illustration of a unified symbolic scene representing today's major world news.
All elements exist in ONE cohesive world with dramatic lighting and atmospheric mood.

${regionDescriptions}

Style: Cinematic editorial photojournalism, symbolic but specific and recognizable,
professional news illustration, designed to be understood from 15 feet away, no text labels.
Unified by: dramatic lighting, coherent perspective, single cohesive atmosphere.
    `.trim();
    
    console.log('📝 Generated prompt:\n', unifiedPrompt);
    
    // 4. Generate image (using DALL-E 3 for now)
    const openaiApiKey = process.env.OPENAI_API_KEY || 
      require('/root/.openclaw/agents/main/agent/auth-profiles.json').profiles['openai:default'].token;
    
    const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: unifiedPrompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd'
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const imageUrl = imageResponse.data.data[0].url;
    console.log('✅ Image generated:', imageUrl);
    
    // 5. Download image
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const dateStr = new Date().toISOString().split('T')[0];
    const imagePath = `./images/daily/${dateStr}.png`;
    
    // Create directory if needed
    await fs.mkdir('./images/daily', { recursive: true });
    await fs.writeFile(imagePath, imageData.data);
    
    console.log('💾 Image saved:', imagePath);
    
    // 6. Save metadata with hotspot coordinates
    const metadata = {
      generatedAt: new Date().toISOString(),
      date: dateStr,
      imageUrl: `/images/daily/${dateStr}.png`,
      events: topEvents.map((event, i) => ({
        title: event.title,
        url: event.sources[0].url,
        source: event.sources[0].name,
        score: event.score,
        referenceImage: event.image,
        hotspot: {
          x: layout[i].x,
          y: layout[i].y,
          width: layout[i].width,
          height: layout[i].height,
          zone: layout[i].zone
        }
      })),
      prompt: unifiedPrompt
    };
    
    await fs.writeFile(`./images/daily/${dateStr}.json`, JSON.stringify(metadata, null, 2));
    console.log('📋 Metadata saved');
    
    // 7. Post to X/Twitter
    try {
      console.log('📤 Posting to X...');
      const { postDailyImage } = require('./x-integration');
      const tweet = await postDailyImage(imagePath, metadata);
      metadata.tweetId = tweet.id;
      metadata.tweetUrl = `https://twitter.com/i/web/status/${tweet.id}`;
      console.log('✅ Posted to X:', metadata.tweetUrl);
      
      // Update metadata with tweet info
      await fs.writeFile(`./images/daily/${dateStr}.json`, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.log('⚠️ Could not post to X:', error.message);
      console.log('   (Image still saved locally)');
    }
    
    return metadata;
    
  } catch (error) {
    console.error('❌ Error generating daily image:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateDailyImage()
    .then(metadata => {
      console.log('\n✅ Daily image generation complete!');
      console.log('📊 Stats:', {
        events: metadata.events.length,
        image: metadata.imageUrl
      });
    })
    .catch(err => {
      console.error('\n❌ Generation failed:', err);
      process.exit(1);
    });
}

module.exports = { generateDailyImage, LAYOUTS };
