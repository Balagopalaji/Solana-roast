import { TwitterApi } from 'twitter-api-v2';
import logger from '../../../utils/logger';
import { environment } from '../../../config/environment';
import { v2 as cloudinary } from 'cloudinary';

interface MediaUploadResponse {
  media_id: number;
  media_id_string: string;
  size: number;
  expires_after_secs: number;
  image: { image_type: string; w: number; h: number };
}

interface MediaStatusResponse {
  media_id: number;
  media_id_string: string;
  processing_info?: {
    state: 'pending' | 'in_progress' | 'failed' | 'succeeded';
    error?: { message: string };
  };
}

export interface TwitterMediaConfig {
  maxSizeBytes: number;
  allowedFormats: string[];
  dimensions: {
    width: number;
    height: number;
  };
}

export class TwitterMediaError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TwitterMediaError';
  }
}

export class TwitterMediaService {
  private readonly config: TwitterMediaConfig = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png'],
    dimensions: {
      width: 1200,
      height: 675
    }
  };

  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: environment.cloudinary.cloudName,
      api_key: environment.cloudinary.apiKey,
      api_secret: environment.cloudinary.apiSecret
    });
    logger.info('TwitterMediaService initialized');
  }

  async processAndUpload(imageUrl: string, twitterClient: TwitterApi): Promise<string> {
    try {
      // 1. Download and optimize image through Cloudinary
      const optimizedUrl = await this.optimizeImage(imageUrl);
      logger.debug('Image optimized:', optimizedUrl);

      // 2. Download optimized image
      const imageResponse = await fetch(optimizedUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      logger.debug('Image downloaded:', { size: buffer.length });

      // 3. Upload to Twitter
      const mediaId = buffer.length > this.CHUNK_SIZE
        ? await this.uploadLargeMedia(buffer, twitterClient)
        : await this.uploadMedia(buffer, twitterClient);

      // 4. Wait for processing
      await this.checkMediaStatus(mediaId, twitterClient);

      return mediaId;
    } catch (error) {
      logger.error('Failed to process and upload media:', error);
      throw error;
    }
  }

  private async optimizeImage(imageUrl: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'twitter',
        transformation: [
          { width: 1200 },
          { height: 675 },
          { crop: 'fill' },
          { quality: 'auto:good' }
        ]
      });

      return result.secure_url;
    } catch (error) {
      logger.error('Failed to optimize image:', error);
      throw error;
    }
  }

  private async validateMedia(buffer: Buffer): Promise<void> {
    if (buffer.length > this.config.maxSizeBytes) {
      throw new TwitterMediaError(
        `Image size ${buffer.length} bytes exceeds maximum allowed size of ${this.config.maxSizeBytes} bytes`,
        'SIZE_LIMIT_EXCEEDED'
      );
    }
  }

  private async uploadMedia(buffer: Buffer, twitterClient: TwitterApi): Promise<string> {
    try {
      const response = await twitterClient.v1.uploadMedia(buffer, {
        mimeType: 'image/jpeg'
      });

      // Parse response
      const data = JSON.parse(JSON.stringify(response)) as MediaUploadResponse;
      logger.debug('Media uploaded successfully:', { mediaId: data.media_id_string });
      return data.media_id_string;
    } catch (error) {
      logger.error('Failed to upload media:', error);
      throw error;
    }
  }

  private async uploadLargeMedia(buffer: Buffer, twitterClient: TwitterApi): Promise<string> {
    try {
      // Initialize upload
      const initResponse = await twitterClient.v1.post<MediaUploadResponse>('media/upload.json', {
        command: 'INIT',
        total_bytes: buffer.length,
        media_type: 'image/jpeg'
      });

      const mediaId = initResponse.media_id_string;

      // Upload chunks
      for (let i = 0; i < buffer.length; i += this.CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + this.CHUNK_SIZE);
        await twitterClient.v1.post('media/upload.json', {
          command: 'APPEND',
          media_id: mediaId,
          media: chunk,
          segment_index: Math.floor(i / this.CHUNK_SIZE)
        });
      }

      // Finalize upload
      await twitterClient.v1.post('media/upload.json', {
        command: 'FINALIZE',
        media_id: mediaId
      });

      logger.debug('Large media uploaded successfully:', { mediaId });
      return mediaId;
    } catch (error) {
      logger.error('Failed to upload large media:', error);
      throw error;
    }
  }

  private async checkMediaStatus(mediaId: string, twitterClient: TwitterApi): Promise<void> {
    let attempts = 0;
    while (attempts < this.MAX_RETRIES) {
      try {
        const status = await twitterClient.v1.get<MediaStatusResponse>(
          'media/upload.json',
          { command: 'STATUS', media_id: mediaId }
        );
        
        if (status.processing_info?.state === 'succeeded') {
          logger.debug('Media processing completed:', { mediaId });
          return;
        }
        
        if (status.processing_info?.state === 'failed') {
          throw new Error(`Media processing failed: ${status.processing_info.error?.message}`);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        attempts++;
      } catch (error) {
        logger.error('Failed to check media status:', error);
        throw error;
      }
    }

    throw new Error('Media processing timed out');
  }
} 