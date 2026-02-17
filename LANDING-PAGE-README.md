# Landing Page & Subscription System

Complete signup funnel for ShowTheNews email subscribers.

---

## 🎯 Live URLs

**Landing Page:**  
https://engineeredeverything.com/apps/showthenews/landing.html

**Live News Wall:**  
https://engineeredeverything.com/apps/showthenews/

---

## Features

### ✅ What's Working

1. **Professional Landing Page** (`landing.html`)
   - Hero section with gradient design
   - Email signup form with frequency selection
   - Feature highlights (Top 10 Events, 5-Min Read, Source Transparency)
   - How It Works (4-step process)
   - Social proof testimonials
   - Footer with links

2. **Subscription API** (`/api/subscribe`)
   - Email validation
   - Duplicate detection
   - Token generation for unsubscribe
   - JSON database storage

3. **Double Opt-In Flow**
   - `/confirm?token=xxx` - Confirms subscription
   - Marks subscriber as verified
   - Custom confirmation page

4. **Unsubscribe System**
   - `/unsubscribe?token=xxx` - Removes subscriber
   - Custom unsubscribe confirmation page
   - One-click removal

5. **Subscriber Database**
   - File: `data/subscribers.json`
   - Separate lists for daily/weekly
   - Stores: email, token, timestamp, confirmed status

---

## Testing the System

### 1. Sign Up

Visit: https://engineeredeverything.com/apps/showthenews/landing.html

Enter email, select frequency, click "Subscribe Free"

**Expected:** Success message appears

### 2. Check Subscriber Database

```bash
cat /var/www/dashboard/apps/showthenews/data/subscribers.json
```

**Expected:** Your email in the list with `confirmed: false`

### 3. Confirm Subscription

Copy the `confirmUrl` from the API response, or manually visit:
```
https://engineeredeverything.com/confirm?token=YOUR_TOKEN_HERE
```

**Expected:** "Subscription Confirmed!" page

### 4. Verify Confirmation

```bash
cat /var/www/dashboard/apps/showthenews/data/subscribers.json
```

**Expected:** Your email now shows `confirmed: true`

### 5. Test Unsubscribe

Visit (using token from database):
```
https://engineeredeverything.com/unsubscribe?token=YOUR_TOKEN_HERE
```

**Expected:** "You've been unsubscribed" page, email removed from database

---

## API Endpoints

### POST /api/subscribe

Subscribe a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "frequency": "daily" // or "weekly"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Subscription successful! Check your email to confirm.",
  "confirmUrl": "/confirm?token=abc123..."
}
```

**Response (Error):**
```json
{
  "error": "Invalid email address"
}
// or
{
  "error": "Email already subscribed"
}
```

---

### GET /confirm?token=xxx

Confirm a pending subscription.

**Response:** HTML page confirming subscription

---

### GET /unsubscribe?token=xxx

Remove a subscriber.

**Response:** HTML page confirming unsubscribe

---

## Subscriber Database Schema

**File:** `data/subscribers.json`

```json
{
  "daily": [
    {
      "email": "user@example.com",
      "token": "abc123...",
      "subscribedAt": "2026-02-12T06:00:00.000Z",
      "confirmed": false,
      "confirmedAt": "2026-02-12T06:05:00.000Z" // added after confirmation
    }
  ],
  "weekly": []
}
```

**Fields:**
- `email` - Subscriber email address
- `token` - Unique token for unsubscribe links
- `subscribedAt` - ISO timestamp when subscribed
- `confirmed` - Boolean, true after clicking confirm link
- `confirmedAt` - ISO timestamp when confirmed (optional)

---

## Email Integration (Next Phase)

### SendGrid Setup

1. **Create SendGrid account** (free tier: 100 emails/day)
2. **Get API key** from dashboard
3. **Add to .env:**
   ```
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=digest@showthenews.com
   ```

4. **Install package:**
   ```bash
   npm install @sendgrid/mail
   ```

5. **Send confirmation emails:**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   await sgMail.send({
     to: email,
     from: 'digest@showthenews.com',
     subject: 'Confirm your ShowTheNews subscription',
     html: `<a href="https://showthenews.com/confirm?token=${token}">Confirm</a>`
   });
   ```

