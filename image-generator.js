'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Helpers ────────────────────────────────────────────────────────────────

function getOpenAIKey() {
  const key = process.env.OPENAI_API_KEY;
  if (key) return key;
  try {
    const profiles = JSON.parse(
      fs.readFileSync('/root/.openclaw/agents/main/agent/auth-profiles.json', 'utf8')
    );
    return profiles.profiles['openai:default'].token;
  } catch (e) {
    throw new Error('OPENAI_API_KEY not set and auth-profiles.json not found');
  }
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Download a URL to a file path
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${response.statusCode} downloading image`));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// POST to OpenAI API
function openAIRequest(endpoint, body, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed);
        } catch (e) {
          reject(new Error(`JSON parse error: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Region → Source mapping ────────────────────────────────────────────────
const REGION_SOURCES = {
  us: ['CNN', 'NPR', 'ABC News', 'CBS News', 'The Hill', 'Washington Post', 'PBS NewsHour'],
  uk: ['BBC', 'The Guardian', 'The Independent', 'Sky News'],
  europe: ['France24', 'DW (Germany)'],
  asia: ['The Times of India', 'Al Jazeera'],
  global: null, // all sources
};

// ── Hotspot calculation (3-panel layout) ──────────────────────────────────
function calculateHotspots() {
  return [
    { x: 0,    y: 0, width: 33,  height: 100, storyIndex: 0, label: 'Panel 1' },
    { x: 33,   y: 0, width: 34,  height: 100, storyIndex: 1, label: 'Panel 2' },
    { x: 67,   y: 0, width: 33,  height: 100, storyIndex: 2, label: 'Panel 3' },
  ];
}

// ── Filter events by region ────────────────────────────────────────────────
function filterEventsByRegion(events, region) {
  if (!events || events.length === 0) return [];
  
  if (!region || region === 'global') {
    // For global, take the highest-scoring events from all regions
    return events
      .filter(e => e.category === 'world' || !e.category)
      .slice(0, 10);
  }

  const allowedSources = REGION_SOURCES[region];
  if (!allowedSources) return events.slice(0, 10);

  // Filter by source name
  const filtered = events.filter(e => {
    if (!e.sources) return false;
    return e.sources.some(s => allowedSources.includes(s.name));
  });

  // If too few, fall back to all events
  return filtered.length >= 3 ? filtered : events.slice(0, 10);
}

// ── Build DALL-E prompt ────────────────────────────────────────────────────
const SAFE_KEYWORDS_BLOCKLIST = /\b(war|kill|dead|murder|bomb|attack|terror|shoot|gun|weapon|death|crisis|conflict|violence|protest|riot|avalanche|disaster|flood|earthquake|hurricane|crash|fire|explosion|toxic|poison|abuse|sexual|rape|epstein|nazi|genocide|massacre|suicide|overdose|hostage|kidnap|trafficking|extremist|isis|taliban|hamas|al.qaeda)\b/gi;

function sanitizeHeadline(title) {
  return (title || 'World news')
    .replace(/[^\w\s,.!?'-]/g, ' ')
    .replace(SAFE_KEYWORDS_BLOCKLIST, 'development')
    .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g, match => {
      // Keep 1-word proper nouns (countries, companies) but remove person names
      // Simple heuristic: keep if it looks like a place/org keyword
      return match;
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70);
}

function buildPrompt(stories, safe = false) {
  if (safe) {
    // Generic safe fallback — no specific headlines, just region mood
    return `Editorial news magazine cover illustration divided into exactly 3 equal vertical panels side by side. Panel 1: diplomats shaking hands in a conference hall with flags. Panel 2: a modern city skyline at golden hour with people walking. Panel 3: scientists and researchers working in a bright laboratory. Style: bold, cinematic, modern editorial magazine cover art, rich colors, dramatic lighting, clean composition, professional aesthetic. No text, no words, no letters, no captions.`;
  }

  const panels = stories.slice(0, 3).map((s, i) => {
    const headline = sanitizeHeadline(s.title);
    return `Panel ${i + 1}: editorial illustration representing: ${headline}`;
  });

  return `Editorial news magazine illustration divided into exactly 3 equal vertical panels side by side. ${panels.join('. ')}. Style: bold, cinematic, modern editorial magazine cover art, rich colors, dramatic lighting, clean composition, professional photojournalism aesthetic. Each panel has a distinct scene. No text, no words, no letters, no captions, no overlays of any kind.`;
}

// ── Monthly/Yearly: find most-corroborated story ──────────────────────────
function findMostCorroborated(dailyMetas) {
  // Flatten all stories from daily metas and find the most referenced headline
  const storyCount = {};
  for (const meta of dailyMetas) {
    if (!meta.stories) continue;
    for (const story of meta.stories) {
      const key = (story.title || '').toLowerCase().slice(0, 60);
      storyCount[key] = (storyCount[key] || 0) + 1;
    }
  }
  const topKey = Object.keys(storyCount).sort((a, b) => storyCount[b] - storyCount[a])[0];
  
  // Return stories from the latest meta that has the top story
  for (const meta of [...dailyMetas].reverse()) {
    if (!meta.stories) continue;
    const found = meta.stories.find(s => (s.title || '').toLowerCase().startsWith(topKey?.slice(0, 40) || ''));
    if (found) return [found, ...meta.stories.filter(s => s !== found).slice(0, 2)];
  }
  // Fallback: just use first meta's stories
  return dailyMetas[0]?.stories?.slice(0, 3) || [];
}

// ── Core generation function ───────────────────────────────────────────────
async function generateForRegion(region, events) {
  const apiKey = getOpenAIKey();
  const date = todayString();

  const imageDir = path.join(__dirname, 'images', region, 'daily');
  ensureDir(imageDir);

  const imagePath = path.join(imageDir, `${date}.png`);
  const metaPath = path.join(imageDir, `${date}.json`);

  // Return existing if already generated today
  if (fs.existsSync(metaPath)) {
    console.log(`[image-generator] Using existing image for ${region} on ${date}`);
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  // Filter events for this region
  const regionEvents = filterEventsByRegion(events, region);
  const topStories = regionEvents.slice(0, 3).map(e => ({
    title: e.title,
    url: e.url || (e.sources && e.sources[0]?.url) || '',
    source: e.source || (e.sources && e.sources[0]?.name) || 'Unknown',
    summary: e.summary || e.digest || ''
  }));

  if (topStories.length === 0) {
    throw new Error(`No stories available for region: ${region}`);
  }

  // Pad to 3 if fewer stories
  while (topStories.length < 3) {
    topStories.push({ ...topStories[0], title: topStories[0].title + ' (continued)' });
  }

  let prompt = buildPrompt(topStories);
  console.log(`[image-generator] Generating image for ${region}: "${prompt.slice(0, 80)}..."`);

  // Call DALL-E 3 with safety retry
  let response;
  try {
    response = await openAIRequest('/v1/images/generations', {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'url',
    }, apiKey);
  } catch (err) {
    if (err.message && err.message.includes('safety')) {
      console.warn(`[image-generator] Safety rejection for ${region}, retrying with safe prompt...`);
      prompt = buildPrompt(topStories, true);
      response = await openAIRequest('/v1/images/generations', {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        response_format: 'url',
      }, apiKey);
    } else {
      throw err;
    }
  }

  const imageUrl = response.data[0].url;
  console.log(`[image-generator] Image URL received for ${region}`);

  // Download image
  await downloadFile(imageUrl, imagePath);
  console.log(`[image-generator] Image saved to ${imagePath}`);

  // Relative URL for the frontend
  const relativeImageUrl = `/images/${region}/daily/${date}.png`;

  const hotspots = calculateHotspots();

  const metadata = {
    date,
    region,
    generatedAt: new Date().toISOString(),
    stories: topStories,
    prompt,
    imageUrl: relativeImageUrl,
    originalUrl: imageUrl,
    hotspots,
  };

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`[image-generator] Metadata saved to ${metaPath}`);

  return metadata;
}

// ── Monthly generation ────────────────────────────────────────────────────
async function generateMonthlyForRegion(region) {
  const apiKey = getOpenAIKey();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const imageDir = path.join(__dirname, 'images', region, 'monthly');
  ensureDir(imageDir);

  const metaPath = path.join(imageDir, `${monthKey}.json`);
  const imagePath = path.join(imageDir, `${monthKey}.png`);

  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  // Load daily metas for this month
  const dailyDir = path.join(__dirname, 'images', region, 'daily');
  const dailyMetas = [];
  if (fs.existsSync(dailyDir)) {
    fs.readdirSync(dailyDir)
      .filter(f => f.endsWith('.json') && f.startsWith(monthKey))
      .forEach(f => {
        try {
          dailyMetas.push(JSON.parse(fs.readFileSync(path.join(dailyDir, f), 'utf8')));
        } catch (e) {}
      });
  }

  if (dailyMetas.length === 0) throw new Error(`No daily data for ${region}/${monthKey}`);

  const topStories = findMostCorroborated(dailyMetas);
  const prompt = buildPrompt(topStories) + ' Monthly editorial summary.';

  const response = await openAIRequest('/v1/images/generations', {
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'url',
  }, apiKey);

  const imageUrl = response.data[0].url;
  await downloadFile(imageUrl, imagePath);

  const relativeImageUrl = `/images/${region}/monthly/${monthKey}.png`;
  const metadata = {
    date: monthKey,
    region,
    type: 'monthly',
    generatedAt: new Date().toISOString(),
    stories: topStories,
    imageUrl: relativeImageUrl,
    hotspots: calculateHotspots(),
  };

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

// ── Yearly generation ─────────────────────────────────────────────────────
async function generateYearlyForRegion(region) {
  const apiKey = getOpenAIKey();
  const year = new Date().getFullYear().toString();

  const imageDir = path.join(__dirname, 'images', region, 'yearly');
  ensureDir(imageDir);

  const metaPath = path.join(imageDir, `${year}.json`);
  const imagePath = path.join(imageDir, `${year}.png`);

  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  // Load all monthly metas for this year
  const monthlyDir = path.join(__dirname, 'images', region, 'monthly');
  const monthlyMetas = [];
  if (fs.existsSync(monthlyDir)) {
    fs.readdirSync(monthlyDir)
      .filter(f => f.endsWith('.json') && f.startsWith(year))
      .forEach(f => {
        try {
          monthlyMetas.push(JSON.parse(fs.readFileSync(path.join(monthlyDir, f), 'utf8')));
        } catch (e) {}
      });
  }

  if (monthlyMetas.length === 0) throw new Error(`No monthly data for ${region}/${year}`);

  const topStories = findMostCorroborated(monthlyMetas);
  const prompt = buildPrompt(topStories) + ' Yearly editorial retrospective.';

  const response = await openAIRequest('/v1/images/generations', {
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'url',
  }, apiKey);

  const imageUrl = response.data[0].url;
  await downloadFile(imageUrl, imagePath);

  const relativeImageUrl = `/images/${region}/yearly/${year}.png`;
  const metadata = {
    date: year,
    region,
    type: 'yearly',
    generatedAt: new Date().toISOString(),
    stories: topStories,
    imageUrl: relativeImageUrl,
    hotspots: calculateHotspots(),
  };

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  return metadata;
}

// ── CLI entry point ───────────────────────────────────────────────────────
if (require.main === module) {
  const region = process.argv[2] || 'global';
  const type = process.argv[3] || 'daily';
  const axios = require('axios');

  async function run() {
    // Fetch events from running server
    let events = [];
    try {
      const resp = await axios.get(`http://localhost:3042/api/events?region=${region}&limit=10`);
      events = resp.data.events || [];
    } catch (e) {
      console.warn('Could not fetch events from server, using empty array');
    }

    if (type === 'monthly') {
      const meta = await generateMonthlyForRegion(region);
      console.log('Monthly image generated:', meta.imageUrl);
    } else if (type === 'yearly') {
      const meta = await generateYearlyForRegion(region);
      console.log('Yearly image generated:', meta.imageUrl);
    } else {
      const meta = await generateForRegion(region, events);
      console.log('Daily image generated:', meta.imageUrl);
    }
  }

  run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { generateForRegion, generateMonthlyForRegion, generateYearlyForRegion };
