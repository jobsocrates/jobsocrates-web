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

export interface SummaryInterviewQ {
  question: string;
  msgs: SummaryMsg[];
}

interface Props {
  jobTitle: string;
  question: string;
  draft: string;
  msgs: SummaryMsg[];
  interviewQs?: SummaryInterviewQ[];
  analysisContent?: string;
  onClose: () => void;
  onNextItem?: () => void;
}

/* ── 텍스트 정제 / PDF 유틸 (mypage 에서도 import 가능) ── */
export function stripMd(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[수정본\][\s\S]*$/, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[지원동기\][\s\S]*$/, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[완성준비\]/g, "")
    .trim();
}

export function parseRevisionMsg(text: string) {
  const subMatch = text.match(/\[소제목\]([\s\S]*?)\[\/소제목\]/);
  const revMatch = text.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/) || text.match(/\[지원동기\]([\s\S]*?)\[\/지원동기\]/);
  const chgMatch = text.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const subtitle = subMatch ? subMatch[1].trim() : "";
  const rawRevision = revMatch
    ? revMatch[1].replace(/\[소제목\][\s\S]*?\[\/소제목\]\s*/g, "").trim()
    : "";
  const revision = rawRevision;
  const changes = chgMatch ? chgMatch[1].trim() : "";
  const rest = text
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[완성준비\]/g, "")
    .trim();
  return { subtitle, revision, changes, rest };
}

