// src/lib/quota.ts
// Per-user daily caps on the routes that cost real money (OpenAI, Replicate).
// Counters live in the auth user's app_metadata: only the service role can
// write it, so a user can't reset their own count the way they could with
// localStorage, and no database migration is needed.

import { createAdminClient } from "@/lib/supabase/admin";

export type QuotaKind = "chat" | "analyze" | "bg";

// Generous enough that a real person never hits them (a big bulk upload is
// ~100 photos), low enough that a script can't run up a large bill.
const DAILY_LIMITS: Record<QuotaKind, number> = {
  chat: 40,
  analyze: 150,
  bg: 150,
};

const LIMIT_MESSAGES: Record<QuotaKind, string> = {
  chat: "You've reached today's chat limit. It resets tomorrow.",
  analyze: "You've reached today's photo limit. It resets tomorrow.",
  bg: "You've reached today's photo limit. It resets tomorrow.",
};

type Usage = { day: string } & Partial<Record<QuotaKind, number>>;

export async function consumeQuota(userId: string, kind: QuotaKind): Promise<{ ok: true } | { ok: false; message: string }> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) throw error ?? new Error("user not found");

    const meta = (data.user.app_metadata ?? {}) as { usage?: Usage };
    const usage: Usage = meta.usage?.day === today ? { ...meta.usage } : { day: today };
    const used = usage[kind] ?? 0;
    if (used >= DAILY_LIMITS[kind]) return { ok: false, message: LIMIT_MESSAGES[kind] };

    usage[kind] = used + 1;
    await admin.auth.admin.updateUserById(userId, { app_metadata: { ...data.user.app_metadata, usage } });
    return { ok: true };
  } catch (e) {
    // Never block a real user because the counter itself failed.
    console.error(`[quota] ${kind} check failed:`, e);
    return { ok: true };
  }
}
