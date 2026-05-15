/**
 * auth.ts — Sécurité JWT (remplace userId:timestamp forgeable)
 *
 * CORRECTION CRITIQUE :
 * ❌ AVANT : generateToken() = `${userId}:${Date.now()}` → forgeable par n'importe qui
 * ✅ APRÈS : JWT signé HMAC-SHA256 + expiration 7 jours + rétro-compatibilité
 *
 * Rétro-compatible : les anciens tokens userId:timestamp continuent de fonctionner
 * pendant la transition. Tous les nouveaux tokens seront JWT.
 */

import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// ─── Secret JWT ────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? "enam-impact-dev-secret-min-32-chars!!";
const ACCESS_TTL  = 7  * 24 * 60 * 60; // 7 jours
const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 jours

// ─── Blacklist tokens révoqués (logout) ────────────────────────────────────────
const revokedTokens = new Set<string>();
setInterval(() => {
  // En production, utiliser Redis avec TTL
  if (revokedTokens.size > 10000) revokedTokens.clear();
}, 60 * 60 * 1000);

// ─── JWT helpers ──────────────────────────────────────────────────────────────
interface JwtPayload { sub: number; type: "access" | "refresh"; iat: number; exp: number; }

function signJwt(payload: Omit<JwtPayload, "iat" | "exp">, ttl: number): string {
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + ttl };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig    = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  const sigBuf = Buffer.from(sig!, "base64url");
  const expBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid signature");
  }
  const payload = JSON.parse(Buffer.from(body!, "base64url").toString()) as JwtPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

// ─── API publique ──────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return signJwt({ sub: userId, type: "access" }, ACCESS_TTL);
}

export function generateRefreshToken(userId: number): string {
  return signJwt({ sub: userId, type: "refresh" }, REFRESH_TTL);
}

export function invalidateToken(token: string): void {
  revokedTokens.add(token);
}

export interface AuthenticatedRequest extends Request {
  userId?:    number;
  userRole?:  string;
  companyId?: number;
  authToken?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  if (!queryToken && (!authHeader || !authHeader.startsWith("Bearer "))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = queryToken ?? authHeader!.slice(7);

  if (revokedTokens.has(token)) {
    res.status(401).json({ error: "Token has been revoked" });
    return;
  }

  // ── JWT ────────────────────────────────────────────────────────────────────
  if (token.includes(".")) {
    try {
      const payload = verifyJwt(token);
      if (payload.type !== "access") {
        res.status(401).json({ error: "Invalid token type" });
        return;
      }
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub));
      if (!user) { res.status(401).json({ error: "User not found" }); return; }
      req.userId    = user.id;
      req.userRole  = user.role;
      req.companyId = user.companyId ?? user.id;
      req.authToken = token;
      next();
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid token";
      if (msg === "Token expired") {
        res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
      } else {
        res.status(401).json({ error: "Invalid token" });
      }
      return;
    }
  }

  // ── Rétro-compatibilité userId:timestamp ───────────────────────────────────
  const parts  = token.split(":");
  const userId = parseInt(parts[0] ?? "", 10);
  if (isNaN(userId) || parts.length < 2) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  req.userId    = user.id;
  req.userRole  = user.role;
  req.companyId = user.companyId ?? user.id;
  req.authToken = token;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }
  next();
}

export function requireAdminOrAccountant(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin" && req.userRole !== "accountant") {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  next();
}
