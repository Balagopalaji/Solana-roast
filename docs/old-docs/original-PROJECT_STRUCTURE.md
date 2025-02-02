# SolanaRoast.lol Project Structure & Documentation
// this is the original project structure before we decided to refactor the project

## Current Implementation Status
- ✅ Basic React Frontend with Windows 95 theme
- ✅ Phantom Wallet Integration
- ✅ Environment Configuration & Verification
- ✅ OpenAI Integration with workarounds
- ⏳ Roast Generation (In Progress)
- ⚠️ Solscan API Integration (Optional/Pending)
- 🔜 Meme Generation (Planned)

## Directory Structure
```
solana-roast/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts                 # Express application setup
│   │   │   ├── server.ts              # Server entry point
│   │   │   ├── config/
│   │   │   │   └── environment.ts     # Environment & OpenAI configuration
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── requestLogger.ts
│   │   │   ├── routes/
│   │   │   │   ├── health.ts
│   │   │   │   └── roast.routes.ts
│   │   │   ├── scripts/
│   │   │   │   └── verify-env.ts      # Environment verification
│   │   │   ├── services/
│   │   │   │   ├── openai.service.ts
│   │   │   │   └── solana.service.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       └── logger.ts
│   │   ├── tests/
│   │   │   ├── integration.test.ts
│   │   │   └── setup.ts
│   │   ├── jest.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout/
│       │   │   │   └── Layout.tsx
│       │   │   ├── Header/
│       │   │   │   └── Header.tsx
│       │   │   └── wallet/
│       │   │       ├── WalletButton.tsx
│       │   │       └── WalletProvider.tsx
│       │   ├── hooks/
│       │   │   └── useWalletConnection.ts
│       │   └── pages/
│       │       ├── Home.tsx
│       │       └── Roast.tsx
│       ├── .env
│       └── package.json
├── .env                # Root environment variables
└── package.json        # Workspace configuration
```

## Known Issues & Solutions

### 1. OpenAI API Key Format
- **Issue**: OpenAI's sk-proj- format causes validation problems
- **Solution**: Using global variable approach in environment.ts
- **Location**: `packages/backend/src/config/environment.ts`

### 2. Solscan API Integration (⚠️ Pending)
- **Status**: Currently non-functional but non-critical
- **Impact**: Basic wallet analysis still works via Solana RPC
- **TODO**: 
  - Implement proper API key validation
  - Add rate limiting handling
  - Consider premium API access for enhanced features
- **Fallback**: System continues to work with basic Solana RPC data

## Development Workflow
1. Install dependencies: `npm install`
2. Verify environment: `npm run verify`
3. Start development:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`
   - Both: `npm run dev`

## Testing
- Backend integration tests in place
- Frontend component testing planned
- E2E testing to be implemented

## Future Optimizations
1. Implement proper error boundaries in React
2. Add loading states for wallet operations
3. Enhance Windows 95 theme consistency
4. Add proper TypeScript types for all components 