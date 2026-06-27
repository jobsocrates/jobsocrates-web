import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/reviewUtils";

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service);

  // 관리자 검증 (access token의 이메일 확인)
  const { data: userData, error: authErr } = await admin.auth.getUser(body.accessToken);
  if (authErr || !userData?.user || userData.user.email !== ADMIN_EMAIL) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  switch (body.action) {
    case "listAll": {
      const { data } = await admin.from("reviews").select("*").order("created_at", { ascending: false });
      return Response.json({ reviews: data || [] });
    }
    case "approve": {
      const { error } = await admin.from("reviews").update({ status: "approved" }).eq("id", body.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }
    case "delete": {
      const { error } = await admin.from("reviews").delete().eq("id", body.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }
    case "seed": {
      const { error } = await admin.from("reviews").insert({
        email: body.email || null,
        type: "digging",
        content: body.content,
        job_title: body.job_title || null,
        status: "approved",
      });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }
    case "seedPhoto": {
      const { error } = await admin.from("reviews").insert({
        email: body.email || null,
        type: "photo",
        photo_url: body.photo_url,
        job_title: body.job_title || null,
        status: "approved",
      });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }
    default:
      return Response.json({ error: "알 수 없는 요청" }, { status: 400 });
  }
}
