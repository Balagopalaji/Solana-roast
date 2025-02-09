class ClipboardService {
  private async convertToPng(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error("Failed to convert to PNG"));
          }
        }, "image/png");
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(blob);
    });
  }

  async copyToClipboard(text: string, imageUrl: string) {
    try {
      const encodedUrl = encodeURIComponent(imageUrl);
      const response = await fetch(`/api/fetch-image?url=${encodedUrl}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch image: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const pngBlob = await this.convertToPng(blob);

      const htmlContent = `
        <div>${text}</div>
        <img src="${imageUrl}" alt="Roast meme">
      `;

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'image/png': pngBlob,
        }),
      ]);
    } catch (error) {
      throw error;
    }
  }
}

export const clipboardService = new ClipboardService();

export async function copyToClipboard(url: string) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`/api/fetch-image?url=${encodedUrl}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} - ${await response.text()}`);
    }

    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
  } catch (error) {
    throw error;
  }
} 