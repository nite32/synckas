import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const COOKIE = "kas_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "change-this-secret-in-production");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
export async function createSession(username: string) {
  const token = await new SignJWT({ username }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
}
export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret)).payload as { username?: string }; } catch { return null; }
}
export async function requireSession() {
  const session = await getSession();
  if (!session?.username) throw new Error("UNAUTHORIZED");
  return session;
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
