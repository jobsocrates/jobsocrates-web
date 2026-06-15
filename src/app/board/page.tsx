"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BORDER = "rgba(255,255,255,0.07)";
const ADMIN_EMAIL = "ijhan6403@gmail.com";
const Q_CAT = "쥔장에게 묻고 바란다";

type CatNode = { type: "sep" } | { type: "item"; name: string; children?: string[] };

const DEFAULT_CATS: CatNode[] = [
  { type: "item", name: "공지·업데이트" },
  { type: "sep" },
  { type: "item", name: "쥔장 잡담" },
  { type: "item", name: "자소서 팁" },
  { type: "item", name: "면접 팁" },
  { type: "item", name: "뉴스", children: ["경제", "기술", "사회", "글로벌"] },
  { type: "item", name: Q_CAT },
];

interface Post {
  id: string;
  title: string;
  category: string;
  created_at: string;
  is_pinned: boolean;
  nickname?: string | null;
  admin_reply?: string | null;
}

function filterPosts(posts: Post[], cat: string, cats: CatNode[]) {
  if (cat === "전체") return posts;
  const node = cats.find(c => c.type === "item" && (c as Extract<CatNode, { type: "item" }>).name === cat) as Extract<CatNode, { type: "item" }> | undefined;
  if (node?.children?.length) {
    return posts.filter(p => [node.name, ...node.children!].includes(p.category));
  }
  // 하위 탭일 경우 상위 카테고리 글도 포함
  const parent = cats.find(c => c.type === "item" && (c as Extract<CatNode, { type: "item" }>).children?.includes(cat)) as Extract<CatNode, { type: "item" }> | undefined;
  if (parent) {
    return posts.filter(p => p.category === cat || p.category === parent.name);
  }
  return posts.filter(p => p.category === cat);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit",
  }).replace(/\.\s*/g, ".").replace(/\.$/, "");
}