/* ── PDF 생성용 HTML ── */
export function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export function buildPrintHtml(
  jobTitle: string,
  question: string,
  revision: string,
  changes: string,
  diagMsgs: SummaryMsg[],
  interviewQs: SummaryInterviewQ[],
  baseUrl = ""
): string {
  const changeItems = changes
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);

  const msgRow = (m: SummaryMsg, isDiag = false, isRevMsg = false) => {
    // 수정본 메시지 뒤에 붙는 "읽어보고 어색한점..." 텍스트 제거
    if (isRevMsg) return "";
    const text = stripMd(m.text);
    if (!text.trim()) return "";
    const isBot = m.role === "bot";
    if (isDiag) {
      return `
        <div class="diag-box">
          <div class="diag-label-row"><img class="avatar" src="${baseUrl}/logo.jpg" alt="" style="object-fit:contain;background:#fff;padding:1px;border-radius:4px"> 초안 진단</div>
          <p class="diag-text">${escHtml(text)}</p>
        </div>`;
    }
    if (isBot) {
      return `
        <div class="msg-wrap">
          <div class="msg-ai">
            <img class="avatar" src="${baseUrl}/logo.jpg" alt="" style="object-fit:contain;background:#fff;padding:1px;border-radius:4px">
            <div class="bubble-ai">${escHtml(text)}</div>
          </div>
        </div>`;
    }
    return `
      <div class="msg-wrap">
        <div class="msg-user">
          <div class="bubble-me">${escHtml(text)}</div>
          <div class="avatar avatar-me">나</div>
        </div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<base href="${baseUrl}">
<title>취업소크라테스 리포트 — ${escHtml(question)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;background:#ffffff;color:#111827;padding:48px;font-size:14px;line-height:1.75}

.header{margin-bottom:40px;padding-bottom:18px;border-bottom:3px solid #111827}
.header h1{font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.02em}
.header .meta{font-size:12px;color:#6b7280;margin-top:6px}

.section{margin-bottom:48px}
.section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid #e5e7eb}
.section-num{font-size:10px;font-weight:800;color:#ffffff;background:#111827;padding:3px 9px;border-radius:20px;letter-spacing:.06em}
.section-title{font-size:15px;font-weight:700;color:#111827}

.revision-box{background:#fff;border:2px solid #111827;border-radius:12px;overflow:hidden;margin-bottom:4px}
.revision-header{background:#111827;padding:10px 20px;display:flex;align-items:center;gap:8px}
.revision-header p{font-size:10px;font-weight:700;color:#fff;letter-spacing:.1em;text-transform:uppercase}
.revision-body{padding:22px 24px;font-size:13.5px;line-height:2;white-space:pre-wrap;word-break:keep-all;color:#111827}

.changes-box{background:#fffbeb;border:1px solid #f59e0b;border-left:4px solid #d97706;border-radius:0 10px 10px 0;padding:16px 20px;margin-top:14px}
.changes-header{font-size:10px;font-weight:700;color:#92400e;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.08em}
.changes-item{display:flex;gap:8px;margin-bottom:8px;font-size:13px;line-height:1.65;word-break:keep-all;color:#111827}
.changes-dot{color:#d97706;font-weight:700;flex-shrink:0}

.diag-box{background:#eef2ff;border-left:4px solid #4338ca;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:14px}
.diag-label{font-size:10px;font-weight:700;color:#4338ca;letter-spacing:.1em;margin-bottom:8px;text-transform:uppercase}
.diag-label-row{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700;color:#4338ca;letter-spacing:.1em;margin-bottom:8px;text-transform:uppercase}
.diag-text{font-size:13px;line-height:1.8;color:#111827;word-break:keep-all}

.msg-wrap{margin-bottom:14px}
.msg-ai{display:flex;gap:10px;align-items:flex-start}
.msg-user{display:flex;gap:10px;align-items:flex-start;justify-content:flex-end}
.avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;object-fit:cover;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.avatar-me{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;background:#c2410c;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bubble-ai{background:#f1f5f9;border:1px solid #94a3b8;border-left:4px solid #4338ca;border-radius:2px 12px 12px 12px;padding:12px 16px;font-size:13px;line-height:1.75;word-break:keep-all;max-width:80%;color:#111827}
.bubble-me{background:#fff7ed;border:1px solid #fdba74;border-right:4px solid #c2410c;border-radius:12px 2px 12px 12px;padding:12px 16px;font-size:13px;line-height:1.75;word-break:keep-all;max-width:80%;color:#111827}

.legend{display:flex;gap:20px;margin-bottom:16px;padding:10px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px}
.legend-item{display:flex;align-items:center;gap:7px;font-size:11px;color:#374151;font-weight:500}
.legend-dot{width:10px;height:10px;border-radius:50%;-webkit-print-color-adjust:exact;print-color-adjust:exact}

hr{border:none;border-top:1px solid #d1d5db;margin:40px 0}
.interview-q{margin-bottom:28px}
.interview-q-num{font-size:10px;font-weight:800;color:#4338ca;letter-spacing:.1em;margin-bottom:6px;text-transform:uppercase}
.interview-q-text{font-size:13.5px;font-weight:600;color:#111827;line-height:1.65;word-break:keep-all;padding:12px 16px;background:#eef2ff;border-radius:0 10px 10px 10px;border-left:4px solid #4338ca;margin-bottom:10px}
.no-answer{font-size:12px;color:#9ca3af;font-style:italic;margin-left:4px}
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
    <span class="section-title">완성본</span>
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
    <div class="legend-item"><div class="legend-dot" style="background:#4338ca"></div> 취업소크라테스</div>
    <div class="legend-item"><div class="legend-dot" style="background:#c2410c"></div> 나의 답변</div>
  </div>
  ${diagMsgs.map((m, i) => {
    const isRevMsg = m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]"));
    return msgRow(m, i === 0 && m.role === "bot", isRevMsg);
  }).join("")}
</div>

${interviewQs.length > 0 ? `
<hr>
<div class="section">
  <div class="section-header">
    <span class="section-num">${revision ? "03" : "02"}</span>
    <span class="section-title">면접 예상 Q&amp;A</span>
  </div>
  ${interviewQs.map((q, i) => `
    <div class="interview-q">
      <p class="interview-q-num">Q${i + 1}</p>
      <p class="interview-q-text">${escHtml(q.question)}</p>
      ${q.msgs.length > 0
        ? q.msgs.map(m => msgRow(m)).join("")
        : '<p class="no-answer">아직 답변하지 않은 질문이에요.</p>'}
    </div>
  `).join("")}
</div>
` : ""}

</body>
</html>`;
}

