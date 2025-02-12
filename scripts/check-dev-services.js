const { execSync } = require('child_process');
const path = require('path');

// Only run in development
if (process.env.NODE_ENV === 'production') {
  console.log('Skipping development services check in production');
  process.exit(0);
}

function checkRedis() {
  try {
    // Check if Redis is running
    execSync('redis-cli ping', { stdio: 'pipe' });
    console.log('✅ Redis is running');
  } catch (error) {
    console.log('🚀 Starting Redis...');
    try {
      execSync('brew services start redis');
      console.log('✅ Redis started successfully');
    } catch (error) {
      console.error('❌ Failed to start Redis:', error.message);
      process.exit(1);
    }
  }
}

function checkNgrok() {
  try {
    // Check if ngrok is running
    const response = execSync('curl -s http://localhost:4040/api/tunnels', { stdio: 'pipe' });
    const tunnels = JSON.parse(response.toString());
    if (tunnels.tunnels && tunnels.tunnels.length > 0) {
      console.log('✅ Ngrok is running:', tunnels.tunnels[0].public_url);
    } else {
      throw new Error('No active tunnels');
    }
  } catch (error) {
    console.log('ℹ️  Ngrok is not running. Please start it with:');
    console.log('npm run dev:persistent');
    // Don't exit - ngrok might be intentionally not running
  }
}

// Run checks
checkRedis();
checkNgrok(); 