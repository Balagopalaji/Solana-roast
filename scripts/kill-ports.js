const { execSync } = require('child_process');
const logger = console;

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      try {
        execSync(`netstat -ano | findstr :${port}`);
        execSync(`FOR /F "tokens=5" %a in ('netstat -ano | findstr :${port}') do taskkill /F /PID %a`);
      } catch (e) {
        // Port wasn't in use
        return;
      }
    } else {
      // For macOS/Linux, use a more robust command
      try {
        // Try without sudo first
        execSync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
      } catch (e) {
        // If failed, try with sudo
        try {
          execSync(`sudo lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs sudo kill -9`);
        } catch (e) {
          // Port wasn't in use
          return;
        }
      }
    }
    logger.log(`Killed process on port ${port}`);
  } catch (error) {
    logger.error(`Failed to kill port ${port}:`, error.message);
  }
}

const ports = [3000, 5173];
ports.forEach(killPort); 