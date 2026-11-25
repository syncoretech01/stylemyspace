"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type FormEvent,
  type InvalidEvent,
  type ReactNode,
} from "react";
import { submitContact, type ContactState } from "./actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { SITE } from "@/lib/site";

const initial: ContactState = { status: "idle" };

type FieldKey = "name" | "email" | "phone" | "message";
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
/** undefined = defer to the server message; null = cleared by the user; string = client message. */
type Overrides = Partial<Record<FieldKey, string | null>>;

const FIELD_KEYS: readonly FieldKey[] = ["name", "email", "phone", "message"];
const isFieldKey = (v: string): v is FieldKey => (FIELD_KEYS as readonly string[]).includes(v);

/** Human messages for the browser's ValidityState; mirrors the zod messages in actions.ts. */
function humanMessage(el: Control): string | null {
  const v = el.validity;
  if (v.valid) return null;
  switch (el.name) {
    case "name":
      return "Please tell us your name.";
    case "email":
      return v.valueMissing ? "Please enter your email address." : "Enter a valid email address.";
    case "phone":
      return "Enter a valid phone number.";
    case "message":
      return v.valueMissing ? "Tell us a little about the project." : "Tell us a little about the project (at least 10 characters).";
    default:
      return "Please check this field.";
  }
}

// noValidate is applied only after hydration so a no-JS submit keeps native validation.
const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

// The rest-state rule is olive/75 (3.4:1 on bone): taupe reads 1.72:1 there, under the 3:1 a control
// boundary needs. Focus thickens the rule to 3px with a shadow, so nothing moves.
const field =
  "block w-full min-h-6 rounded-none border-0 border-b border-olive/75 bg-transparent py-1 text-body text-ink transition-[border-color,box-shadow] duration-(--dur-micro) outline-none focus:border-olive focus:shadow-[0_2px_0_0_var(--color-olive)] aria-[invalid=true]:border-clay aria-[invalid=true]:focus:shadow-[0_2px_0_0_var(--color-clay)]";
const errorText = "mt-0.5 min-h-3 text-small text-clay";

function Field({
  id,
  label,
  optional = false,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} data-reveal>
      <label htmlFor={id} className="block text-small text-olive">
        {label}
        {optional && " (optional)"}
      </label>
      {children}
      <p id={`${id}-error`} role="alert" className={errorText}>
        {error}
      </p>
    </div>
  );
}

