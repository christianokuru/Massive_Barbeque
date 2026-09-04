import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  brand: z.string().min(1),
  message: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const resend = new Resend(config.resendApiKey);

  try {
    const body = await readBody(event);

    // Validate request body
    const validatedData = contactSchema.parse(body);

    const { name, email, brand, message } = validatedData;

    const { data, error } = await resend.emails.send({
      from: config.fromEmail || "onboarding@resend.dev",
      to: [config.contactReceiverEmail || "info@massivebarbeque.com"],
      subject: `New Contact Form Submission from ${brand}`,
      replyTo: email,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Brand:</strong> ${brand}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
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
