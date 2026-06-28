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

export interface FinalAnalysis {
  companyJob: string;
  weapons: { title: string; competency?: string; detail: string }[];
  interviewKeys: { q: string; a: string }[];
  insight: { edge: string; caution: string; direction: string };
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
  ${finalAnalysis.companyJob ? `<div class="op-block op-company"><p class="op-label">🏢 이 회사·직무 (이건 말할 수 있어야 해요)</p><p class="op-text">${escHtml(finalAnalysis.companyJob)}</p><p class="op-note">취업소크라테스가 정리한 초안이에요. 맞는지 확인하고 본인 말로 다시 정리해보세요.</p></div>` : ""}
  ${finalAnalysis.weapons?.length ? `<div class="op-block"><p class="op-label">💪 내 무기</p>${finalAnalysis.weapons.map((w, i) => `<div class="op-wp"><p class="op-wp-t"><span class="op-wp-n">${String(i + 1).padStart(2, "0")}</span> ${escHtml(w.title)}</p>${w.competency ? `<p class="op-wp-row"><span class="op-wp-lab">역량</span> ${escHtml(w.competency)}</p>` : ""}<p class="op-wp-row"><span class="op-wp-lab">근거</span> ${escHtml(w.detail)}</p></div>`).join("")}</div>` : ""}
  ${finalAnalysis.interviewKeys?.length ? `<div class="op-block"><p class="op-label">🎤 이 질문엔 이렇게</p>${finalAnalysis.interviewKeys.map(k => `<div class="op-qa"><p class="op-q">Q. ${escHtml(k.q)}</p><p class="op-a">→ ${escHtml(k.a)}</p></div>`).join("")}</div>` : ""}
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
export function CoverLetterSummary({ jobTitle, question, draft, msgs, interviewQs = [], analysisContent, finalAnalysis, finalAnalysisLoading, onClose, onNextItem }: Props) {
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

          {/* ★ 당신 분석 (자기이해 리포트) */}
          {(finalAnalysis || finalAnalysisLoading) && (
            <section>
              <style>{`@keyframes revealUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ animation: "revealUp .5s ease both" }}>
                <p style={{ fontSize: 21, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
                  🎉 {jobTitle ? `${jobTitle} ` : ""}면접, 이렇게 준비됐어요
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6, lineHeight: 1.6, wordBreak: "keep-all" }}>면접장에 들고 갈 한 장이에요. 외워서 읽지 말고, 사실을 확인한 뒤 본인 말로 다시 정리해보세요.</p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, animation: "revealUp .5s ease .08s both" }}>
                <Stat label="완성본" value={`${revision.length}자`} />
                <Stat label="면접 대비" value={`${interviewQs.length}문항`} />
                {finalAnalysis && finalAnalysis.weapons?.length > 0 && <Stat label="내 무기" value={`${finalAnalysis.weapons.length}개`} />}
                {draft?.trim() && <Stat label="초안 → 완성" value="한 단계 ↑" />}
              </div>

              {finalAnalysisLoading && !finalAnalysis ? (
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#A78BFA", display: "inline-block", animation: "spin .8s linear infinite" }} />
                  면접 한 장을 정리하고 있어요…
                </div>
              ) : finalAnalysis ? (
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  {finalAnalysis.companyJob && (
                    <div style={{ animation: "revealUp .5s ease .16s both", padding: "16px 18px", borderRadius: 16, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#60A5FA", marginBottom: 7 }}>🏢 이 회사·직무 (이건 말할 수 있어야 해요)</p>
                      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.92)", wordBreak: "keep-all" }}>{finalAnalysis.companyJob}</p>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: 9, wordBreak: "keep-all" }}>👉 취업소크라테스가 정리한 초안이에요. 맞는지 확인하고, 본인 말로 다시 정리해보세요.</p>
                    </div>
                  )}
                  {finalAnalysis.weapons?.length > 0 && (
                    <div style={{ animation: "revealUp .5s ease .24s both" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "rgb(74,222,128)", marginBottom: 10 }}>💪 내 무기</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {finalAnalysis.weapons.map((s, i) => (
                          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.18)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "rgb(74,222,128)", background: "rgba(74,222,128,0.14)" }}>{String(i + 1).padStart(2, "0")}</span>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", wordBreak: "keep-all" }}>{s.title}</p>
                            </div>
                            {s.competency && (
                              <div style={{ display: "flex", gap: 8, marginBottom: 7, paddingLeft: 31 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", flexShrink: 0, marginTop: 2 }}>역량</span>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgb(134,239,172)", wordBreak: "keep-all" }}>{s.competency}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, paddingLeft: 31 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", flexShrink: 0, marginTop: 3 }}>근거</span>
                              <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>{s.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {finalAnalysis.interviewKeys?.length > 0 && (
                    <div style={{ animation: "revealUp .5s ease .32s both" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#FF8A65", marginBottom: 10 }}>🎤 이 질문엔 이렇게</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {finalAnalysis.interviewKeys.map((k, i) => (
                          <div key={i} style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(255,138,101,0.06)", border: "1px solid rgba(255,138,101,0.2)" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#FFB59B", marginBottom: 5, wordBreak: "keep-all" }}>Q. {k.q}</p>
                            <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>→ {k.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {finalAnalysis.insight && (
                    <div style={{ animation: "revealUp .5s ease .4s both", padding: "16px 18px", borderRadius: 16, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)", display: "flex", flexDirection: "column", gap: 13 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#A78BFA" }}>👀 취업소크라테스가 본 당신</p>
                      {finalAnalysis.insight.edge && (
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgb(134,239,172)", marginBottom: 4 }}>✨ 이게 진짜 강점이에요</p>
                          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", wordBreak: "keep-all" }}>{finalAnalysis.insight.edge}</p>
                        </div>
                      )}
                      {finalAnalysis.insight.caution && (
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#FFD166", marginBottom: 4 }}>⚠️ 이건 조심하면 좋아요</p>
                          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", wordBreak: "keep-all" }}>{finalAnalysis.insight.caution}</p>
                        </div>
                      )}
                      {finalAnalysis.insight.direction && (
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#FF8A65", marginBottom: 4 }}>🎯 그래서 면접에선</p>
                          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", wordBreak: "keep-all" }}>{finalAnalysis.insight.direction}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          )}

          {/* 00 · 기업·직무 분석 보고서 */}
          {analysisContent?.trim() && (
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
              {revision && subtitle && (
                <p className="text-base font-bold" style={{ color: "#fff", letterSpacing: "-0.02em", marginBottom: -6 }}>{subtitle}</p>
              )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: "1 1 120px", minWidth: 110, padding: "12px 14px", borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{value}</p>
    </div>
  );
}

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
