export interface DownloadOptions {
  filename?: string;
  format?: 'png' | 'jpg';
  quality?: number;
}

export const downloadImage = async (
  url: string,
  options: DownloadOptions = {}
): Promise<boolean> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = options.filename || 'roast-meme.png';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('Failed to download image:', error);
    return false;
  }
}; 