import React, { useState } from 'react';
import { Toast } from '../components/common/Toast';

export const ClipboardTest: React.FC = () => {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const convertToPng = async (blob: Blob): Promise<Blob> => {
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
  };

  const copyToClipboard = async () => {
    setLoading(true);
    try {
      if (!url.trim()) {
        throw new Error("Please enter a valid URL");
      }

      // Fetch the image directly
      console.log("Fetching image...");
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      // Get the original blob
      const originalBlob = await response.blob();
      
      // Convert to PNG
      console.log("Converting to PNG...");
      const pngBlob = await convertToPng(originalBlob);

      // Create HTML content
      const htmlContent = `
        <div>${text}</div>
        <img src="${url}" alt="Copied image">
      `;

      // Write to clipboard
      console.log("Writing to clipboard...");
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'image/png': pngBlob
        })
      ]);

      setToastMessage("Copied to clipboard!");
    } catch (error) {
      console.error("Error:", error);
      setToastMessage(error instanceof Error ? error.message : "Failed to copy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image to Clipboard</h1>
      
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
          className="w-full p-2 border rounded"
          rows={3}
        />

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter imgflip URL..."
          className="w-full p-2 border rounded"
        />

        <button
          onClick={copyToClipboard}
          disabled={loading}
          className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Copying..." : "Copy to Clipboard"}
        </button>

        {/* For testing */}
        <button
          onClick={() => setUrl("https://i.imgflip.com/9jkaba.jpg")}
          className="text-sm text-blue-600 hover:underline"
        >
          Load Test Image
        </button>

        {/* Preview */}
        {(text || url) && (
          <div className="mt-4 p-4 border rounded">
            <h2 className="font-bold mb-2">Preview:</h2>
            {text && <p className="mb-2">{text}</p>}
            {url && <img src={url} alt="Preview" className="max-w-full" />}
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
}; 