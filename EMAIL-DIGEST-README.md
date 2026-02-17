# Email Digest System

Daily email newsletter for ShowTheNews subscribers.

## Features

✅ **HTML + Plain Text** versions (compatible with all email clients)  
✅ **Top 10 events** from daily news (not overwhelming)  
✅ **Priority indicators** (HIGH/MEDIUM based on source corroboration)  
✅ **Direct links** to original publisher articles  
✅ **Professional design** matching ShowTheNews brand  
✅ **Mobile responsive** (optimized for email clients)

---

## Usage

### Generate Daily Digest

```bash
cd /var/www/dashboard/apps/showthenews
node email-digest.js
```

**Output:**
- `data/daily-digest.html` - HTML version for modern email clients
- `data/daily-digest.txt` - Plain text version for fallback

**Preview:**
- Local: `file:///var/www/dashboard/apps/showthenews/data/daily-digest.html`
- Web: `https://engineeredeverything.com/apps/showthenews/data/daily-digest.html`

---

## Automation

### Daily Cron Job (Midnight UTC)

Add to crontab:
```bash
0 0 * * * cd /var/www/dashboard/apps/showthenews && node email-digest.js
```

Or use pm2-cron:
```bash
pm2 start email-digest.js --cron "0 0 * * *" --no-autorestart
```

---

## Email Service Integration

### Option 1: SendGrid (Recommended)

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { generateDailyDigest, generatePlainTextDigest } = require('./email-digest');

async function sendDailyDigest(subscribers) {
  const html = await generateDailyDigest();
  const text = await generatePlainTextDigest();
  
  const msg = {
    to: subscribers,
    from: 'digest@showthenews.com',
    subject: `📰 ShowTheNews Daily - ${new Date().toLocaleDateString()}`,
    text: text,
    html: html,
  };
  
  await sgMail.send(msg);
}
```

**Pricing:** Free up to 100 emails/day, then $15/mo for 40K emails

---

### Option 2: Mailgun

```javascript
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

async function sendViaMailgun(subscribers) {
  const html = await generateDailyDigest();
  const text = await generatePlainTextDigest();
  
  const data = {
    from: 'ShowTheNews <digest@showthenews.com>',
    to: subscribers.join(','),
    subject: `📰 ShowTheNews Daily - ${new Date().toLocaleDateString()}`,
    text: text,
    html: html
  };
  
  await mailgun.messages().send(data);
}
```

**Pricing:** Free up to 5K emails/mo, then $35/mo for 50K emails

---

### Option 3: AWS SES (Cheapest at Scale)

```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

async function sendViaSES(subscribers) {
  const html = await generateDailyDigest();
  const text = await generatePlainTextDigest();
  
  for (const email of subscribers) {
    await ses.sendEmail({
      Source: 'digest@showthenews.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `📰 ShowTheNews Daily - ${new Date().toLocaleDateString()}` },
        Body: {
          Text: { Data: text },
          Html: { Data: html }
        }
      }
    }).promise();
  }
}
```

**Pricing:** $0.10 per 1,000 emails (cheapest at scale)

---

## Subscriber Management

### Simple File-Based (MVP)

```json
// data/subscribers.json
{
  "daily": [
    "user1@example.com",
    "user2@example.com"
  ],
  "weekly": [
    "user3@example.com"
  ]
}
```

### Database (Production)

```sql
CREATE TABLE subscribers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  frequency ENUM('daily', 'weekly') DEFAULT 'daily',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE,
  active BOOLEAN DEFAULT TRUE
);
```

---

## Subscription Flow

### 1. Landing Page Signup

```html
<form action="/subscribe" method="POST">
  <input type="email" name="email" placeholder="your@email.com" required>
  <select name="frequency">
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
  </select>
  <button type="submit">Subscribe</button>
</form>
```

### 2. Double Opt-In Email

```javascript
// Send confirmation email with unique token
const confirmUrl = `https://showthenews.com/confirm?token=${token}`;

await sendEmail({
  to: email,
  subject: 'Confirm your ShowTheNews subscription',
  html: `
    <h1>Welcome to ShowTheNews!</h1>
    <p>Click to confirm your ${frequency} digest:</p>
    <a href="${confirmUrl}">Confirm Subscription</a>
  `
});
```

### 3. Unsubscribe Link

All emails include:
```html
<a href="https://showthenews.com/unsubscribe?token=${unsubToken}">
  Unsubscribe
</a>
```

---

## Analytics Tracking

### UTM Parameters

All links in digest include tracking:
```javascript
const trackedUrl = `${originalUrl}?utm_source=showthenews&utm_medium=email&utm_campaign=daily_digest`;
```

### Metrics to Track

- Open rate (via pixel tracking)
- Click-through rate (via UTM)
- Unsubscribe rate
- Most clicked stories
- Best performing send times

---

## A/B Testing Ideas

1. **Subject lines:**
   - "📰 Your Daily News Digest"
   - "Today's Top 10 News Events"
   - "What You Need to Know - Feb 11"

2. **Send times:**
   - 6am (early morning)
   - 12pm (lunch)
   - 6pm (evening)

3. **Story count:**
   - 5 stories (quick)
   - 10 stories (standard)
   - 15 stories (comprehensive)

4. **Format:**
   - Text-heavy (current)
   - Image-heavy (with thumbnails)
   - Summary-only (headlines + links)

---

## Deliverability Best Practices

### Email Authentication

1. **SPF Record:**
```
v=spf1 include:sendgrid.net ~all
```

2. **DKIM Signing:**
Configure via SendGrid/Mailgun dashboard

3. **DMARC Policy:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@showthenews.com
```

### Content Guidelines

✅ **DO:**
- Use plain text + HTML versions
- Include unsubscribe link
- Keep under 100KB total size
- Test with Mail Tester before launch
- Authenticate sending domain

❌ **DON'T:**
- Use all caps in subject
- Overuse exclamation marks
- Send without permission
- Buy email lists
- Forget CAN-SPAM compliance

---

## Monetization

### Free Tier
- Daily or weekly digest
- Top 10 events
- Text-only format
- Ads included (1-2 per email)

### Premium ($10/mo)
- Ad-free
- Top 20 events
- Custom topics
- Priority delivery (sent first)
- Early access to breaking news alerts

### Enterprise ($50+/mo)
- White-label
- Custom branding
- API access
- Dedicated IP
- Custom send times

---

## Growth Tactics

1. **Viral Footer:**
   "Enjoying ShowTheNews? Forward to a friend!" with signup link

2. **Social Proof:**
   "Join 10,000+ subscribers who start their day with ShowTheNews"

3. **Partnerships:**
   Co-branded digests with complementary publishers

4. **Referral Program:**
   Get 1 month free for every 5 referrals

5. **Content Upgrades:**
   "Want deep dives? Upgrade to Premium for full analyses"

---

## Next Steps

1. ✅ Email digest generator (done)
2. ⬜ Set up SendGrid account
3. ⬜ Create subscriber database
4. ⬜ Build signup landing page
5. ⬜ Add double opt-in flow
6. ⬜ Implement unsubscribe handling
7. ⬜ Schedule daily cron job
8. ⬜ Add UTM tracking
9. ⬜ Create premium tier
10. ⬜ Launch beta with 100 subscribers

---

**Current Status:** Digest generator ready, awaiting email service integration and subscriber system.
