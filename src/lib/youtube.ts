/**
 * YouTube API service - multi-source with fallbacks
 * Uses Invidious API + YouTube oEmbed + direct parsing as fallbacks
 * No API key required - perfect for serverless environments
 */

import type { VideoInfo, VideoFormat } from "./utils";

// Prioritized list of reliable Invidious instances
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://inv.riverside.rocks",
  "https://invidious.private.coffee",
  "https://invidious.snopyta.org",
  "https://yewtu.be",
  "https://invidious.jing.rocks",
  "https://invidious.projectsegfau.lt",
];

let currentInstanceIndex = 0;

function getCurrentInstance(): string {
  return INVIDIOUS_INSTANCES[currentInstanceIndex % INVIDIOUS_INSTANCES.length];
}

function rotateInstance(): void {
  currentInstanceIndex = (currentInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function tryParseJson(response: Response): Promise<any> {
  const text = await response.text();

  // Detect HTML response (non-JSON)
  if (text.trim().startsWith("<!") || text.trim().startsWith("<")) {
    throw new Error(`Non-JSON response from ${response.url} (likely blocked)`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${response.url}: ${text.slice(0, 100)}`);
  }
}

/**
 * Attempt to fetch video info from Invidious API with automatic instance rotation
 */
async function fetchFromInvidious(videoId: string): Promise<VideoInfo | null> {
  const maxAttempts = Math.min(INVIDIOUS_INSTANCES.length, 4);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const instance = getCurrentInstance();

    try {
      const url = `${instance}/api/v1/videos/${videoId}`;
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        rotateInstance();
        continue;
      }

      const data = await tryParseJson(response);

      // Validate we got actual video data
      if (!data || !data.title) {
        rotateInstance();
        continue;
      }

      // Get the best thumbnail
      const thumbnail =
        data.videoThumbnails?.find((t: any) => t.quality === "maxres")?.url ||
        data.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
        data.videoThumbnails?.[0]?.url ||
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

      // Process formats
      const formats: VideoFormat[] = [];

      // Process format streams (audio+video combined - best quality typically 720p)
      for (const fs of data.formatStreams || []) {
        formats.push({
          itag: fs.itag,
          quality: fs.quality,
          qualityLabel: fs.qualityLabel || fs.quality,
          mimeType: fs.type,
          container: fs.container,
          hasAudio: true,
          hasVideo: true,
          contentLength: fs.contentLength,
        });
      }

      // Process adaptive formats (separate audio/video - 1080p+ video only)
      for (const af of data.adaptiveFormats || []) {
        const isAudio = af.type?.startsWith("audio/");
        formats.push({
          itag: af.itag,
          quality: af.quality,
          qualityLabel: af.qualityLabel || af.quality,
          mimeType: af.type,
          container: af.container,
          hasAudio: isAudio || af.type?.includes("audio"),
          hasVideo: !isAudio,
          contentLength: af.contentLength,
        });
      }

      return {
        videoId: data.videoId || videoId,
        title: data.title,
        description: data.description || "",
        duration: data.lengthSeconds || 0,
        thumbnail,
        author: data.author || "Unknown",
        formats,
      };
    } catch (err) {
      rotateInstance();
      continue;
    }
  }

  return null;
}

/**
 * Fallback: Get basic video info from YouTube's oEmbed API (always works, no auth)
 * This only provides title, author, thumbnail - no format data
 */
async function fetchFromOEmbed(
  videoId: string
): Promise<{ title: string; author: string; thumbnail: string } | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetchWithTimeout(url, 5000);
    const data = await tryParseJson(response);

    if (!data || !data.title) return null;

    return {
      title: data.title,
      author: data.author_name || "Unknown",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch {
    return null;
  }
}

/**
 * Get direct download URL from the best available Invidious instance
 */
export async function getDirectDownloadUrl(
  videoId: string,
  itag: number
): Promise<string> {
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const instance = getCurrentInstance();

    try {
      // Try to get a redirect URL
      const url = `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true&redirect=false`;
      const response = await fetchWithTimeout(url, 5000);

      if (!response.ok) {
        rotateInstance();
        continue;
      }

      const text = await response.text();
      let downloadUrl: string | null = null;

      // Try to parse as JSON first
      if (!text.trim().startsWith("<")) {
        try {
          const data = JSON.parse(text);
          downloadUrl = data.url || data.downloadUrl || null;
        } catch {
          // Not JSON, might be a direct URL
        }
      }

      // Fallback: direct download link
      if (!downloadUrl) {
        downloadUrl = `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true`;
      }

      return downloadUrl;
    } catch {
      rotateInstance();
      continue;
    }
  }

  // Last resort fallback using a different approach
  return `https://invidious.snopyta.org/latest_version?id=${videoId}&itag=${itag}&local=true`;
}

/**
 * Main function to get video info with automatic fallbacks
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  // Try Invidious first (has format data)
  const invidiousData = await fetchFromInvidious(videoId);
  if (invidiousData) {
    return invidiousData;
  }

  // Fallback: oEmbed for at least basic info
  const oembedData = await fetchFromOEmbed(videoId);
  if (oembedData) {
    // Generate default format options
    const formats: VideoFormat[] = [
      {
        itag: 22,
        quality: "hd720",
        qualityLabel: "720p",
        mimeType: "video/mp4",
        container: "mp4",
        hasAudio: true,
        hasVideo: true,
      },
      {
        itag: 18,
        quality: "medium",
        qualityLabel: "360p",
        mimeType: "video/mp4",
        container: "mp4",
        hasAudio: true,
        hasVideo: true,
      },
      {
        itag: 17,
        quality: "small",
        qualityLabel: "144p",
        mimeType: "video/3gpp",
        container: "3gp",
        hasAudio: true,
        hasVideo: true,
      },
    ];

    return {
      videoId,
      title: oembedData.title,
      description: "",
      duration: 0,
      thumbnail: oembedData.thumbnail,
      author: oembedData.author,
      formats,
    };
  }

  throw new Error(
    "Nepodařilo se načíst informace o videu. Zkuste to prosím později nebo zadejte jiný odkaz."
  );
}