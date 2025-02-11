# Setting up ngrok for Twitter Development

## Installation

1. Install ngrok globally:
```bash
npm install -g ngrok
```

2. Sign up for a free ngrok account at https://ngrok.com/signup

3. Get your authtoken from ngrok dashboard and authenticate:
```bash
# Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok authtoken your_auth_token_here

# Verify authentication
ngrok config check
```

## Usage

### Development Modes

1. Regular Development (without Twitter):
```bash
# This will kill any existing processes on ports 3000 and 5173
npm run dev
```

2. Twitter Integration Development:
```bash
npm run dev:ngrok
```

### Monitoring Logs

When running with ngrok, logs are available in:
- `logs/backend.log`: Backend server logs
- `logs/frontend.log`: Frontend server logs

A separate terminal window will open automatically to show these logs.

1. Start your development servers:
```bash
# Terminal 1: Start backend
cd packages/backend
npm run dev  # runs on port 3000

# Terminal 2: Start frontend
cd packages/frontend
npm run dev  # runs on port 5173
```

2. Start ngrok for frontend:
```bash
# Terminal 3: Start ngrok
ngrok http 5173

# Look for the "Forwarding" line in the output:
# Forwarding      https://YOUR-URL.ngrok-free.app -> http://localhost:5173

# Or open the web interface:
# Web Interface     http://127.0.0.1:4040
```

3. Copy the HTTPS URL from ngrok output (e.g., https://abc123.ngrok.io)
# Important: This URL changes each time you restart ngrok!

4. Update Twitter Developer Portal:
   - Website URL: Your ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
   - Callback URL: Backend callback through ngrok (e.g., https://abc123.ngrok.io/api/twitter/callback)

5. Update your local environment:
```bash
npm run update:ngrok https://YOUR-URL.ngrok-free.app
```

## Configuration Updates

1. Update backend CORS (already done in app.ts):
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://solanaroast.lol',
    /^https:\/\/.*\.ngrok\.io$/
  ],
  credentials: true
}));
```

2. Create a development environment file:
```env:.env.development
# Only override what's different in development
VITE_TWITTER_CALLBACK_URL=http://localhost:3000/api/twitter/callback
```

Note: Most configuration values are read from the root `.env` file. The `.env.development` 
file only contains development-specific overrides.

## Troubleshooting

1. If ngrok URL changes:
   - Update Twitter Developer Portal URLs
   - Update your .env.development file
   - Restart your development servers

2. Common issues:
   - Invalid callback URL: Make sure to update both frontend and Twitter portal
   - CORS errors: Verify ngrok URL is allowed in backend
   - Connection refused: Ensure all servers are running 