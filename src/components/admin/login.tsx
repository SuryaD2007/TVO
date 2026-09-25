"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "../logo";
import { Button, EASE } from "../ui";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't log in.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log in.");
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative w-full max-w-sm"
      >
        <Logo />
        <h1 className="mt-10 text-4xl font-medium tracking-[-0.04em]">
          Operator <span className="serif-accent text-accent">console.</span>
        </h1>
        <p className="mt-3 text-muted">Review applications and move them through the pipeline.</p>

        <form onSubmit={onSubmit} className="mt-10">
          <label htmlFor="admin-password" className="text-sm font-medium text-fg/90">
            Password
          </label>
          <div className="relative mt-2">
            <Lock className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} aria-hidden />
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "admin-error" : undefined}
              className="h-12 w-full rounded-xl bg-ink pr-4 pl-11 text-[16px] text-fg ring-1 ring-line-strong transition-shadow duration-300 outline-none focus:shadow-[0_0_0_4px_rgb(255_165_89/0.12)] focus:ring-accent/70 sm:text-[15px]"
            />
          </div>
          {error && (
            <p id="admin-error" role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy || !password} className="mt-6 w-full justify-between">
            {busy ? "Checking" : "Enter"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
