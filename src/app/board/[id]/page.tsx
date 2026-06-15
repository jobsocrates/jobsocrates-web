"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const BORDER = "rgba(255,255,255,0.07)";
const ADMIN_EMAIL = "ijhan6403@gmail.com";
const Q_CAT = "Q&A";
const NEWS_CATS = ["반도체", "자동차", "디스플레이", "IT", "식품/화장품", "제약/바이오", "공기업/금융", "경제", "기술", "사회", "글로벌", "뉴스"];

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  view_count: number;
}

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  nickname: string;
  content: string;
  created_at: string;
}

function fmt(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── 댓글 섹션 ──
function CommentSection({ postId, isAdmin }: { postId: string; isAdmin: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  useEffect(() => { fetchComments(); }, [postId]);

  useEffect(() => {
    if (replyTo && replyRef.current) replyRef.current.focus();
  }, [replyTo]);

  async function submitComment(content: string, parentId: string | null) {
    if (!content.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      parent_id: parentId,
      nickname: isAdmin ? "쥔장★" : "익명",
      content: content.trim(),
    });
    setSubmitting(false);
    if (parentId) { setReplyTo(null); setReplyInput(""); }
    else setInput("");
    fetchComments();
  }

  async function deleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    fetchComments();
  }

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div style={{ marginTop: 60 }}>
      <div style={{ height: 1, background: BORDER, marginBottom: 32 }} />
      <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        댓글 {comments.length}
      </p>

      {/* 댓글 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {topLevel.map(c => (
          <div key={c.id}>
            {/* 댓글 */}
            <div style={{ padding: "16px 0", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: c.nickname === "쥔장★" ? ACCENT : "rgba(255,255,255,0.6)",
                }}>
                  {c.nickname}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{fmt(c.created_at)}</span>
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  style={{ marginLeft: 4, fontSize: 12, color: "rgba(255,255,255,0.28)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                >
                  답글
                </button>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {c.content}
              </p>
            </div>

            {/* 대댓글 목록 */}
            {replies(c.id).map(r => (
              <div key={r.id} style={{ padding: "14px 0 14px 24px", borderBottom: `1px solid rgba(255,255,255,0.04)`, borderLeft: `2px solid rgba(255,255,255,0.07)`, marginLeft: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>↳</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: r.nickname === "쥔장★" ? ACCENT : "rgba(255,255,255,0.6)",
                  }}>
                    {r.nickname}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{fmt(r.created_at)}</span>
                </div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {r.content}
                </p>
              </div>
            ))}

            {/* 대댓글 입력 */}
            {replyTo === c.id && (
              <div style={{ padding: "12px 0 12px 16px", borderLeft: `2px solid ${ACCENT}44` }}>
                <textarea
                  ref={replyRef}
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(replyInput, c.id); } }}
                  placeholder="대댓글 작성... (Enter로 등록)"
                  rows={2}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "rgba(255,255,255,0.82)", resize: "none", fontFamily: "inherit", outline: "none" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={() => { setReplyTo(null); setReplyInput(""); }} style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button
                    onClick={() => submitComment(replyInput, c.id)}
                    disabled={submitting}
                    style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.6 : 1 }}
                  >
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", padding: "24px 0" }}>첫 댓글을 남겨보세요</p>
        )}
      </div>

      {/* 댓글 입력 */}
      <div style={{ marginTop: 28 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(input, null); } }}
          placeholder={isAdmin ? "쥔장★으로 댓글 작성... (Enter로 등록)" : "익명으로 댓글 작성... (Enter로 등록)"}
          rows={3}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "rgba(255,255,255,0.82)", resize: "none", fontFamily: "inherit", outline: "none" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={() => submitComment(input, null)}
            disabled={submitting || !input.trim()}
            style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: ACCENT, border: "none", borderRadius: 10, padding: "8px 22px", cursor: "pointer", fontFamily: "inherit", opacity: (submitting || !input.trim()) ? 0.5 : 1 }}
          >
            댓글 등록
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 뉴스 파싱 ──
function extractLink(block: string): string | null {
  const m = block.match(/🔗\s*원문[:：]?\s*(https?:\/\/\S+)/);
  return m ? m[1] : null;
}

