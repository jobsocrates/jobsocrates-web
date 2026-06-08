"use client";

import { useEffect, type ReactNode } from "react";

const ACCENT = "#FF6B35";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";

export interface SummaryMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

interface Props {
  jobTitle: string;
  question: string;
  draft: string;
  msgs: SummaryMsg[];
  onClose: () => void;
}

/* ── 텍스트 정제 ── */
function stripMd(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[참조\]([\s\S]*?)\[\/참조\]/g, "$1")
    .replace(/\[참조\]|\[\/참조\]/g, "")
    .trim();
}

function parseRevisionMsg(text: string) {
  const revMatch = text.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/);
  const chgMatch = text.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const revision = revMatch ? revMatch[1].trim() : "";
  const changes = chgMatch ? chgMatch[1].trim() : "";
  const rest = text
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .trim();
  return { revision, changes, rest };
}

/* ── PDF 생성용 HTML ── */
function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function buildPrintHtml(
  jobTitle: string,
  question: string,
  revision: string,
  changes: string,
  diagMsgs: SummaryMsg[],
  interviewMsgs: SummaryMsg[]
): string {
  const changeItems = changes
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);

  const msgRow = (m: SummaryMsg, isDiag = false, isRevMsg = false) => {
    if (isRevMsg) {
      const { rest } = parseRevisionMsg(m.text);
      if (!rest.trim()) return "";
      return `
        <div class="msg-wrap">
          <div class="msg-ai">
            <div class="avatar avatar-ai">AI</div>
            <div class="bubble-ai">${escHtml(stripMd(rest))}</div>
          </div>
        </div>`;
    }
    const text = stripMd(m.text);
    if (!text.trim()) return "";
    const isBot = m.role === "bot";
    if (isDiag) {
      return `
        <div class="diag-box">
          <p class="diag-label">📋 초안 진단</p>
          <p class="diag-text">${escHtml(text)}</p>
        </div>`;
    }
    if (isBot) {
      return `
        <div class="msg-wrap">
          <div class="msg-ai">
            <div class="avatar avatar-ai">AI</div>
            <div class="bubble-ai">${escHtml(text)}</div>
          </div>
        </div>`;
    }
    return `
      <div class="msg-wrap">
        <div class="msg-user">
          <div class="avatar avatar-me">나</div>
          <div class="bubble-me">${escHtml(text)}</div>
        </div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>취업소크라테스 리포트 — ${escHtml(question)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;background:#fff;color:#1a1a2e;padding:48px;font-size:14px;line-height:1.75}

.header{margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #1a1a2e}
.header h1{font-size:20px;font-weight:800;color:#1a1a2e}
.header .meta{font-size:12px;color:#666;margin-top:6px}

.section{margin-bottom:48px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.section-num{font-size:10px;font-weight:800;color:#fff;background:#1a1a2e;padding:3px 9px;border-radius:20px;letter-spacing:.06em}
.section-title{font-size:15px;font-weight:700;color:#1a1a2e}

.revision-box{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:14px;overflow:hidden}
.revision-header{background:#4338ca;padding:10px 18px}
.revision-header p{font-size:10px;font-weight:700;color:#fff;letter-spacing:.1em;text-transform:uppercase}
.revision-body{padding:20px 22px;font-size:13px;line-height:1.9;white-space:pre-wrap;word-break:keep-all;color:#1a1a2e}

.changes-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-top:16px}
.changes-header{font-size:11px;font-weight:700;color:#92400e;margin-bottom:12px}
.changes-item{display:flex;gap:8px;margin-bottom:8px;font-size:13px;line-height:1.65;word-break:keep-all}
.changes-dot{color:#d97706;font-weight:700;flex-shrink:0}

.diag-box{background:#f0f4ff;border-left:3px solid #4338ca;border-radius:0 12px 12px 0;padding:14px 18px;margin-bottom:14px}
.diag-label{font-size:10px;font-weight:700;color:#4338ca;letter-spacing:.1em;margin-bottom:8px}
.diag-text{font-size:13px;line-height:1.8;color:#1a1a2e;word-break:keep-all}

.msg-wrap{margin-bottom:14px}
.msg-ai{display:flex;gap:10px;align-items:flex-start}
.msg-user{display:flex;gap:10px;align-items:flex-start;justify-content:flex-end}
.avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.avatar-ai{background:#4338ca}
.avatar-me{background:#e8562a}
.bubble-ai{background:#f0f4ff;border-radius:4px 14px 14px 14px;padding:12px 16px;font-size:13px;line-height:1.75;word-break:keep-all;max-width:80%;color:#1a1a2e}
.bubble-me{background:#fff3ee;border-radius:14px 4px 14px 14px;padding:12px 16px;font-size:13px;line-height:1.75;word-break:keep-all;max-width:80%;color:#1a1a2e;border:1px solid #fdd0bb}

.legend{display:flex;gap:16px;margin-bottom:16px;padding:10px 14px;background:#f9f9f9;border-radius:10px}
.legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#555}
.legend-dot{width:10px;height:10px;border-radius:50%}

hr{border:none;border-top:1px solid #e5e7eb;margin:40px 0}
@media print{body{padding:20px 24px}}
</style>
</head>
<body>

<div class="header">
  <h1>취업소크라테스 — 첨삭 리포트</h1>
  <p class="meta">${escHtml(jobTitle)}${jobTitle && question ? " &nbsp;·&nbsp; " : ""}${escHtml(question)}</p>
</div>

${revision ? `
<div class="section">
  <div class="section-header">
    <span class="section-num">01</span>
    <span class="section-title">수정본</span>
  </div>
  <div class="revision-box">
    <div class="revision-header"><p>수정된 자소서</p></div>
    <div class="revision-body">${escHtml(revision)}</div>
  </div>
  ${changeItems.length > 0 ? `
  <div class="changes-box">
    <p class="changes-header">✏️ 바뀐 점</p>
    ${changeItems.map(item => `<div class="changes-item"><span class="changes-dot">·</span><span>${escHtml(item)}</span></div>`).join("")}
  </div>` : ""}
</div>
<hr>
` : ""}

<div class="section">
  <div class="section-header">
    <span class="section-num">${revision ? "02" : "01"}</span>
    <span class="section-title">진단 &amp; 첨삭 대화</span>
  </div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#4338ca"></div> AI 소크라테스</div>
    <div class="legend-item"><div class="legend-dot" style="background:#e8562a"></div> 나의 답변</div>
  </div>
  ${diagMsgs.map((m, i) => {
    const isRevMsg = m.role === "bot" && m.text.includes("[수정본]");
    return msgRow(m, i === 0 && m.role === "bot", isRevMsg);
  }).join("")}
</div>

${interviewMsgs.length > 0 ? `
<hr>
<div class="section">
  <div class="section-header">
    <span class="section-num">${revision ? "03" : "02"}</span>
    <span class="section-title">면접 예상 Q&amp;A</span>
  </div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#4338ca"></div> AI 질문</div>
    <div class="legend-item"><div class="legend-dot" style="background:#e8562a"></div> 나의 답변</div>
  </div>
  ${interviewMsgs.map(m => msgRow(m)).join("")}
</div>
` : ""}

</body>
</html>`;
}

