import { NextResponse } from "next/server";
import { extractVideoId, isValidYoutubeUrl } from "@/lib/utils";
import { getDirectDownloadUrl } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const { url, itag } = await request.json();

    if (!url || !itag) {
      return NextResponse.json(
        { error: "URL and format (itag) are required" },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not extract video ID." },
        { status: 400 }
      );
    }

    // Get the direct download URL from Invidious
    const downloadUrl = await getDirectDownloadUrl(videoId, itag);

    return NextResponse.json({
      success: true,
      downloadUrl,
      videoId,
    });
  } catch (error) {
    console.error("Download error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to initiate download. Please try again.";

    return NextResponse.json(
      {
        error: message,
        details:
          "The video may be unavailable or the format might not be accessible.",
      },
      { status: 500 }
    );
  }
}