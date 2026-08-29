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
} from "react";
import { submitContact, type ContactState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Todo } from "@/components/ui/Todo";
import { cn } from "@/components/ui/cn";
import { SITE } from "@/lib/site";

const initial: ContactState = { status: "idle" };

type FieldKey = "name" | "email" | "phone" | "message";
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
/** undefined = defer to the server message; null = cleared by the user; string = client message. */
type Overrides = Partial<Record<FieldKey, string | null>>;

const FIELD_KEYS: readonly FieldKey[] = ["name", "email", "phone", "message"];
const isFieldKey = (v: string): v is FieldKey => (FIELD_KEYS as readonly string[]).includes(v);

/** Human messages for the browser's ValidityState — mirrors the zod messages in actions.ts. */
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

// The rest-state rule is olive/75 (3.4:1 on bone): taupe reads 1.72:1 there, under the 3:1 a
// control boundary needs, so the fields were four near-invisible hairlines until focus.
const field =
  "peer block w-full min-h-6 rounded-xs border-b border-olive/75 bg-transparent pb-1.5 pt-4 text-body text-ink transition-colors duration-(--dur-micro) focus:border-olive aria-[invalid=true]:border-clay";
const floatBase =
  "pointer-events-none absolute left-0 top-4 origin-left text-body text-olive transition-[top,font-size,letter-spacing] duration-(--dur-micro) ease-(--ease-out-expo) peer-focus:top-0 peer-focus:eyebrow";
const floating = `${floatBase} peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:eyebrow`;
// A <select> never matches :placeholder-shown, so its "filled" state is a data attribute instead;
// the attribute selector outranks the resting top-4 in the same way peer-focus: does.
const floatingSelect = `${floatBase} data-[filled=true]:top-0 data-[filled=true]:eyebrow`;
const errorText = "mt-1 min-h-3 text-small text-clay";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);

  // Client-side messages layered over the server's; reset whenever a new server state arrives.
  const [overrides, setOverrides] = useState<Overrides>({});
  const [projectType, setProjectType] = useState("");
  // Fields the visitor has typed in (or that failed a submit). Blur validates only these, so
  // simply tabbing through an untouched form never puts it into an error state.
  const touched = useRef<Set<FieldKey>>(new Set());
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setOverrides({});
  }

  useEffect(() => {
    // Timing token for the server-side bot heuristic; set outside render to keep SSR/CSR identical.
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "sent" || state.status === "validated") {
      statusRef.current?.focus();
      return;
    }
    if (state.status === "error") {
      const first = formRef.current?.querySelector<Control>('[aria-invalid="true"]');
      if (first) first.focus();
      else summaryRef.current?.focus();
    }
  }, [state]);

  if (state.status === "sent" || state.status === "validated") {
    return (
      <p ref={statusRef} tabIndex={-1} role="status" className="measure rounded-xs bg-sand p-3 text-body md:p-4">
        {state.status === "sent" ? (
          "Thank you — your message has been sent. We’ll be in touch shortly."
        ) : (
          <>
            Thank you — your message was validated. Delivery is not connected yet:{" "}
            <Todo>connect form delivery (CONTACT_ENDPOINT)</Todo>. Meanwhile, email{" "}
            <a className="underline underline-offset-4" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            or call{" "}
            <a className="underline underline-offset-4" href={SITE.phoneHref}>
              {SITE.phone}
            </a>
            .
          </>
        )}
      </p>
    );
  }

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
    if (form.checkValidity()) return; // fires onInvalid per control
    e.preventDefault();
    form.querySelector<Control>(":invalid")?.focus();
  };

  const anyError = FIELD_KEYS.some((k) => errorFor(k));
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
      className="grid gap-x-6 gap-y-5 md:grid-cols-2"
    >
      <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="relative" data-reveal>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder=" "
          className={field}
          aria-invalid={!!errorFor("name")}
          aria-describedby={describedBy("name")}
          {...handlers}
        />
        <label htmlFor="name" className={floating}>
          Name
        </label>
        <p id="name-error" role="alert" className={errorText}>
          {errorFor("name")}
        </p>
      </div>

      <div className="relative" data-reveal>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder=" "
          className={field}
          aria-invalid={!!errorFor("email")}
          aria-describedby={describedBy("email")}
          {...handlers}
        />
        <label htmlFor="email" className={floating}>
          Email
        </label>
        <p id="email-error" role="alert" className={errorText}>
          {errorFor("email")}
        </p>
      </div>

      <div className="relative" data-reveal>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          pattern="[+\(\)\d\s.\-]{7,}"
          placeholder=" "
          className={field}
          aria-invalid={!!errorFor("phone")}
          aria-describedby={describedBy("phone")}
          {...handlers}
        />
        <label htmlFor="phone" className={floating}>
          Phone (optional)
        </label>
        <p id="phone-error" role="alert" className={errorText}>
          {errorFor("phone")}
        </p>
      </div>

      <div className="relative" data-reveal>
        <select
          id="projectType"
          name="projectType"
          defaultValue=""
          onChange={(e) => setProjectType(e.currentTarget.value)}
          className={cn(field, "cursor-pointer appearance-none pr-4")}
        >
          <option value="" />
          {SITE.disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label htmlFor="projectType" className={floatingSelect} data-filled={projectType !== ""}>
          Project type (optional)
        </label>
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-[2.9rem] block size-[0.5rem] -translate-y-1/2 rotate-45 border-b border-r border-olive"
        />
        <p className={errorText} aria-hidden />
      </div>

      <div className="relative md:col-span-2" data-reveal>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={10}
          placeholder=" "
          className={cn(field, "resize-y")}
          aria-invalid={!!errorFor("message")}
          aria-describedby={describedBy("message")}
          {...handlers}
        />
        <label htmlFor="message" className={floating}>
          Tell us about the project
        </label>
        <p id="message-error" role="alert" className={errorText}>
          {errorFor("message")}
        </p>
      </div>

      {(state.message || (state.status === "error" && anyError)) && (
        <p
          ref={summaryRef}
          id="form-error"
          tabIndex={-1}
          role="alert"
          className="rounded-xs text-body text-clay md:col-span-2"
        >
          {state.message ?? "Please check the highlighted fields and try again."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 md:col-span-2" data-reveal>
        <span data-magnet className="inline-block">
          <Button type="submit" disabled={pending} cursor="Send" className="disabled:cursor-progress disabled:opacity-60">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </span>
      </div>
    </form>
  );
}
