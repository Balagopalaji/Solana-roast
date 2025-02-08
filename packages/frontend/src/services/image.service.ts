// import { metrics } from './metrics.service';

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface OptimizedImage {
  url: string;
  width: number;
  height: number;
  format: string;
}

class ImageService {
  private static instance: ImageService;
  private imageCache = new Map<string, OptimizedImage>();

  private constructor() {}

  static getInstance(): ImageService {
    if (!this.instance) {
      this.instance = new ImageService();
    }
    return this.instance;
  }

  async optimizeImage(
    originalUrl: string, 
    options: OptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const cacheKey = this.getCacheKey(originalUrl, options);
    
    // Check cache first
    const cached = this.imageCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Load image
      const img = await this.loadImage(originalUrl);
      
      // Create canvas with desired dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Calculate dimensions
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      // Draw and optimize
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to desired format
      const optimized = await new Promise<OptimizedImage>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            const url = URL.createObjectURL(blob);
            resolve({
              url,
              width,
              height,
              format: options.format || 'webp'
            });
          },
          `image/${options.format || 'webp'}`,
          options.quality || 0.85
        );
      });

      // Cache result
      this.imageCache.set(cacheKey, optimized);
      
      return optimized;
    } catch (error) {
      console.error('Image optimization failed:', error);
      // Return original URL as fallback
      return {
        url: originalUrl,
        width: 0,
        height: 0,
        format: 'unknown'
      };
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth = 800,
    maxHeight = 800
  ) {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width, height };
  }

  private getCacheKey(url: string, options: OptimizationOptions): string {
    return `${url}-${JSON.stringify(options)}`;
  }

  clearCache() {
    this.imageCache.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });
    this.imageCache.clear();
  }
}

export const imageService = ImageService.getInstance(); 