import { TwitterApi } from 'twitter-api-v2';
import logger from '../utils/logger';
import { environment } from '../config/environment';

export class TwitterService {
  private client: TwitterApi | null = null;

  constructor() {
    const { apiKey, apiSecret, accessToken, accessSecret } = environment.twitter;
    
    if (apiKey && apiSecret && accessToken && accessSecret) {
      this.client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });
    } else {
      logger.warn('Twitter credentials not fully configured');
    }
  }

  async uploadImageAndTweet(imageBuffer: Buffer, text: string, url: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twitter service not initialized');
    }

    try {
      // Upload the image
      const mediaId = await this.client.v1.uploadMedia(imageBuffer, { type: 'image/jpeg' });
      
      // Combine text and URL for the tweet
      const tweetText = `${text}\n\nRoast your wallet at ${url} 🔥`;
      
      // Post tweet with image
      const tweet = await this.client.v1.tweet(tweetText, {
        media_ids: [mediaId]
      });

      return tweet.id_str;
    } catch (error) {
      logger.error('Twitter API error:', error);
      throw new Error('Failed to post tweet');
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async shareWithMedia(text: string, imageUrl: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Twitter service not initialized');
      return false;
    }

    try {
      // Download image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Upload media
      const mediaId = await this.client.v1.uploadMedia(Buffer.from(imageBuffer));

      // Post tweet with media
      await this.client.v2.tweet({
        text,
        media: { media_ids: [mediaId] }
      });

      return true;
    } catch (error) {
      logger.error('Twitter share error:', error);
      return false;
    }
  }
}

export const twitterService = new TwitterService(); 