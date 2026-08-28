"use server";

import { z } from "zod";

export type ContactState = {
  status: "idle" | "error" | "sent" | "validated";
  errors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
  message?: string;
};

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[+()\d\s.-]{7,}$/.test(v), "Enter a valid phone number."),
  projectType: z.string().trim().optional(),
  message: z.string().trim().min(10, "Tell us a little about the project (at least 10 characters)."),
  website: z.string().max(0).optional(), // honeypot
  startedAt: z.coerce.number().optional(),
});

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "phone" || key === "message") errors[key] ??= issue.message;
    }
    return { status: "error", errors };
  }
  const { website, startedAt } = parsed.data;
  if (website || (startedAt && Date.now() - startedAt < 2000)) {
    // Bot heuristics: pretend success without doing anything.
    return { status: "sent" };
  }
  const endpoint = process.env.CONTACT_ENDPOINT;
  if (!endpoint) {
    // Delivery is not configured yet — see OPEN-ITEMS.md. The message was validated but not sent.
    return { status: "validated" };
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) throw new Error(`Delivery endpoint responded ${res.status}`);
    return { status: "sent" };
  } catch {
    return { status: "error", message: "We couldn’t send your message just now. Please call or email us instead." };
  }
}
