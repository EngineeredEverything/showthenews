const axios = require('axios');
const fs = require('fs').promises;
require('dotenv').config();

async function generateSpecificImage() {
  try {
    console.log('🎨 Generating image with SPECIFIC story details...');
    
    // Get top 3 stories (skip Gaza to avoid content filter)
    const response = await axios.get('http://localhost:3042/api/news');
    const allEvents = response.data.events;
    const topEvents = [
      allEvents[0],  // Trump/bridge
      allEvents[1],  // Bad Bunny
      allEvents[3]   // Parenting story (skip Gaza at index 2)
    ];
    
    console.log('Top 3 stories:');
    topEvents.forEach((e, i) => console.log(`${i+1}. ${e.title}`));
    
    // Build ULTRA-SPECIFIC prompt
    const prompt = `
Professional editorial news illustration showing THREE DISTINCT, CLEARLY VISIBLE news stories:

LEFT SIDE (30% of image):
- Donald Trump in recognizable portrait style, wearing red tie and dark suit
- Pointing or gesturing at a suspension bridge (Ambassador Bridge style between US and Canada)
- American and Canadian flags visible
- Serious, confrontational expression
- Bridge in background with border crossing signs

CENTER (40% of image):  
- Bad Bunny (Puerto Rican musician) performing on a massive outdoor stadium stage
- Wearing distinctive colorful outfit
- Large Puerto Rican flag prominently displayed behind him
- Stadium crowd and lights visible
- Super Bowl halftime show energy with pyrotechnics
- Microphone in hand, mid-performance pose

RIGHT SIDE (30% of image):
- Couple sitting apart on opposite ends of a couch in a modern living room
- Young children's toys scattered on floor between them
- Both parents looking distant/disconnected but not angry
- Soft domestic lighting
- Family photos on wall in background
- Emotional distance visually represented by physical space
- Warm but melancholy color palette

CRITICAL REQUIREMENTS:
- All three scenes must be CLEARLY DISTINGUISHABLE
- Each subject must be RECOGNIZABLE (Trump's face, Bad Bunny on stage, damaged building)
- NO generic imagery - specific details for each story
- Unified lighting (dramatic sunset/dusk) but DISTINCT spatial zones
- Professional editorial illustration style
- Cinematic composition
- NO TEXT LABELS

Style: High-quality editorial photojournalism illustration, symbolic but SPECIFIC and RECOGNIZABLE, designed to be understood from 15 feet away, dramatic lighting, coherent perspective.
    `.trim();
    
    console.log('\n📝 Prompt length:', prompt.length, 'characters');
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
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
    
    // Download
    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const dateStr = new Date().toISOString().split('T')[0];
    const imagePath = `./images/daily/${dateStr}.png`;
    
    await fs.writeFile(imagePath, imageData.data);
    console.log('💾 Saved:', imagePath);
    
    // Update metadata with better hotspot coordinates
    const metadata = {
      generatedAt: new Date().toISOString(),
      date: dateStr,
      imageUrl: `/images/daily/${dateStr}.png`,
      events: [
        {
          title: topEvents[0].title,
          url: topEvents[0].sources[0].url,
          source: topEvents[0].sources[0].name,
          score: topEvents[0].score,
          referenceImage: topEvents[0].image,
          hotspot: { x: 5, y: 35, width: 30, height: 50, zone: "left" }  // Trump/Bridge left
        },
        {
          title: topEvents[1].title,
          url: topEvents[1].sources[0].url,
          source: topEvents[1].sources[0].name,
          score: topEvents[1].score,
          referenceImage: topEvents[1].image,
          hotspot: { x: 30, y: 25, width: 40, height: 60, zone: "center" }  // Bad Bunny center
        },
        {
          title: topEvents[2].title,
          url: topEvents[2].sources[0].url,
          source: topEvents[2].sources[0].name,
          score: topEvents[2].score,
          referenceImage: topEvents[2].image,
          hotspot: { x: 70, y: 35, width: 28, height: 50, zone: "right" }  // Gaza right
        }
      ],
      prompt: prompt
    };
    
    await fs.writeFile(`./images/daily/${dateStr}.json`, JSON.stringify(metadata, null, 2));
    console.log('📋 Metadata saved');
    
    console.log('\n✅ SPECIFIC image generation complete!');
    console.log('🎯 Each story should be clearly visible and recognizable');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

generateSpecificImage();
