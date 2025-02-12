import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    twitterUser?: {
      id: string;
      username: string;
    };
  }
} 