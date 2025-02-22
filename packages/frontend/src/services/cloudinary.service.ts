import { environment } from '../config/environment';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  maxFileSizeMB: number;
  allowedFormats: string[];
  folder: string;
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
}

// Add Twitter-specific config
interface CloudinaryTwitterConfig extends CloudinaryConfig {
  twitter: {
    maxFileSize: number;  // 5MB limit
    dimensions: {
      width: number;      // 1200px
      height: number;     // 675px
    };
    allowedFormats: string[];
  };
}

class CloudinaryError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'CloudinaryError';
  }
}

class CloudinaryService {
  private config: CloudinaryTwitterConfig;
  private uploadCount: number = 0;
  private lastUploadReset: number = Date.now();

  constructor(config: Partial<CloudinaryTwitterConfig> = {}) {
    if (!environment.cloudinary.cloudName || !environment.cloudinary.uploadPreset) {
      throw new CloudinaryError('Missing required Cloudinary configuration');
    }

    this.config = {
      cloudName: environment.cloudinary.cloudName,
      uploadPreset: environment.cloudinary.uploadPreset,
      maxFileSizeMB: 10,
      allowedFormats: ['png', 'jpg', 'jpeg', 'gif'],
      folder: 'roasts',
      twitter: {
        maxFileSize: 5 * 1024 * 1024,
        dimensions: {
          width: 1200,
          height: 675
        },
        allowedFormats: ['png', 'jpg', 'jpeg']
      },
      ...config
    };
  }

  async uploadImage(file: Blob): Promise<string> {
    this.checkRateLimit();
    await this.validateFile(file);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('folder', 'roasts');

    console.log('Cloudinary config:', {
      cloudName: this.config.cloudName,
      uploadPreset: this.config.uploadPreset
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudinary error:', error);
      throw new Error('Upload failed');
    }

    const data: UploadResponse = await response.json();
    this.uploadCount++;
    
    return data.secure_url;
  }

  private async validateFile(file: Blob) {
    if (file.size > this.config.maxFileSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds ${this.config.maxFileSizeMB}MB limit`);
    }
  }

  private checkRateLimit() {
    // Reset counter every hour
    if (Date.now() - this.lastUploadReset > 3600000) {
      this.uploadCount = 0;
      this.lastUploadReset = Date.now();
    }

    if (this.uploadCount >= 50) {
      throw new Error('Upload rate limit exceeded');
    }
  }

  async prepareForTwitter(file: Blob): Promise<string> {
    // Validate Twitter requirements
    await this.validateTwitterRequirements(file);
    
    // Upload with Twitter optimizations
    const url = await this.uploadImage(file);
    return this.getTwitterOptimizedUrl(url);
  }

  private async validateTwitterRequirements(file: Blob): Promise<void> {
    if (file.size > this.config.twitter.maxFileSize) {
      throw new CloudinaryError('File exceeds Twitter\'s 5MB limit', 'TWITTER_SIZE_LIMIT');
    }

    const format = file.type.split('/')[1];
    if (!this.config.twitter.allowedFormats.includes(format)) {
      throw new CloudinaryError('Invalid format for Twitter', 'TWITTER_FORMAT');
    }
  }

  getTwitterOptimizedUrl(url: string): string {
    return url.replace(
      '/upload/',
      `/upload/w_${this.config.twitter.dimensions.width},` +
      `h_${this.config.twitter.dimensions.height},` +
      'c_fill,g_center,q_auto,f_auto/'
    );
  }
}

// Add singleton export
const cloudinaryService = new CloudinaryService();
export { cloudinaryService };
export default CloudinaryService; 