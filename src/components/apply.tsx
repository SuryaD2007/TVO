"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Loader2,
} from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { STEPS, validateField, validateStep, type Field, type Values } from "@/lib/apply-schema";
import type { Track } from "@/lib/content";
import { useApply } from "./apply-context";
import { Button, cn, Container, EASE, Reveal } from "./ui";

const TRACKS: { id: Track; label: string; sub: string; icon: typeof Building2 }[] = [
  { id: "startup", label: "I'm a founder", sub: "Deploy a sprint", icon: Building2 },
  { id: "builder", label: "I'm a UT builder", sub: "Join the cohort", icon: Code2 },
];

type Status = "idle" | "submitting" | "error" | "done";

export function Apply() {
  const { track, setTrack } = useApply();

  return (
    <section id="apply" className="relative overflow-hidden bg-ink-2 py-28 sm:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[700px] rounded-full bg-accent/[0.06] blur-[140px]"
      />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Reveal>
              <div className="flex items-center gap-4 font-mono text-xs text-subtle">
                <span className="text-accent">04</span>
                <span className="h-px w-10 bg-line-strong" aria-hidden />
                <span className="tracking-[0.08em]">Apply</span>
              </div>
              <h2 className="mt-8 text-[2.5rem] leading-[1] font-medium tracking-[-0.04em] sm:text-6xl">
                Enter the <span className="serif-accent text-accent">syndicate.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-muted">
                Founders: scope a sprint in about two minutes. Builders: applications for the
                founding cohort are reviewed on a rolling basis.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                role="radiogroup"
                aria-label="Application type"
                className="mt-10 flex flex-col gap-2"
              >
                {TRACKS.map((t) => {
                  const active = t.id === track;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTrack(t.id)}
                      className={cn(
                        "relative flex items-center gap-4 rounded-2xl p-4 text-left transition-colors duration-500 ease-fluid",
                        active ? "text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="track-pill"
                          className="absolute inset-0 rounded-2xl bg-fg/[0.05] ring-1 ring-line-strong"
                          transition={{ duration: 0.6, ease: EASE }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-500",
                          active ? "bg-accent text-accent-ink" : "bg-fg/[0.05]",
                        )}
                      >
                        <t.icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="relative min-w-0">
                        <span className="block font-medium">{t.label}</span>
                        <span className="block text-sm text-subtle">{t.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="lg:col-span-7 lg:col-start-6">
            {/* Remount per track so each flow starts clean */}
            <ApplicationForm key={track} track={track} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ApplicationForm({ track }: { track: Track }) {
  const steps = STEPS[track];
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [ref, setRef] = useState("");
  const [direction, setDirection] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const setValue = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name])
      setErrors((e) => {
        const next = { ...e };
        delete next[name];
        return next;
      });
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0];
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus(),
    );
  };

  const goTo = (i: number) => {
    setDirection(i > stepIndex ? 1 : -1);
    setStepIndex(i);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateStep(step, values);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    if (!isLast) return goTo(stepIndex + 1);

    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, values, website_hp: honeypot.current?.value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          // Jump back to the first step that has a server-side error
          const badStep = steps.findIndex((s) => s.fields.some((f) => data.errors[f.name]));
          setErrors(data.errors);
          if (badStep >= 0) goTo(badStep);
        }
        throw new Error(data.error ?? "Something went wrong.");
      }
      setRef(data.ref);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Network error. Try again.");
    }
  };

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="bezel"
        role="status"
      >
        <div className="bezel-core flex flex-col items-center px-6 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-ink">
            <CheckCircle2 className="size-7" strokeWidth={1.75} />
          </span>
          <h3 className="mt-8 text-3xl font-medium tracking-[-0.03em]">
            {track === "startup" ? "Sprint request received" : "Application received"}
          </h3>
          <p className="mt-2 max-w-md text-muted">
            {track === "startup"
              ? "We'll reach out by email to scope your backlog."
              : "We'll email your UT address with next steps for the technical round."}
          </p>
          <p className="mt-8 rounded-full bg-ink px-4 py-1.5 font-mono text-xs text-muted ring-1 ring-line">
            ref <span className="text-fg">{ref}</span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="bezel"
      aria-labelledby="apply-step-title"
    >
      <div className="bezel-core overflow-hidden">
        {/* Stepper */}
        <ol className="flex border-b border-line">
          {steps.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => goTo(i)}
                  aria-current={current ? "step" : undefined}
                  className="relative flex w-full items-center gap-3 px-4 py-5 text-left disabled:cursor-default sm:px-8"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] transition-colors duration-500",
                      done && "bg-accent/15 text-accent",
                      current && "bg-accent text-accent-ink",
                      !done && !current && "text-subtle ring-1 ring-line-strong",
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-sm sm:block",
                      current ? "text-fg" : done ? "text-muted" : "text-subtle",
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="absolute inset-x-0 bottom-[-1px] h-px">
                    <motion.span
                      className="block h-full bg-accent"
                      initial={false}
                      animate={{ scaleX: i <= stepIndex ? 1 : 0 }}
                      style={{ originX: 0 }}
                      transition={{ duration: 0.7, ease: EASE }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="relative overflow-hidden p-6 sm:p-10">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.fieldset
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <legend id="apply-step-title" className="text-2xl font-medium tracking-[-0.03em]">
                  {step.title}
                </legend>
                <span className="font-mono text-xs text-subtle">
                  step {stepIndex + 1}/{steps.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{step.description}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {step.fields.map((f) => (
                  <FieldControl
                    key={f.name}
                    field={f}
                    value={values[f.name] ?? ""}
                    error={errors[f.name]}
                    onChange={(v) => setValue(f.name, v)}
                    onBlur={() => {
                      const err = values[f.name] ? validateField(f, values[f.name]) : null;
                      if (err) setErrors((e) => ({ ...e, [f.name]: err }));
                    }}
                  />
                ))}
              </div>
            </motion.fieldset>
          </AnimatePresence>

          {/* Honeypot */}
          <input
            ref={honeypot}
            type="text"
            name="website_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] size-px opacity-0"
          />

          {status === "error" && (
            <p
              role="alert"
              className="mt-6 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/25"
            >
              <AlertCircle className="size-4 shrink-0" /> {serverError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goTo(stepIndex - 1)}
              className={cn(stepIndex === 0 && "invisible")}
            >
              <ArrowLeft className="size-4" strokeWidth={1.75} /> Back
            </Button>
            <Button
              type="submit"
              size="lg"
              icon={status === "submitting" ? Loader2 : ArrowRight}
              disabled={status === "submitting"}
              aria-busy={status === "submitting"}
              className={cn(status === "submitting" && "[&_svg]:animate-spin")}
            >
              {status === "submitting"
                ? "Submitting"
                : isLast
                  ? track === "startup"
                    ? "Request sprint"
                    : "Submit application"
                  : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange,
  onBlur,
}: {
  field: Field;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = (error ? errorId : field.hint ? hintId : "") || undefined;

  const inputClass = cn(
    "w-full rounded-xl bg-ink px-4 text-[16px] text-fg ring-1 placeholder:text-subtle/70 sm:text-[15px]",
    "transition-[box-shadow] duration-300 ease-fluid outline-none",
    "focus:ring-accent/70 focus:shadow-[0_0_0_4px_rgb(255_165_89/0.12)]",
    error ? "ring-red-400/60" : "ring-line-strong hover:ring-fg/25",
  );

  const common = {
    id,
    name: field.name,
    "data-field": field.name,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": field.required,
    onBlur,
  };

  let control;
  if (field.type === "textarea") {
    control = (
      <textarea
        {...common}
        rows={4}
        maxLength={4000}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "resize-y py-3 leading-relaxed")}
      />
    );
  } else if (field.type === "select") {
    control = (
      <select
        {...common}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputClass,
          "h-12 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2385827b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10",
          !value && "text-subtle",
        )}
      >
        <option value="" disabled>
          Select…
        </option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "chips") {
    const selected = value ? value.split(",") : [];
    const toggle = (o: string) =>
      onChange(
        (selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o]).join(","),
      );
    control = (
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className="flex flex-wrap gap-2"
      >
        {field.options?.map((o, i) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              data-field={i === 0 ? field.name : undefined}
              onClick={() => toggle(o)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm transition-colors duration-300 ease-fluid",
                on
                  ? "bg-accent text-accent-ink"
                  : "bg-ink text-muted ring-1 ring-line-strong hover:text-fg hover:ring-fg/25",
              )}
            >
              {on && <Check className="size-3.5" strokeWidth={2.5} />}
              {o}
            </button>
          );
        })}
      </div>
    );
  } else {
    control = (
      <input
        {...common}
        type={field.type === "url" ? "text" : field.type}
        inputMode={field.type === "url" ? "url" : field.type === "email" ? "email" : undefined}
        autoComplete={field.name === "email" ? "email" : field.name === "name" ? "name" : undefined}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "h-12")}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", field.span !== "half" && "sm:col-span-2")}>
      <label
        id={`${id}-label`}
        htmlFor={field.type === "chips" ? undefined : id}
        className="flex h-5 items-center justify-between text-sm font-medium text-fg/90"
      >
        <span>
          {field.label}
          {field.required && (
            <span className="text-accent" aria-hidden>
              {" "}
              *
            </span>
          )}
        </span>
        {!field.required && (
          <span className="font-mono text-[11px] font-normal text-subtle">optional</span>
        )}
      </label>
      {control}
      {field.hint && !error && (
        <p id={hintId} className="text-xs text-subtle">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
