import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getRuntimeConfig, isManagedHosting, saveRuntimeConfig } from "@/lib/config";
import { getRedis } from "@/lib/kv";

const AUTH_KV_KEY = "secwatch:auth";
const SESSION_COOKIE = "secwatch_session";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE = 60 * 60 * 12;
export const DEFAULT_APP_PASSWORD = "SecWatch4you";

interface AuthRecord {
  passwordHash: string;
  updatedAt: string;
}

const DEFAULT_PASSWORD_HASH = createPasswordHash(
  DEFAULT_APP_PASSWORD,
  "secwatch-default-password-salt"
);

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

export function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [algo, salt, expected] = passwordHash.split("$");
  if (algo !== "scrypt" || !salt || !expected) return false;

  const derived = scryptSync(password, salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const derivedBuffer = Buffer.from(derived, "hex");

  return (
    expectedBuffer.length === derivedBuffer.length &&
    timingSafeEqual(expectedBuffer, derivedBuffer)
  );
}

async function readAuthRecord(): Promise<AuthRecord | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const data = await redis.get<AuthRecord>(AUTH_KV_KEY);
      if (data?.passwordHash) return data;
    } catch {
      // ignore and fall back
    }
  }

  const config = getRuntimeConfig();
  if (config.SECWATCH_PASSWORD_HASH) {
    return {
      passwordHash: config.SECWATCH_PASSWORD_HASH,
      updatedAt: new Date(0).toISOString(),
    };
  }

  return null;
}

async function writeAuthRecord(record: AuthRecord): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(AUTH_KV_KEY, record);
    return;
  }

  if (isManagedHosting()) {
    throw new Error(
      "Redis non configuré. Le mot de passe ne peut pas être modifié sur cette instance Vercel."
    );
  }

  saveRuntimeConfig({ SECWATCH_PASSWORD_HASH: record.passwordHash });
}

export async function getAuthRecord(): Promise<AuthRecord> {
  const existing = await readAuthRecord();
  if (existing) return existing;

  const fallback: AuthRecord = {
    passwordHash: DEFAULT_PASSWORD_HASH,
    updatedAt: new Date().toISOString(),
  };

  try {
    await writeAuthRecord(fallback);
  } catch {
    // Keep working even if persistence is not available yet.
  }

  return fallback;
}

export async function isDefaultPasswordActive(): Promise<boolean> {
  const { passwordHash } = await getAuthRecord();
  return verifyPassword(DEFAULT_APP_PASSWORD, passwordHash);
}

function signSessionPayload(payload: string, passwordHash: string): string {
  return createHmac("sha256", passwordHash).update(payload).digest("base64url");
}

function createSessionToken(passwordHash: string, remember: boolean): string {
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Date.now() + (remember ? REMEMBER_MAX_AGE : SESSION_MAX_AGE) * 1000,
      remember,
    })
  );

  return `${payload}.${signSessionPayload(payload, passwordHash)}`;
}

function verifySessionToken(token: string, passwordHash: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = signSessionPayload(payload, passwordHash);
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isCurrentSessionAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const { passwordHash } = await getAuthRecord();
  return verifySessionToken(token, passwordHash);
}

export async function requirePageAuth(): Promise<void> {
  if (!(await isCurrentSessionAuthenticated())) {
    redirect("/login");
  }
}

export async function redirectIfAuthenticated(): Promise<void> {
  if (await isCurrentSessionAuthenticated()) {
    redirect("/");
  }
}

export async function ensureApiAuthenticated(): Promise<NextResponse | null> {
  if (await isCurrentSessionAuthenticated()) return null;

  return NextResponse.json(
    { error: "unauthorized", message: "Authentification requise." },
    { status: 401 }
  );
}

export async function login(password: string, remember: boolean): Promise<{
  token: string;
  maxAge?: number;
} | null> {
  const auth = await getAuthRecord();
  if (!verifyPassword(password, auth.passwordHash)) return null;

  return {
    token: createSessionToken(auth.passwordHash, remember),
    maxAge: remember ? REMEMBER_MAX_AGE : undefined,
  };
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = await getAuthRecord();
  if (!verifyPassword(currentPassword, auth.passwordHash)) {
    throw new Error("current_password_invalid");
  }

  const nextPassword = newPassword.trim();
  if (nextPassword.length < 8) {
    throw new Error("password_too_short");
  }

  const nextRecord: AuthRecord = {
    passwordHash: createPasswordHash(nextPassword),
    updatedAt: new Date().toISOString(),
  };

  await writeAuthRecord(nextRecord);
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  maxAge?: number
): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
