"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = {
  /** Resolves with a fresh token, or "" when Turnstile isn't configured. */
  getToken: () => Promise<string>;
  /** Tokens are single-use; call after each submit. */
  reset: () => void;
};

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Invisible Cloudflare Turnstile check. Only shows UI if Cloudflare decides a
 * visitor needs to click; renders nothing when no site key is configured.
 */
export function Turnstile({ action, ref }: { action: string; ref: Ref<TurnstileHandle> }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef("");
  const waiters = useRef<((t: string) => void)[]>([]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: SITE_KEY,
          action,
          theme: "dark",
          appearance: "interaction-only",
          callback: (t: string) => {
            token.current = t;
            waiters.current.splice(0).forEach((w) => w(t));
          },
          "expired-callback": () => {
            token.current = "";
          },
        });
      })
      .catch((err) => console.warn("[turnstile]", err));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [action]);

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (!SITE_KEY) return Promise.resolve("");
      if (token.current) return Promise.resolve(token.current);
      // Wait for the widget, but never hang the form: the server decides
      return new Promise((resolve) => {
        waiters.current.push(resolve);
        setTimeout(() => resolve(token.current), 8_000);
      });
    },
    reset: () => {
      token.current = "";
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  if (!SITE_KEY) return null;
  return <div ref={container} className="empty:hidden [&_iframe]:!max-w-full" />;
}
