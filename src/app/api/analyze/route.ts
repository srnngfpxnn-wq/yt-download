import { NextResponse } from "next/server";
import { extractVideoId, isValidYoutubeUrl } from "@/lib/utils";
import { getVideoInfo } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Neplatný JSON v requestu." },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidYoutubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid YouTube link." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not extract video ID from the URL." },
        { status: 400 }
      );
    }

    const videoInfo = await getVideoInfo(videoId);

    return NextResponse.json({
      success: true,
      data: videoInfo,
    });
  } catch (error) {
    console.error("Analyze error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze video. Please try again.";

    return NextResponse.json(
      {
        error: message,
        details:
          "This could be due to a rate limit or the video being unavailable.",
      },
      { status: 500 }
    );
  }
}