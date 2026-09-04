import { z } from 'zod';
import { auth } from '~~/server/auth.config';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, loginSchema.parse);

    // Sign in user using Better Auth
    const session = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: getHeaders(event),
    });

    if (!session) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      });
    }

    return { 
      success: true, 
      user: session.user 
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error',
    });
  }
});