# SolanaRoast.lol Project Structure & Documentation
// this is the project structure after we decided to refactor the project

## Updated Implementation Status
- ✅ Basic React Frontend with Windows 95 theme
- ✅ Phantom Wallet Integration
- ✅ OpenAI Integration
- ⚠️ Firebase Integration (Optional)
- 🔄 Social Features (In Progress)

## New Architecture Decisions
1. Firebase becomes optional for development
2. Core features work without social features
3. Social features have fallback mechanisms
4. Clear separation between core and social services

## Immediate Action Items
1. Fix JSON parsing in roast generation
2. Implement proper error handling
3. Add Firebase initialization guards
4. Update documentation

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
│       │   │   ├── common/           # Shared components
│       │   │   │   └── ErrorBoundary.tsx
│       │   │   ├── ui/              # Base UI components
│       │   │   │   ├── Button.tsx
│       │   │   │   └── Window.tsx
│       │   │   └── roast/           # Feature-specific components
│       │   │       ├── RoastGenerator.tsx
│       │   │       └── RoastDisplay.tsx
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

### UI Components
```
packages/frontend/src/components/
├── common/
│   └── ErrorBoundary.tsx   # Global error handling
└── ui/
    └── Window.tsx          # Reusable window component
```

### Component Dependencies
- ErrorBoundary → Window
- Window (standalone) 

## Future Architecture
### Planned Workspace Structure
```
solana-roast/
├── packages/
│   ├── core/               # Future: Core roasting functionality
│   │   ├── src/
│   │   └── package.json
│   ├── social/            # Future: Social features
│   │   ├── src/
│   │   └── package.json
│   ├── backend/           # Current: Will be gradually migrated
│   └── frontend/          # Current: Will be gradually migrated
```

### Migration Strategy
1. Keep current structure operational
2. Create new packages alongside existing ones
3. Gradually migrate functionality
4. Switch over when ready 