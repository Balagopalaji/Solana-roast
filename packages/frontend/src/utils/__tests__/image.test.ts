import { downloadImage } from '../image';

describe('downloadImage', () => {
  beforeEach(() => {
    // Mock URL and Blob
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should download image successfully', async () => {
    // Mock successful fetch
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob())
    });

    const result = await downloadImage('test.png');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('test.png');
  });

  it('should handle download failure', async () => {
    // Mock failed fetch
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await downloadImage('test.png');
    expect(result).toBe(false);
  });
}); 