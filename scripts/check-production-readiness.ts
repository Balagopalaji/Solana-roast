import * as fs from 'fs';
import * as path from 'path';

async function checkProductionReadiness() {
  console.log('🔍 Checking production readiness...\n');
  
  // 1. Check for development-only files
  console.log('1️⃣  Checking development files:');
  const envDevPath = path.join(__dirname, '../packages/frontend/.env.development');
  if (fs.existsSync(envDevPath)) {
    console.warn('⚠️  Warning: .env.development exists and should not be committed');
  }

  // 2. Check for ngrok processes
  console.log('\n2️⃣  Checking ngrok processes:');
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    if (response.ok) {
      console.warn('⚠️  Warning: ngrok is still running. Run `npm run ngrok:cleanup` before deployment');
    }
  } catch {
    console.log('✅ No ngrok processes detected');
  }

  // 3. Check environment variables
  console.log('\n3️⃣  Checking environment variables:');
  const productionVars = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
    'APP_URL',
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET'
  ];

  const missingVars = productionVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.error('❌ Missing production environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
  } else {
    console.log('✅ All required environment variables present');
  }

  // 4. Check for development URLs in configuration
  console.log('\n4️⃣  Checking configuration:');
  const configPath = path.join(__dirname, '../packages/backend/src/config/environment.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('ngrok') || configContent.includes('localhost')) {
    console.warn('⚠️  Warning: Development URLs found in environment.ts');
    console.warn('   Please ensure these are properly wrapped in NODE_ENV checks');
  }

  console.log('\n📋 Summary:');
  console.log('1. Remove .env.development before deployment');
  console.log('2. Stop any running ngrok processes');
  console.log('3. Verify all production environment variables');
  console.log('4. Double-check Twitter Developer Portal settings');
  console.log('5. Update DNS and SSL certificates if needed');
}

// Run the checks
checkProductionReadiness().catch(error => {
  console.error('Error during production readiness check:', error);
  process.exit(1);
}); 