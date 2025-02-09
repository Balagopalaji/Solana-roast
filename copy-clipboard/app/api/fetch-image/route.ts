import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")

  console.log("Received request for image URL:", imageUrl)

  if (!imageUrl) {
    console.error("No image URL provided")
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
  }

  try {
    console.log("Fetching image from URL:", imageUrl)
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    console.log("Content-Type:", contentType)

    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error("The URL does not point to a valid image")
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    console.log("Image successfully fetched and converted to base64")

    return NextResponse.json({
      data: `data:${contentType};base64,${base64}`,
    })
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred while fetching the image",
      },
      { status: 500 },
    )
  }
}

