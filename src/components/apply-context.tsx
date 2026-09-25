"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Track } from "@/lib/content";

type ApplyContextValue = {
  track: Track;
  setTrack: (track: Track) => void;
  /** Select a track and scroll the application portal into view. */
  openApply: (track: Track) => void;
};

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track>("startup");

  const openApply = useCallback((next: Track) => {
    setTrack(next);
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <ApplyContext.Provider value={{ track, setTrack, openApply }}>
      {/* Honors the OS "reduce motion" setting for every framer-motion animation */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ApplyContext.Provider>
  );
}

export function useApply() {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error("useApply must be used inside <ApplyProvider>");
  return ctx;
}
