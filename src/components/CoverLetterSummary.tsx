"use client";

import { useEffect, useState, type ReactNode } from "react";

const LOADING_LINES = [
  "디깅에서 나온 판단들을 다시 읽고 있어요…",
  "이 회사가 뭘로 돈 버는지 뜯어보는 중…",
  "면접관이 찌를 만한 급소를 찾고 있어요…",
  "당신만의 무기를 골라내는 중이에요…",
  "회사의 고민과 당신 경험이 만나는 지점을 잇는 중…",
  "밖에서 본 당신의 진짜 강점을 짚는 중이에요…",
  "면접장에서 통할 한 줄을 벼리고 있어요…",
  "거의 다 됐어요. 마지막으로 다듬는 중…",
];

export interface SummaryMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

export interface SummaryInterviewQ {
  question: string;
  msgs: SummaryMsg[];
}

export interface FinalAnalysis {
  companyJob: string;
  jobRole?: string; // 직무 해부 — 이 자리는 왜 뽑는가
  weapons: { title: string; competency?: string; detail: string }[];
  oneLine?: string; // 나의 한 줄 — 회사의 고민 ↔ 내 무기 앵커
  interviewKeys?: { q: string; a: string }[]; // 구버전 호환(더는 생성 안 함)
  insight: { edge: string; caution: string; direction: string };
  weakSpots?: { q: string; guide: string }[]; // 예상 급소 + 받아치는 방향
  homework?: string[]; // 면접 전 숙제
}

