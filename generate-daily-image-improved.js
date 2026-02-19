const axios = require('axios');
const fs = require('fs').promises;

// Improved layout with better visual hierarchy
const LAYOUTS = {
  3: [
    { zone: 'hero', x: 10, y: 35, width: 55, height: 50, weight: 5, 
      description: 'Main focal point - center-left, dominant presence' },
    { zone: 'supporting', x: 60, y: 15, width: 35, height: 35, weight: 3,
      description: 'Upper right - secondary subject, complementary' },
    { zone: 'context', x: 65, y: 55, width: 30, height: 35, weight: 2,
      description: 'Lower right - background context, atmospheric' }
  ],
  4: [
    { zone: 'hero', x: 8, y: 25, width: 45, height: 45, weight: 5 },
    { zone: 'top-right', x: 58, y: 10, width: 35, height: 35, weight: 3 },
    { zone: 'bottom-left', x: 5, y: 65, width: 35, height: 28, weight: 3 },
    { zone: 'bottom-right', x: 62, y: 68, width: 32, height: 27, weight: 2 }
  ],
  5: [
    { zone: 'center', x: 25, y: 25, width: 50, height: 50, weight: 6 },
    { zone: 'top-left', x: 5, y: 5, width: 18, height: 18, weight: 2 },
    { zone: 'top-right', x: 77, y: 5, width: 18, height: 18, weight: 2 },
    { zone: 'bottom-left', x: 5, y: 77, width: 18, height: 18, weight: 2 },
    { zone: 'bottom-right', x: 77, y: 77, width: 18, height: 18, weight: 2 }
  ]
};

// Visual style templates for different story types
const STYLE_TEMPLATES = {
  politics: {
    atmosphere: 'dramatic governmental architecture, marble halls, power symbols',
    lighting: 'dramatic directional lighting, strong shadows',
    mood: 'gravitas and importance'
  },
  conflict: {
    atmosphere: 'tense urban or battlefield setting, protective barriers',
    lighting: 'harsh contrasts, smoke-filtered sunlight',
    mood: 'urgency and tension'
  },
  technology: {
    atmosphere: 'sleek modern environments, digital interfaces, innovation spaces',
    lighting: 'cool blue tones, glowing screens, futuristic',
    mood: 'innovation and progress'
  },
  nature: {
    atmosphere: 'dramatic natural landscapes, weather phenomena',
    lighting: 'golden hour, storm light, natural drama',
    mood: 'power of nature'
  },
  economy: {
    atmosphere: 'financial districts, trading floors, urban commerce',
    lighting: 'professional lighting, glass and steel reflections',
    mood: 'momentum and activity'
  },
  sports: {
    atmosphere: 'dynamic athletic moments, stadium atmosphere',
    lighting: 'spotlight drama, motion blur',
    mood: 'energy and competition'
  },
  default: {
    atmosphere: 'cinematic news scene, editorial composition',
    lighting: 'professional photojournalism lighting',
    mood: 'newsworthy significance'
  }
};

function detectStoryType(title) {
  const lower = title.toLowerCase();
  
  if (/election|vote|government|congress|senate|president|minister|political/i.test(lower)) {
    return 'politics';
  }
  if (/strike|attack|war|conflict|protest|violence|military/i.test(lower)) {
    return 'conflict';
  }
  if (/tech|ai|robot|digital|cyber|software|apple|google|microsoft/i.test(lower)) {
    return 'technology';
  }
  if (/climate|weather|storm|flood|earthquake|wildfire|environment/i.test(lower)) {
    return 'nature';
  }
  if (/market|stock|economy|trade|business|financial|billion|dollar/i.test(lower)) {
    return 'economy';
  }
  if (/sport|game|match|championship|athlete|team|score/i.test(lower)) {
    return 'sports';
  }
  
  return 'default';
}

function buildEnhancedPrompt(events, layout) {
  // Detect predominant story type from top event
  const primaryType = detectStoryType(events[0].title);
  const style = STYLE_TEMPLATES[primaryType];
  
  // Build scene descriptions for each region
  const regionDescriptions = events.map((event, i) => {
    const region = layout[i];
    const prominence = i === 0 ? 'dominant focal point' : 
                      i === 1 ? 'strong secondary element' : 
                      'supporting context';
    
    // Extract key visual elements from title
    const visualElements = extractVisualElements(event.title);
    
    return `
${i + 1}. [${region.zone.toUpperCase()}] - ${prominence}
   Story: "${event.title}"
   Visual: ${visualElements}
   Composition: Occupies ${region.zone} region, ${prominence}
   Source: ${event.source}
    `.trim();
  }).join('\n\n');
  
  const prompt = `
Create a dramatic, cinematic editorial illustration representing today's major news in ONE unified, photorealistic scene.

VISUAL COMPOSITION (${events.length} stories unified in single frame):
${regionDescriptions}

UNIFIED SCENE REQUIREMENTS:
- ALL elements exist in the SAME coherent world/environment
- ${style.atmosphere}
- ${style.lighting}
- Emotional tone: ${style.mood}
- Perspective: Wide cinematic angle showing full scene depth
- Style: Award-winning photojournalism, National Geographic quality
- NO text, labels, or newspaper layouts - pure visual storytelling
- Designed to be understood from 15 feet away on a display

TECHNICAL SPECIFICATIONS:
- Photorealistic rendering with cinematic color grading
- Dramatic depth of field - sharp foreground, softer background
- Professional composition following rule of thirds
- Unified lighting source creating visual cohesion
- Color palette: Rich, saturated, emotionally resonant
- Atmosphere: ${style.mood} with editorial gravitas

The scene should feel like a single moment frozen in time, where all these news stories converge into one powerful visual narrative.
  `.trim();
  
  return prompt;
}

