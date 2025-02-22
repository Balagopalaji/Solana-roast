# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# Solana Roast Frontend

A React-based frontend for generating humorous roasts of Solana wallets.

## Components

### RoastDisplay

Displays the generated roast and meme for a Solana wallet.

```typescript
interface RoastDisplayProps {
  roastData: RoastResponse | null;
  loading: boolean;
  error: string | null;
  onClose?: () => void;
  onMinimize?: () => void;
}
```

Example usage:
```tsx
<RoastDisplay
  roastData={roastData}
  loading={isLoading}
  error={error}
  onClose={() => setShowRoast(false)}
/>
```

### RoastMeme

Displays the generated meme with top and bottom text.

```typescript
interface RoastMemeProps {
  roastData: RoastResponse;
}
```

Example usage:
```tsx
<RoastMeme roastData={roastData} />
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```
