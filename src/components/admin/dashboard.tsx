"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, Inbox, LogOut, RefreshCw, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { STEPS } from "@/lib/apply-schema";
import type { Track } from "@/lib/content";
import type { ApplicationRow, ApplicationStatus } from "@/lib/store";
import { Logo } from "../logo";
import { cn, EASE } from "../ui";

const STATUSES: { id: ApplicationStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
];

const LABELS: Record<string, string> = Object.fromEntries(
  Object.values(STEPS)
    .flat()
    .flatMap((s) => s.fields)
    .map((f) => [f.name, f.label]),
);
const URL_FIELDS = new Set(["website", "github", "portfolio"]);

const displayName = (r: ApplicationRow) =>
  r.track === "startup" ? r.payload.company || "Untitled company" : r.payload.name || "Unnamed builder";
const subtitle = (r: ApplicationRow) =>
  r.track === "startup"
    ? [r.payload.name, r.payload.stage].filter(Boolean).join(" · ")
    : [r.payload.major, r.payload.grad && `'${r.payload.grad.slice(-2)}`].filter(Boolean).join(" · ");

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toCsv(rows: ApplicationRow[]) {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.payload)))];
  const header = ["ref", "track", "status", "created_at", ...keys, "notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    header.join(","),
    ...rows.map((r) =>
      [r.ref, r.track, r.status, r.created_at, ...keys.map((k) => r.payload[k]), r.notes].map(esc).join(","),
    ),
  ].join("\n");
}

