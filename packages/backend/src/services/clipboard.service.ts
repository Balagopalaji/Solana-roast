import logger from '../utils/logger';

export class ClipboardService {
  private async convertToPng(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error('Failed to convert to PNG'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  async copyToClipboard(text: string, imageUrl: string): Promise<void> {
    try {
      // Fetch image data from our API
      logger.debug('Fetching image data from API...');
      const response = await fetch(`/api/clipboard/fetch-image?url=${encodeURIComponent(imageUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      
      const jsonData = await response.json();
      if (!jsonData.data) {
        throw new Error('No image data received from API');
      }

      // Fetch the image as a blob
      logger.debug('Fetching image as blob...');
      const imgResponse = await fetch(jsonData.data);
      if (!imgResponse.ok) {
        throw new Error(`Failed to fetch image data: ${imgResponse.statusText}`);
      }
      const originalBlob = await imgResponse.blob();

      // Convert to PNG
      logger.debug('Converting image to PNG...');
      const pngBlob = await this.convertToPng(originalBlob);

      // Create HTML content with text and image
      const htmlContent = `
        <div>${text}</div>
        <img src="${jsonData.data}" alt="Roast meme">
      `;

      // Write both text/html and image/png to clipboard
      logger.debug('Writing content to clipboard...');
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'image/png': pngBlob,
        }),
      ]);

      logger.debug('Content successfully copied to clipboard');
    } catch (error) {
      logger.error('Error copying to clipboard:', error);
      throw error;
    }
  }
}

export const clipboardService = new ClipboardService(); 