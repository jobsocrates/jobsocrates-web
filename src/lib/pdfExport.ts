export function parseAnalysisForPDF(content: string): { heading: string; items: string[] }[] {
  return content
    .split(/(?=## \d)/)
    .filter(Boolean)
    .map((section) => {
      const lines = section.trim().split("\n").filter(Boolean);
      const heading = lines[0]?.replace(/^##\s*/, "") ?? "";
      const items = lines
        .slice(1)
        .filter((l) => l.startsWith("- "))
        .map((l) => l.replace(/^-\s*/, "").trim());
      return { heading, items };
    })
    .filter((s) => s.heading && s.items.length > 0);
}

export function exportToPDF(title: string, sections: { heading: string; items: string[] }[], meta?: string) {
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 13px; line-height: 1.75; color: #111827; padding: 48px 52px; }
  h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; letter-spacing: -0.02em; }
  .meta { font-size: 12px; color: #6B7280; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1.5px solid #E5E7EB; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; color: #312E81; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #EDE9FE; }
  .item { display: flex; gap: 10px; margin-bottom: 6px; padding: 8px 12px; background: #F9FAFB; border-radius: 8px; }
  .dot { width: 3px; border-radius: 4px; background: #A78BFA; flex-shrink: 0; margin-top: 2px; }
  .item-text { font-size: 12.5px; color: #374151; line-height: 1.7; word-break: keep-all; }
  .item-label { font-weight: 600; color: #111827; }
  .divider { height: 1px; background: #F3F4F6; margin: 4px 0 28px; }
  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: right; }
  @page { margin: 0; size: A4; }
  @media print { body { padding: 36px 44px; } }
</style></head><body>
<h1>${title}</h1>
${meta ? `<div class="meta">${meta}</div>` : ""}
${sections.map((s, i) => `
  <div class="section">
    <div class="section-title">${s.heading}</div>
    ${s.items.map(item => {
      const colonIdx = item.indexOf(": ");
      if (colonIdx > 0 && colonIdx < 20) {
        return `<div class="item"><div class="dot"></div><div class="item-text"><span class="item-label">${item.slice(0, colonIdx)}</span>${item.slice(colonIdx)}</div></div>`;
      }
      return `<div class="item"><div class="dot"></div><div class="item-text">${item}</div></div>`;
    }).join("")}
  </div>
  ${i < sections.length - 1 ? '<div class="divider"></div>' : ''}
`).join("")}
<div class="footer">취업소크라테스 · ${new Date().toLocaleDateString("ko-KR")}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

export function exportCoverLetterPDF(
  companyName: string,
  jobTitle: string,
  question: string,
  charLimit: string,
  revision: string,
  changes: string,
  draft: string = "",
  interviewQs: { question: string; msgs: { role: string; text: string }[] }[] = [],
  subtitle: string = ""
) {
  const revLen = revision.trim().length;
  const over = !!charLimit && revLen > Number(charLimit);
  const metaText = [companyName, jobTitle].filter(Boolean).join("  ·  ") + (charLimit ? `  ·  ${charLimit}자` : "");
  const changeItems = changes
    ? changes.split("\n").map((c) => c.replace(/^[-·•]\s*/, "").trim()).filter(Boolean)
    : [];

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>자소서 완성본 — ${[companyName, jobTitle].filter(Boolean).join(" ") || "취업소크라테스"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #1F2430; padding: 54px 56px 40px; }
  .brand { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #A78BFA; margin-bottom: 14px; }
  .doc-title { font-size: 23px; font-weight: 800; color: #16182B; letter-spacing: -0.03em; }
  .accent-rule { width: 46px; height: 3px; background: linear-gradient(90deg, #1A3461, #312E81); border-radius: 2px; margin: 11px 0 16px; }
  .meta { font-size: 12.5px; color: #6B7280; margin-bottom: 34px; padding-bottom: 18px; border-bottom: 1px solid #ECEEF2; }
  .label { font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #6366F1; margin-bottom: 10px; }
  .question-box { padding: 13px 17px; background: #F5F3FF; border-left: 3px solid #A78BFA; border-radius: 0 9px 9px 0; font-size: 12.5px; color: #4C3F99; font-weight: 500; line-height: 1.65; margin-bottom: 32px; word-break: keep-all; }
  .final-block { padding: 24px 26px; background: #FBFAFF; border: 1px solid #E9E4FB; border-radius: 16px; }
  .body-text { font-size: 13.5px; color: #1F2430; line-height: 2.05; word-break: keep-all; white-space: pre-wrap; }
  .char-count { font-size: 11px; color: #9CA3AF; text-align: right; margin: 10px 2px 34px; }
  .char-count .over { color: #DC2626; font-weight: 700; }
  .changes-section { margin-bottom: 34px; }
  .change-item { display: flex; gap: 10px; margin-bottom: 9px; align-items: flex-start; }
  .change-num { flex-shrink: 0; width: 19px; height: 19px; border-radius: 6px; background: #FEF3C7; color: #B45309; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
  .change-text { font-size: 12.5px; color: #374151; line-height: 1.7; word-break: keep-all; }
  .before-wrap { margin-bottom: 8px; }
  .before-block { padding: 19px 22px; background: #F7F8FA; border: 1px solid #ECEEF2; border-radius: 16px; }
  .before-text { font-size: 12px; color: #969BA5; line-height: 1.95; word-break: keep-all; white-space: pre-wrap; }
  .before-hint { font-size: 11px; color: #B6BCC6; margin: 7px 2px 0; }
  .iq-section { margin-bottom: 34px; }
  .iq { margin-bottom: 16px; padding-bottom: 13px; border-bottom: 1px dashed #ECEEF2; }
  .iq:last-child { border-bottom: none; padding-bottom: 0; }
  .iq-q { font-size: 12.5px; font-weight: 700; color: #4C3F99; line-height: 1.6; word-break: keep-all; margin-bottom: 8px; }
  .iq-num { display: inline-block; background: #EDE9FE; color: #6366F1; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 5px; margin-right: 6px; }
  .iq-msg { margin: 6px 0 0 4px; padding: 8px 12px; border-radius: 9px; }
  .iq-user { background: #F3F4F6; }
  .iq-bot { background: #F5F3FF; }
  .iq-role { font-size: 9.5px; font-weight: 800; letter-spacing: 0.08em; color: #9CA3AF; margin-bottom: 3px; }
  .iq-bot .iq-role { color: #A78BFA; }
  .iq-text { font-size: 12px; color: #374151; line-height: 1.7; word-break: keep-all; white-space: pre-wrap; }
  .footer { margin-top: 42px; padding-top: 14px; border-top: 1px solid #ECEEF2; font-size: 10.5px; color: #B6BCC6; display: flex; justify-content: space-between; align-items: center; }
  @page { margin: 0; size: A4; }
  @media print { body { padding: 42px 46px; } .final-block, .before-block { break-inside: avoid; } }
</style></head><body>
  <div class="brand">JobSocrates · 취업소크라테스</div>
  <div class="doc-title">자소서 완성본</div>
  <div class="accent-rule"></div>
  <div class="meta">${metaText}</div>

  ${question ? `<div class="label">문항</div><div class="question-box">${question}</div>` : ""}

  <div class="label">완성본</div>
  ${subtitle ? `<div style="font-size:17px;font-weight:800;color:#16182B;letter-spacing:-0.02em;margin-bottom:11px;padding-left:2px;">${subtitle}</div>` : ""}
  <div class="final-block"><div class="body-text">${revision}</div></div>
  <div class="char-count"><span class="${over ? "over" : ""}">${revLen}자</span>${charLimit ? ` / ${charLimit}자` : ""}</div>

  ${changeItems.length > 0 ? `<div class="changes-section"><div class="label">수정 포인트</div>${changeItems.map((c, i) => `<div class="change-item"><div class="change-num">${i + 1}</div><div class="change-text">${c}</div></div>`).join("")}</div>` : ""}

  ${interviewQs.length > 0 ? `<div class="iq-section"><div class="label">면접 예상 질문 & 연습</div>${interviewQs.map((q, i) => `<div class="iq"><div class="iq-q"><span class="iq-num">Q${i + 1}</span>${q.question}</div>${q.msgs.map((m) => `<div class="iq-msg ${m.role === "user" ? "iq-user" : "iq-bot"}"><div class="iq-role">${m.role === "user" ? "내 답변" : "코치"}</div><div class="iq-text">${m.text}</div></div>`).join("")}</div>`).join("")}</div>` : ""}

  ${draft && draft.trim() ? `<div class="before-wrap"><div class="label" style="color:#9CA3AF;">수정 전 초안</div><div class="before-block"><div class="before-text">${draft}</div></div><div class="before-hint">처음 작성한 초안이에요. 완성본과 비교해보세요.</div></div>` : ""}

  <div class="footer"><span>취업소크라테스로 작성했습니다</span><span>${new Date().toLocaleDateString("ko-KR")}</span></div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}
