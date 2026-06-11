"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BORDER = "rgba(255,255,255,0.07)";

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
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", margin: 0 }}>글을 찾을 수 없어요</p>
        <button onClick={() => router.push("/board")} style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          ← 게시판으로
        </button>
      </div>
    );
  }

  const date = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* 헤더 */}
      <header style={{ height: 52, padding: "0 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: "rgba(13,13,24,0.97)", backdropFilter: "blur(10px)", zIndex: 20 }}>
        <button
          onClick={() => router.push("/board")}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          게시판
        </button>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.category}</span>
      </header>

      {/* 본문 */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 28px 100px" }}>
        {/* 카테고리 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "rgba(201,100,66,0.14)", border: "1px solid rgba(201,100,66,0.28)", color: ACCENT }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{date}</span>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.5, marginBottom: 28, letterSpacing: "-0.02em", wordBreak: "keep-all", margin: "0 0 28px" }}>
          {post.title}
        </h1>

        <div style={{ height: 1, background: BORDER, marginBottom: 32 }} />

        {/* 본문 */}
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.9, wordBreak: "keep-all", whiteSpace: "pre-wrap", margin: 0 }}>
          {post.content}
        </p>
      </div>
    </div>
  );
}
