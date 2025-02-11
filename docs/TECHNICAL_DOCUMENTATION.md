# Solana Roast - Technical Documentation

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Architecture](#2-architecture)
3. [Twitter Integration](#3-twitter-integration)
4. [Development Setup](#4-development-setup)
5. [Deployment Process](#5-deployment-process)
6. [API Documentation](#6-api-documentation)
7. [References](#7-references)

## 1. Application Overview

### Purpose
Solana Roast is a web application that generates humorous "roasts" for Solana wallet addresses, combining AI-generated text with meme images, and allows sharing on social media platforms.

### Core Features
- Wallet analysis and roast generation
- Meme generation with text overlay
- Social media sharing (Twitter integration)
- Image optimization and processing
- Cross-platform compatibility

### Tech Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Image Processing: Cloudinary, ImgFlip API
- AI: OpenAI API
- Social: Twitter API
- Development Tools: ngrok (development environment)

## 2. Architecture

### Project Structure
```
packages/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── twitter.service.ts
│   │   │   └── cloudinary.service.ts
│   │   ├── routes/
│   │   │   └── api/
│   │   │       └── twitter.ts
│   │   └── app.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── roast/
    │   │       └── RoastDisplay.tsx
    │   ├── services/
    │   │   ├── social-share.service.ts
    │   │   └── twitter-media.service.ts
    │   └── app.tsx
    └── package.json
```

### Data Flow
1. User inputs Solana wallet address
2. Backend analyzes wallet and generates roast using OpenAI
3. ImgFlip API generates meme with roast text
4. Cloudinary optimizes image
5. User can share via Twitter integration

## 3. Twitter Integration

### Authentication Flow
```typescript
class TwitterService {
  private client: TwitterApi;
  
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET
    });
  }
}
```

### Image Processing Pipeline
1. **ImgFlip Generation**
   ```typescript
   // Generate meme with text
   const meme = await imgflipService.generateMeme({
     template_id: templateId,
     text: roastText
   });
   ```

2. **Cloudinary Optimization**
   ```typescript
   const optimizedImage = await cloudinary.uploader.upload(imgflipUrl, {
     folder: 'solana-roast',
     transformation: [
       { quality: 'auto:good' },
       { fetch_format: 'auto' },
       { width: 'auto' },
       { dpr: 'auto' }
     ]
   });
   ```

3. **Twitter Upload**
   ```typescript
   const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
     mimeType: 'image/jpeg'
   });
   ```

### Share Implementation
```typescript
async shareToTwitter({ text, url, imageUrl }) {
  // Download and process image
  const imageBuffer = await downloadAndProcessImage(imageUrl);
  
  // Upload and tweet
  const tweetId = await twitterService.uploadImageAndTweet(
    imageBuffer,
    text,
    url
  );
  
  return { success: true, tweetId };
}
```

## 4. Development Setup

### Local Environment
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up ngrok:
   ```bash
   npm install -g ngrok
   ngrok http 5173  # Frontend port
   ```

3. Configure environment variables:
   ```env
   # .env
   TWITTER_API_KEY=your_key
   TWITTER_API_SECRET=your_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Twitter Developer Portal Setup
1. Create app at developer.twitter.com
2. Set permissions to "Read and write"
3. Configure OAuth settings:
   - Development URL: `https://[ngrok-id].ngrok.io`
   - Callback URL: `https://[ngrok-id].ngrok.io/api/twitter/callback`

## 5. Deployment Process

### Pre-deployment Checklist
1. Update Twitter credentials
2. Configure production URLs
3. Set up monitoring
4. Enable production logging

### Production Configuration
```typescript
// environment.ts
export const environment = {
  production: {
    twitter: {
      callbackUrl: 'https://solanaroast.lol/api/twitter/callback',
      // Other production settings
    }
  }
};
```

## 6. API Documentation

### Twitter Endpoints
```typescript
// POST /api/twitter/tweet
interface TweetRequest {
  text: string;
  imageUrl: string;
  url: string;
}

interface TweetResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}
```

### Image Processing Endpoints
```typescript
// POST /api/image/optimize
interface OptimizeRequest {
  imageUrl: string;
  options?: CloudinaryOptions;
}

interface OptimizeResponse {
  success: boolean;
  optimizedUrl: string;
}
```

## 7. References

### Official Documentation
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [ImgFlip API](https://api.imgflip.com/)

### Internal Documentation
- [Twitter Integration Plan](docs/TWITTER_INTEGRATION_PLAN.md)
- [Twitter Deployment Checklist](docs/TWITTER_DEPLOYMENT_CHECKLIST.md)
- [Twitter API Analysis](docs/TWITTER_API_ANALYSIS.md)

### Code References
- Frontend Components:
  - [RoastDisplay.tsx](packages/frontend/src/components/roast/RoastDisplay.tsx)
  - [TwitterShare.tsx](packages/frontend/src/components/twitter/TwitterShare.tsx)

- Backend Services:
  - [twitter.service.ts](packages/backend/src/services/twitter.service.ts)
  - [cloudinary.service.ts](packages/backend/src/services/cloudinary.service.ts)

### Error Codes and Handling
```typescript
const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  MEDIA_UPLOAD_FAILED: 'Media upload failed',
  INVALID_IMAGE_FORMAT: 'Invalid image format',
  SIZE_LIMIT_EXCEEDED: 'Image size exceeds 5MB limit'
};
```

### Best Practices
1. Image Optimization
   - Use Cloudinary's auto-optimization
   - Validate size before upload
   - Handle format conversion

2. Error Handling
   - Implement retries for rate limits
   - Provide fallback sharing methods
   - Clear user feedback

3. Security
   - Secure credential storage
   - Rate limiting
   - Input validation

### Monitoring and Maintenance
1. Regular Tasks
   - Token rotation
   - Rate limit monitoring
   - Error log analysis

2. Health Checks
   - API endpoint status
   - Image processing pipeline
   - Authentication flow

---

This documentation provides a comprehensive overview of the application's architecture, implementation details, and maintenance requirements. For specific implementation details, refer to the linked code files and official documentation. 