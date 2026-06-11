"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";

const CATEGORIES = ["전체", "자소서팁", "뉴스", "시사", "경제", "사회이슈"];

interface Post {
  id: string;
  content: string;
  job_title: string;
  category: string;
  created_at: string;
}

export default function BoardPage() {
  const [boardVisible, setBoardVisible] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: config } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "board_visible")
        .single();

      const visible = config?.value === true;
      setBoardVisible(visible);

      if (visible) {
        const { data } = await supabase
          .from("posts")
          .select("id, content, job_title, category, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        setPosts(data || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const filtered = category === "전체" ? posts : posts.filter((p) => p.category === category);

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(201,100,66,0.3)", borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!boardVisible) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
        <p style={{ fontSize: 36 }}>🔧</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: 0 }}>준비 중이에요</p>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: 0 }}>곧 오픈할게요</p>
        <a href="/" style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← 홈으로</a>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "36px 24px" }}>
        {/* 뒤로가기 */}
        <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 32 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          홈으로
        </a>

        {/* 타이틀 */}
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 8, letterSpacing: "-0.02em" }}>게시판</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.42)", marginBottom: 32, lineHeight: 1.6 }}>취업소크라테스가 모아온 이야기들</p>

        {/* 카테고리 탭 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "8px 18px",
                borderRadius: 24,
                fontSize: 14,
                fontWeight: category === cat ? 600 : 400,
                border: category === cat ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.09)",
                background: category === cat ? "rgba(255,255,255,0.1)" : "transparent",
                color: category === cat ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 0", color: "rgba(255,255,255,0.28)", fontSize: 15 }}>
            아직 글이 없어요
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((post) => (
              <article
                key={post.id}
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 18,
                  padding: "26px 28px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.35)",
                }}
              >
                {/* 메타 정보 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: "rgba(201,100,66,0.14)",
                    border: "1px solid rgba(201,100,66,0.28)",
                    color: ACCENT,
                  }}>
                    {post.category}
                  </span>
                  {post.job_title && (
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.32)" }}>{post.job_title}</span>
                  )}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", marginLeft: "auto" }}>
                    {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>

                {/* 본문 */}
                <p style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.88)",
                  lineHeight: 1.85,
                  wordBreak: "keep-all",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  fontWeight: 400,
                }}>
                  {post.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