const inlineLink = "underline decoration-1 underline-offset-4 transition-colors duration-(--dur-micro) hover:text-olive";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);

  // Client-side messages layered over the server's; reset whenever a new server state arrives.
  const [overrides, setOverrides] = useState<Overrides>({});
  // Fields the visitor has typed in (or that failed a submit). Blur validates only these, so
  // simply tabbing through an untouched form never puts it into an error state.
  const touched = useRef<Set<FieldKey>>(new Set());
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setOverrides({});
  }

  useEffect(() => {
    shownAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (state.status === "sent" || state.status === "unsent") {
      statusRef.current?.focus();
      return;
    }
    if (state.status === "error") {
      const first = formRef.current?.querySelector<Control>('[aria-invalid="true"]');
      if (first) first.focus();
      else summaryRef.current?.focus();
    }
  }, [state]);

  if (state.status === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-xs border-t border-olive pt-4">
        <p className="font-display text-h2">
          Thank <em>you.</em>
        </p>
        <p className="measure mt-1.5">Your message has been sent. We’ll be in touch shortly.</p>
      </div>
    );
  }

  if (state.status === "unsent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-xs border-t border-olive pt-4">
        <p className="font-display text-h2">
          One more <em>step.</em>
        </p>
        <p className="measure mt-1.5">
          Your message is ready but has not been sent yet. Open it in your email app to send it to {SITE.email}, or call{" "}
          <a className={inlineLink} href={SITE.phoneHref}>
            {SITE.phone}
          </a>
          .
        </p>
        <p className="mt-3">
          <a
            href={state.mailto}
            className="inline-flex min-h-6 items-center rounded-xs bg-olive px-3.5 eyebrow text-bone transition-colors duration-(--dur-micro) hover:bg-olive-deep"
          >
            Open in email
          </a>
        </p>
      </div>
    );
  }

  const values = state.values;
  const serverErrors = state.errors ?? {};
  const errorFor = (key: FieldKey): string | undefined => {
    const o = overrides[key];
    if (o === null) return undefined;
    return o ?? serverErrors[key];
  };
  const setFieldError = (key: FieldKey, message: string | null) => setOverrides((prev) => ({ ...prev, [key]: message }));

  const onInvalid = (e: InvalidEvent<Control>) => {
    e.preventDefault(); // suppress the native bubble; the message is rendered inline instead
    if (!isFieldKey(e.currentTarget.name)) return;
    touched.current.add(e.currentTarget.name); // a failed submit makes every field reportable
    setFieldError(e.currentTarget.name, humanMessage(e.currentTarget));
  };
  const onBlur = (e: FocusEvent<Control>) => {
    if (!isFieldKey(e.currentTarget.name)) return;
    if (!touched.current.has(e.currentTarget.name)) return;
    setFieldError(e.currentTarget.name, humanMessage(e.currentTarget));
  };
  const onInput = (e: FormEvent<Control>) => {
    if (!isFieldKey(e.currentTarget.name)) return;
    touched.current.add(e.currentTarget.name);
    // Clear a shown error as soon as the field becomes valid again.
    if (errorFor(e.currentTarget.name) && e.currentTarget.validity.valid) {
      setFieldError(e.currentTarget.name, null);
    }
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    if (elapsedRef.current) elapsedRef.current.value = String(Math.round(performance.now() - shownAt.current));
    if (form.checkValidity()) return; // fires onInvalid per control
    e.preventDefault();
    form.querySelector<Control>(":invalid")?.focus();
  };

  const describedBy = (key: FieldKey) => (errorFor(key) ? `${key}-error` : undefined);
  const handlers = { onInvalid, onBlur, onInput };

  return (
    <form
      ref={formRef}
      action={action}
      noValidate={hydrated}
      onSubmit={onSubmit}
      aria-busy={pending || undefined}
      aria-describedby={state.message ? "form-error" : undefined}
      className="grid gap-x-5 gap-y-2 md:grid-cols-2"
    >
      <input ref={elapsedRef} type="hidden" name="elapsed" defaultValue="" />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id="name" label="Name" error={errorFor("name")}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={values?.name}
          className={field}
          aria-invalid={!!errorFor("name")}
          aria-describedby={describedBy("name")}
          {...handlers}
        />
      </Field>

      <Field id="email" label="Email" error={errorFor("email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values?.email}
          className={field}
          aria-invalid={!!errorFor("email")}
          aria-describedby={describedBy("email")}
          {...handlers}
        />
      </Field>

      <Field id="phone" label="Phone" optional error={errorFor("phone")}>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          pattern="[+\(\)\d\s.\-]{7,}"
          maxLength={40}
          defaultValue={values?.phone}
          className={field}
          aria-invalid={!!errorFor("phone")}
          aria-describedby={describedBy("phone")}
          {...handlers}
        />
      </Field>

      <Field id="projectType" label="Project type" optional>
        <span className="relative block">
          {/* Keyed: React does not re-apply a <select>'s defaultValue when it resets the form. */}
          <select
            key={values?.projectType ?? ""}
            id="projectType"
            name="projectType"
            defaultValue={values?.projectType ?? ""}
            className={cn(field, "cursor-pointer appearance-none pr-4")}
          >
            <option value="">Choose one</option>
            {SITE.disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-0.5 block size-1 -translate-y-[70%] rotate-45 border-r border-b border-olive"
          />
        </span>
      </Field>

      <Field id="message" label="Tell us about the project" error={errorFor("message")} className="md:col-span-2">
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={5000}
          defaultValue={values?.message}
          className={cn(field, "resize-y")}
          aria-invalid={!!errorFor("message")}
          aria-describedby={describedBy("message")}
          {...handlers}
        />
      </Field>

      {state.message && (
        <div ref={summaryRef} id="form-error" tabIndex={-1} role="alert" className="mb-2 rounded-xs text-clay md:col-span-2">
          <p>{state.message}</p>
          {state.mailto && (
            <p className="mt-1">
              <a className={inlineLink} href={state.mailto}>
                Send it by email instead
              </a>
            </p>
          )}
        </div>
      )}

      <div className="md:col-span-2" data-reveal>
        <span data-magnet className="inline-block">
          <Button type="submit" disabled={pending} className="disabled:cursor-progress disabled:opacity-60">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </span>
      </div>
    </form>
  );
}
