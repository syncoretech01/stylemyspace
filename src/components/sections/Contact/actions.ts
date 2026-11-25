"use server";

import { z } from "zod";
import { SITE } from "@/lib/site";

export type ContactValues = { name: string; email: string; phone: string; projectType: string; message: string };

export type ContactState = {
  /**
   * sent:   delivered to CONTACT_ENDPOINT.
   * unsent: valid, but no endpoint is configured; `mailto` carries the whole message so nothing is lost.
   */
  status: "idle" | "error" | "sent" | "unsent";
  errors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
  message?: string;
  mailto?: string;
  /** Echoed back on every non-final state: React resets an uncontrolled form once its action settles. */
  values?: ContactValues;
};

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120, "Please shorten your name."),
  email: z.string().trim().max(254, "Enter a valid email address.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(40, "Enter a valid phone number.")
    .optional()
    .refine((v) => !v || /^[+()\d\s.-]{7,}$/.test(v), "Enter a valid phone number."),
  projectType: z.string().trim().max(40).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little about the project (at least 10 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
});

/** Milliseconds between the form appearing and being sent, below which a person is implausible. */
const MIN_FILL_MS = 1500;
const DELIVERY_TIMEOUT_MS = 10_000;

const text = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

function mailtoFor(v: ContactValues): string {
  const subject = `Project inquiry from ${v.name}`;
  const body = [
    v.message,
    "",
    v.name,
    v.email,
    ...(v.phone ? [`Phone: ${v.phone}`] : []),
    ...(v.projectType ? [`Project type: ${v.projectType}`] : []),
  ].join("\n");
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values: ContactValues = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    projectType: text(formData, "projectType"),
    message: text(formData, "message"),
  };

  // Honeypot: only a script fills a field nobody can see. Claim success and do nothing.
  if (text(formData, "website")) return { status: "sent" };

  // `elapsed` is measured in the browser (performance.now), never against the server's clock: comparing
  // a client timestamp with Date.now() here silently discarded messages from anyone whose clock ran fast.
  const elapsed = Number(text(formData, "elapsed"));
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_FILL_MS) {
    return { status: "error", message: "That was quick. Please check your details and send again.", values };
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "phone" || key === "message") errors[key] ??= issue.message;
    }
    return { status: "error", errors, values };
  }

  const endpoint = process.env.CONTACT_ENDPOINT;
  if (!endpoint) {
    // Delivery is not configured (OPEN-ITEMS OI-13). Hand the message back, ready to send by email.
    return { status: "unsent", mailto: mailtoFor(values) };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Delivery endpoint responded ${res.status}`);
    return { status: "sent" };
  } catch (error) {
    console.error("[contact] delivery failed:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message: "We couldn’t send your message just now. Your details are still here: please try again, or call or email us instead.",
      mailto: mailtoFor(values),
      values,
    };
  }
}
