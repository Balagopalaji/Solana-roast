## Prompt 10: OAuth 2.0 Foundation

### Context
We are implementing Twitter's OAuth 2.0 authentication system with PKCE for enhanced security, while preserving our existing OAuth 1.0a implementation for the dev account tweet functionality.

### Critical Requirements
1. **PRESERVE EXISTING FUNCTIONALITY**:
   - DO NOT modify the `DevTwitterService` class or its OAuth 1.0a implementation
   - Keep all existing OAuth 1.0a routes and configurations
   - Maintain the dev account tweet functionality intact
   - Ensure both OAuth 1.0a and 2.0 can coexist

2. **New OAuth 2.0 Implementation**:
   - Implement parallel OAuth 2.0 with PKCE flow
   - Set up secure token storage in Redis
   - Handle rate limiting and token refresh
   - Add comprehensive error handling
   - Implement monitoring and logging

### Implementation Guide
1. **OAuth Service Setup**
   ```typescript
   // src/services/twitter/twitter-oauth.service.ts
   export class TwitterOAuthService {
     private readonly redis: Redis;
     private readonly config: TwitterConfig;
     
     constructor(redis: Redis, config: TwitterConfig) {
       this.redis = redis;
       this.config = config;
     }
     
     async initiateOAuth(): Promise<string> {
       // Generate PKCE challenge
       // Store state and verifier
       // Return authorization URL
     }
     
     async handleCallback(code: string, state: string): Promise<TokenResponse> {
       // Verify state
       // Exchange code for tokens
       // Store tokens securely
     }
   }
   ```

2. **Token Storage**
   ```typescript
   // src/services/twitter/twitter-token.storage.ts
   export class TwitterTokenStorage {
     private readonly redis: Redis;
     private readonly encryptionKey: Buffer;
     
     async storeToken(userId: string, token: TokenData): Promise<void> {
       // Encrypt token
       // Store with expiration
     }
     
     async getToken(userId: string): Promise<TokenData | null> {
       // Retrieve and decrypt token
       // Handle refresh if needed
     }
   }
   ```

3. **Rate Limiting**
   ```typescript
   // src/middleware/rate-limiting.ts
   export const twitterRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: async (req) => {
       // Dynamic rate limit based on endpoint and auth type (1.0a vs 2.0)
       return getRateLimit(req.path, req.authType);
     }
   });
   ```

### File Structure
```
src/
  services/
    twitter/
      dev-twitter.service.ts      # PRESERVE: OAuth 1.0a implementation
      twitter-oauth.service.ts     # NEW: OAuth 2.0 implementation
      twitter-token.storage.ts     # NEW: Token management
      base-twitter.service.ts      # PRESERVE: Base functionality
  routes/
    api/
      twitter.ts                   # PRESERVE: OAuth 1.0a routes
    twitter-auth.routes.ts         # NEW: OAuth 2.0 routes
```

### Testing Requirements
1. Unit tests for all OAuth 2.0 flows
2. Integration tests with Twitter API
3. Security testing for token storage
4. Rate limit testing
5. Error handling scenarios
6. **Regression tests for OAuth 1.0a functionality**

### Security Considerations
1. Use secure PKCE implementation
2. Encrypt all stored tokens
3. Validate all OAuth state parameters
4. Implement proper token refresh logic
5. Handle token revocation
6. **Maintain separate rate limit pools for 1.0a and 2.0**

### Monitoring
1. Track authentication success/failure rates
2. Monitor token expiration and refresh
3. Alert on rate limit approaches
4. Log security-relevant events
5. **Track usage patterns across both OAuth versions**

### References
- [Twitter OAuth 2.0 Overview](https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/overview)
- [PKCE Implementation Guide](https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/authorization-code)
- [Bearer Token Authentication](https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/bearer-tokens)
- [User Access Token Guide](https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/user-access-token)

### Verification Checklist
Before completing this prompt:
1. ✅ Verify OAuth 1.0a dev tweet functionality still works
2. ✅ Test all existing routes and endpoints
3. ✅ Confirm rate limits are properly separated
4. ✅ Validate token storage security
5. ✅ Check monitoring coverage
6. ✅ Run full test suite 