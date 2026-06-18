"use client";

export function ChangesCard({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#FDE68A" }}>
        <span style={{ fontSize: "12px" }}>✏️</span>
        <span className="text-sm font-semibold" style={{ color: "#92400E" }}>바뀐 점</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-xs flex-shrink-0 mt-[3px] font-bold" style={{ color: "#B45309" }}>·</span>
            <p className="text-sm leading-relaxed" style={{ color: "#111827", wordBreak: "keep-all" }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
