import { z } from 'zod';
import { auth } from '~~/server/auth.config';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, registerSchema.parse);

    // Register user using Better Auth
    const user = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
      headers: getHeaders(event),
    });

    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Registration failed',
      });
    }

    return { 
      success: true, 
      user 
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
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