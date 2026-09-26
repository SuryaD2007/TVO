"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { CONTACT, ENGINE_STEPS } from "@/lib/content";
import { useApply } from "./apply-context";
import { cn, EASE } from "./ui";

type Line = { id: number; node: ReactNode };

const PROMPT = "guest@tvo:~$";

const FILES: Record<string, string[]> = {
  "manifesto.md": [
    "# TVO manifesto",
    "",
    "1. Ship to production or it didn't happen.",
    "2. Work on real backlogs for real companies.",
    "3. Earn trust with merged PRs, not slides.",
    "4. Leave every codebase better documented than you found it.",
    "5. Austin builds here. So do we.",
  ],
  "challenge.md": ["Run `challenge` to read the current problem."],
  "contact.txt": [`email     ${CONTACT.email}`, `linkedin  ${CONTACT.linkedin}`],
};

const COMMANDS = [
  "help", "about", "engine", "ls", "cat", "whoami", "apply", "challenge",
  "submit", "contact", "date", "clear", "exit",
] as const;

const PUZZLE = [
  "BUILD-01 · the clean build problem",
  "",
  "Our CI stamps every build n with a checksum:",
  "",
  "    c(n) = (n² + 73n + 2027) mod 65521",
  "",
  "A build is clean when c(n) reads the same backwards,",
  "like build 397 → 57575.",
  "",
  "How many clean builds are there for 1 ≤ n ≤ 1,000,000?",
];

// ---- Output primitives ----

const Out = ({ children, tone = "fg" }: { children: ReactNode; tone?: "fg" | "muted" | "accent" | "error" }) => (
  <div
    className={cn(
      "break-words whitespace-pre-wrap",
      tone === "fg" && "text-fg",
      tone === "muted" && "text-subtle",
      tone === "accent" && "text-accent",
      tone === "error" && "text-red-300",
    )}
  >
    {children}
  </div>
);

const Cmd = ({ children }: { children: ReactNode }) => (
  <span className="rounded bg-fg/[0.07] px-1.5 py-px text-fg">{children}</span>
);

function CodeCard({ code, onApply }: { code: string; onApply: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the code is still visible */
    }
  };
  return (
    <div className="my-2 rounded-xl bg-accent/10 p-4 ring-1 ring-accent/30">
      <p className="text-accent">✓ Correct. Nice work, operator.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-ink px-3 py-1.5 text-fg ring-1 ring-line-strong">{code}</code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted ring-1 ring-line-strong transition-colors hover:text-fg"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-8 items-center rounded-full bg-accent px-3 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-soft"
        >
          Apply with this code
        </button>
      </div>
      <p className="mt-3 text-subtle">Solved applications get read first.</p>
    </div>
  );
}

// ---- Terminal ----

