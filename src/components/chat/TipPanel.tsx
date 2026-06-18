"use client";

import { GOLD } from "@/lib/chatConstants";

export function TipPanel({ hasRevision, revisionReady }: { hasRevision: boolean; revisionReady: boolean }) {
  const tips = [
    { icon: "💬", text: "① 상황 ② 내가 한 행동\n③ 결과\n이 세 가지가 다 들어가게 구체적으로 답해보세요.\n그럼 더 탄탄한 자소서가 탄생합니다." },
    { icon: "🎙️", text: "실제 면접이라 생각하고 작성해보세요.\n면접 준비가 함께 돼요." },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="w-1 h-3 rounded-full" style={{ background: GOLD }} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#6B7280", letterSpacing: "0.08em" }}>답변 팁</span>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-4 flex flex-col gap-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-lg flex-shrink-0 leading-none mt-0.5">{tip.icon}</span>
            <p className="text-sm leading-[1.7]" style={{ color: "#111827", wordBreak: "keep-all", whiteSpace: "pre-line", overflowWrap: "break-word" }}>{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
