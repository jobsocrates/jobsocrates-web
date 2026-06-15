import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { title, content, nickname, password_hash } = body;

  if (!title?.trim() || !content?.trim() || !nickname?.trim() || !password_hash) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("posts")
    .insert({
      title: title.trim(),
      content: content.trim(),
      category: "Q&A",
      is_published: true,
      nickname: nickname.trim(),
      password_hash,
    })
    .select("id, title, category, created_at, is_pinned, nickname, admin_reply")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
