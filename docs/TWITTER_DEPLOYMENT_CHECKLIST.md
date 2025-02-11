# Twitter Integration Deployment Checklist

## Environment Variables
- [ ] Update Twitter API credentials in production environment
  - [ ] TWITTER_API_KEY
  - [ ] TWITTER_API_SECRET
  - [ ] TWITTER_ACCESS_TOKEN
  - [ ] TWITTER_ACCESS_SECRET

## Twitter Developer Portal Updates
1. Update App Settings (https://developer.twitter.com/en/portal/dashboard)
   - [ ] Change Callback URL from development to production
     - Development: `http://127.0.0.1:3000/api/twitter/callback`
     - Production: `https://solanaroast.lol/api/twitter/callback`
   
   - [ ] Update Website URL
     - Development: `http://127.0.0.1:5173`
     - Production: `https://solanaroast.lol`

   - [ ] Verify App permissions are set to "Read and write"
   - [ ] Regenerate access tokens after changing settings

2. Verify OAuth 2.0 Settings
   - [ ] Client type is set to "Confidential client"
   - [ ] App type is set to "Web App, Automated App or Bot"

## Backend Configuration
- [ ] Update CORS settings for production domain
- [ ] Verify rate limiting is properly configured
- [ ] Enable production-level logging
- [ ] Verify error handling for production environment

## Frontend Configuration
- [ ] Update API endpoint URLs to production
- [ ] Verify Twitter share button functionality
- [ ] Test image upload with production Cloudinary settings
- [ ] Ensure proper error handling for user feedback

## Testing Checklist
- [ ] Test Twitter authentication flow in production
- [ ] Verify image upload functionality
- [ ] Test tweet posting with images
- [ ] Verify error handling and user feedback
- [ ] Check rate limit handling
- [ ] Test fallback mechanisms

## Monitoring
- [ ] Set up logging for Twitter API interactions
- [ ] Configure alerts for API errors
- [ ] Monitor rate limit usage
- [ ] Track successful/failed uploads

## Security
- [ ] Verify secure storage of Twitter credentials
- [ ] Enable HTTPS for all endpoints
- [ ] Review access token handling
- [ ] Check for exposed sensitive information in logs

## Documentation
- [ ] Update API documentation with production endpoints
- [ ] Document troubleshooting procedures
- [ ] Update maintenance guides
- [ ] Document rollback procedures

## Backup Plan
- [ ] Document fallback sharing mechanisms
- [ ] Create recovery procedures for token expiration
- [ ] Prepare incident response plan

## Regular Maintenance Tasks
- [ ] Monitor Twitter API deprecation notices
- [ ] Review and rotate access tokens periodically
- [ ] Check Twitter API usage and quotas
- [ ] Update app settings as needed

## Notes
- Keep Twitter API credentials secure and never commit them to version control
- Always test changes in a staging environment first
- Keep documentation updated with any changes to the integration
- Monitor Twitter's developer terms and conditions for any changes

## Useful Links
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)

## Development Setup
1. Local Development with ngrok
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Start your frontend (Vite) server
   npm run dev  # runs on port 5173

   # In a new terminal, start ngrok
   ngrok http 5173
   ```

2. Twitter Developer Portal Configuration
   - Website URL: Use the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
   - Callback URL: Append your callback path (e.g., `https://abc123.ngrok.io/api/twitter/callback`)

3. Environment Updates
   - Update frontend API calls to use ngrok URL
   - Update CORS settings in backend to allow ngrok domain

## Development Notes
- ngrok URLs change each time you restart ngrok (unless you have a paid account)
- Keep the ngrok terminal window open during development
- Update Twitter Developer Portal URLs when ngrok URL changes
- For production, switch to your actual domain (e.g., `https://solanaroast.lol`) 