/* ── 메인 컴포넌트 ── */
export function CoverLetterSummary({ jobTitle, question, draft, msgs, interviewQs = [], analysisContent, onClose, onNextItem }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const revMsgIdx = msgs.findIndex((m) => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
  const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;

  const { subtitle, revision, changes } =
    revMsgIdx >= 0 ? parseRevisionMsg(msgs[revMsgIdx].text) : { subtitle: "", revision: "", changes: "" };

  const changeItems = changes
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);

  function handlePdf() {
    const html = buildPrintHtml(
      jobTitle, question, revision, changes, diagMsgs, interviewQs, window.location.origin
    );
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
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

          {/* 00 · 기업·직무 분석 보고서 */}
          {analysisContent && (
            <Section number="00" title="기업 · 직무 분석" numColor="rgba(167,139,250,0.7)">
              <div className="flex flex-col gap-6">
                {analysisContent.split(/(?=##\s)/).filter(s => s.trim()).map((block, i) => {
                  const lines = block.trim().split("\n").filter(Boolean);
                  const rawTitle = lines[0]?.replace(/^##\s*/, "") ?? "";
                  const numMatch = rawTitle.match(/^(\S+)\s+(\d+)\.\s*(.+)$/);
                  const emoji = numMatch ? numMatch[1] : "";
                  const sectionTitle = numMatch ? numMatch[3] : rawTitle;
                  const bullets = lines.slice(1).filter(l => l.startsWith("- ")).map(l => l.replace(/^-\s*/, ""));
                  return (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{emoji}</span>
                          <span className="text-sm font-bold text-white">{sectionTitle}</span>
                        </div>
                      </div>
                      <div className="px-5 py-4 flex flex-col gap-4">
                        {bullets.map((b, j) => {
                          const colonIdx = b.indexOf(": ");
                          const label = colonIdx > 0 && colonIdx < 24 ? b.slice(0, colonIdx) : null;
                          const body = label ? b.slice(colonIdx + 2) : b;
                          return (
                            <div key={j} className="flex flex-col gap-1 pl-3" style={{ borderLeft: "2px solid rgba(167,139,250,0.3)" }}>
                              {label && <p className="text-xs font-bold" style={{ color: "#A78BFA" }}>{label}</p>}
                              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", wordBreak: "keep-all" }}>{body}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 01 · 완성본 */}
          <Section number="01" title="완성본" numColor={`${GOLD}99`}>
            <div className="flex flex-col gap-4">
              {revision ? (
                <DraftBox label="수정된 자소서" text={revision} accent />
              ) : (
                <div
                  className="rounded-2xl flex items-center justify-center py-10"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
                >
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>완성본이 아직 작성되지 않았어요</p>
                </div>
              )}

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
          <Section number="02" title="진단 & 첨삭 대화" numColor={`${BLUE}99`}>
            <div className="flex flex-col gap-3">
              {diagMsgs.map((msg, i) => {
                if (!stripMd(msg.text).trim() && !msg.text.includes("[수정본]") && !msg.text.includes("[지원동기]")) return null;
                const isRevMsg = msg.role === "bot" && (msg.text.includes("[수정본]") || msg.text.includes("[지원동기]"));
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
          {interviewQs.length > 0 && (
            <Section number="03" title="면접 예상 Q&A" numColor={`${ACCENT}99`}>
              <div className="flex flex-col gap-6">
                {interviewQs.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs font-bold flex-shrink-0 mt-[3px]" style={{ color: BLUE }}>Q{i + 1}</span>
                      <p className="text-sm font-semibold text-white" style={{ wordBreak: "keep-all", lineHeight: 1.6 }}>{q.question}</p>
                    </div>
                    {q.msgs.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {q.msgs.map((msg) => <SummaryMsgRow key={msg.id} msg={msg} />)}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>아직 답변하지 않은 질문이에요</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div
        className="flex-shrink-0 px-6 pt-4 pb-5 border-t flex flex-col gap-3"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* 안내 + PDF */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            기록은 마이페이지에서 언제든지 다시 볼 수 있어요
          </p>
          <button
            onClick={handlePdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-75 flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF 저장
          </button>
        </div>

        {/* 주요 액션 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-75"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            완료하기
          </button>
          {onNextItem && (
            <button
              onClick={onNextItem}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: `0 0 20px ${ACCENT}35` }}
            >
              다음 문항 작성하기 →
            </button>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}

/* ── 하위 컴포넌트 ── */

function Section({ number, title, numColor, children }: { number: string; title: string; numColor: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl font-black" style={{ color: numColor, lineHeight: 1, letterSpacing: "-0.02em" }}>{number}</span>
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
        <div className="px-5 py-4">
          <p className="text-sm lg:text-base leading-[1.85] whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.85)", wordBreak: "keep-all" }}>
            {stripMd(msg.text)}
          </p>
        </div>
      </div>
    );
  }

  // 수정본 메시지 뒤에 붙는 "읽어보고 어색한 점이 있으면..." 텍스트 표시 안 함
  if (isRevisionMsg) return null;

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot ? (
        <img src="/logo.jpg" alt="" className="w-7 h-7 rounded-lg object-contain flex-shrink-0 mt-1" style={{ background: "#fff", padding: "1px" }} />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
          style={{ background: ACCENT, color: "#fff" }}
        >
          나
        </div>
      )}
      <div
        className="rounded-2xl px-4 py-3.5 text-sm lg:text-base leading-[1.85] whitespace-pre-wrap"
        style={{
          background: isBot ? "rgba(255,255,255,0.07)" : `${ACCENT}18`,
          borderLeft: isBot ? `2px solid ${BLUE}50` : undefined,
          borderRight: isBot ? undefined : `2px solid ${ACCENT}60`,
          color: "rgba(255,255,255,0.88)",
          wordBreak: "keep-all",
          maxWidth: "86%",
        }}
      >
        {stripMd(msg.text).replace(/^AI:\s*/i, "")}
      </div>
    </div>
  );
}