export function Terminal() {
  const { terminalOpen: open, setTerminalOpen: setOpen, openApply } = useApply();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const print = useCallback((...nodes: ReactNode[]) => {
    setLines((prev) => [...prev, ...nodes.map((node) => ({ id: nextId.current++, node }))]);
  }, []);

  const banner = useCallback(() => {
    print(
      <Out tone="accent">Texas Venture Operators · operator shell v0.1</Out>,
      <Out tone="muted">
        Type <Cmd>help</Cmd> to see what&apos;s here. Builders: try <Cmd>challenge</Cmd>.
      </Out>,
      <Out> </Out>,
    );
  }, [print]);

  const goApply = useCallback(
    (track: "startup" | "builder", values?: Record<string, string>) => {
      setOpen(false);
      setTimeout(() => openApply(track, values), 250);
    },
    [openApply, setOpen],
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!answer) {
        print(<Out tone="error">usage: submit &lt;answer&gt;</Out>);
        return;
      }
      setBusy(true);
      print(<Out tone="muted">verifying {answer}…</Out>);
      try {
        const res = await fetch("/api/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        });
        const data = await res.json();
        if (!res.ok) print(<Out tone="error">{data.error ?? "Verification failed."}</Out>);
        else if (data.correct)
          print(<CodeCard code={data.code} onApply={() => goApply("builder", { challenge: data.code })} />);
        else print(<Out tone="error">✗ Not quite. Check your bounds and try again.</Out>);
      } catch {
        print(<Out tone="error">Network error. Try again.</Out>);
      } finally {
        setBusy(false);
      }
    },
    [goApply, print],
  );

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      print(
        <div className="flex gap-2">
          <span className="shrink-0 text-accent">{PROMPT}</span>
          <span className="break-all text-fg">{trimmed}</span>
        </div>,
      );
      if (!trimmed) return;
      history.current = [trimmed, ...history.current].slice(0, 50);
      historyIndex.current = -1;

      // `tvo apply` and `apply` are the same command
      const [name, ...args] = trimmed.replace(/^tvo\s+/, "").split(/\s+/);
      const cmd = name.toLowerCase();

      switch (cmd) {
        case "help":
          print(
            ...[
              ["about", "what TVO is"],
              ["engine", "how a sprint works"],
              ["ls / cat <file>", "read the files here"],
              ["apply founder|builder", "open the application"],
              ["challenge", "the builder problem"],
              ["submit <answer>", "check your answer"],
              ["contact", "reach the operators"],
              ["clear / exit", "tidy up / close (Esc)"],
            ].map(([c, d]) => (
              <Out key={c}>
                <span className="inline-block w-44 text-fg">{c}</span>
                <span className="text-subtle">{d}</span>
              </Out>
            )),
          );
          break;
        case "about":
          print(
            <Out>
              TVO is UT Austin&apos;s external engineering syndicate. We embed vetted student builders
              into locally funded Austin startups to clear live backlogs and ship production code.
            </Out>,
          );
          break;
        case "engine":
          print(
            ...ENGINE_STEPS.map((s) => (
              <Out key={s.id}>
                <span className="text-accent">{s.index}</span> {s.title}{" "}
                <span className="text-subtle">· {s.summary}</span>
              </Out>
            )),
          );
          break;
        case "ls":
          print(<Out>{Object.keys(FILES).join("    ")}</Out>);
          break;
        case "cat": {
          const file = FILES[args[0] ?? ""];
          if (file) print(...file.map((l, i) => <Out key={i}>{l || " "}</Out>));
          else print(<Out tone="error">cat: {args[0] ?? "(missing file)"}: No such file. Try `ls`.</Out>);
          break;
        }
        case "whoami":
          print(
            <Out>
              guest. Run <Cmd>apply builder</Cmd> to change that.
            </Out>,
          );
          break;
        case "apply": {
          const which = (args[0] ?? "").toLowerCase();
          if (which === "founder" || which === "startup") goApply("startup");
          else if (which === "builder") goApply("builder");
          else print(<Out tone="error">usage: apply founder | apply builder</Out>);
          break;
        }
        case "challenge":
          print(
            ...PUZZLE.map((l, i) => (
              <Out key={i} tone={i === 0 ? "accent" : "fg"}>
                {l || " "}
              </Out>
            )),
            <Out tone="muted">
              Solve it any way you like, then run <Cmd>submit &lt;answer&gt;</Cmd>.
            </Out>,
          );
          break;
        case "submit":
          void submitAnswer(args.join(""));
          break;
        case "contact":
          print(...FILES["contact.txt"].map((l, i) => <Out key={i}>{l}</Out>));
          break;
        case "date":
          print(
            <Out>
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Chicago",
                dateStyle: "full",
                timeStyle: "long",
              }).format(new Date())}
            </Out>,
          );
          break;
        case "clear":
          setLines([]);
          break;
        case "exit":
          setOpen(false);
          break;
        case "sudo":
          print(
            <Out>
              Nice try. Permissions are earned. See <Cmd>challenge</Cmd>.
            </Out>,
          );
          break;
        case "rm":
          print(<Out>We only ship forward.</Out>);
          break;
        case "vim":
        case "emacs":
          print(<Out tone="muted">Holy wars are out of scope for this sprint.</Out>);
          break;
        default:
          print(<Out tone="error">command not found: {name}. Type `help`.</Out>);
      }
    },
    [goApply, print, setOpen, submitAnswer],
  );

  // Global hotkeys: "/" opens, Esc closes
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (!open && e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      } else if (open && e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Focus handling + first-open banner
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement;
      if (lines.length === 0) banner();
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
    returnFocus.current?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  // A note for the curious
  useEffect(() => {
    console.log(
      "%cTVO%c  You opened devtools. You're our kind of person.\n\nPress / on the page, or run tvo.challenge() right here.",
      "background:#ffa559;color:#1a0f05;font-weight:700;padding:2px 8px;border-radius:4px",
      "color:#a8a59e",
    );
    const w = window as unknown as { tvo?: object };
    w.tvo = {
      challenge() {
        console.log(PUZZLE.join("\n") + "\n\nThen run: await tvo.submit(<answer>)");
      },
      async submit(answer: number | string) {
        const res = await fetch("/api/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: String(answer) }),
        });
        const data = await res.json();
        if (data.correct) return `Correct. Your code: ${data.code}. Paste it in the builder application.`;
        return data.error ?? "Not quite. Try again.";
      },
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (busy) return;
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(historyIndex.current + 1, history.current.length - 1);
      if (i >= 0) {
        historyIndex.current = i;
        setInput(history.current[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = historyIndex.current - 1;
      historyIndex.current = Math.max(i, -1);
      setInput(i >= 0 ? history.current[i] : "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const [head, ...rest] = input.split(" ");
      if (rest.length === 0) {
        const match = COMMANDS.filter((c) => c.startsWith(head.toLowerCase()));
        if (match.length === 1) setInput(match[0] + " ");
        else if (match.length > 1) print(<Out tone="muted">{match.join("    ")}</Out>);
      } else if (head === "cat") {
        const match = Object.keys(FILES).filter((f) => f.startsWith(rest.join(" ")));
        if (match.length === 1) setInput(`cat ${match[0]}`);
      } else if (head === "apply") {
        const match = ["founder", "builder"].filter((f) => f.startsWith(rest.join(" ")));
        if (match.length === 1) setInput(`apply ${match[0]}`);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="TVO terminal"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="bezel relative w-full max-w-3xl shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)]"
          >
            <div className="bezel-core flex h-[min(560px,75dvh)] flex-col overflow-hidden bg-[#0c0c0b]">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2" aria-hidden>
                  <span className="size-3 rounded-full bg-accent" />
                  <span className="size-3 rounded-full bg-fg/15" />
                  <span className="size-3 rounded-full bg-fg/15" />
                </div>
                <span className="font-mono text-xs text-subtle">operator shell</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close terminal"
                  className="grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>

              <div
                ref={scrollRef}
                onClick={() => inputRef.current?.focus()}
                className="flex-1 space-y-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed sm:p-5"
                aria-live="polite"
              >
                {lines.map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    {l.node}
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <label htmlFor="tvo-terminal-input" className="shrink-0 text-accent">
                    {PROMPT}
                  </label>
                  <input
                    id="tvo-terminal-input"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={busy}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent text-[16px] text-fg caret-accent outline-none sm:text-[13px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-subtle">
                <span>
                  <kbd className="text-muted">tab</kbd> complete
                </span>
                <span>
                  <kbd className="text-muted">↑↓</kbd> history
                </span>
                <span>
                  <kbd className="text-muted">esc</kbd> close
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
