"use client";

import { useState } from "react";
import { cn, formatFileSize, type VideoFormat } from "@/lib/utils";
import {
  Download,
  Video,
  Music,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface FormatSelectorProps {
  formats: VideoFormat[];
  videoUrl: string;
}

export function FormatSelector({ formats, videoUrl }: FormatSelectorProps) {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Categorize formats
  const videoFormats = formats
    .filter((f) => f.hasVideo && f.hasAudio)
    .sort((a, b) => {
      const aLabel = parseInt(a.qualityLabel) || 0;
      const bLabel = parseInt(b.qualityLabel) || 0;
      return bLabel - aLabel;
    });

  const audioFormats = formats
    .filter((f) => f.hasAudio && !f.hasVideo)
    .sort((a, b) => {
      const aBitrate = parseInt(a.quality) || 0;
      const bBitrate = parseInt(b.quality) || 0;
      return bBitrate - aBitrate;
    });

  const handleDownload = async (format: VideoFormat) => {
    setDownloading(format.itag);
    setError(null);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, itag: format.itag }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Download failed");
      }

      // Open download in new tab (redirects to actual video file)
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download. Try again."
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="animate-slide-up w-full max-w-3xl mx-auto space-y-6">
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Chyba při stahování</p>
            <p className="text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Video formats */}
      {videoFormats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Video className="w-4 h-4 text-blue-400" />
            <h3>Video formáty</h3>
          </div>
          <div className="grid gap-2">
            {videoFormats.map((format) => (
              <FormatButton
                key={format.itag}
                format={format}
                isDownloading={downloading === format.itag}
                onDownload={() => handleDownload(format)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio formats */}
      {audioFormats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Music className="w-4 h-4 text-purple-400" />
            <h3>Audio formáty (MP3)</h3>
          </div>
          <div className="grid gap-2">
            {audioFormats.map((format) => (
              <FormatButton
                key={format.itag}
                format={format}
                isDownloading={downloading === format.itag}
                onDownload={() => handleDownload(format)}
              />
            ))}
          </div>
        </div>
      )}

      {videoFormats.length === 0 && audioFormats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Žádné dostupné formáty ke stažení.</p>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <p className="text-muted-foreground">
          Kvality 1080p a vyšší mají oddělený audio a video stream. Pro plnou
          kvalitu se zvukem doporučujeme 720p, kde je vše v jednom souboru.
        </p>
      </div>
    </div>
  );
}

function FormatButton({
  format,
  isDownloading,
  onDownload,
}: {
  format: VideoFormat;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const qualityLabel = format.qualityLabel || format.quality;
  const size = format.contentLength
    ? formatFileSize(parseInt(format.contentLength))
    : null;
  const isAudio = !format.hasVideo;

  return (
    <button
      onClick={onDownload}
      disabled={isDownloading}
      className={cn(
        "flex items-center justify-between w-full p-4 rounded-xl",
        "glass hover:bg-accent/50 transition-all duration-200",
        "group disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Format badge */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
            isAudio
              ? "bg-purple-500/10 text-purple-400"
              : "bg-blue-500/10 text-blue-400"
          )}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isAudio ? (
            <Music className="w-4 h-4" />
          ) : (
            <Video className="w-4 h-4" />
          )}
        </div>

        <div className="text-left">
          <p className="font-medium text-foreground">{qualityLabel}</p>
          <p className="text-xs text-muted-foreground">
            {format.container.toUpperCase()}
            {size && ` • ${size}`}
            {!format.hasAudio && format.hasVideo && " • Bez zvuku"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
          "bg-primary/10 text-primary",
          "group-hover:bg-primary group-hover:text-primary-foreground"
        )}
      >
        {isDownloading ? (
          <span className="text-sm">Stahuji...</span>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Stáhnout</span>
          </>
        )}
      </div>
    </button>
  );
}