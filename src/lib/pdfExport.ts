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
  changes: string
) {
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>자소서 완성본</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 13px; line-height: 1.85; color: #111827; padding: 48px 52px; }
  h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; letter-spacing: -0.02em; }
  .meta { font-size: 12px; color: #6B7280; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1.5px solid #E5E7EB; }
  .label { font-size: 11px; font-weight: 700; color: #6366F1; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
  .question-box { padding: 12px 16px; background: #F5F3FF; border-radius: 10px; font-size: 12.5px; color: #4C3F99; font-weight: 500; margin-bottom: 24px; line-height: 1.6; word-break: keep-all; }
  .body-text { font-size: 13px; color: #111827; line-height: 2; word-break: keep-all; white-space: pre-wrap; }
  .changes-section { margin-top: 28px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
  .change-item { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #374151; }
  .change-dot { width: 3px; border-radius: 4px; background: #F59E0B; flex-shrink: 0; margin-top: 3px; }
  .char-count { font-size: 11px; color: #9CA3AF; margin-top: 12px; text-align: right; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: right; }
  @page { margin: 0; size: A4; }
</style></head><body>
<h1>자소서 완성본</h1>
<div class="meta">${[companyName, jobTitle].filter(Boolean).join(" · ")}${charLimit ? ` · ${charLimit}자` : ""}</div>
${question ? `<div class="label">문항</div><div class="question-box">${question}</div>` : ""}
<div class="label">완성본</div>
<div class="body-text">${revision}</div>
<div class="char-count">${revision.replace(/\s/g,"").length}자</div>
${changes ? `<div class="changes-section"><div class="label">수정 포인트</div>${changes.split("\n").filter(Boolean).map(c => `<div class="change-item"><div class="change-dot"></div><span>${c.replace(/^[-·]\s*/,"")}</span></div>`).join("")}</div>` : ""}
<div class="footer">취업소크라테스 · ${new Date().toLocaleDateString("ko-KR")}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}