export function AdminDashboard({ initialRows, loadError }: { initialRows: ApplicationRow[]; loadError: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selectedRef, setSelectedRef] = useState<string | null>(initialRows[0]?.ref ?? null);
  const [track, setTrack] = useState<"all" | Track>("all");
  const [status, setStatus] = useState<"all" | ApplicationStatus>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [refreshing, startRefresh] = useTransition();

  // Adopt fresh server data after router.refresh()
  const [serverRows, setServerRows] = useState(initialRows);
  if (initialRows !== serverRows) {
    setServerRows(initialRows);
    setRows(initialRows);
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (track === "all" || r.track === track) &&
        (status === "all" || r.status === status) &&
        (!q || [r.ref, ...Object.values(r.payload), r.notes].join(" ").toLowerCase().includes(q)),
    );
  }, [rows, track, status, query]);

  const selected = rows.find((r) => r.ref === selectedRef) ?? null;

  const counts = useMemo(() => {
    const by = (s: ApplicationStatus) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      founders: rows.filter((r) => r.track === "startup").length,
      builders: rows.filter((r) => r.track === "builder").length,
      new: by("new"),
      reviewing: by("reviewing"),
      accepted: by("accepted"),
    };
  }, [rows]);

  const save = async (ref: string, changes: { status?: ApplicationStatus; notes?: string }) => {
    const before = rows;
    setRows((rs) => rs.map((r) => (r.ref === ref ? { ...r, ...changes } : r)));
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, ...changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      setRows((rs) => rs.map((r) => (r.ref === ref ? data.row : r)));
      setToast(changes.status ? `Marked ${changes.status}` : "Notes saved");
      return true;
    } catch (err) {
      setRows(before);
      setToast(err instanceof Error ? err.message : "Couldn't save.");
      if (err instanceof Error && err.message.includes("Log in")) router.refresh();
      return false;
    }
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tvo-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <main className="min-h-dvh pb-20">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo compact />
            <span className="hidden font-mono text-xs text-subtle sm:inline">/ operator console</span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Refresh" onClick={() => startRefresh(() => router.refresh())}>
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} strokeWidth={1.75} />
            </IconButton>
            <IconButton label="Export CSV" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="size-4" strokeWidth={1.75} />
            </IconButton>
            <IconButton label="Log out" onClick={logout}>
              <LogOut className="size-4" strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Stats */}
        <dl className="mt-10 grid grid-cols-2 border-t border-line sm:grid-cols-4">
          {[
            { label: "Applications", value: counts.total, sub: `${counts.founders} founder${counts.founders === 1 ? "" : "s"} · ${counts.builders} builder${counts.builders === 1 ? "" : "s"}` },
            { label: "New", value: counts.new, sub: "Waiting on you" },
            { label: "Reviewing", value: counts.reviewing, sub: "In progress" },
            { label: "Accepted", value: counts.accepted, sub: "Founding cohort" },
          ].map((s, i) => (
            <div key={s.label} className={cn("border-b border-line py-6", i % 2 ? "border-l pl-6" : "pr-6", i === 2 && "sm:border-l sm:pl-6")}>
              <dt className="text-sm text-subtle">{s.label}</dt>
              <dd className="mt-2 font-serif text-5xl leading-none text-fg tabular-nums">{s.value}</dd>
              <p className="mt-2 text-xs text-subtle">{s.sub}</p>
            </div>
          ))}
        </dl>

        {loadError && (
          <p role="alert" className="mt-8 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/25">
            {loadError}
          </p>
        )}

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            <Segmented
              value={track}
              onChange={setTrack}
              options={[
                { id: "all", label: "All" },
                { id: "startup", label: "Founders" },
                { id: "builder", label: "Builders" },
              ]}
            />
            <Segmented
              value={status}
              onChange={setStatus}
              options={[{ id: "all", label: "Any status" }, ...STATUSES]}
            />
          </div>
          <label className="relative block lg:w-72">
            <span className="sr-only">Search applications</span>
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, ref…"
              className="h-10 w-full rounded-full bg-ink pr-4 pl-10 text-[16px] text-fg ring-1 ring-line-strong outline-none placeholder:text-subtle/70 focus:ring-accent/70 sm:text-sm"
            />
          </label>
        </div>

        {/* List + detail */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="bezel lg:col-span-5">
            <div className="bezel-core max-h-[70dvh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-20 text-center">
                  <Inbox className="size-6 text-subtle" strokeWidth={1.5} />
                  <p className="mt-4 font-medium text-fg">{rows.length ? "No matches" : "No applications yet"}</p>
                  <p className="mt-1 max-w-xs text-sm text-subtle">
                    {rows.length ? "Try a different filter or search." : "They'll land here the moment someone applies."}
                  </p>
                </div>
              ) : (
                <ul>
                  {filtered.map((r) => (
                    <li key={r.ref}>
                      <button
                        type="button"
                        onClick={() => setSelectedRef(r.ref)}
                        aria-current={r.ref === selectedRef}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-line px-5 py-4 text-left transition-colors duration-300",
                          r.ref === selectedRef ? "bg-fg/[0.05]" : "hover:bg-fg/[0.025]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            r.status === "new" ? "bg-accent" : "bg-transparent",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium text-fg">{displayName(r)}</span>
                            {r.payload.challenge_status === "verified" && (
                              <Sparkles className="size-3.5 shrink-0 text-accent" strokeWidth={1.75} aria-label="Solved challenge" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-subtle">{subtitle(r)}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1.5">
                          <StatusPill status={r.status} />
                          <span className="font-mono text-[11px] text-subtle">{timeAgo(r.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.ref}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <Detail row={selected} onSave={save} />
                </motion.div>
              ) : (
                <div className="bezel">
                  <div className="bezel-core grid min-h-60 place-items-center p-10 text-sm text-subtle">
                    Select an application to review it.
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-ink shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Detail({
  row,
  onSave,
}: {
  row: ApplicationRow;
  onSave: (ref: string, changes: { status?: ApplicationStatus; notes?: string }) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState(row.notes);
  const [savingNotes, setSavingNotes] = useState(false);
  const dirty = notes !== row.notes;

  const saveNotes = async () => {
    if (!dirty) return;
    setSavingNotes(true);
    await onSave(row.ref, { notes });
    setSavingNotes(false);
  };

  const fields = STEPS[row.track].flatMap((s) => s.fields).filter((f) => row.payload[f.name]);

  return (
    <div className="bezel">
      <div className="bezel-core p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="rounded-full bg-ink px-3 py-1.5 text-muted ring-1 ring-line">{row.ref}</span>
          <span className="rounded-full bg-ink px-3 py-1.5 text-muted ring-1 ring-line">
            {row.track === "startup" ? "sprint request" : "builder"}
          </span>
          {row.payload.challenge_status === "verified" && (
            <span className="rounded-full bg-accent/15 px-3 py-1.5 text-accent ring-1 ring-accent/30">solved challenge</span>
          )}
          {row.payload.challenge_status === "invalid" && (
            <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-red-300 ring-1 ring-red-500/25">invalid challenge code</span>
          )}
          <span className="ml-auto text-subtle">{new Date(row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>

        <h2 className="mt-6 text-3xl font-medium tracking-[-0.03em] text-fg">{displayName(row)}</h2>
        <p className="mt-1 text-muted">{subtitle(row)}</p>

        {/* Status */}
        <div className="mt-8">
          <p className="text-sm text-subtle">Status</p>
          <div role="radiogroup" aria-label="Application status" className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-ink p-1 ring-1 ring-line sm:grid-cols-4">
            {STATUSES.map((s) => {
              const on = row.status === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => !on && onSave(row.ref, { status: s.id })}
                  className={cn(
                    "relative h-10 rounded-xl text-sm font-medium transition-colors duration-300",
                    on ? (s.id === "accepted" ? "text-accent-ink" : "text-fg") : "text-subtle hover:text-fg",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId={`status-${row.ref}`}
                      className={cn("absolute inset-0 rounded-xl", s.id === "accepted" ? "bg-accent" : "bg-fg/[0.08] ring-1 ring-line-strong")}
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                  <span className="relative">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Answers */}
        <dl className="mt-8 border-t border-line">
          {fields.map((f) => {
            const v = row.payload[f.name];
            const href = URL_FIELDS.has(f.name) ? (v.startsWith("http") ? v : `https://${v}`) : f.name === "email" ? `mailto:${v}` : null;
            return (
              <div key={f.name} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-sm text-subtle">{f.label ?? LABELS[f.name]}</dt>
                <dd className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-fg">
                  {f.type === "chips" ? (
                    <span className="flex flex-wrap gap-1.5">
                      {v.split(",").map((c) => (
                        <span key={c} className="rounded-full px-2.5 py-0.5 text-[13px] text-muted ring-1 ring-line">
                          {c}
                        </span>
                      ))}
                    </span>
                  ) : href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline">
                      {v} {href.startsWith("http") && <ExternalLink className="size-3.5" strokeWidth={1.75} />}
                    </a>
                  ) : (
                    v
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* Notes */}
        <div className="mt-8">
          <label htmlFor={`notes-${row.ref}`} className="text-sm text-subtle">
            Operator notes <span className="text-subtle/70">(private)</span>
          </label>
          <textarea
            id={`notes-${row.ref}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={4}
            maxLength={10000}
            placeholder="Interview notes, next steps, who's following up…"
            className="mt-2 w-full resize-y rounded-xl bg-ink px-4 py-3 text-[16px] leading-relaxed text-fg ring-1 ring-line-strong outline-none placeholder:text-subtle/70 focus:ring-accent/70 sm:text-[15px]"
          />
          <div className="mt-2 flex h-5 items-center justify-end font-mono text-xs text-subtle">
            {savingNotes ? "saving…" : dirty ? "unsaved · click outside to save" : row.notes ? "saved" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
        status === "new" && "text-accent ring-1 ring-accent/40",
        status === "reviewing" && "bg-fg/[0.08] text-fg",
        status === "accepted" && "bg-accent text-accent-ink",
        status === "declined" && "text-subtle ring-1 ring-line",
      )}
    >
      {status}
    </span>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-full bg-ink p-1 ring-1 ring-line [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 shrink-0 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors duration-300",
            value === o.id ? "bg-fg/[0.09] text-fg" : "text-subtle hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({ label, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-fg/[0.06] hover:text-fg disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
