import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "ijhan6403@gmail.com";

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: items } = await admin.from("cover_items").select("id").eq("session_id", sessionId);
  if (items && items.length > 0) {
    const itemIds = items.map((c: any) => c.id);
    const { data: iqs } = await admin.from("interview_questions").select("id").in("cover_item_id", itemIds);
    if (iqs && iqs.length > 0) {
      await admin.from("interview_answers").delete().in("interview_question_id", iqs.map((q: any) => q.id));
      await admin.from("interview_questions").delete().in("cover_item_id", itemIds);
    }
    await admin.from("messages").delete().in("cover_item_id", itemIds);
    await admin.from("revisions").delete().in("cover_item_id", itemIds);
    await admin.from("cover_items").delete().eq("session_id", sessionId);
  }
  await admin.from("admin_reviews").delete().eq("session_id", sessionId);
  const { error } = await admin.from("sessions").delete().eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
