import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Apple App Store Guideline 5.1.1(v) requires a real, working account
// deletion path - settings/page.tsx's "Delete Account & All Data" button
// previously just called supabase.auth.signOut() and left every row intact.
// This actually removes the user's data, then their auth account.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createAdminClient();

  // Delete owned rows first (no ON DELETE CASCADE assumed - best effort,
  // logged but non-fatal per table so one failure doesn't block the rest).
  const tables = ["items", "feedback", "couples"] as const;
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      console.error(`[delete-account] Failed to delete ${table} rows:`, error.message);
    }
  }

  const { error: userRowError } = await admin.from("users").delete().eq("id", userId);
  if (userRowError) {
    console.error("[delete-account] Failed to delete users row:", userRowError.message);
  }

  // Also remove any wardrobe photos in Supabase Storage under this user's folder.
  try {
    const { data: files } = await admin.storage.from("wardrobe").list(userId);
    if (files && files.length > 0) {
      await admin.storage.from("wardrobe").remove(files.map(f => `${userId}/${f.name}`));
    }
  } catch (e) {
    console.error("[delete-account] Failed to clean up storage:", e);
  }

  // Finally, the actual auth account - this is what makes the deletion real
  // instead of just orphaned rows for an account that can still log back in.
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[delete-account] Failed to delete auth user:", authError.message);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
