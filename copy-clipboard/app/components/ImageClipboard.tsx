"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function ImageClipboard() {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const convertToPng = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0)
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob)
          } else {
            reject(new Error("Failed to convert to PNG"))
          }
        }, "image/png")
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(blob)
    })
  }

  const copyToClipboard = async () => {
    setLoading(true)
    try {
      // Validate URL
      if (!url.trim()) {
        throw new Error("Please enter a valid URL")
      }

      // Fetch image data from our API
      console.log("Fetching image data from API...")
      const response = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }
      const jsonData = await response.json()

      if (!jsonData.data) {
        throw new Error("No image data received from API")
      }

      // Fetch the image as a blob
      console.log("Fetching image as blob...")
      const imgResponse = await fetch(jsonData.data)
      if (!imgResponse.ok) {
        throw new Error(`Failed to fetch image data: ${imgResponse.statusText}`)
      }
      const originalBlob = await imgResponse.blob()

      // Convert to PNG
      console.log("Converting image to PNG...")
      const pngBlob = await convertToPng(originalBlob)

      // Check if the Clipboard API is available
      if (!navigator.clipboard) {
        throw new Error("Clipboard API is not available")
      }
      if (!navigator.clipboard.write) {
        throw new Error("Clipboard write method is not supported")
      }

      // Create HTML content with text and image
      const htmlContent = `
        <div>${text}</div>
        <img src="${jsonData.data}" alt="Copied image">
      `

      // Write both text/html and image/png to clipboard
      console.log("Writing content to clipboard...")
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlContent], { type: "text/html" }),
          "image/png": pngBlob,
        }),
      ])

      console.log("Content successfully copied to clipboard")
      toast({
        title: "Success",
        description: "Text and image copied to clipboard!",
      })
    } catch (error) {
      console.error("Error in copyToClipboard:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md">
      <Textarea
        placeholder="Enter text to copy (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full min-h-[100px]"
      />
      <Input
        type="url"
        placeholder="Enter image URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full"
      />
      <Button onClick={copyToClipboard} disabled={!url || loading} className="w-full">
        {loading ? "Copying..." : "Copy to Clipboard"}
      </Button>

      {/* Preview section */}
      {(text || url) && (
        <div className="w-full border rounded-lg p-4 mt-4">
          <h3 className="text-sm font-medium mb-2">Preview:</h3>
          <div className="space-y-2">
            {text && <p className="whitespace-pre-wrap">{text}</p>}
            {url && (
              <div className="mt-2">
                <img
                  src={url || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