/* ── 메인 컴포넌트 ── */
export function CoverLetterSummary({ jobTitle, question, draft, msgs, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const revMsgIdx = msgs.findIndex((m) => m.role === "bot" && m.text.includes("[수정본]"));
  const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;
  const interviewMsgs = revMsgIdx >= 0 ? msgs.slice(revMsgIdx + 1) : [];

  const { revision, changes } =
    revMsgIdx >= 0 ? parseRevisionMsg(msgs[revMsgIdx].text) : { revision: "", changes: "" };

  const changeItems = changes
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);

  function handlePdf() {
    const html = buildPrintHtml(
      jobTitle, question, revision, changes, diagMsgs, interviewMsgs
    );
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      onClose();
    }, 400);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: "900px",
          maxHeight: "88vh",
          background: "#0D0D18",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          color: "rgba(255,255,255,0.88)",
        }}
      >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div>
          <p className="text-sm font-semibold text-white">첨삭 리포트</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
            {jobTitle && `${jobTitle} · `}{question || "문항 미입력"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "18px", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-6 py-7">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">

          {/* 01 · 자소서 비교 */}
          <Section number="01" title="자소서 비교">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <DraftBox label="원본 초안" text={draft} />
                {revision ? (
                  <DraftBox label="수정본" text={revision} accent />
                ) : (
                  <div
                    className="rounded-2xl flex items-center justify-center py-10"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>수정본이 아직 작성되지 않았어요</p>
                  </div>
                )}
              </div>

              {changeItems.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: `${GOLD}09`, border: `1px solid ${GOLD}28` }}
                >
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${GOLD}20` }}>
                    <span style={{ fontSize: "12px" }}>✏️</span>
                    <span className="text-xs font-semibold" style={{ color: GOLD }}>바뀐 점</span>
                  </div>
                  <div className="px-4 py-3.5 flex flex-col gap-2.5">
                    {changeItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-xs flex-shrink-0 mt-[3px] font-bold" style={{ color: GOLD }}>·</span>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)", wordBreak: "keep-all" }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* 02 · 진단 & 첨삭 대화 */}
          <Section number="02" title="진단 & 첨삭 대화">
            <div className="flex flex-col gap-3">
              {diagMsgs.map((msg, i) => {
                if (!stripMd(msg.text).trim() && !msg.text.includes("[수정본]")) return null;
                const isRevMsg = msg.role === "bot" && msg.text.includes("[수정본]");
                return (
                  <SummaryMsgRow
                    key={msg.id}
                    msg={msg}
                    isDiagnosis={i === 0 && msg.role === "bot"}
                    isRevisionMsg={isRevMsg}
                  />
                );
              })}
            </div>
          </Section>

          {/* 03 · 면접 Q&A */}
          {interviewMsgs.length > 0 && (
            <Section number="03" title="면접 예상 Q&A">
              <div className="flex flex-col gap-3">
                {interviewMsgs.map((msg) => {
                  if (!stripMd(msg.text).trim()) return null;
                  return <SummaryMsgRow key={msg.id} msg={msg} />;
                })}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div
        className="flex-shrink-0 px-6 py-4 border-t flex items-center justify-between gap-4"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          수정본 · 대화 내용 · 면접 Q&A 포함
        </p>
        <button
          onClick={handlePdf}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97] flex-shrink-0"
          style={{ background: ACCENT, boxShadow: `0 0 20px ${ACCENT}40` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PDF 다운받기
        </button>
      </div>

      </div>
    </div>
  );
}

/* ── 하위 컴포넌트 ── */

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.06)", lineHeight: 1 }}>{number}</span>
        <span className="text-base font-semibold text-white">{title}</span>
      </div>
      {children}
    </section>
  );
}

function DraftBox({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: accent ? `${BLUE}0D` : "rgba(255,255,255,0.04)",
        border: `1px solid ${accent ? `${BLUE}28` : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="px-4 py-2.5 border-b" style={{ borderColor: accent ? `${BLUE}20` : "rgba(255,255,255,0.07)" }}>
        <p className="text-xs font-medium" style={{ color: accent ? BLUE : "rgba(255,255,255,0.35)" }}>{label}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.78)", lineHeight: "1.9", wordBreak: "keep-all" }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function SummaryMsgRow({
  msg,
  isDiagnosis,
  isRevisionMsg,
}: {
  msg: SummaryMsg;
  isDiagnosis?: boolean;
  isRevisionMsg?: boolean;
}) {
  const isBot = msg.role === "bot";

  if (isDiagnosis) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: `${BLUE}0A`, border: `1px solid ${BLUE}1C` }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}18` }}>
          <p className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
            {stripMd(msg.text)}
          </p>
        </div>
      </div>
    );
  }

  if (isRevisionMsg) {
    const { rest } = parseRevisionMsg(msg.text);
    if (!rest) return null;
    return (
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: BLUE, color: "#fff" }}>AI</div>
        <div className="flex-1 rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
          {rest}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={isBot ? { background: BLUE, color: "#fff" } : { background: ACCENT, color: "#fff" }}
      >
        {isBot ? "AI" : "나"}
      </div>
      <div
        className="flex-1 rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          background: isBot ? "rgba(255,255,255,0.05)" : `${ACCENT}14`,
          color: "rgba(255,255,255,0.82)",
          wordBreak: "keep-all",
          maxWidth: "88%",
        }}
      >
        {stripMd(msg.text)}
      </div>
    </div>
  );
}
