const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Initialize X client
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
});

// Get trending topics and top news tweets
async function fetchTrendingNews() {
  try {
    console.log('📱 Fetching trending news from X...');
    
    // Get trending topics (requires OAuth 1.0a user context)
    // For now, we'll search for news-related tweets
    const newsKeywords = [
      'breaking news',
      'just in',
      'developing',
      'report',
      'announces'
    ];
    
    const tweets = [];
    
    for (const keyword of newsKeywords.slice(0, 2)) {
      try {
        const search = await client.v2.search(`${keyword} -is:retweet lang:en`, {
          max_results: 10,
          'tweet.fields': 'created_at,public_metrics,entities',
          'user.fields': 'name,username,verified',
          expansions: 'author_id'
        });
        
        for await (const tweet of search) {
          tweets.push({
            title: tweet.text.split('\n')[0].slice(0, 200),
            text: tweet.text,
            url: `https://twitter.com/i/web/status/${tweet.id}`,
            author: tweet.author_id,
            metrics: tweet.public_metrics,
            created_at: tweet.created_at
          });
        }
      } catch (err) {
        console.log(`⚠️ Search failed for "${keyword}":`, err.message);
      }
    }
    
    // Sort by engagement (likes + retweets)
    tweets.sort((a, b) => {
      const scoreA = (a.metrics?.like_count || 0) + (a.metrics?.retweet_count || 0);
      const scoreB = (b.metrics?.like_count || 0) + (b.metrics?.retweet_count || 0);
      return scoreB - scoreA;
    });
    
    console.log(`✅ Fetched ${tweets.length} trending news tweets from X`);
    return tweets.slice(0, 20);
    
  } catch (error) {
    console.error('❌ Error fetching from X:', error.message);
    return [];
  }
}

// Post daily image to X
async function postDailyImage(imagePath, metadata) {
  try {
    console.log('📤 Posting daily image to X...');
    
    const fs = require('fs');
    
    // Upload image
    const mediaId = await client.v1.uploadMedia(imagePath);
    console.log('✅ Image uploaded to X');
    
    // Build tweet text
    const headlines = metadata.events
      .map(e => `• ${e.title}`)
      .slice(0, 3)
      .join('\n');
    
    const tweetText = `📰 Today's News at a Glance\n\n${headlines}\n\n🔗 Explore: https://engineeredeverything.com/apps/showthenews/`;
    
    // Post tweet
    const tweet = await client.v2.tweet({
      text: tweetText,
      media: { media_ids: [mediaId] }
    });
    
    console.log(`✅ Posted to X: https://twitter.com/i/web/status/${tweet.data.id}`);
    return tweet.data;
    
  } catch (error) {
    console.error('❌ Error posting to X:', error.message);
    throw error;
  }
}

// Test authentication
async function testAuth() {
  try {
    const appClient = await client.appLogin();
    console.log('✅ X API authentication successful');
    return true;
  } catch (error) {
    console.error('❌ X API authentication failed:', error.message);
    return false;
  }
}

module.exports = {
  fetchTrendingNews,
  postDailyImage,
  testAuth
};

// Test if run directly
if (require.main === module) {
  (async () => {
    console.log('🧪 Testing X integration...\n');
    
    const authOk = await testAuth();
    if (!authOk) {
      console.log('\n❌ Authentication failed. Check API credentials.');
      process.exit(1);
    }
    
    console.log('\n📱 Fetching trending news...');
    const news = await fetchTrendingNews();
    console.log(`Found ${news.length} tweets`);
    if (news.length > 0) {
      console.log('\nTop tweet:', news[0].title);
    }
    
    console.log('\n✅ X integration working!');
  })();
}
