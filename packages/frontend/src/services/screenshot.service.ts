import html2canvas from 'html2canvas';
import { metrics } from './metrics.service';
import { AppError, ErrorCategory } from '../types/errors';

interface ScreenshotOptions {
  element: HTMLElement;
  scale?: number;
  quality?: number;
  includeWatermark?: boolean;
}

interface ScreenshotResult {
  dataUrl: string;
  blob?: Blob;
}

class ScreenshotService {
  private static instance: ScreenshotService;
  
  private constructor() {}
  
  static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  async captureElement(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const start = performance.now();
    
    try {
      // Apply Windows 95 theme filter
      const filter = this.applyWin95Filter(options.element);
      
      const canvas = await html2canvas(options.element, {
        scale: options.scale || 2, // Higher resolution
        logging: false,
        backgroundColor: '#c0c0c0', // Windows 95 gray
        windowWidth: options.element.scrollWidth,
        windowHeight: options.element.scrollHeight
      });

      if (options.includeWatermark) {
        this.addWatermark(canvas);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', options.quality || 0.8);
      const blob = await this.dataUrlToBlob(dataUrl);

      // Track success
      metrics.trackEvent({
        category: 'screenshot',
        action: 'capture',
        label: 'success',
        value: performance.now() - start
      });

      return { dataUrl, blob };
    } catch (error) {
      // Track failure
      metrics.trackError({
        error: new AppError('Screenshot capture failed', {
          category: ErrorCategory.INTEGRATION,
          retryable: true,
          context: 'screenshot_service'
        }),
        context: 'capture_element'
      });
      
      throw error;
    } finally {
      // Cleanup any filters
      this.removeWin95Filter(options.element);
    }
  }

  private applyWin95Filter(element: HTMLElement): () => void {
    // Add a slight blur and pixelation for Windows 95 feel
    const originalFilter = element.style.filter;
    element.style.filter = `${originalFilter} blur(0.5px)`;
    return () => element.style.filter = originalFilter;
  }

  private addWatermark(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '12px "Microsoft Sans Serif"';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText('solanaroast.lol', 10, canvas.height - 10);
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }
}

export const screenshotService = ScreenshotService.getInstance(); 