"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BORDER = "rgba(255,255,255,0.07)";
const NEWS_CHILDREN = ["경제", "기술", "시사"];

interface CategoryNode { name: string; children?: string[] }
const CATEGORY_TREE: CategoryNode[] = [
  { name: "공지·업데이트" },
  { name: "──" },
  { name: "쥔장 잡담" },
  { name: "자소서 팁" },
  { name: "면접 팁" },
  { name: "뉴스", children: NEWS_CHILDREN },
  { name: "쥔장에게 묻고 바란다" },
];

interface Post { id: string; title: string; category: string; created_at: string; is_pinned: boolean }

function filterPosts(posts: Post[], cat: string) {
  if (cat === "전체") return posts;
  if (cat === "뉴스") return posts.filter(p => ["뉴스", ...NEWS_CHILDREN].includes(p.category));
  return posts.filter(p => p.category === cat);
}

function countFor(posts: Post[], cat: string) {
  if (cat === "전체") return posts.length;
  if (cat === "뉴스") return posts.filter(p => ["뉴스", ...NEWS_CHILDREN].includes(p.category)).length;
  return posts.filter(p => p.category === cat).length;
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
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      const [{ data: config }, { data: { user } }] = await Promise.all([
        supabase.from("site_config").select("value").eq("key", "board_visible").single(),
        supabase.auth.getUser(),
      ]);
      const isAdmin = user?.email === "ijhan6403@gmail.com";
      const show = config?.value === true || isAdmin;
      setVisible(show);
      if (show) {
        const { data } = await supabase
          .from("posts")
          .select("id, title, category, created_at, is_pinned")
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        setPosts(data || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const filtered = filterPosts(posts, category);

  if (loading) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!visible) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <p style={{ fontSize: 32 }}>🔧</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>준비 중이에요</p>
      <a href="/" style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginTop: 8 }}>← 홈으로</a>
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif`, display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* 헤더 */}
      <header style={{ height: 54, padding: "0 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: "rgba(13,13,24,0.97)", backdropFilter: "blur(10px)", zIndex: 20, flexShrink: 0 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          홈
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>게시판</span>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* 사이드바 */}
        <aside style={{ width: 192, flexShrink: 0, borderRight: `1px solid ${BORDER}`, paddingTop: 28, position: "sticky", top: 54, height: "calc(100vh - 54px)", overflowY: "auto" }}>
          <SideItem label="전체" count={countFor(posts, "전체")} active={category === "전체"} onClick={() => setCategory("전체")} />
          <div style={{ height: 1, background: BORDER, margin: "10px 14px" }} />
          {CATEGORY_TREE.map(node =>
            node.name === "──"
              ? <div key="sep2" style={{ height: 1, background: BORDER, margin: "10px 14px" }} />
              : (
                <div key={node.name}>
                  <SideItem label={node.name} count={countFor(posts, node.name)} active={category === node.name} onClick={() => setCategory(node.name)} />
                  {node.children?.map(child => (
                    <SideChild key={child} label={child} count={countFor(posts, child)} active={category === child} onClick={() => setCategory(child)} />
                  ))}
                </div>
              )
          )}
        </aside>

        {/* 본문 */}
        <main style={{ flex: 1, minWidth: 0, padding: "32px 40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{category}</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }}>총 {filtered.length}개</span>
          </div>

          {/* 컬럼 헤더 */}
          {filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 96px", padding: "8px 12px", marginBottom: 2 }}>
              {["번호", "제목", "카테고리", "날짜"].map(h => (
                <span key={h} style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{h}</span>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", color: "rgba(255,255,255,0.2)", fontSize: 16 }}>아직 글이 없어요</div>
          ) : (
            filtered.map((post, i) => (
              <div
                key={post.id}
                onClick={() => router.push(`/board/${post.id}`)}
                style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 96px", padding: "16px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer", borderRadius: 6, transition: "background 0.1s", alignItems: "center", background: post.is_pinned ? "rgba(255,200,0,0.04)" : "transparent", borderLeft: post.is_pinned ? "2px solid rgba(255,200,0,0.35)" : "2px solid transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = post.is_pinned ? "rgba(255,200,0,0.07)" : "rgba(255,255,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = post.is_pinned ? "rgba(255,200,0,0.04)" : "transparent")}
              >
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.22)", textAlign: "center" }}>{filtered.length - i}</span>
                <span style={{ fontSize: 16, color: post.is_pinned ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.88)", fontWeight: post.is_pinned ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  {post.is_pinned && <span style={{ fontSize: 13, flexShrink: 0 }}>📌</span>}
                  {post.title || "(제목 없음)"}
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.42)" }}>{post.category}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.32)" }}>{fmt(post.created_at)}</span>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function SideItem({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 14px", background: active ? "rgba(255,255,255,0.06)" : "transparent",
      border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`,
      color: active ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.48)",
      fontSize: label === "쥔장에게 묻고 바란다" ? 13 : 15,
      fontWeight: active ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      <span>{label}</span>
      {count > 0 && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginLeft: 6 }}>{count}</span>}
    </button>
  );
}

function SideChild({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 14px 11px 28px", background: active ? "rgba(255,255,255,0.05)" : "transparent",
      border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`,
      color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)",
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      <span>{label}</span>
      {count > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginLeft: 6 }}>{count}</span>}
    </button>
  );
}
