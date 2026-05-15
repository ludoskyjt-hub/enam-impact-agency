import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { opsUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { OpsUser } from "@workspace/db";

export type OpsContext = {
  req: Request;
  res: Response;
  user: OpsUser | null;
};

export async function createOpsContext({ req, res }: { req: Request; res: Response }): Promise<OpsContext> {
  let user: OpsUser | null = null;
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    // JWT (3 parties "aaa.bbb.ccc")
    if (token.includes(".")) {
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          const { createHmac, timingSafeEqual } = await import("crypto");
          const [header, body, sig] = parts;
          const secret   = process.env.JWT_SECRET ?? "enam-impact-dev-secret-min-32-chars!!";
          const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
          const sigBuf   = Buffer.from(sig!, "base64url");
          const expBuf   = Buffer.from(expected, "base64url");
          if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
            const payload = JSON.parse(Buffer.from(body!, "base64url").toString()) as { sub: number; type: string; exp: number };
            if (payload.type === "access" && payload.exp >= Math.floor(Date.now() / 1000)) {
              const rows = await db.select().from(opsUsersTable).where(eq(opsUsersTable.id, payload.sub)).limit(1);
              user = rows[0] ?? null;
            }
          }
        } catch { /* token invalide */ }
      }
    } else {
      // Legacy userId:timestamp
      const parts  = token.split(":");
      const userId = parseInt(parts[0] ?? "", 10);
      if (!isNaN(userId) && parts.length >= 2) {
        const rows = await db.select().from(opsUsersTable).where(eq(opsUsersTable.id, userId)).limit(1);
        user = rows[0] ?? null;
      }
    }
  }
  return { req, res, user };
}
