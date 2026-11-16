import { Resend } from "resend";
import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { escapeHtml } from "~~/server/utils/orderEmailTemplate";

// POST /api/contact { name, email, brand, message, company? }
// Emails the shop inbox (CONTACT_RECEIVER_EMAIL). Unauthenticated email
// relay, so: 5 per client per hour, field caps, and a honeypot.
const schema = z.object({
  name: z.string({ required_error: "Please enter your name." }).trim().min(2, "Please enter your name.").max(100),
  email: z.string({ required_error: "Enter a valid email address." }).trim().email("Enter a valid email address.").max(254),
  brand: z.string({ required_error: "Please tell us your brand or company." }).trim().min(1, "Please tell us your brand or company.").max(200),
  message: z.string({ required_error: "Please write a message." }).trim().min(10, "Message must be at least 10 characters.").max(2000),
  // Honeypot: real visitors never fill it (hidden field).
  company: z.string().max(0).optional(),
});

export default defineApi(async (event) => {
  enforceRateLimit(event, "contact", {
    limit: 5,
    windowSecs: 3600,
    message: "Too many messages. Try again later.",
  });

  // Bots fill the hidden field: pretend success and send nothing, so the
  // filter can't be probed.
  const raw = ((await readBody(event).catch(() => ({}))) || {}) as Record<string, unknown>;
  if (typeof raw.company === "string" && raw.company.length > 0) return { success: true };

  const body = await parseBody(event, schema);
  const config = useRuntimeConfig(event);
  if (!config.resendApiKey) {
    console.error("[contact] RESEND_API_KEY is not set - message not sent.");
    apiError(503, "Our contact form is temporarily unavailable. Please email us directly.");
  }

  const { error } = await new Resend(config.resendApiKey).emails.send({
    from: config.fromEmail || "onboarding@resend.dev",
    to: [config.contactReceiverEmail || "info@massivebarbeque.com"],
    replyTo: body.email,
    subject: `New contact message from ${body.brand.replace(/[\r\n]+/g, " ")}`,
    text: `Name: ${body.name}\nEmail: ${body.email}\nBrand: ${body.brand}\n\n${body.message}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
      <p><strong>Brand:</strong> ${escapeHtml(body.brand)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(body.message)}</p>
    `,
  });
  if (error) {
    console.error("[contact] send failed:", error);
    apiError(502, "Your message couldn't be sent. Please try again in a moment.");
  }
  return { success: true };
});
