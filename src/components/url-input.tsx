"use client";

import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Link, Search, Loader2 } from "lucide-react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div
        className={cn(
          "relative group transition-all duration-300",
          isFocused && "scale-[1.02]"
        )}
      >
        {/* Glow effect behind input */}
        <div
          className={cn(
            "absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-0 blur-xl transition-all duration-500",
            isFocused && "opacity-75",
            !isFocused && "group-hover:opacity-50"
          )}
        />

        <div className="relative flex items-center">
          <div className="absolute left-5 pointer-events-none">
            <Link
              className={cn(
                "w-5 h-5 transition-colors duration-300",
                isFocused
                  ? "text-blue-400"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Vložte YouTube odkaz..."
            className={cn(
              "w-full pl-12 pr-36 py-4 rounded-xl",
              "bg-card/90 backdrop-blur-sm",
              "border-2 transition-all duration-300",
              "text-foreground placeholder:text-muted-foreground/60",
              "text-base lg:text-lg",
              isFocused
                ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                : "border-border hover:border-border/80",
              "focus:outline-none focus:ring-0"
            )}
            disabled={isLoading}
          />

          <div className="absolute right-2">
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "shadow-lg shadow-primary/25"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzuji...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyzovat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}