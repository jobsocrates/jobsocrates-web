"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BORDER = "rgba(255,255,255,0.07)";
const ADMIN_EMAIL = "ijhan6403@gmail.com";

export type CatNode = { type: "sep" } | { type: "item"; name: string; children?: string[] };

export const DEFAULT_CATS: CatNode[] = [
  { type: "item", name: "공지·업데이트" },
  { type: "sep" },
  { type: "item", name: "쥔장 잡담" },
  { type: "item", name: "자소서 팁" },
  { type: "item", name: "면접 팁" },
  { type: "item", name: "뉴스", children: ["경제", "기술", "사회", "글로벌"] },
  { type: "item", name: "쥔장에게 묻고 바란다" },
];

interface Post { id: string; title: string; category: string; created_at: string; is_pinned: boolean }

function filterPosts(posts: Post[], cat: string, cats: CatNode[]) {
  if (cat === "전체") return posts;
  const node = cats.find(c => c.type === "item" && (c as Extract<CatNode, { type: "item" }>).name === cat) as Extract<CatNode, { type: "item" }> | undefined;
  if (node?.children?.length) {
    return posts.filter(p => [node.name, ...node.children!].includes(p.category));
  }
  return posts.filter(p => p.category === cat);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit",
  }).replace(/\.\s*/g, ".").replace(/\.$/, "");
}

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [cats, setCats] = useState<CatNode[]>(DEFAULT_CATS);
  const [editMode, setEditMode] = useState(false);
  const [editTree, setEditTree] = useState<CatNode[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newChildName, setNewChildName] = useState<Record<string, string>>({});
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const [{ data: config }, { data: catConfig }, { data: authData }] = await Promise.all([
        supabase.from("site_config").select("value").eq("key", "board_visible").single(),
        supabase.from("site_config").select("value").eq("key", "board_categories").single(),
        supabase.auth.getUser(),
      ]);
      const admin = authData.user?.email === ADMIN_EMAIL;
      setIsAdmin(admin);
      const show = config?.value === true || admin;
      setVisible(show);
      if (catConfig?.value) setCats(catConfig.value as CatNode[]);
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

  function startEdit() {
    setEditTree(cats.map(c =>
      c.type === "sep" ? { type: "sep" as const } : { ...c, children: c.children ? [...c.children] : undefined }
    ));
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setNewCatName("");
    setNewChildName({});
  }

  async function saveEdit() {
    setCatSaving(true);
    await supabase.from("site_config").upsert({ key: "board_categories", value: editTree });
    setCats(editTree);
    setEditMode(false);
    setNewCatName("");
    setNewChildName({});
    setCatSaving(false);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const t = [...editTree];
    const to = idx + dir;
    if (to < 0 || to >= t.length) return;
    [t[idx], t[to]] = [t[to], t[idx]];
    setEditTree(t);
  }

  function deleteItem(idx: number) {
    setEditTree(editTree.filter((_, i) => i !== idx));
  }

  function addItem() {
    const name = newCatName.trim();
    if (!name) return;
    setEditTree([...editTree, { type: "item", name }]);
    setNewCatName("");
  }

  function addSep() {
    setEditTree([...editTree, { type: "sep" }]);
  }

  function deleteChild(parentIdx: number, child: string) {
    const t = [...editTree];
    const node = t[parentIdx];
    if (node.type !== "item") return;
    t[parentIdx] = { ...node, children: node.children?.filter(c => c !== child) };
    setEditTree(t);
  }

  function addChild(parentIdx: number, parentName: string) {
    const name = (newChildName[parentName] || "").trim();
    if (!name) return;
    const t = [...editTree];
    const node = t[parentIdx];
    if (node.type !== "item") return;
    t[parentIdx] = { ...node, children: [...(node.children || []), name] };
    setEditTree(t);
    setNewChildName(prev => ({ ...prev, [parentName]: "" }));
  }

  const filtered = filterPosts(posts, category, cats);

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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input:focus{outline:none}`}</style>

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
        <aside style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${BORDER}`, position: "sticky", top: 54, height: "calc(100vh - 54px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* 카테고리 헤더 */}
          <div style={{ padding: "20px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>CATEGORY</span>
            {isAdmin && (
              <button
                onClick={editMode ? cancelEdit : startEdit}
                style={{ background: "none", border: `1px solid ${editMode ? "rgba(255,90,90,0.35)" : BORDER}`, cursor: "pointer", color: editMode ? "rgba(255,90,90,0.7)" : "rgba(255,255,255,0.3)", fontSize: 11, padding: "3px 8px", borderRadius: 5, fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = editMode ? "rgba(255,90,90,0.7)" : ACCENT; e.currentTarget.style.color = editMode ? "rgba(255,90,90,1)" : ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = editMode ? "rgba(255,90,90,0.35)" : BORDER; e.currentTarget.style.color = editMode ? "rgba(255,90,90,0.7)" : "rgba(255,255,255,0.3)"; }}
              >
                {editMode ? "취소" : "편집"}
              </button>
            )}
          </div>

          {!editMode ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <SideItem label="전체" count={posts.length} active={category === "전체"} onClick={() => setCategory("전체")} />
              <div style={{ height: 1, background: BORDER, margin: "4px 16px" }} />
              {cats.map((node, i) =>
                node.type === "sep"
                  ? <div key={`sep-${i}`} style={{ height: 1, background: BORDER, margin: "4px 16px" }} />
                  : (
                    <div key={node.name}>
                      <SideItem
                        label={node.name}
                        count={filterPosts(posts, node.name, cats).length}
                        active={category === node.name}
                        onClick={() => setCategory(node.name)}
                      />
                      {node.children?.map(child => (
                        <SideChild
                          key={child}
                          label={child}
                          count={posts.filter(p => p.category === child).length}
                          active={category === child}
                          onClick={() => setCategory(child)}
                        />
                      ))}
                    </div>
                  )
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* 저장 버튼 */}
              <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
                <button
                  onClick={saveEdit}
                  disabled={catSaving}
                  style={{ width: "100%", padding: "8px 0", background: ACCENT, border: "none", borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 700, cursor: catSaving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: catSaving ? 0.7 : 1 }}
                >
                  {catSaving ? "저장 중..." : "저장하기"}
                </button>
              </div>

              {/* 편집 목록 */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {editTree.map((node, idx) =>
                  node.type === "sep" ? (
                    <div key={`sep-${idx}`} style={{ display: "flex", alignItems: "center", padding: "6px 16px", gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>구분선</span>
                      <button onClick={() => deleteItem(idx)} style={{ background: "none", border: "none", color: "rgba(255,80,80,0.5)", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ) : (
                    <div key={`item-${node.name}-${idx}`} style={{ marginBottom: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", padding: "7px 8px 7px 16px", gap: 3 }}>
                        <span style={{ flex: 1, fontSize: 14, color: "rgba(255,255,255,0.78)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
                        <button onClick={() => moveItem(idx, -1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 10, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>▲</button>
                        <button onClick={() => moveItem(idx, 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 10, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>▼</button>
                        <button onClick={() => deleteItem(idx)} style={{ background: "none", border: "none", color: "rgba(255,80,80,0.5)", fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
                      </div>
                      {node.children !== undefined && (
                        <div style={{ paddingLeft: 16 }}>
                          {node.children.map(child => (
                            <div key={child} style={{ display: "flex", alignItems: "center", padding: "4px 8px 4px 14px", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>└</span>
                              <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{child}</span>
                              <button onClick={() => deleteChild(idx, child)} style={{ background: "none", border: "none", color: "rgba(255,80,80,0.4)", fontSize: 14, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: 4, padding: "4px 8px 6px 14px" }}>
                            <input
                              value={newChildName[node.name] || ""}
                              onChange={e => setNewChildName(prev => ({ ...prev, [node.name]: e.target.value }))}
                              onKeyDown={e => e.key === "Enter" && addChild(idx, node.name)}
                              placeholder="하위 추가"
                              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 5, color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "4px 8px", fontFamily: "inherit", minWidth: 0 }}
                            />
                            <button onClick={() => addChild(idx, node.name)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 5, color: "rgba(255,255,255,0.45)", fontSize: 14, cursor: "pointer", padding: "0 8px" }}>+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* 새 카테고리 추가 */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addItem()}
                    placeholder="카테고리 이름 입력"
                    style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 7, color: "rgba(255,255,255,0.82)", fontSize: 13, padding: "7px 10px", fontFamily: "inherit", minWidth: 0 }}
                  />
                  <button
                    onClick={addItem}
                    style={{ background: ACCENT + "33", border: `1px solid ${ACCENT}55`, borderRadius: 7, color: ACCENT, fontSize: 18, cursor: "pointer", padding: "0 12px", fontFamily: "inherit", fontWeight: 700, lineHeight: 1 }}
                  >+</button>
                </div>
                <button
                  onClick={addSep}
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 7, color: "rgba(255,255,255,0.28)", fontSize: 12, padding: "7px 0", cursor: "pointer", fontFamily: "inherit" }}
                >
                  ── 구분선 추가
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* 본문 */}
        <main style={{ flex: 1, minWidth: 0, padding: "32px 40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{category}</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }}>총 {filtered.length}개</span>
          </div>

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
      padding: "10px 16px", background: active ? "rgba(255,255,255,0.06)" : "transparent",
      border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`,
      color: active ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.48)",
      fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      <span>{label}</span>
      {count > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginLeft: 6 }}>{count}</span>}
    </button>
  );
}

function SideChild({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 16px 9px 30px", background: active ? "rgba(255,255,255,0.05)" : "transparent",
      border: "none", borderLeft: `3px solid ${active ? ACCENT : "transparent"}`,
      color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      <span>{label}</span>
      {count > 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginLeft: 6 }}>{count}</span>}
    </button>
  );
}
