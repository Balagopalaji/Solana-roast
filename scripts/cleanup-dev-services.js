const { execSync } = require('child_process');

// Only run in development
if (process.env.NODE_ENV === 'production') {
  console.log('Skipping development services cleanup in production');
  process.exit(0);
}

// Don't stop Redis by default - it's lightweight and might be used by other services
// Only stop if explicitly requested
if (process.env.STOP_REDIS) {
  try {
    console.log('Stopping Redis...');
    execSync('brew services stop redis');
    console.log('✅ Redis stopped');
  } catch (error) {
    console.error('Failed to stop Redis:', error.message);
  }
} 