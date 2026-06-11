import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "ijhan6403@gmail.com";

async function getAdminClient(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) return null;

  const token = req.headers.get("authorization")?.slice(7);
  if (!token) return null;

  const anon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user || user.email !== ADMIN_EMAIL) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const admin = await getAdminClient(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("admin_reviews")
    .select("id, session_id, rating, comment");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminClient(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { session_id, rating, comment } = await req.json();
  if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const { data, error } = await admin
    .from("admin_reviews")
    .upsert(
      { session_id, rating, comment, updated_at: new Date().toISOString() },
      { onConflict: "session_id" }
    )
    .select("id, session_id, rating, comment")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
