"use client";

import { useEffect, useState } from "react";
import { DOTS, REVISION_LOADING_MSGS } from "@/lib/chatConstants";

export function RevisionLoadingCard() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => Math.min(p + 1, REVISION_LOADING_MSGS.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
        <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>완성본</span>
      </div>
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="flex gap-1.5">
          {DOTS.map(({ delay, color }) => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
          ))}
        </div>
        <span className="text-sm" style={{ color: "#6B7280" }}>{REVISION_LOADING_MSGS[idx]}</span>
      </div>
    </div>
  );
}
