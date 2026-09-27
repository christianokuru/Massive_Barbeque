// Postgres unique violations (code 23505) surface as 500s by default.
// Map them to 409 with a human message — the UI shows field-level
// "already exists" instead of "Internal Server Error".
export function throwIfUniqueViolation(error: any, message: string): void {
  if (error?.code === "23505") {
    throw createError({ statusCode: 409, statusMessage: message });
  }
  throw error;
}
