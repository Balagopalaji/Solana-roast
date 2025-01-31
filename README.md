# SolanaRoast.lol

AI-powered Solana wallet roasts with a retro Windows 95 aesthetic.

## Features
- Generate AI-powered roasts for any Solana wallet
- Analyze wallet activity and holdings
- Retro Windows 95-style interface
- Meme generation (coming soon)

## Tech Stack
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TailwindCSS (coming soon)
- AI: OpenAI GPT
- Blockchain: Solana Web3.js, Solscan API

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn
- Solana devnet access
- OpenAI API key

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

4. Run development server
```bash
npm run dev
```

### Environment Variables
See `.env.example` for required environment variables.

## Development
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run verify`: Verify environment setup
- `npm test`: Run tests
- `npm run lint`: Lint code
- `npm run format`: Format code

## Known Limitations
- Solscan API may have intermittent availability
- Enhanced wallet data may be limited without Solscan API
- See development plan for more details

## License
MIT 