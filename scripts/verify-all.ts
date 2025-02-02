import { spawn } from 'child_process';
import { logger } from '../packages/backend/src/utils/logger';

async function verifyAll() {
  try {
    // Verify backend environment
    await runCommand('npm', ['run', 'verify', '-w', 'packages/backend']);
    
    // Verify providers
    await runCommand('npm', ['run', 'verify:providers', '-w', 'packages/backend']);
    
    logger.info('✅ All verifications passed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, { stdio: 'inherit' });
    process.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

verifyAll(); 