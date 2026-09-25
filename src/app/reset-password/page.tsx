"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landing page for the "reset your password" email link. The link arrives
// with a one-time ?code=... that is exchanged for a short session, which is
// then allowed to set a new password.
export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errDesc = params.get("error_description");
    if (errDesc) { setLinkError(errDesc); return; }
    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setLinkError("This link has expired or was already used. Request a new one."); return; }
        window.history.replaceState(null, "", "/reset-password");
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setLinkError("This link has expired or was already used. Request a new one."); return; }
      setReady(true);
    })();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-10">Occaswear</p>

        {linkError ? (
          <div className="text-center">
            <h1 className="font-display text-3xl font-black mb-3">Link not valid.</h1>
            <p className="text-sm text-neutral-500 mb-8">{linkError}</p>
            <Link href="/forgot-password" className="inline-block rounded-xl bg-black text-white px-6 py-3 text-sm font-bold hover:bg-black/85 transition">
              Send a new link
            </Link>
          </div>
        ) : !ready ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-black/15 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-black mb-1">Set a new password.</h1>
            <p className="text-sm text-neutral-500 mb-8">Choose something you haven&apos;t used before.</p>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] mb-2">New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  autoComplete="new-password" placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition placeholder:text-neutral-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-[0.1em] mb-2">Repeat password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6}
                  autoComplete="new-password" placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/8 focus:border-black/25 transition placeholder:text-neutral-300" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-black text-white px-4 py-4 text-sm font-bold hover:bg-black/85 transition-all disabled:opacity-50 btn-press">
                {loading ? "Saving..." : "Save new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