async function hashPw(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function BoardPageWrapper() {
  return <Suspense><BoardPage /></Suspense>;
}

function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState(() => searchParams.get("cat") || "전체");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cats, setCats] = useState<CatNode[]>(DEFAULT_CATS);
  const [editMode, setEditMode] = useState(false);
  const [editTree, setEditTree] = useState<CatNode[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newChildName, setNewChildName] = useState<Record<string, string>>({});
  const [catSaving, setCatSaving] = useState(false);

  // 글쓰기 모달
  const [writeOpen, setWriteOpen] = useState(false);
  const [wNick, setWNick] = useState("");
  const [wPw, setWPw] = useState("");
  const [wTitle, setWTitle] = useState("");
  const [wContent, setWContent] = useState("");
  const [wErrors, setWErrors] = useState<Record<string, string>>({});
  const [wLoading, setWLoading] = useState(false);

  // 비밀번호 확인 + 내용 보기 모달
  const [pwPost, setPwPost] = useState<Post | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [viewData, setViewData] = useState<{ content: string; admin_reply: string | null } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  useEffect(() => {
    supabase.from("page_views").insert({ path: "/board" });
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
          .select("id, title, category, created_at, is_pinned, nickname, admin_reply")
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        setPosts(data || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function submitWrite() {
    const errs: Record<string, string> = {};
    if (!wNick.trim()) errs.nick = "닉네임을 입력해주세요";
    if (!wPw.trim()) errs.pw = "비밀번호를 입력해주세요";
    if (!wTitle.trim()) errs.title = "제목을 입력해주세요";
    if (!wContent.trim()) errs.content = "내용을 입력해주세요";
    if (Object.keys(errs).length) { setWErrors(errs); return; }
    setWLoading(true);
    const hash = await hashPw(wPw.trim());
    const { data, error } = await supabase.from("posts").insert({
      title: wTitle.trim(),
      content: wContent.trim(),
      category: Q_CAT,
      is_published: true,
      nickname: wNick.trim(),
      password_hash: hash,
    }).select("id, title, category, created_at, is_pinned, nickname, admin_reply").single();
    setWLoading(false);
    if (error) { setWErrors({ content: "저장에 실패했어요. 다시 시도해주세요." }); return; }
    setPosts(prev => [data as Post, ...prev]);
    setWriteOpen(false);
    setWNick(""); setWPw(""); setWTitle(""); setWContent(""); setWErrors({});
  }

  async function verifyPw() {
    if (!pwInput.trim()) { setPwError("비밀번호를 입력해주세요"); return; }
    setPwLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("content, password_hash, admin_reply")
      .eq("id", pwPost!.id)
      .single();
    if (error || !data) { setPwLoading(false); setPwError("글을 불러오지 못했습니다"); return; }
    const hash = await hashPw(pwInput.trim());
    if (hash !== (data as { password_hash: string }).password_hash) {
      setPwLoading(false); setPwError("비밀번호가 틀렸어요"); return;
    }
    setPwLoading(false);
    setViewData({ content: data.content, admin_reply: data.admin_reply });
  }

  async function openAdminView(post: Post) {
    const { data } = await supabase
      .from("posts")
      .select("content, admin_reply")
      .eq("id", post.id)
      .single();
    setPwPost(post);
    setViewData({ content: data?.content ?? "", admin_reply: data?.admin_reply ?? null });
    setReplyText(data?.admin_reply ?? "");
  }

  async function saveReply() {
    if (!pwPost) return;
    setReplySaving(true);
    const reply = replyText.trim() || null;
    await supabase.from("posts").update({ admin_reply: reply }).eq("id", pwPost.id);
    setViewData(v => v ? { ...v, admin_reply: reply } : v);
    setPosts(prev => prev.map(p => p.id === pwPost.id ? { ...p, admin_reply: reply } : p));
    setReplySaving(false);
  }

  function closePwModal() {
    setPwPost(null); setPwInput(""); setPwError(""); setPwLoading(false);
    setViewData(null); setReplyText("");
  }

  function handlePostClick(post: Post) {
    if (post.category !== Q_CAT) { router.push(`/board/${post.id}?from=${encodeURIComponent(category)}`); return; }
    if (isAdmin) { openAdminView(post); return; }
    setPwPost(post); setPwInput(""); setPwError(""); setViewData(null);
  }

  function startEdit() {
    setEditTree(cats.map(c =>
      c.type === "sep" ? { type: "sep" as const } : { ...c, children: c.children ? [...c.children] : undefined }
    ));
    setEditMode(true);
  }

  function cancelEdit() { setEditMode(false); setNewCatName(""); setNewChildName({}); }

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

  function deleteItem(idx: number) { setEditTree(editTree.filter((_, i) => i !== idx)); }

  function addItem() {
    const name = newCatName.trim();
    if (!name) return;
    setEditTree([...editTree, { type: "item", name }]);
    setNewCatName("");
  }

  function addSep() { setEditTree([...editTree, { type: "sep" }]); }

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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input:focus,textarea:focus{outline:none}`}</style>

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
              <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
                <button
                  onClick={saveEdit}
                  disabled={catSaving}
                  style={{ width: "100%", padding: "8px 0", background: ACCENT, border: "none", borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 700, cursor: catSaving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: catSaving ? 0.7 : 1 }}
                >
                  {catSaving ? "저장 중..." : "저장하기"}
                </button>
              </div>
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
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addItem()}
                    placeholder="카테고리 이름 입력"
                    style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 7, color: "rgba(255,255,255,0.82)", fontSize: 13, padding: "7px 10px", fontFamily: "inherit", minWidth: 0 }}
                  />
                  <button onClick={addItem} style={{ background: ACCENT + "33", border: `1px solid ${ACCENT}55`, borderRadius: 7, color: ACCENT, fontSize: 18, cursor: "pointer", padding: "0 12px", fontFamily: "inherit", fontWeight: 700, lineHeight: 1 }}>+</button>
                </div>
                <button onClick={addSep} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 7, color: "rgba(255,255,255,0.28)", fontSize: 12, padding: "7px 0", cursor: "pointer", fontFamily: "inherit" }}>
                  ── 구분선 추가
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* 본문 */}
        <main style={{ flex: 1, minWidth: 0, padding: "32px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{category}</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }}>총 {filtered.length}개</span>
            {category === Q_CAT && !isAdmin && (
              <button
                onClick={() => setWriteOpen(true)}
                style={{ marginLeft: "auto", padding: "8px 18px", background: ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                ✏️ 글쓰기
              </button>
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 96px", padding: "8px 12px", marginBottom: 2 }}>
              {["번호", "제목", "카테고리", "날짜"].map(h => (
                <span key={h} style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{h}</span>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", color: "rgba(255,255,255,0.2)", fontSize: 16 }}>
              {category === Q_CAT ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <span>아직 글이 없어요</span>
                  {!isAdmin && (
                    <button
                      onClick={() => setWriteOpen(true)}
                      style={{ padding: "10px 24px", background: ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      첫 글 남기기
                    </button>
                  )}
                </div>
              ) : "아직 글이 없어요"}
            </div>
          ) : (
            filtered.map((post, i) => {
              const isQ = post.category === Q_CAT;
              const hasReply = isQ && !!post.admin_reply;
              return (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 96px", padding: "16px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer", borderRadius: 6, transition: "background 0.1s", alignItems: "center", background: post.is_pinned ? "rgba(255,200,0,0.04)" : "transparent", borderLeft: post.is_pinned ? "2px solid rgba(255,200,0,0.35)" : "2px solid transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = post.is_pinned ? "rgba(255,200,0,0.07)" : "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = post.is_pinned ? "rgba(255,200,0,0.04)" : "transparent")}
                >
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.22)", textAlign: "center" }}>
                    {isQ ? "🔒" : filtered.length - i}
                  </span>
                  <span style={{ fontSize: 16, color: post.is_pinned ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.88)", fontWeight: post.is_pinned ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 20, display: "flex", alignItems: "center", gap: 6 }}>
                    {post.is_pinned && <span style={{ fontSize: 13, flexShrink: 0 }}>📌</span>}
                    {post.title || "(제목 없음)"}
                    {isQ && post.nickname && (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 400, flexShrink: 0 }}>· {post.nickname}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)" }}>
                    {isQ ? (
                      hasReply
                        ? <span style={{ padding: "2px 8px", background: "rgba(100,200,100,0.15)", border: "1px solid rgba(100,200,100,0.3)", borderRadius: 4, color: "rgba(120,220,120,0.9)", fontSize: 12 }}>답변완료</span>
                        : <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 4, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>답변대기</span>
                    ) : post.category}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.32)" }}>{fmt(post.created_at)}</span>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* ── 글쓰기 모달 ── */}
      {writeOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setWriteOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "#13131F", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>쥔장에게 묻고 바란다</span>
              <button onClick={() => setWriteOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <Field label="닉네임" required error={wErrors.nick} hint="본인이 알아볼 수 있는 이름 (예: 취준생A)">
              <input
                value={wNick}
                onChange={e => { setWNick(e.target.value); setWErrors(p => ({ ...p, nick: "" })); }}
                placeholder="닉네임 입력"
                style={inputStyle(!!wErrors.nick)}
              />
            </Field>

            <Field label="비밀번호" required error={wErrors.pw} hint="내 글을 다시 확인할 때 필요해요. 꼭 기억해주세요!">
              <input
                type="password"
                value={wPw}
                onChange={e => { setWPw(e.target.value); setWErrors(p => ({ ...p, pw: "" })); }}
                placeholder="비밀번호 설정"
                style={inputStyle(!!wErrors.pw)}
              />
            </Field>

            <Field label="제목" required error={wErrors.title}>
              <input
                value={wTitle}
                onChange={e => { setWTitle(e.target.value); setWErrors(p => ({ ...p, title: "" })); }}
                placeholder="제목을 입력해주세요"
                style={inputStyle(!!wErrors.title)}
              />
            </Field>

            <Field label="내용" required error={wErrors.content}>
              <textarea
                value={wContent}
                onChange={e => { setWContent(e.target.value); setWErrors(p => ({ ...p, content: "" })); }}
                placeholder="궁금한 점이나 건의사항을 자유롭게 남겨주세요"
                rows={6}
                style={{ ...inputStyle(!!wErrors.content), resize: "vertical", lineHeight: 1.7 }}
              />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setWriteOpen(false)}
                style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                취소
              </button>
              <button
                onClick={submitWrite}
                disabled={wLoading}
                style={{ flex: 2, padding: "12px 0", background: wLoading ? "rgba(201,100,66,0.5)" : ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, cursor: wLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {wLoading ? "제출 중..." : "제출하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 비밀번호 확인 + 내용 보기 모달 ── */}
      {pwPost && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closePwModal(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "#13131F", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.4 }}>{pwPost.title}</p>
                {pwPost.nickname && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{pwPost.nickname} · {fmt(pwPost.created_at)}</p>
                )}
              </div>
              <button onClick={closePwModal} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
            </div>

            {!viewData ? (
              /* 비밀번호 입력 */
              <div>
                <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
                <p style={{ margin: "0 0 14px", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>🔒 비밀번호를 입력하면 내용을 볼 수 있어요</p>
                <input
                  type="password"
                  value={pwInput}
                  onChange={e => { setPwInput(e.target.value); setPwError(""); }}
                  onKeyDown={e => e.key === "Enter" && verifyPw()}
                  placeholder="비밀번호"
                  autoFocus
                  style={inputStyle(!!pwError)}
                />
                {pwError && <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,100,100,0.9)" }}>{pwError}</p>}
                <button
                  onClick={verifyPw}
                  disabled={pwLoading}
                  style={{ width: "100%", marginTop: 16, padding: "12px 0", background: pwLoading ? "rgba(201,100,66,0.5)" : ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, cursor: pwLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  {pwLoading ? "확인 중..." : "확인"}
                </button>
              </div>
            ) : (
              /* 내용 보기 */
              <div>
                <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
                <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                  {viewData.content}
                </p>

                {/* 답변 영역 */}
                <div style={{ marginTop: 28, padding: 20, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>쥔장 답변</p>
                  {isAdmin ? (
                    <div>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="답변을 입력하세요"
                        rows={4}
                        style={{ ...inputStyle(false), resize: "vertical", lineHeight: 1.7 }}
                      />
                      <button
                        onClick={saveReply}
                        disabled={replySaving}
                        style={{ marginTop: 10, padding: "10px 20px", background: replySaving ? "rgba(201,100,66,0.5)" : ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: replySaving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                      >
                        {replySaving ? "저장 중..." : "답변 저장"}
                      </button>
                    </div>
                  ) : viewData.admin_reply ? (
                    <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                      {viewData.admin_reply}
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.25)" }}>아직 답변이 없어요. 쥔장이 곧 답변할게요!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasError ? "rgba(255,80,80,0.6)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 8,
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    padding: "11px 14px",
    fontFamily: `"Pretendard Variable", Pretendard, sans-serif`,
    transition: "border-color 0.15s",
  };
}

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>
        {label} {required && <span style={{ color: ACCENT }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>{hint}</p>}
      {error && <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,100,100,0.9)" }}>{error}</p>}
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
