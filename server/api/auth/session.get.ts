import { auth } from '~~/server/auth.config';

export default defineEventHandler(async (event) => {
  try {
    const session = await auth.api.getSession({
      headers: getHeaders(event),
    });

    if (!session) {
      return { user: null };
    }

    return { user: session.user };
  } catch (error: any) {
    console.error('Session error:', error);
    return { user: null };
  }
});