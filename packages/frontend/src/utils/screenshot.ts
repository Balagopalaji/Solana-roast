import html2canvas from 'html2canvas';

export async function captureElement(element: HTMLElement): Promise<Blob> {
  try {
    // Capture with high quality settings
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#000000',
      scale: 2, // Higher quality
      logging: false,
      imageTimeout: 0,
      removeContainer: true
    });

    // Convert to blob with high quality
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob as Blob),
        'image/jpeg',
        0.95
      );
    });
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
} 