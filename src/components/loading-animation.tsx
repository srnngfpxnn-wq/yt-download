"use client";

import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({
  message = "Analyzuji video...",
}: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Pulse ring animation */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-pulse-ring" />
        <div className="absolute w-14 h-14 rounded-full bg-primary/30 animate-pulse-ring"
          style={{ animationDelay: "0.5s" }}
        />
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30">
          <svg
            className="w-7 h-7 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <p className="text-muted-foreground text-sm font-medium">{message}</p>

      {/* Loading dots */}
      <div className="flex items-center gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonLoader() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="aspect-video bg-muted" />
        <div className="p-6 space-y-4">
          <div className="h-6 bg-muted rounded-lg w-3/4" />
          <div className="h-4 bg-muted rounded-lg w-1/2" />
          <div className="h-3 bg-muted rounded-lg w-full" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}