function extractVisualElements(title) {
  // Parse title to extract concrete visual elements
  const lower = title.toLowerCase();
  
  // People/Leaders
  if (/dies|death|tribute|icon/i.test(lower)) {
    return 'Memorial scene with symbolic tributes, respectful atmosphere';
  }
  
  // Violence/Conflict
  if (/strike|attack|kill|shot/i.test(lower)) {
    return 'Tense security scene, emergency response, protective measures';
  }
  
  // Sports
  if (/match|game|halted|racism/i.test(lower)) {
    return 'Stadium scene with dramatic athletic moment or controversy';
  }
  
  // Politics
  if (/election|vote|government/i.test(lower)) {
    return 'Governmental architecture, voting scenes, political symbolism';
  }
  
  // Technology
  if (/tech|ai|digital/i.test(lower)) {
    return 'Modern tech environment, glowing screens, innovation imagery';
  }
  
  // Nature/Disaster
  if (/storm|climate|disaster/i.test(lower)) {
    return 'Dramatic weather or natural phenomenon, powerful forces';
  }
  
  // Economy/Business
  if (/market|economy|trade/i.test(lower)) {
    return 'Financial district, trading floor activity, economic symbols';
  }
  
  // Default
  return 'Cinematic news scene capturing the essence of the story';
}

async function generateDailyImage() {
  try {
    console.log('🎨 Starting enhanced daily image generation...');
    
    // 1. Fetch top news events
    const response = await axios.get('http://localhost:3042/api/news');
    const { events } = response.data;
    const topEvents = events.slice(0, 3); // Top 3 stories
    
    console.log(`📰 Processing ${topEvents.length} top events:`);
    topEvents.forEach((e, i) => console.log(`   ${i + 1}. ${e.title.substring(0, 60)}...`));
    
    // 2. Get optimized layout
    const layout = LAYOUTS[topEvents.length] || LAYOUTS[3];
    
    // 3. Build enhanced prompt with visual intelligence
    const enhancedPrompt = buildEnhancedPrompt(topEvents, layout);
    
    console.log('\n📝 Generated enhanced prompt:');
    console.log(enhancedPrompt);
    console.log('\n');
    
    // 4. Generate image using DALL-E 3
    const openaiApiKey = process.env.OPENAI_API_KEY || 
      require('/root/.openclaw/agents/main/agent/auth-profiles.json').profiles['openai:default'].token;
    
    console.log('🎨 Generating image with DALL-E 3...');
    const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      style: 'vivid' // More dramatic, photorealistic style
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const imageUrl = imageResponse.data.data[0].url;
    const revisedPrompt = imageResponse.data.data[0].revised_prompt;
    console.log('✅ Image generated successfully');
    console.log('📝 DALL-E revised prompt:', revisedPrompt);
    
    // 5. Download and save image
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const dateStr = new Date().toISOString().split('T')[0];
    const imagePath = `./images/daily/${dateStr}.png`;
    
    await fs.mkdir('./images/daily', { recursive: true });
    await fs.writeFile(imagePath, imageData.data);
    console.log('💾 Image saved:', imagePath);
    
    // 6. Save comprehensive metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      date: dateStr,
      imageUrl: `/images/daily/${dateStr}.png`,
      events: topEvents.map((event, i) => ({
        title: event.title,
        url: event.sources[0].url,
        source: event.sources[0].name,
        score: event.score,
        storyType: detectStoryType(event.title),
        hotspot: {
          x: layout[i].x,
          y: layout[i].y,
          width: layout[i].width,
          height: layout[i].height,
          zone: layout[i].zone,
          weight: layout[i].weight
        }
      })),
      prompt: {
        original: enhancedPrompt,
        revised: revisedPrompt
      },
      generation: {
        model: 'dall-e-3',
        quality: 'hd',
        style: 'vivid',
        size: '1792x1024'
      }
    };
    
    await fs.writeFile(`./images/daily/${dateStr}.json`, JSON.stringify(metadata, null, 2));
    console.log('📋 Metadata saved with enhanced details');
    
    // 7. Optional: Post to X/Twitter (if integration available)
    try {
      console.log('📤 Attempting to post to X...');
      const { postDailyImage } = require('./x-integration');
      const tweet = await postDailyImage(imagePath, metadata);
      metadata.tweetId = tweet.id;
      metadata.tweetUrl = `https://twitter.com/i/web/status/${tweet.id}`;
      console.log('✅ Posted to X:', metadata.tweetUrl);
      
      await fs.writeFile(`./images/daily/${dateStr}.json`, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.log('ℹ️ X posting not configured or failed:', error.message);
    }
    
    console.log('\n✨ Enhanced daily image generation complete!');
    console.log('📊 Summary:');
    console.log(`   - Events: ${topEvents.length}`);
    console.log(`   - Primary type: ${detectStoryType(topEvents[0].title)}`);
    console.log(`   - Image: ${metadata.imageUrl}`);
    console.log(`   - Hotspots: ${layout.length} interactive regions`);
    
    return metadata;
    
  } catch (error) {
    console.error('❌ Error generating daily image:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateDailyImage()
    .then(metadata => {
      console.log('\n🎉 Success! Image ready for display.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Generation failed');
      process.exit(1);
    });
}

module.exports = { generateDailyImage, LAYOUTS, detectStoryType, buildEnhancedPrompt };
