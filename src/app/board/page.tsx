"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BORDER = "rgba(255,255,255,0.07)";

const CATEGORIES = [
  "쥔장 잡담",
  "자소서 팁",
  "면접 팁",
  "공지·업데이트",
  "뉴스",
  "경제",
  "기술",
  "시사",
  "쥔장에게 묻고 바란다",
];

interface Post {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

function fmt(d: string) {
  const dt = new Date(d);
  return `${String(dt.getFullYear()).slice(2)}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
}

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [boardVisible, setBoardVisible] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      const [{ data: config }, { data: { user } }] = await Promise.all([
        supabase.from("site_config").select("value").eq("key", "board_visible").single(),
        supabase.auth.getUser(),
      ]);
      const isAdmin = user?.email === "ijhan6403@gmail.com";
      const visible = config?.value === true || isAdmin;
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

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!boardVisible) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
        <p style={{ fontSize: 30 }}>🔧</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>준비 중이에요</p>
        <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginTop: 8 }}>← 홈으로</a>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif`, display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* 헤더 */}
      <header style={{ height: 52, padding: "0 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: "rgba(13,13,24,0.97)", backdropFilter: "blur(10px)", zIndex: 20, flexShrink: 0 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          홈
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>게시판</span>
      </header>

      {/* 2컬럼 레이아웃 */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* 좌측 사이드바 */}
        <aside style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${BORDER}`, paddingTop: 24, position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto" }}>
          <SidebarItem label="전체" count={posts.length} active={category === "전체"} onClick={() => setCategory("전체")} />
          <div style={{ height: 1, background: BORDER, margin: "8px 16px" }} />
          {CATEGORIES.map((cat) => (
            <SidebarItem
              key={cat}
              label={cat}
              count={posts.filter((p) => p.category === cat).length}
              active={category === cat}
              onClick={() => setCategory(cat)}
            />
          ))}
        </aside>

        {/* 우측 글 목록 */}
        <main style={{ flex: 1, minWidth: 0, padding: "28px 36px" }}>
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: `1px solid ${BORDER}`, marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{category}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>총 {filtered.length}개</span>
          </div>

          {/* 컬럼 헤더 */}
          {filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 110px 84px", padding: "7px 10px", marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>번호</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>제목</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>카테고리</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600 }}>날짜</span>
            </div>
          )}

          {/* 글 목록 */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
              아직 글이 없어요
            </div>
          ) : (
            filtered.map((post, i) => (
              <div
                key={post.id}
                onClick={() => router.push(`/board/${post.id}`)}
                style={{ display: "grid", gridTemplateColumns: "44px 1fr 110px 84px", padding: "13px 10px", borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer", borderRadius: 6, transition: "background 0.1s", alignItems: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>{filtered.length - i}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>
                  {post.title || "(제목 없음)"}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{post.category}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>{fmt(post.created_at)}</span>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px", background: active ? "rgba(255,255,255,0.06)" : "transparent",
        border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`,
        color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)",
        fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.12s",
      }}
    >
      <span>{label}</span>
      {count > 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{count}</span>}
    </button>
  );
}
