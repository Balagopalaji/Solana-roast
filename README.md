# SolanaRoast.lol

AI-powered Solana wallet roasts with a retro Windows 95 aesthetic.

## Features
- Generate AI-powered roasts for any Solana wallet
- Analyze wallet activity and holdings
- Retro Windows 95-style interface
- Meme generation (coming soon)
- Secure token storage with Redis
- Real-time event distribution
- Health monitoring

## Tech Stack
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TailwindCSS (coming soon)
- AI: OpenAI GPT
- Blockchain: Solana Web3.js, Solscan API
- Storage: Redis with TLS support
- Monitoring: Built-in metrics and alerts

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn
- Solana devnet access
- OpenAI API key
- Redis 6+ (local or hosted)

### Installation
1. Clone the repository
```bash
git clone https://github.com/Balagopalaji/Solana-roast.git
cd Solana-roast
```

2. Install dependencies
```bash
npm install
```

3. Copy environment variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Install and start Redis (local development)
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

5. Run development server
```bash
npm run dev
```

### Environment Variables
See `.env.example` for required environment variables.

### Redis Configuration

#### Development
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_MAX_RETRIES=3
REDIS_HEALTH_CHECK_INTERVAL=30000
REDIS_CONNECTION_TIMEOUT=5000
REDIS_MAX_POOL_SIZE=20
```

#### Production
```env
REDIS_URL=rediss://your-production-redis-url
REDIS_PASSWORD=your-production-redis-password
REDIS_TLS=true
REDIS_MAX_RETRIES=5
REDIS_HEALTH_CHECK_INTERVAL=15000
REDIS_CONNECTION_TIMEOUT=3000
REDIS_MAX_POOL_SIZE=50

# Monitoring
REDIS_MONITOR_ENABLED=true
REDIS_MONITOR_INTERVAL=60000
REDIS_ALERT_THRESHOLD_MEMORY=80
REDIS_ALERT_THRESHOLD_LATENCY=100
REDIS_ALERT_THRESHOLD_ERRORS=10
```

## Development
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run verify`: Verify environment setup
- `npm test`: Run tests
- `npm run lint`: Lint code
- `npm run format`: Format code

## Monitoring
The application includes built-in Redis monitoring:
- Connection status and health checks
- Memory usage tracking
- Operation latency monitoring
- Error rate tracking
- Automatic alerts for issues

## Known Limitations
- Solscan API may have intermittent availability
- Enhanced wallet data may be limited without Solscan API
- Redis monitoring requires additional setup in production
- See development plan for more details

## License
MIT 