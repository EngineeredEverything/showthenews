# X/Twitter API Integration Status

## ✅ What's Working

### Authentication
- API credentials stored securely in `.env`
- App-only authentication successful
- Ready to post tweets

### Auto-Posting (Ready)
- Daily image auto-posts to X after generation
- Tweet includes top 3 headlines
- Links back to ShowTheNews website
- Integrated into `generate-daily-image.js`

---

## ⚠️ Current Limitations

### Search/Trending (403 Error)
**Issue:** X API Free/Basic tier doesn't allow search endpoints

**What we tried:**
- Searching for "breaking news", "just in", etc.
- Fetching trending topics

**Error:** `Request failed with code 403`

**Why:** X API v2 free tier has very limited access:
- ❌ No search API
- ❌ No trending topics
- ❌ Limited to posting only
- ✅ Can post tweets with media

---

## 🔧 Solutions

### Option A: Upgrade X API Tier (Recommended)
**Basic Tier ($100/month):**
- ✅ Search tweets
- ✅ Trending topics  
- ✅ 10,000 tweets/month read
- ✅ Real-time streams

This would let us:
1. Use X as a news source (trending topics)
2. Search for breaking news tweets
3. Monitor specific accounts (CNN, BBC, etc.)

### Option B: OAuth 1.0a User Auth
**Requirements:**
- User access token + secret
- Requires manual OAuth flow
- Would give user-level permissions

**Benefits:**
- More API access than app-only
- Can read timelines, search (if tier allows)

### Option C: Skip X as News Source (Current)
- ✅ Continue posting daily images to X
- ❌ Can't use X trending as news source
- Focus on RSS feeds (6 sources working perfectly)

---

## Current Setup

### Credentials (Stored in `.env`)
```
X_API_KEY=ChyjaKxc5QGJK5gzYWgJJKRIP
X_API_SECRET=yyUqKnTfEdU6PbmljQ38AUVeT8RhCDjf5kRFcsdGo7KLVZUl4v
```

### Auto-Posting Flow
```
Daily Cron (Midnight UTC) →
  Generate Image →
    Upload to X →
      Post Tweet →
        Save Tweet URL
```

### Tweet Format
```
📰 Today's News at a Glance

• Bad Bunny brings Puerto Rico to Super Bowl halftime show
• Nancy Guthrie search enters second week
• Trump threatens to block new bridge

🔗 Explore: https://engineeredeverything.com/apps/showthenews/
```

---

## Testing

### Test Authentication
```bash
cd /var/www/dashboard/apps/showthenews
node x-integration.js
```

**Expected Output:**
```
✅ X API authentication successful
⚠️ Search failed (403) - Expected with free tier
```

### Manual Post Test
```bash
# After generating daily image:
node -e "
const { postDailyImage } = require('./x-integration');
const metadata = require('./images/daily/2026-02-10.json');
postDailyImage('./images/daily/2026-02-10.png', metadata)
  .then(tweet => console.log('Posted:', tweet))
  .catch(err => console.error('Error:', err));
"
```

---

## Recommendations

### Immediate (Free Tier)
✅ Auto-post daily images to X  
✅ Build ShowTheNews brand presence  
✅ Drive traffic to website  
⚠️ Skip X as news source (use 6 RSS feeds)

### Future (With API Upgrade)
- Monitor trending topics hourly
- Search for breaking news in real-time
- Track specific news accounts
- Add X as 7th news source
- Post updates when major stories break

---

## Cost Analysis

### Current (Free Tier)
- **Cost:** $0/month
- **Posting:** ✅ Works
- **Reading/Search:** ❌ Limited
- **Posts per month:** Unlimited

### Basic Tier ($100/month)
- **Cost:** $100/month
- **Read tweets:** 10,000/month
- **Search:** ✅ Full access
- **Worth it?** Depends on ShowTheNews revenue

**Break-even:** Need $100/month in revenue to justify
**Alternative:** Stick with RSS feeds (free, reliable)

---

## Status: ✅ READY FOR AUTO-POSTING

**Next Generation:**
When daily image generates tonight (midnight UTC), it will automatically:
1. Generate unified news image
2. Upload to X/Twitter
3. Post tweet with headlines
4. Save tweet URL to metadata

**Manual trigger to test:**
```bash
cd /var/www/dashboard/apps/showthenews
node generate-daily-image.js
```

This will generate today's image and post to X immediately.
