# Twitter API Analysis & Implementation Plan

## 1. Current Working Implementation
Our stable version uses the app owner's credentials to tweet:

```typescript
// Current working implementation in twitter.service.ts
class TwitterService {
  private client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,    // App owner's token
    accessSecret: process.env.TWITTER_ACCESS_SECRET   // App owner's secret
  });

  async uploadImageAndTweet(imageBuffer: Buffer, text: string, url: string) {
    // 1. Upload media
    const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/jpeg'
    });

    // 2. Create tweet
    const tweet = await this.client.v2.tweet({
      text: `${text}\n\nRoast your wallet at ${url} 🔥`,
      media: { media_ids: [mediaId] }
    });

    return tweet.data.id;
  }
}
```

## 2. API Requirements Analysis

### Media Upload (v1.1)
- **Endpoint**: `POST media/upload`
- **Key Points**:
  - Must use v1.1 endpoint (not v2)
  - 5MB size limit
  - JPEG/PNG only
  - OAuth 1.0a required
  - No query parameters in signature

### Tweet Creation (v2)
- **Endpoint**: `POST /2/tweets`
- **Requirements**:
  - 280 character limit
  - Media IDs from v1.1 upload
  - OAuth 1.0a required

### User Authentication
- OAuth 1.0a flow required
- No OAuth 2.0 support
- Tokens needed:
  - `access_token`
  - `access_token_secret`

## 3. Implementation Strategy

### Phase 1: Keep Working Version
```typescript
// Keep current implementation as fallback
async tweetAsDev(imageBuffer: Buffer, text: string, url: string) {
  // Existing working implementation
}
```

### Phase 2: Add User Auth
```typescript
// Add alongside existing implementation
async tweetAsUser(imageBuffer: Buffer, text: string, url: string, tokens: TwitterTokens) {
  const userClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: tokens.accessToken,
    accessSecret: tokens.accessSecret
  });

  // Use same proven upload/tweet logic with user client
  const mediaId = await userClient.v1.uploadMedia(imageBuffer);
  const tweet = await userClient.v2.tweet({/*...*/});
}
```

### Phase 3: Session Integration
```typescript
// Add minimal session handling
router.post('/tweet', async (req, res) => {
  const tokens = req.session?.twitterTokens;
  return tokens 
    ? twitterService.tweetAsUser(...args, tokens)
    : twitterService.tweetAsDev(...args);
});
```

## 4. Key Points from API Docs

1. Media Upload:
   - Use v1.1 endpoint
   - Handle multipart correctly
   - Don't include query params in OAuth

2. Tweet Creation:
   - Use v2 endpoint
   - Media IDs must be strings
   - Text must be truncated to 280

3. Auth Flow:
   - OAuth 1.0a only
   - Store tokens securely
   - Handle token expiration

## 5. Migration Steps

1. Add user auth without removing dev implementation
2. Test with both flows working
3. Gradually transition to user auth
4. Remove dev implementation when ready

## 6. Validation & Error Cases

1. Media:
   - Size > 5MB
   - Invalid format
   - Upload failure

2. Auth:
   - Token expiration
   - Invalid tokens
   - Rate limits

3. Tweet:
   - Text too long
   - Media ID invalid
   - API errors

## 7. References

- [Media Upload API](https://developer.x.com/en/docs/x-api/v1/media/upload-media/api-reference/post-media-upload)
- [Tweet Creation](https://developer.x.com/en/docs/x-api/v2/tweets/manage-tweets/api-reference/post-tweets)
- [OAuth 1.0a](https://docs.x.com/resources/fundamentals/authentication/oauth-1-0a/creating-a-signature) 


### extra references
https://devcommunity.x.com/t/v1-1-api-no-longer-working/199890/24
@https://developer.x.com/en/docs/x-api/v1/media/upload-media/api-reference/post-media-upload @https://developer.x.com/en/docs/media/upload-media/uploading-media/media-best-practices @https://developer.x.com/en/docs/tutorials/uploading-media @https://developer.x.com/en/docs/media/upload-media/api-reference/post-media-metadata-create @https://docs.x.com/resources/fundamentals/authentication/oauth-1-0a/creating-a-signature 


@TWITTER_API_INTEGRATION-how-it-worked-in-the-end.md