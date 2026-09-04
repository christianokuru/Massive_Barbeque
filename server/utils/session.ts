import { auth } from "~~/server/auth.config";

export async function getUserSession(event: any) {
  try {
    const session = await auth.api.getSession({
      headers: getHeaders(event),
    });
    return session;
  } catch {
    return null;
  }
}

export async function requireUser(event: any) {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return session;
}

export async function requireAdmin(event: any) {
  const session = await requireUser(event);
  const role = (session.user as any)?.role;
  if (role && role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: admin only" });
  }
  return session;
}