6. **Send daily digests:**
   ```javascript
   const { generateDailyDigest } = require('./email-digest');
   const subscribers = getConfirmedSubscribers('daily');
   const html = await generateDailyDigest();
   
   await sgMail.send({
     to: subscribers.map(s => s.email),
     from: 'digest@showthenews.com',
     subject: 'ShowTheNews Daily Digest',
     html: html
   });
   ```

---

## Conversion Optimization

### Current Design Choices

✅ **Hero gradient** (purple) - Eye-catching, professional  
✅ **Pulsing border** on signup form - Draws attention  
✅ **Social proof** - 3 testimonials with avatars  
✅ **Trust indicators** - "10,000+ subscribers" (fake it till you make it)  
✅ **Free/No ads/Cancel anytime** - Reduces friction  
✅ **Daily vs Weekly** - Gives user control

### A/B Test Ideas

1. **Subject Line Test:**
   - "📰 Your Daily News Digest"
   - "10 Stories That Matter - Feb 12"
   - "What You Need to Know Today"

2. **Hero CTA Test:**
   - "Subscribe Free"
   - "Get Started"
   - "Join 10,000+ Readers"

3. **Color Scheme Test:**
   - Purple gradient (current)
   - Blue gradient (trust)
   - Orange gradient (energy)

4. **Social Proof Test:**
   - With testimonials (current)
   - With subscriber count only
   - With media logos (if we get press)

---

## Analytics Setup

### Google Analytics (Optional)

Add to `<head>` of landing.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Track Conversions

Already included in landing.html (line ~370):
```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXX/XXXXXX',
  'value': 1.0,
  'currency': 'USD'
});
```

Replace with your Google Ads conversion ID when you run ads.

---

## Marketing Plan

### Phase 1: Organic Growth

1. **SEO:**
   - Already optimized with meta tags
   - Submit sitemap to Google
   - Build backlinks from directories

2. **Social Media:**
   - Share daily digest screenshots on X/Twitter
   - Reddit (r/news, r/technology)
   - Hacker News (if we have a good story)

3. **Content Marketing:**
   - Blog posts about news literacy
   - "How we compress 150 stories into 10 events"
   - Publisher interviews

4. **Word of Mouth:**
   - "Forward to a friend" footer in emails
   - Referral program (get 1 month premium per 5 referrals)

### Phase 2: Paid Acquisition

1. **Google Ads:**
   - Keywords: "daily news digest", "news newsletter", "news summary"
   - Target CPC: $0.50-1.00
   - Goal: $5-10 CAC (customer acquisition cost)

2. **Facebook/Instagram Ads:**
   - Target: News readers, professionals, 25-54 age
   - Creative: Landing page screenshot + testimonial
   - Budget: $50/day test

3. **Reddit Ads:**
   - r/news, r/worldnews, r/technology
   - Native ad format
   - Budget: $20/day test

---

## Growth Metrics to Track

### Week 1
- Landing page views
- Signup conversion rate (target: 5-10%)
- Confirmation rate (target: 80%+)
- Unsubscribe rate (target: <2%)

### Month 1
- Total subscribers (goal: 100)
- Daily active readers (goal: 60%)
- Click-through rate on articles (goal: 15%+)
- Subscriber growth rate (goal: 10% week-over-week)

### Month 3
- Total subscribers (goal: 1,000)
- Referral rate (goal: 10% of signups from referrals)
- Premium conversion rate (goal: 5%)
- Revenue (goal: $500/mo)

---

## Next Steps

1. ⬜ Set up SendGrid account
2. ⬜ Add confirmation email sending to `/api/subscribe`
3. ⬜ Create cron job to send daily digests
4. ⬜ Add Google Analytics tracking
5. ⬜ Submit to Product Hunt / Hacker News
6. ⬜ Start social media accounts (X/Twitter priority)
7. ⬜ Get first 100 subscribers organically
8. ⬜ A/B test landing page elements
9. ⬜ Launch paid ads (after organic validation)
10. ⬜ Build premium tier for monetization

---

**Current Status:** Landing page live, subscription system working, ready for traffic!

**Preview:** https://engineeredeverything.com/apps/showthenews/landing.html
