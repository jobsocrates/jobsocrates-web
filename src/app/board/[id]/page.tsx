"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const BORDER = "rgba(255,255,255,0.07)";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

// 🔗 원문: URL 추출
function extractLink(block: string): string | null {
  const m = block.match(/🔗\s*원문[:：]?\s*(https?:\/\/\S+)/);
  return m ? m[1] : null;
}

// 본문을 ---로 나눠 기사 카드 배열로 변환
function parseArticles(content: string) {
  return content
    .split(/\n\s*---\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);
}

// 한 블록 내 줄들을 렌더링
function ArticleCard({ block }: { block: string }) {
  const link = extractLink(block);
  // 링크 줄은 헤더 영역에서만 쓰고 본문에서 제거
  const lines = block
    .replace(/🔗\s*원문[:：]?\s*https?:\/\/\S+/g, "")
    .split("\n");

  const elements: React.ReactNode[] = [];
  let bodyBuf: string[] = [];

  const flushBody = (key: string) => {
    const text = bodyBuf.join("\n").trim();
    if (text) {
      elements.push(
        <p key={key} style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 2.15, whiteSpace: "pre-wrap", wordBreak: "keep-all", margin: 0 }}>
          {text}
        </p>
      );
    }
    bodyBuf = [];
  };

  let titleSet = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (bodyBuf.length) bodyBuf.push("");
      return;
    }

    // 📰 기사 제목 + 원문 링크 한 줄에
    if (trimmed.startsWith("📰")) {
      flushBody(`body-before-${i}`);
      titleSet = true;
      elements.push(
        <div key={`title-${i}`} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.55, wordBreak: "keep-all", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            {trimmed.replace(/^📰\s*/, "")}
          </h2>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: `${BLUE}18`, border: `1px solid ${BLUE}38`, color: BLUE, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
            >
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

    // 섹션 레이블 (무슨 일이냐면 / 🔍 / 💬)
    const isSectionLabel =
      trimmed.startsWith("무슨 일이냐면") ||
      trimmed.startsWith("🔍") ||
      trimmed.startsWith("💬");

    if (isSectionLabel) {
      flushBody(`body-${i}`);
      elements.push(
        <p key={`label-${i}`} style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.07em", textTransform: "uppercase", margin: "28px 0 10px", opacity: 0.85 }}>
          {trimmed}
        </p>
      );
      return;
    }

    // 제목 전 줄(TITLE 파싱 잔여 등) 무시
    if (!titleSet) return;

    bodyBuf.push(line);
  });
  flushBody("body-end");

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 22,
      padding: "36px 40px 36px",
      display: "flex",
      flexDirection: "column",
    }}>
      {elements}
    </div>
  );
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

  const isNews = ["경제", "기술", "시사", "금융", "뉴스"].includes(post.category);
  const articles = isNews ? parseArticles(post.content) : null;
  const date = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: `"Pretendard Variable", Pretendard, sans-serif` }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} a{text-decoration:none}`}</style>

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
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{post.category}</span>
      </header>

      {/* 본문 */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 24px 120px" }}>
        {/* 메타 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "rgba(201,100,66,0.14)", border: "1px solid rgba(201,100,66,0.28)", color: ACCENT }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{date}</span>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.95)", lineHeight: 1.45, marginBottom: 36, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {post.title}
        </h1>

        <div style={{ height: 1, background: BORDER, marginBottom: 40 }} />

        {/* 뉴스 카드 vs 일반 글 */}
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
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.82)", lineHeight: 2.1, wordBreak: "keep-all", whiteSpace: "pre-wrap", margin: 0 }}>
            {post.content}
          </p>
        )}
      </div>
    </div>
  );
}
