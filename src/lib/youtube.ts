/**
 * YouTube API service using public Invidious API
 * No API key required - perfect for serverless environments
 */

import type { VideoInfo, VideoFormat } from "./utils";

const INVIDIOUS_INSTANCES = [
  "https://invidious.snopyta.org",
  "https://yewtu.be",
  "https://inv.riverside.rocks",
  "https://invidious.jing.rocks",
];

let currentInstanceIndex = 0;

function getCurrentInstance(): string {
  return INVIDIOUS_INSTANCES[currentInstanceIndex];
}

function rotateInstance(): void {
  currentInstanceIndex = (currentInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;
}

interface InvidiousVideoResponse {
  videoId: string;
  title: string;
  description: string;
  lengthSeconds: number;
  videoThumbnails: { quality: string; url: string }[];
  author: string;
  formatStreams: {
    url: string;
    itag: number;
    type: string;
    quality: string;
    qualityLabel: string;
    container: string;
    encoding: string;
    bitrate: number;
    contentLength: string;
  }[];
  adaptiveFormats: {
    url: string;
    itag: number;
    type: string;
    quality: string;
    qualityLabel: string;
    container: string;
    encoding: string;
    bitrate: number;
    contentLength: string;
    audioSampleRate?: string;
    audioChannels?: number;
  }[];
}

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; YTDownloader/1.0)",
          ...options?.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      
      // If rate limited or server error, rotate instance
      if (response.status === 429 || response.status >= 500) {
        rotateInstance();
        continue;
      }
      
      return response;
    } catch {
      rotateInstance();
      continue;
    }
  }
  
  throw new Error("Failed to fetch after retries from all instances");
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const instance = getCurrentInstance();
  const url = `${instance}/api/v1/videos/${videoId}`;
  
  const response = await fetchWithRetry(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video info: ${response.statusText}`);
  }
  
  const data: InvidiousVideoResponse = await response.json();
  
  // Get the best thumbnail
  const thumbnail =
    data.videoThumbnails.find((t) => t.quality === "maxres")?.url ||
    data.videoThumbnails.find((t) => t.quality === "medium")?.url ||
    data.videoThumbnails[0]?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  
  // Process formats
  const formats: VideoFormat[] = [];
  
  // Process format streams (audio+video combined)
  for (const fs of data.formatStreams) {
    const mimeMatch = fs.type.match(/^([^;]+)/);
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
  
  // Process adaptive formats (separate audio/video)
  for (const af of data.adaptiveFormats) {
    const isAudio = af.type.startsWith("audio/");
    const mimeMatch = af.type.match(/^([^;]+)/);
    formats.push({
      itag: af.itag,
      quality: af.quality,
      qualityLabel: af.qualityLabel || af.quality,
      mimeType: af.type,
      container: af.container,
      hasAudio: isAudio || af.type.includes("audio"),
      hasVideo: !isAudio,
      contentLength: af.contentLength,
    });
  }
  
  return {
    videoId: data.videoId,
    title: data.title,
    description: data.description,
    duration: data.lengthSeconds,
    thumbnail,
    author: data.author,
    formats,
  };
}

export function getDownloadUrl(videoId: string, itag: number): string {
  const instance = getCurrentInstance();
  return `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true`;
}

export async function getDirectDownloadUrl(
  videoId: string,
  itag: number
): Promise<string> {
  const instance = getCurrentInstance();
  
  // First try to get the redirect URL
  const url = `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true&redirect=false`;
  
  const response = await fetchWithRetry(url);
  
  if (!response.ok) {
    throw new Error(`Failed to get download URL: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.url || `${instance}/latest_version?id=${videoId}&itag=${itag}&local=true`;
}