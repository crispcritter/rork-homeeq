import { dbGet, dbSet, dbHas } from "./db";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

function userKey(email: string): string {
  return `user:${email.toLowerCase().trim()}`;
}

function userByIdKey(id: string): string {
  return `user_id:${id}`;
}

function sessionKey(token: string): string {
  return `session:${token}`;
}

async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const actualSalt = salt || crypto.randomUUID();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(actualSalt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return { hash: hashHex, salt: actualSalt };
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = userKey(normalizedEmail);

  if (dbHas(key)) {
    throw new Error("An account with this email already exists.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { hash, salt } = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  const storedUser: StoredUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
  };

  dbSet(key, storedUser);
  dbSet(userByIdKey(userId), storedUser);

  const token = generateToken();
  const session: AuthSession = {
    token,
    userId,
    createdAt: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  dbSet(sessionKey(token), session);

  console.log("[Auth] User registered:", normalizedEmail, "id:", userId);

  return {
    user: { id: userId, email: normalizedEmail, createdAt: now },
    token,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = userKey(normalizedEmail);
  const storedUser = dbGet<StoredUser>(key);

  if (!storedUser) {
    throw new Error("Invalid email or password.");
  }

  const { hash } = await hashPassword(password, storedUser.passwordSalt);

  if (hash !== storedUser.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const token = generateToken();
  const now = new Date().toISOString();
  const session: AuthSession = {
    token,
    userId: storedUser.id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  dbSet(sessionKey(token), session);

  console.log("[Auth] User logged in:", normalizedEmail);

  return {
    user: {
      id: storedUser.id,
      email: storedUser.email,
      createdAt: storedUser.createdAt,
    },
    token,
  };
}

export function validateToken(token: string): AuthUser | null {
  const session = dbGet<AuthSession>(sessionKey(token));
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    console.log("[Auth] Session expired for token:", token.slice(0, 8) + "...");
    return null;
  }

  const storedUser = dbGet<StoredUser>(userByIdKey(session.userId));
  if (!storedUser) return null;

  return {
    id: storedUser.id,
    email: storedUser.email,
    createdAt: storedUser.createdAt,
  };
}

export function revokeToken(token: string): void {
  const key = sessionKey(token);
  if (dbHas(key)) {
    dbSet(key, null);
    console.log("[Auth] Session revoked:", token.slice(0, 8) + "...");
  }
}
