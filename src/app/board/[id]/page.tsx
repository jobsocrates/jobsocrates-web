"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, title, content, category, created_at")
      .eq("id", id)
      .eq("is_published", true)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(201,100,66,0.3)", borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0 }}>글을 찾을 수 없어요</p>
        <button onClick={() => router.push("/board")} style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          ← 게시판으로
        </button>
      </div>
    );
  }

  const date = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 헤더 */}
      <header style={{ height: 56, padding: "0 28px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "rgba(13,13,24,0.96)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <button
          onClick={() => router.push("/board")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          게시판
        </button>
      </header>

      {/* 본문 */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 28px 80px" }}>
        {/* 카테고리 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "rgba(201,100,66,0.14)", border: "1px solid rgba(201,100,66,0.28)", color: ACCENT }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{date}</span>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.45, marginBottom: 32, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {post.title}
        </h1>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 36 }} />

        {/* 본문 내용 */}
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.88)", lineHeight: 1.9, wordBreak: "keep-all", whiteSpace: "pre-wrap", margin: 0, fontWeight: 400 }}>
          {post.content}
        </p>
      </div>
    </div>
  );
}
