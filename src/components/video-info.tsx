"use client";

import Image from "next/image";
import { Clock, User, Film } from "lucide-react";
import { cn, formatDuration, type VideoInfo } from "@/lib/utils";

interface VideoInfoCardProps {
  video: VideoInfo;
}

export function VideoInfoCard({ video }: VideoInfoCardProps) {
  return (
    <div className="animate-slide-up w-full max-w-3xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

          {/* Duration badge */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(video.duration)}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground line-clamp-2">
            {video.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{video.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              <span>{video.formats.length} formátů</span>
            </div>
          </div>

          {video.description && (
            <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}