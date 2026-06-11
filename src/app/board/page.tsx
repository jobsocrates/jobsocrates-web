"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const CATEGORIES = ["전체", "자소서팁", "뉴스", "시사", "경제", "사회이슈"];

interface Post {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function BoardPage() {
  const router = useRouter();
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
          .select("id, title, category, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        setPosts(data || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const filtered = category === "전체" ? posts : posts.filter((p) => p.category === category);
  const counts = Object.fromEntries(
    CATEGORIES.map((cat) => [cat, cat === "전체" ? posts.length : posts.filter((p) => p.category === cat).length])
  );

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

      {/* 헤더 */}
      <header style={{ height: 56, padding: "0 28px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "rgba(13,13,24,0.96)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          홈
        </a>
        <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>게시판</span>
      </header>

      {/* 2컬럼 레이아웃 */}
      <div style={{ display: "flex", maxWidth: 1040, margin: "0 auto", minHeight: "calc(100vh - 56px)" }}>

        {/* 좌측 카테고리 사이드바 */}
        <aside style={{ width: 220, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "32px 0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 22px", marginBottom: 10 }}>
            카테고리
          </p>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 22px",
                background: category === cat ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none",
                borderLeft: `2px solid ${category === cat ? ACCENT : "transparent"}`,
                color: category === cat ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
                fontSize: 14,
                fontWeight: category === cat ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              <span>{cat}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{counts[cat]}</span>
            </button>
          ))}
        </aside>

        {/* 우측 글 목록 */}
        <main style={{ flex: 1, padding: "32px 36px" }}>
          {/* 상단 타이틀 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{category}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>총 {filtered.length}개</p>
          </div>

          {/* 글 목록 */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.22)", fontSize: 15 }}>
              아직 글이 없어요
            </div>
          ) : (
            filtered.map((post, i) => (
              <div
                key={post.id}
                onClick={() => router.push(`/board/${post.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "15px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  borderRadius: 6,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", width: 28, textAlign: "right", flexShrink: 0 }}>
                  {filtered.length - i}
                </span>
                {category === "전체" && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(201,100,66,0.12)", border: "1px solid rgba(201,100,66,0.25)", color: ACCENT, flexShrink: 0, whiteSpace: "nowrap" }}>
                    {post.category}
                  </span>
                )}
                <span style={{ flex: 1, fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title || "(제목 없음)"}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>
                  {fmt(post.created_at)}
                </span>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
