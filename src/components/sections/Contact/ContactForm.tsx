"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContact, type ContactState } from "./actions";
import { Todo } from "@/components/ui/Todo";
import { SITE } from "@/lib/site";

const initial: ContactState = { status: "idle" };

const field =
  "peer w-full border-b border-taupe bg-transparent pb-1 pt-4 text-ink outline-none transition-colors duration-(--dur-micro) focus:border-olive aria-[invalid=true]:border-clay";
const label =
  "pointer-events-none absolute left-0 top-4 text-olive transition-all duration-(--dur-micro) peer-focus:top-0 peer-focus:text-eyebrow peer-focus:uppercase peer-focus:tracking-(--text-eyebrow--letter-spacing) peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-eyebrow peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-(--text-eyebrow--letter-spacing)";

/** STUB (P0). Owner ⑦: floating labels, live validation, magnetic submit. */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Timing token for the server-side bot heuristic; set outside render to keep SSR/CSR identical.
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);
  useEffect(() => {
    if (state.status === "sent" || state.status === "validated") statusRef.current?.focus();
  }, [state.status]);

  if (state.status === "sent" || state.status === "validated") {
    return (
      <p ref={statusRef} tabIndex={-1} role="status" className="measure rounded-xs bg-sand p-4">
        {state.status === "sent" ? (
          "Thank you — your message has been sent. We’ll be in touch shortly."
        ) : (
          <>
            Thank you — your message was validated. Delivery is not connected yet:{" "}
            <Todo>connect form delivery (CONTACT_ENDPOINT)</Todo>. Meanwhile, email{" "}
            <a className="underline" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            or call{" "}
            <a className="underline" href={SITE.phoneHref}>
              {SITE.phone}
            </a>
            .
          </>
        )}
      </p>
    );
  }

  const err = state.errors ?? {};
  return (
    <form action={action} noValidate className="grid gap-6 md:grid-cols-2" aria-describedby={state.message ? "form-error" : undefined}>
      <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="relative">
        <input id="name" name="name" type="text" autoComplete="name" required placeholder=" " className={field} aria-invalid={!!err.name} aria-describedby="name-error" />
        <label htmlFor="name" className={label}>
          Name
        </label>
        <p id="name-error" role="alert" className="mt-1 text-small text-clay">{err.name}</p>
      </div>

      <div className="relative">
        <input id="email" name="email" type="email" autoComplete="email" required placeholder=" " className={field} aria-invalid={!!err.email} aria-describedby="email-error" />
        <label htmlFor="email" className={label}>
          Email
        </label>
        <p id="email-error" role="alert" className="mt-1 text-small text-clay">{err.email}</p>
      </div>

      <div className="relative">
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder=" " className={field} aria-invalid={!!err.phone} aria-describedby="phone-error" />
        <label htmlFor="phone" className={label}>
          Phone (optional)
        </label>
        <p id="phone-error" role="alert" className="mt-1 text-small text-clay">{err.phone}</p>
      </div>

      <div className="relative">
        <select id="projectType" name="projectType" className={field} defaultValue="">
          <option value="">Project type (optional)</option>
          {SITE.disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="relative md:col-span-2">
        <textarea id="message" name="message" rows={5} required placeholder=" " className={field} aria-invalid={!!err.message} aria-describedby="message-error" />
        <label htmlFor="message" className={label}>
          Tell us about the project
        </label>
        <p id="message-error" role="alert" className="mt-1 text-small text-clay">{err.message}</p>
      </div>

      {state.message && (
        <p id="form-error" role="alert" className="text-clay md:col-span-2">
          {state.message}
        </p>
      )}

      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="inline-flex min-h-6 items-center rounded-xs bg-olive px-3 eyebrow text-bone transition-colors duration-(--dur-micro) hover:bg-olive-deep disabled:opacity-60" data-cursor="Send">
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