interface Props {
  jobTitle: string;
  question: string;
  draft: string;
  msgs: SummaryMsg[];
  interviewQs?: SummaryInterviewQ[];
  analysisContent?: string;
  finalAnalysis?: FinalAnalysis | null;
  finalAnalysisLoading?: boolean;
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
  baseUrl = "",
  analysisContent = "",
  subtitle = "",
  finalAnalysis: FinalAnalysis | null = null
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
.analysis-block{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:16px}
.analysis-block-header{background:#f5f3ff;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #ede9fe}
.analysis-block-emoji{font-size:14px}
.analysis-block-title{font-size:13px;font-weight:700;color:#4338ca}
.analysis-block-body{padding:14px 18px;display:flex;flex-direction:column;gap:12px}
.analysis-item{padding-left:12px;border-left:2px solid #ede9fe}
.analysis-label{font-size:11px;font-weight:700;color:#6366f1;margin-bottom:3px}
.analysis-body{font-size:13px;line-height:1.8;color:#374151;word-break:keep-all}
.interview-q{margin-bottom:28px}
.interview-q-num{font-size:10px;font-weight:800;color:#4338ca;letter-spacing:.1em;margin-bottom:6px;text-transform:uppercase}
.interview-q-text{font-size:13.5px;font-weight:600;color:#111827;line-height:1.65;word-break:keep-all;padding:12px 16px;background:#eef2ff;border-radius:0 10px 10px 10px;border-left:4px solid #4338ca;margin-bottom:10px}
.no-answer{font-size:12px;color:#9ca3af;font-style:italic;margin-left:4px}
.op-block{margin-bottom:12px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;break-inside:avoid}
.op-company{background:#eff6ff;border-color:#bfdbfe}
.op-label{font-size:11px;font-weight:700;color:#4338ca;margin-bottom:8px}
.op-text{font-size:13px;line-height:1.7;color:#111827;word-break:keep-all}
.op-note{font-size:11px;color:#6b7280;margin-top:7px;word-break:keep-all}
.op-item{font-size:12.5px;line-height:1.6;color:#374151;margin-bottom:6px;word-break:keep-all}
.op-item-t{font-weight:700;color:#111827}
.op-wp{padding:11px 13px;border:1px solid #d1fae5;background:#f0fdf4;border-radius:10px;margin-bottom:8px;break-inside:avoid}
.op-wp-t{font-size:13px;font-weight:700;color:#111827;margin-bottom:5px}
.op-wp-n{display:inline-block;font-size:10px;font-weight:800;color:#15803d;background:#dcfce7;border-radius:5px;padding:1px 5px;margin-right:5px}
.op-wp-row{font-size:12px;color:#374151;line-height:1.6;word-break:keep-all;margin-top:3px}
.op-wp-lab{font-size:10px;font-weight:700;color:#9ca3af;margin-right:5px}
.op-ins{margin-bottom:11px}
.op-ins-t{font-size:12px;font-weight:700;margin-bottom:3px}
.op-qa{margin-bottom:9px}
.op-q{font-size:12.5px;font-weight:700;color:#b45309;word-break:keep-all}
.op-a{font-size:12.5px;color:#374151;line-height:1.6;word-break:keep-all;margin-top:2px}
@media print{body{padding:20px 24px}}
</style>
</head>
<body>

<div class="header">
  <h1>취업소크라테스 — 첨삭 리포트</h1>
  <p class="meta">${escHtml(jobTitle)}${jobTitle && question ? " &nbsp;·&nbsp; " : ""}${escHtml(question)}</p>
</div>

${finalAnalysis ? `
<div class="section">
  <div class="section-header">
    <span class="section-num">★</span>
    <span class="section-title">면접 한 장 — 면접장에 들고 가세요</span>
  </div>
  ${finalAnalysis.companyJob ? `<div class="op-block op-company"><p class="op-label">🏢 이 회사는 뭘로 돈을 벌까</p><p class="op-text">${escHtml(finalAnalysis.companyJob)}</p><p class="op-note">취업소크라테스가 정리한 초안이에요. 맞는지 확인하고 본인 말로 다시 정리해보세요.</p></div>` : ""}
  ${finalAnalysis.jobRole ? `<div class="op-block op-company"><p class="op-label">🧭 이 자리는 왜 뽑을까 · 직무 해부</p><p class="op-text">${escHtml(finalAnalysis.jobRole)}</p></div>` : ""}
  ${finalAnalysis.weapons?.length ? `<div class="op-block"><p class="op-label">💪 내 무기</p>${finalAnalysis.weapons.map((w, i) => `<div class="op-wp"><p class="op-wp-t"><span class="op-wp-n">${String(i + 1).padStart(2, "0")}</span> ${escHtml(w.title)}</p>${w.competency ? `<p class="op-wp-row"><span class="op-wp-lab">역량</span> ${escHtml(w.competency)}</p>` : ""}<p class="op-wp-row"><span class="op-wp-lab">근거</span> ${escHtml(w.detail)}</p></div>`).join("")}</div>` : ""}
  ${finalAnalysis.oneLine ? `<div class="op-block" style="background:#eef2ff;border-color:#c7d2fe"><p class="op-label">🎯 나의 한 줄</p><p class="op-text" style="font-weight:700">“${escHtml(finalAnalysis.oneLine)}”</p></div>` : ""}
  ${finalAnalysis.interviewKeys?.length ? `<div class="op-block"><p class="op-label">🎤 이 질문엔 이렇게</p>${finalAnalysis.interviewKeys.map(k => `<div class="op-qa"><p class="op-q">Q. ${escHtml(k.q)}</p><p class="op-a">→ ${escHtml(k.a)}</p></div>`).join("")}</div>` : ""}
  ${finalAnalysis.weakSpots?.length ? `<div class="op-block" style="background:#fef2f2;border-color:#fecaca"><p class="op-label">⚡ 예상 급소</p>${finalAnalysis.weakSpots.map(w => `<div class="op-qa"><p class="op-q">Q. ${escHtml(w.q)}</p><p class="op-a">→ ${escHtml(w.guide)}</p></div>`).join("")}</div>` : ""}
  ${finalAnalysis.homework?.length ? `<div class="op-block"><p class="op-label">✅ 면접 전 숙제</p>${finalAnalysis.homework.map((h, i) => `<p class="op-item"><span class="op-item-t">${i + 1}.</span> ${escHtml(h)}</p>`).join("")}</div>` : ""}
  ${finalAnalysis.insight ? `<div class="op-block"><p class="op-label">👀 취업소크라테스가 본 당신</p>${finalAnalysis.insight.edge ? `<div class="op-ins"><p class="op-ins-t" style="color:#15803d">✨ 이게 진짜 강점이에요</p><p class="op-text">${escHtml(finalAnalysis.insight.edge)}</p></div>` : ""}${finalAnalysis.insight.caution ? `<div class="op-ins"><p class="op-ins-t" style="color:#b45309">⚠️ 이건 조심하면 좋아요</p><p class="op-text">${escHtml(finalAnalysis.insight.caution)}</p></div>` : ""}${finalAnalysis.insight.direction ? `<div class="op-ins"><p class="op-ins-t" style="color:#c2410c">🎯 그래서 면접에선</p><p class="op-text">${escHtml(finalAnalysis.insight.direction)}</p></div>` : ""}</div>` : ""}
</div>
<hr>
` : ""}

${analysisContent?.trim() ? (() => {
  const blocks = analysisContent.split(/(?=##\s)/).filter(s => s.trim());
  const blocksHtml = blocks.map(block => {
    const lines = block.trim().split("\n").filter(Boolean);
    const rawTitle = lines[0]?.replace(/^##\s*/, "") ?? "";
    const numMatch = rawTitle.match(/^(\S+)\s+\d+\.\s*(.+)$/);
    const emoji = numMatch ? numMatch[1] : "";
    const sectionTitle = numMatch ? numMatch[2] : rawTitle;
    const bullets = lines.slice(1).filter(l => l.startsWith("- ")).map(l => l.replace(/^-\s*/, ""));
    const bulletsHtml = bullets.map(b => {
      const colonIdx = b.indexOf(": ");
      const label = colonIdx > 0 && colonIdx < 24 ? b.slice(0, colonIdx) : null;
      const body = label ? b.slice(colonIdx + 2) : b;
      return `<div class="analysis-item">${label ? `<p class="analysis-label">${escHtml(label)}</p>` : ""}<p class="analysis-body">${escHtml(body)}</p></div>`;
    }).join("");
    return `<div class="analysis-block"><div class="analysis-block-header"><span class="analysis-block-emoji">${emoji}</span><span class="analysis-block-title">${escHtml(sectionTitle)}</span></div><div class="analysis-block-body">${bulletsHtml}</div></div>`;
  }).join("");
  return `
<div class="section">
  <div class="section-header">
    <span class="section-num">00</span>
    <span class="section-title">기업 · 직무 분석</span>
  </div>
  ${blocksHtml}
</div>
<hr>
`;
})() : ""}

${revision ? `
<div class="section">
  <div class="section-header">
    <span class="section-num">01</span>
    <span class="section-title">완성본</span>
  </div>
  ${subtitle ? `<p style="font-size:16px;font-weight:800;color:#111827;letter-spacing:-0.02em;margin-bottom:10px">${escHtml(subtitle)}</p>` : ""}
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
export function CoverLetterSummary({ jobTitle, question, msgs, interviewQs = [], analysisContent, finalAnalysis, finalAnalysisLoading, onClose, onNextItem }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const revMsgIdx = msgs.findIndex((m) => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
  const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;

  const { subtitle, revision, changes } =
    revMsgIdx >= 0 ? parseRevisionMsg(msgs[revMsgIdx].text) : { subtitle: "", revision: "", changes: "" };

  const fa = finalAnalysis;
  const loading = !!finalAnalysisLoading && !finalAnalysis;

  const [loadIdx, setLoadIdx] = useState(0);
  useEffect(() => {
    if (!loading) { setLoadIdx(0); return; }
    const t = setInterval(() => setLoadIdx((i) => (i + 1) % LOADING_LINES.length), 2600);
    return () => clearInterval(t);
  }, [loading]);

  function handlePdf() {
    const html = buildPrintHtml(
      jobTitle, question, revision, changes, diagMsgs, interviewQs, window.location.origin, analysisContent, subtitle, finalAnalysis
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
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#F9FAFB", color: "#111827", animation: "summaryPageIn 0.36s cubic-bezier(0.22,1,0.36,1)" }}
    >
      <style>{`@keyframes summaryPageIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}@keyframes revealUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* 헤더 */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between px-6 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#4F46E5" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            대화로 돌아가기
          </button>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "#111827" }}>면접 브리핑</p>
            {jobTitle && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{jobTitle}</p>}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* 히어로 */}
          <div style={{ animation: "revealUp .5s ease both" }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.22)" }}>
              <span style={{ fontSize: 12 }}>🎯</span>
              <span className="text-xs font-bold" style={{ color: "#4F46E5" }}>면접 한 장 브리핑</span>
            </span>
            <h1 className="text-2xl font-bold" style={{ color: "#111827", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>{jobTitle ? `${jobTitle} ` : ""}면접, 이 한 장이면 돼요</h1>
            <p className="text-sm mt-2" style={{ color: "#6B7280", lineHeight: 1.65, wordBreak: "keep-all" }}>회사를 이해하고 → 내 무기를 알고 → 실전 태도까지. 외우지 말고, 읽고 본인 언어로 소화하세요.</p>
          </div>

          {loading ? (
            <div className="rounded-2xl px-6 py-10 flex flex-col items-center text-center" style={{ background: "#FFFFFF", border: "1px solid #E9EBEF", boxShadow: "0 2px 10px -6px rgba(17,24,39,0.08)" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(79,70,229,0.15)", borderTopColor: "#4F46E5", display: "inline-block", animation: "spin .8s linear infinite" }} />
              <p key={loadIdx} className="text-[15px] font-semibold mt-5" style={{ color: "#312E81", wordBreak: "keep-all", animation: "loadFade .5s ease" }}>
                {LOADING_LINES[loadIdx]}
              </p>
              <p className="text-xs mt-2.5" style={{ color: "#9CA3AF", wordBreak: "keep-all", lineHeight: 1.6 }}>
                디깅부터 완성본까지 다시 훑어 만드는 브리핑이라, 조금 걸려요.<br />좋은 건 원래 시간이 좀 들거든요. ☕
              </p>
              <style>{`@keyframes loadFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
            </div>
          ) : (
            <>
              {/* PART 1 · 이해 */}
              <PartLabel n="PART 1" text="이 회사를 이해하기" />
              <BriefCard accent="#3B62CC" icon="🏢" title="이 회사는 뭘로 돈을 벌까">
                {fa?.companyJob
                  ? <><BodyText>{fa.companyJob}</BodyText><Note>확인하고 본인 말로 다시 정리해보세요.</Note></>
                  : <Soon text="무엇을 팔고, 누가 사주고, 무엇으로 경쟁하고, 지금 이 회사의 고민은 무엇인지 — 면접관 눈높이로 정리돼요." />}
              </BriefCard>
              <BriefCard accent="#3B62CC" icon="🧭" title="이 자리는 왜 뽑을까 · 직무 해부">
                {fa?.jobRole
                  ? <BodyText>{fa.jobRole}</BodyText>
                  : <Soon text="이 직무가 회사 안에서 실제로 하는 일, 신입에게 진짜 기대하는 것, 현업이 쓰는 말." />}
              </BriefCard>

              {/* PART 2 · 나 */}
              <PartLabel n="PART 2" text="나를 무기로 만들기" />
              <BriefCard accent="#16A34A" icon="💪" title="내 무기 · 강점 키워드">
                {fa?.weapons?.length ? (
                  <div className="flex flex-col gap-2.5">
                    {fa.weapons.map((w, i) => (
                      <div key={i} style={{ padding: "13px 15px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-sm font-bold" style={{ color: "#111827" }}>{w.title}</span>
                          {w.competency && <span className="text-xs font-semibold" style={{ color: "#15803D", background: "#DCFCE7", borderRadius: 6, padding: "1px 8px" }}>{w.competency}</span>}
                        </div>
                        <p className="text-[13px]" style={{ color: "#374151", lineHeight: 1.65, wordBreak: "keep-all" }}>{w.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : <Soon text="디깅에서 검증된 강점을 키워드로 뽑고, 어느 경험에서 증명됐는지·이 직무 어디서 쓰이는지 붙여줘요." />}
              </BriefCard>
              <BriefCard accent="#4F46E5" icon="🎯" title="나의 한 줄" highlight>
                {fa?.oneLine ? (
                  <>
                    <p className="text-[15px] font-bold" style={{ color: "#312E81", lineHeight: 1.7, wordBreak: "keep-all" }}>“{fa.oneLine}”</p>
                    <Note>어떤 질문이 와도 결국 이 문장으로 돌아오면 돼요.</Note>
                  </>
                ) : <Soon text="회사의 고민과 내 무기가 만나는 지점을 한 문장으로. 어떤 질문이 와도 여기로 돌아오면 되는 앵커." />}
              </BriefCard>

              {/* PART 3 · 실전 */}
              <PartLabel n="PART 3" text="면접장에서" />
              <BriefCard accent="#7C5CBF" icon="👀" title="면접 태도·방향 · 전문가 시선">
                {fa?.insight ? (
                  <div className="flex flex-col gap-3">
                    {fa.insight.edge && <InsightRow color="#16A34A" label="✨ 이게 진짜 강점" text={fa.insight.edge} />}
                    {fa.insight.caution && <InsightRow color="#C2740A" label="⚠️ 이건 조심하면 좋아요" text={fa.insight.caution} />}
                    {fa.insight.direction && <InsightRow color="#4F46E5" label="🎯 그래서 면접에선" text={fa.insight.direction} />}
                  </div>
                ) : <Soon text="면접관이 확인하려는 것, 내 답변이 자칫 어떻게 비칠 수 있는지, 무엇을 앞세우고 무엇은 아낄지." />}
              </BriefCard>
              <BriefCard accent="#DC2626" icon="⚡" title="예상 급소">
                {fa?.weakSpots?.length ? (
                  <div className="flex flex-col gap-2.5">
                    {fa.weakSpots.map((w, i) => (
                      <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                        <p className="text-[13px] font-bold mb-1" style={{ color: "#B91C1C", wordBreak: "keep-all" }}>Q. {w.q}</p>
                        <p className="text-[13px]" style={{ color: "#374151", lineHeight: 1.65, wordBreak: "keep-all" }}>→ {w.guide}</p>
                      </div>
                    ))}
                  </div>
                ) : <Soon text="이 회사가 나를 찌를 만한 질문 2~3개와, 각각 어떻게 받아칠지 방향." />}
              </BriefCard>
              <BriefCard accent="#4F46E5" icon="✅" title="면접 전 숙제">
                {fa?.homework?.length ? (
                  <div className="flex flex-col gap-2">
                    {fa.homework.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 mt-[2px] w-4 h-4 rounded flex items-center justify-center" style={{ border: "1.5px solid #A5B4FC", background: "#EEF2FF" }}>
                          <span style={{ fontSize: 9, color: "#4F46E5", fontWeight: 800 }}>{i + 1}</span>
                        </span>
                        <p className="text-[13px]" style={{ color: "#374151", lineHeight: 1.65, wordBreak: "keep-all" }}>{h}</p>
                      </div>
                    ))}
                  </div>
                ) : <Soon text="가기 전에 직접 확인할 것 — 최근 뉴스 하나, 제품 하나 써보기, 핵심 용어 하나." />}
              </BriefCard>
            </>
          )}

          {/* 기록 (참고) */}
          <PartLabel n="기록" text="완성본 · 대화 다시 보기" />
          {revision && (
            <RecordFold icon="📄" title="완성본" defaultOpen>
              {subtitle && <p className="text-sm font-bold mb-2" style={{ color: "#4C3F99", wordBreak: "keep-all" }}>{subtitle}</p>}
              <p className="text-[13px] whitespace-pre-wrap" style={{ color: "#374151", lineHeight: 1.85, wordBreak: "keep-all" }}>{revision}</p>
            </RecordFold>
          )}
          {diagMsgs.length > 0 && (
            <RecordFold icon="💬" title="디깅 대화 기록">
              <div className="flex flex-col gap-2.5">
                {diagMsgs.map((msg, i) => <LightMsgRow key={msg.id} msg={msg} isDiagnosis={i === 0 && msg.role === "bot"} />)}
              </div>
            </RecordFold>
          )}
          {interviewQs.length > 0 && (
            <RecordFold icon="🎤" title={`면접 예상 Q&A (${interviewQs.length}문항)`}>
              <div className="flex flex-col gap-5">
                {interviewQs.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-2 mb-2.5">
                      <span className="text-xs font-bold flex-shrink-0 mt-[3px]" style={{ color: "#4F46E5" }}>Q{i + 1}</span>
                      <p className="text-[13px] font-semibold" style={{ color: "#111827", wordBreak: "keep-all", lineHeight: 1.6 }}>{q.question}</p>
                    </div>
                    {q.msgs.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {q.msgs.map((msg) => <LightMsgRow key={msg.id} msg={msg} />)}
                      </div>
                    ) : (
                      <p className="text-xs pl-6" style={{ color: "#B6BCC6" }}>답변하지 않은 질문이에요</p>
                    )}
                  </div>
                ))}
              </div>
            </RecordFold>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto w-full px-6 pt-4 pb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs" style={{ color: "#9CA3AF" }}>마이페이지에서 언제든 다시 볼 수 있어요</p>
            <button
              onClick={handlePdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: "#F3F4F6", color: "#4F46E5", border: "1px solid #E5E7EB" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF 저장
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
            >
              완료하기
            </button>
            {onNextItem && (
              <button
                onClick={onNextItem}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
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

/* ── 하위 컴포넌트 (라이트) ── */

function PartLabel({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5 mt-2" style={{ animation: "revealUp .5s ease both" }}>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: "#4F46E5", background: "rgba(79,70,229,0.09)", letterSpacing: "0.06em" }}>{n}</span>
      <span className="text-sm font-bold" style={{ color: "#111827" }}>{text}</span>
      <span className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

function BriefCard({ accent, icon, title, highlight, children }: { accent: string; icon: string; title: string; highlight?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: `1px solid ${highlight ? accent : "#E9EBEF"}`, borderLeft: `3px solid ${accent}`, boxShadow: highlight ? `0 10px 28px -14px ${accent}80` : "0 2px 10px -6px rgba(17,24,39,0.08)", animation: "revealUp .5s ease both" }}>
      <div className="flex items-center gap-2 px-5 pt-4 pb-2.5">
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span className="text-[15px] font-bold" style={{ color: "#111827", wordBreak: "keep-all" }}>{title}</span>
      </div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

function BodyText({ children }: { children: ReactNode }) {
  return <p className="text-sm" style={{ color: "#374151", lineHeight: 1.75, wordBreak: "keep-all" }}>{children}</p>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs mt-2.5" style={{ color: "#9CA3AF", wordBreak: "keep-all" }}>👉 {children}</p>;
}

function Soon({ text }: { text: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "#F9FAFB", border: "1px dashed #D1D5DB" }}>
      <p className="text-[13px]" style={{ color: "#6B7280", lineHeight: 1.65, wordBreak: "keep-all" }}>{text}</p>
      <p className="text-[11px] mt-1.5 font-semibold" style={{ color: "#B6BCC6" }}>곧 채워질 항목이에요</p>
    </div>
  );
}

function InsightRow({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-bold mb-1" style={{ color }}>{label}</p>
      <p className="text-sm" style={{ color: "#374151", lineHeight: 1.7, wordBreak: "keep-all" }}>{text}</p>
    </div>
  );
}

function RecordFold({ icon, title, defaultOpen, children }: { icon: string; title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="rounded-2xl overflow-hidden group" style={{ background: "#FFFFFF", border: "1px solid #E9EBEF", boxShadow: "0 2px 10px -6px rgba(17,24,39,0.08)" }}>
      <summary className="flex items-center gap-2 px-5 py-4 cursor-pointer select-none list-none" style={{ color: "#111827" }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span className="text-sm font-bold flex-1" style={{ wordBreak: "keep-all" }}>{title}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"/></svg>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

function LightMsgRow({ msg, isDiagnosis }: { msg: SummaryMsg; isDiagnosis?: boolean }) {
  const text = stripMd(msg.text).replace(/^AI:\s*/i, "");
  if (!text.trim()) return null;
  const isBot = msg.role === "bot";
  if (isDiagnosis) {
    return (
      <div className="rounded-xl px-4 py-3.5" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <p className="text-xs font-bold mb-1.5" style={{ color: "#4F46E5" }}>초안 진단</p>
        <p className="text-[13px] whitespace-pre-wrap" style={{ color: "#374151", lineHeight: 1.8, wordBreak: "keep-all" }}>{text}</p>
      </div>
    );
  }
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className="rounded-xl px-3.5 py-2.5 text-[13px] whitespace-pre-wrap"
        style={{
          maxWidth: "88%",
          background: isBot ? "#F3F4F6" : "#EEF2FF",
          border: `1px solid ${isBot ? "#E5E7EB" : "#C7D2FE"}`,
          color: "#374151",
          lineHeight: 1.75,
          wordBreak: "keep-all",
        }}
      >
        {text}
      </div>
    </div>
  );
}
