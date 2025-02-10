import { describe, it, expect, beforeEach, vi } from 'vitest';
import CloudinaryService from '../cloudinary.service';

// Mock environment with values we'll actually test
vi.mock('../../config/environment', () => ({
  environment: {
    cloudinary: {
      cloudName: 'test-cloud',
      uploadPreset: 'test-preset'
    }
  }
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CloudinaryService();
  });

  it('should initialize with correct config', () => {
    expect(service).toBeDefined();
    // Test the actual configuration being used
    expect(service['config'].cloudName).toBe('test-cloud');
    expect(service['config'].uploadPreset).toBe('test-preset');
  });

  it('should validate file size', async () => {
    const largeFile = new Blob([new ArrayBuffer(11 * 1024 * 1024)]);
    await expect(service.uploadImage(largeFile)).rejects.toThrow('File size exceeds');
  });
}); 