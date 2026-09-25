import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./secrets";

export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}
