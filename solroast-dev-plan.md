# SolanaRoast.lol - AI Development Plan

## Phase 1: Core Backend Setup (First Priority)

### Step 1.1: Basic Express Server

```javascript
// Initial prompt for Replit/Cursor:
"Create a basic Express.js server for SolanaRoast.lol with the following:
1. Basic error handling middleware
2. CORS setup for local development
3. Health check endpoint
4. Basic project structure with routes, controllers, and services folders
5. Environment variable configuration using dotenv"
```

### Step 1.2: OpenAI Integration

```javascript
// Second prompt:
"Create a service for OpenAI integration that:
1. Implements the roast generation logic from the original prompt
2. Includes proper error handling and rate limiting
3. Creates a test endpoint to verify roast generation
4. Implements caching to prevent duplicate API calls
Note: Use the provided roast examples and prompt structure from the original spec"
```

### Step 1.3: Solana Integration

```javascript
// Third prompt:
"Create Solana wallet integration services that:
1. Implement wallet address validation
2. Set up Solscan API integration for wallet analysis
3. Create endpoints for wallet data fetching
4. Include error handling for network issues"
```

#### Implementation Notes:
- Solscan API integration implemented with fallback mechanism
- Non-critical API failures handled gracefully
- App functions without Solscan data using basic Solana RPC data
- Future Enhancement: Consider alternative data sources or premium Solscan API if enhanced wallet data becomes critical

### Known Limitations:
1. Solscan API may have intermittent availability
2. Enhanced wallet data (NFT count, token count) may be unavailable
3. Fallback mechanism provides basic wallet information only

## Phase 2: Frontend Core (Second Priority)

### Step 2.1: Basic React Setup

```javascript
// Frontend initialization prompt:
"Create a React frontend for SolanaRoast.lol with:
1. Vite or Create React App setup
2. Basic routing structure
3. Tailwind CSS integration
4. Theme setup with the specified color scheme
5. Basic layout components"
```

### Step 2.2: Wallet Connection

```javascript
// Wallet integration prompt:
"Implement Phantom wallet connection with:
1. Connect wallet button component
2. Wallet connection state management
3. Error handling for connection issues
4. Loading states and animations
5. Basic wallet info display"
```

### Step 2.3: Roast Interface

```javascript
// Roast UI prompt:
"Create the roast display interface with:
1. Retro Windows 95-style popup component
2. Roast display area with animations
3. Loading states with specified microcopy
4. Error handling display
5. Basic share button structure"
```

## Phase 3: Enhancement Features (Third Priority)

### Step 3.1: Meme Generation

```javascript
// Meme generation prompt:
"Implement basic meme generation with:
1. Integration with specified meme templates
2. Text overlay functionality
3. Basic image manipulation
4. Download/share capabilities"
```

### Step 3.2: Social Features

```javascript
// Social features prompt:
"Add social sharing features including:
1. Tweet generation functionality
2. Screenshot capability
3. Watermark generation
4. Share button implementation"
```

## Phase 4: Degen Features (Final Priority)

### Step 4.1: Easter Eggs

```javascript
// Fun features prompt:
"Implement degen features including:
1. Konami code Easter egg
2. Buy $ROAST button
3. Animation effects
4. Sound effects"
```

## Development Guidelines

1. **AI Tool Usage**:
   - Use Replit for initial setup and backend development
   - Use Cursor for frontend component development and iterative improvements
   - Combine both tools: Replit for running/testing, Cursor for code generation

2. **Testing Strategy**:
   - Implement basic tests after each component
   - Use manual testing for UI components
   - Test API integrations thoroughly

3. **Error Handling**:
   - Implement comprehensive error handling at each step
   - Add user-friendly error messages
   - Include fallback options for failed API calls

4. **Performance Considerations**:
   - Implement caching where appropriate
   - Optimize API calls
   - Lazy load non-critical components

## Next Steps

1. Begin with Phase 1.1: Basic Express Server setup
2. Test each component thoroughly before moving to the next
3. Get core functionality working before adding enhancement features
4. Maintain regular testing throughout development

Would you like to start with Phase 1.1 and generate the initial Express server setup?