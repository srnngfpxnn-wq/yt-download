"use client";

import { useState } from "react";
import { UrlInput } from "@/components/url-input";
import { VideoInfoCard } from "@/components/video-info";
import { FormatSelector } from "@/components/format-selector";
import { LoadingAnimation } from "@/components/loading-animation";
import { type VideoInfo } from "@/lib/utils";
import { Youtube, Github, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: VideoInfo };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const { theme, setTheme } = useTheme();

  const handleAnalyze = async (url: string) => {
    setState({ status: "loading" });
    setCurrentUrl(url);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze video");
      }

      setState({ status: "success", data: result.data });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nepodařilo se analyzovat video. Zkuste to prosím znovu.",
      });
    }
  };

  const handleReset = () => {
    setState({ status: "idle" });
    setCurrentUrl("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Youtube className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">
              YT Downloader
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 lg:py-20">
        {/* Hero section */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
            Stahujte YouTube videa
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vložte odkaz na YouTube video a stahujte v nejvyšší dostupné kvalitě
            nebo jako MP3 audio.
          </p>
        </div>

        {/* URL Input */}
        <div className="mb-8">
          <UrlInput onSubmit={handleAnalyze} isLoading={state.status === "loading"} />
        </div>

        {/* Error state */}
        {state.status === "error" && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">
                  Chyba při analýze
                </p>
                <p className="text-destructive/80 text-sm mt-1">
                  {state.message}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-destructive hover:text-destructive/80 underline underline-offset-2"
              >
                Zkusit znovu
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {state.status === "loading" && <LoadingAnimation />}

        {/* Success state */}
        {state.status === "success" && (
          <div className="space-y-8">
            <VideoInfoCard video={state.data} />
            <FormatSelector
              formats={state.data.formats}
              videoUrl={currentUrl}
            />
          </div>
        )}

        {/* Features */}
        {state.status === "idle" && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 hover:bg-accent/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Tento nástroj slouží pouze pro stahování videí, ke kterým máte
            práva. Respektujte autorská práva.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Youtube className="w-6 h-6 text-primary" />,
    title: "Všechny kvality",
    description:
      "Stahujte videa v rozlišení od 144p až po 1080p a vyšší. Všechny dostupné formáty na jednom místě.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
    ),
    title: "MP3 Audio",
    description:
      "Extraktujte audio stopu z videí a stahujte jako MP3. Ideální pro hudbu a podcasty.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Rychlé a zdarma",
    description:
      "Okamžitá analýza odkazu a rychlé stahování. Bez registrace, bez omezení, zcela zdarma.",
  },
];