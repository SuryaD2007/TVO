"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Values } from "@/lib/apply-schema";
import type { Track } from "@/lib/content";

type ApplyContextValue = {
  track: Track;
  setTrack: (track: Track) => void;
  /** Values to seed the next form with (from the terminal or the planner). */
  prefill: { values: Values; version: number };
  /** Select a track, optionally prefill fields, and scroll the portal into view. */
  openApply: (track: Track, values?: Values) => void;
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
};

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track>("startup");
  const [prefill, setPrefill] = useState({ values: {} as Values, version: 0 });
  const [terminalOpen, setTerminalOpen] = useState(false);

  const openApply = useCallback((next: Track, values?: Values) => {
    setTrack(next);
    if (values) setPrefill((p) => ({ values, version: p.version + 1 }));
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <ApplyContext.Provider value={{ track, setTrack, prefill, openApply, terminalOpen, setTerminalOpen }}>
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
