# ShowTheNews - Reference-Based Image Generation System

## ✅ Phase 1: Image Scraping (COMPLETE)

### What's Working:
- Server scrapes og:image and article images from top 5 news stories
- Images stored with event data in API response
- Logs show successful scraping: "✓ Image for: Bad Bunny brings Puerto Rico..."

### Example Output:
```json
{
  "title": "Bad Bunny brings Puerto Rico to Super Bowl halftime show",
  "image": "https://i.abcnewsfe.com/a/71198194-45ab-48f9-bb35-d711e344c926/260209_gma_reeve_badbunny_0731_hpMain_16x9.jpg",
  "score": 3
}
```

---

## ✅ Phase 2: Reference-Based Generation (COMPLETE - DALL-E 3)

### Test Images Generated:
1. **test-unified-scene.png** - Original symbolic composition
2. **test-abstract.png** - Geometric/abstract style
3. **test-photorealistic.png** - Cinematic photorealistic
4. **test-reference-based.png** - NEW: Using specific details from scraped images

### URLs:
- https://engineeredeverything.com/apps/showthenews/test-reference-based.png
- https://engineeredeverything.com/apps/showthenews/test-photorealistic.png
- https://engineeredeverything.com/apps/showthenews/test-abstract.png
- https://engineeredeverything.com/apps/showthenews/test-unified-scene.png

### Improvements in test-reference-based.png:
- Puerto Rican flag prominently displayed (from reference)
- Stadium setup matching actual venue (Levi's Stadium)
- Searchlight beams on helicopters (specific detail)
- Suspension bridge architecture (recognizable structure)
- Unified dusk/golden hour lighting

---

## 🔄 Phase 3: ControlNet Integration (IN PROGRESS)

### Approach: Multi-Reference Composition

**Option A: Replicate API (Easiest)**
- Use `replicate.com/collections/control-net`
- API-based, no infrastructure needed
- ~$0.05-0.10 per image
- Pass reference images + prompt
- Example:
  ```javascript
  await replicate.run("rossjillian/controlnet", {
    input: {
      image: referenceImageUrl,
      prompt: "unified editorial scene...",
      structure: "depth"
    }
  });
  ```

**Option B: ComfyUI Workflow (Most Control)**
- Self-hosted or cloud GPU (RunPod/Vast.ai)
- Regional Prompter + Multiple ControlNets
- Full control over composition zones
- More complex setup but best results

**Option C: DALL-E 3 Image Editing (Quick Win)**
- Use DALL-E outpainting/editing API
- Start with reference photo canvas
- Expand/composite additional elements
- Simpler than ControlNet but less control

### Recommended Next Steps:

1. **Immediate (Next 24h)**: Test Replicate ControlNet API
   - Use Bad Bunny stage photo as reference
   - Generate unified scene maintaining stage composition
   - Compare quality to DALL-E 3

2. **Short-term (Next week)**: Build automated pipeline
   - Daily generation: scrape images → ControlNet → save
   - Trigger: significant event changes OR 6-hour fallback
   - Archive: `/images/daily/YYYY-MM-DD.png`

3. **Long-term (Month 1)**: Production optimization
   - Migrate to Midjourney v7 if quality matters
   - Build ComfyUI workflow for maximum control
   - Add weekly/monthly/yearly image synthesis

---

## Architecture

### Current Flow:
```
RSS Feeds → News Ingestion → Clustering → Top 5 Events → Image Scraping → API Response
```

### Target Flow:
```
RSS Feeds → News Ingestion → Clustering → Top 5 Events → Image Scraping → 
  ControlNet Generation → Unified Daily Image → Archive → API Response
```

### Data Structure:
```javascript
{
  events: [
    {
      title: "...",
      image: "https://...",  // Scraped reference photo
      score: 3
    }
  ],
  dailyImage: {
    url: "/images/daily/2026-02-10.png",
    generatedAt: "2026-02-10T04:00:00Z",
    references: [
      "https://i.abcnewsfe.com/...",  // Source images used
      "https://npr.brightspotcdn.com/..."
    ],
    events: ["Bad Bunny Super Bowl", "Nancy Guthrie Search", ...]
  }
}
```

---

## Quality Comparison

### DALL-E 3 (Current):
- ✅ Fast API integration
- ✅ Good prompt understanding
- ✅ Professional quality
- ⚠️ Less specific than real photos
- ⚠️ $0.04-0.08 per image

### ControlNet (Proposed):
- ✅ Uses real photo composition
- ✅ Maintains recognizable elements
- ✅ Better spatial control
- ⚠️ More complex setup
- ⚠️ ~$0.05-0.10 per image

### Midjourney v7 (Future):
- ✅ Best overall quality
- ✅ Most professional aesthetics
- ✅ Unlimited generations ($30/mo)
- ⚠️ No official API (need workarounds)
- ⚠️ Harder to automate

---

## Cost Analysis

### MVP Testing (Current):
- 4 test images generated: **$0.32 total**
- Image scraping: **$0 (self-hosted)**
- Storage: **$0 (local)**

### Production Scale:
- Daily image: 1/day × 30 days = **$1.20-2.40/mo**
- Weekly image: 4/mo = **$0.16-0.40/mo**
- Monthly image: 1/mo = **$0.04-0.10/mo**
- **Total: ~$1.50-3.00/mo**

### With Midjourney:
- **$30/mo unlimited**
- Break-even at ~300-750 images/month
- Worth it if quality is critical

---

## Next Action:

**Clay's feedback needed:**
1. Which test image style do you prefer?
   - test-reference-based.png (NEW - most specific)
   - test-photorealistic.png
   - test-abstract.png
   - test-unified-scene.png

2. Priority: Speed vs Quality?
   - Fast: Continue with DALL-E 3 + better prompting
   - Quality: Invest in ControlNet or Midjourney setup

3. Timeline for automation?
   - Immediate: Daily manual generation
   - This week: Automated daily generation
   - This month: Full archive system (daily/weekly/monthly/yearly)
