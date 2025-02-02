const DEBUG = process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: any[]) => {
    if (DEBUG) {
      console.log('[Debug]', ...args);
    }
  },
  
  renderInfo: (component: string, props: any) => {
    if (DEBUG) {
      console.log(`[Render] ${component}:`, props);
    }
  }
}; 