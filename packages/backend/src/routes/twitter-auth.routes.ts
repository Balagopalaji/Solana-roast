import { Router, Request } from 'express';
import { TwitterOAuthService } from '../services/twitter/twitter-oauth.service';
import { environment } from '../config/environment';
import logger from '../utils/logger';
import { Session } from 'express-session';

interface RequestWithSession extends Request {
  session: Session & {
    oauthState?: string;
    twitterUser?: {
      id: string;
      username: string;
    };
  }
}

const router = Router();
const oauthService = TwitterOAuthService.getInstance();

// Initialize OAuth flow
router.get('/auth/twitter', async (req: RequestWithSession, res) => {
  try {
    const { url, state } = await oauthService.generateAuthUrl();
    
    // Store state in session for verification
    req.session.oauthState = state;
    
    // Redirect to Twitter's authorization page
    res.redirect(url);
  } catch (error) {
    logger.error('Failed to initialize OAuth flow:', error);
    res.status(500).json({
      error: 'Failed to initialize authentication'
    });
  }
});

// Handle OAuth callback
router.get('/auth/twitter/callback', async (req: RequestWithSession, res) => {
  const { code, state } = req.query;
  const storedState = req.session.oauthState;

  // Clear stored state
  delete req.session.oauthState;

  if (!code || !state || !storedState || state !== storedState) {
    return res.status(400).json({
      error: 'Invalid OAuth callback'
    });
  }

  try {
    const tokenData = await oauthService.handleCallback(
      code as string,
      state as string
    );

    // Store user info in session
    req.session.twitterUser = {
      id: tokenData.userId,
      username: tokenData.username
    };

    // Redirect to frontend with success
    res.redirect(`${environment.twitter.urls.website}/auth/success`);
  } catch (error) {
    logger.error('OAuth callback failed:', error);
    res.redirect(`${environment.twitter.urls.website}/auth/error`);
  }
});

// Revoke tokens and logout
router.post('/auth/twitter/revoke', async (req: RequestWithSession, res) => {
  const userId = req.session.twitterUser?.id;
  
  if (!userId) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }

  try {
    await oauthService.revokeToken(userId);
    delete req.session.twitterUser;
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Token revocation failed:', error);
    res.status(500).json({
      error: 'Failed to revoke authentication'
    });
  }
});

// Get current auth status
router.get('/auth/twitter/status', (req: RequestWithSession, res) => {
  const user = req.session.twitterUser;
  
  res.json({
    authenticated: !!user,
    user: user || null
  });
});

export default router; 