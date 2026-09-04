import { auth } from "~~/server/auth.config";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
