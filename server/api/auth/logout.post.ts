import { auth } from '~~/server/auth.config';

export default defineEventHandler(async (event) => {
  try {
    // Sign out user using Better Auth
    await auth.api.signOut({
      headers: getHeaders(event),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error',
    });
  }
});