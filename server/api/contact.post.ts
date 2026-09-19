import { Resend } from "resend";
import { z } from "zod";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  brand: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
  // Honeypot: real forms never send it; bots fill it. Reject silently
  // as success so spammers can't probe the filter.
  company: z.string().max(0).optional(),
});

// Escape user input interpolated into the HTML email — the inbox is a
// trust boundary too (stored-XSS-style payloads in admin mail clients).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  // Abuse protection: unauthenticated email relay, 5 per IP per hour.
  const ip = getClientIp(event);
  const { limited, retryAfterSecs } = isRateLimited(`contact:${ip}`, {
    limit: 5,
    windowSecs: 3600,
  });
  if (limited) {
    setResponseHeader(event, "Retry-After", String(retryAfterSecs));
    throw createError({
      statusCode: 429,
      statusMessage: "Too many messages. Try again later.",
    });
  }
  const resend = new Resend(config.resendApiKey);

  try {
    const body = await readBody(event);

    // Honeypot trip: pretend success, send nothing (silent = unprobable).
    if (body && typeof (body as any).company === "string" && (body as any).company.length > 0) {
      return { success: true };
    }

    // Validate request body
    const validatedData = contactSchema.parse(body);

    const { name, email, brand, message } = validatedData;

    const { data, error } = await resend.emails.send({
      from: config.fromEmail || "onboarding@resend.dev",
      to: [config.contactReceiverEmail || "info@massivebarbeque.com"],
      subject: `New Contact Form Submission from ${escapeHtml(brand)}`,
      replyTo: email,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Brand:</strong> ${escapeHtml(brand)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw createError({
        statusCode: 400,
        statusMessage: "Failed to send email",
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Server error:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