function parseArticles(content: string) {
  return content.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);
}

function ArticleCard({ block }: { block: string }) {
  const link = extractLink(block);
  const lines = block.replace(/🔗\s*원문[:：]?\s*https?:\/\/\S+/g, "").split("\n");
  const elements: React.ReactNode[] = [];
  let bodyBuf: string[] = [];

  const flushBody = (key: string) => {
    const text = bodyBuf.join("\n").trim();
    if (text) elements.push(
      <p key={key} style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 2.15, whiteSpace: "pre-wrap", wordBreak: "keep-all", margin: 0 }}>
        {text}
      </p>
    );
    bodyBuf = [];
  };

  let titleSet = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { if (bodyBuf.length) bodyBuf.push(""); return; }
    if (trimmed.startsWith("📰")) {
      flushBody(`body-before-${i}`);
      titleSet = true;
      elements.push(
        <div key={`title-${i}`} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.55, wordBreak: "keep-all", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            {trimmed.replace(/^📰\s*/, "")}
          </h2>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: `${BLUE}18`, border: `1px solid ${BLUE}38`, color: BLUE, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              원문 보기
            </a>
          )}
        </div>
      );
      return;
    }
    if (trimmed.startsWith("📌")) return;
    const isSectionLabel = trimmed.startsWith("무슨 일이냐면") || trimmed.startsWith("🔍") || trimmed.startsWith("💬");
    if (isSectionLabel) {
      flushBody(`body-${i}`);
      elements.push(<p key={`label-${i}`} style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.07em", textTransform: "uppercase", margin: "28px 0 10px", opacity: 0.85 }}>{trimmed}</p>);
      return;
    }
    if (!titleSet) return;
    bodyBuf.push(line);
  });
  flushBody("body-end");

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "36px 40px", display: "flex", flexDirection: "column" }}>
      {elements}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "24px 0 0", lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
        📌 이 내용은 뉴스 크롤링을 기반으로 작성됐어요. 사실관계는 반드시 원문에서 확인해주세요.
      </p>
    </div>
  );
}

export default function PostPageWrapper() {
  return <Suspense><PostPage /></Suspense>;
}

function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCat = searchParams.get("from") || "";
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(data.session?.user?.email === ADMIN_EMAIL);
    });
    supabase
      .from("posts")
      .select("id, title, content, category, created_at, view_count")
      .eq("id", id)
      .eq("is_published", true)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
        if (data) supabase.rpc("increment_view_count", { post_id: id });
      });
  }, [id]);

  if (loading) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!post) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", margin: 0 }}>글을 찾을 수 없어요</p>
      <button onClick={() => router.push("/board")} style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>← 게시판으로</button>
    </div>
  );

  const isNews = NEWS_CATS.includes(post.category);
  const isQnA = post.category === Q_CAT;
  const showComments = !isNews && !isQnA;
  const articles = isNews ? parseArticles(post.content) : null;
  const date = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} a{text-decoration:none} textarea{outline:none}`}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 120px" }}>
        {/* 뒤로가기 + 메타 */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.push(fromCat ? `/board?cat=${encodeURIComponent(fromCat)}` : "/board")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", marginBottom: 20, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            커뮤니티
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "rgba(201,100,66,0.14)", border: "1px solid rgba(201,100,66,0.28)", color: ACCENT }}>
              {post.category}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{date}</span>
          </div>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.95)", lineHeight: 1.45, marginBottom: 36, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {post.title}
        </h1>

        <div style={{ height: 1, background: BORDER, marginBottom: 40 }} />

        {/* 본문 */}
        {articles ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {articles.map((block, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "48px 0" }} />}
                <ArticleCard block={block} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "36px 40px" }}>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.82)", lineHeight: 2.1, wordBreak: "keep-all", whiteSpace: "pre-wrap", margin: 0 }}>
              {post.content}
            </p>
          </div>
        )}

        {/* 댓글 */}
        {showComments && <CommentSection postId={post.id} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
