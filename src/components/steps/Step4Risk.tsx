"use client";

import { useEffect, useState } from "react";
import type { ApiMessage, DiggingContext, InterviewRisk } from "@/types";

const DOTS = [{ d: 0, c: "#FF6B35" }, { d: 150, c: "#6B8EFF" }, { d: 300, c: "#FFD166" }];

interface Props {
  history: ApiMessage[];
  context: DiggingContext;
  coverLetter: string;
  onComplete?: (risks: InterviewRisk[]) => void;
}

export function Step4Risk({ history, context, coverLetter, onComplete }: Props) {
  const [risks, setRisks] = useState<InterviewRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "interview-risk", history, context, coverLetter }),
        });
        const data: InterviewRisk[] = await res.json();
        const loaded = Array.isArray(data) ? data : [];
        setRisks(loaded);
        onComplete?.(loaded);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-white/90">면접 준비 노트</h2>
          <p className="text-sm text-white/40 mt-1">면접관이 파고들 수 있는 포인트와 대응 방향</p>
        </div>

        {loading && (
          <div className="flex gap-1.5 items-center py-6">
            {DOTS.map(({ d, c }) => (
              <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: c, animationDelay: `${d}ms` }} />
            ))}
            <span className="text-sm text-white/40 ml-2">면접 준비 노트 생성중...</span>
          </div>
        )}
        {error && <p className="text-sm text-white/40">분석 중 오류가 발생했어요.</p>}

        {risks.map((risk, i) => (
          <div key={i} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,53,0.15)", color: "#FF6B35" }}>
                리스크 {i + 1}
              </span>
              <p className="text-sm font-medium text-white/85">{risk.title}</p>
            </div>
            <p className="text-sm text-white/55 leading-relaxed">{risk.description}</p>
            <div className="rounded-xl p-3 text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)" }}>
              <span className="text-xs text-white/35 block mb-1.5">대응 방향</span>
              {risk.response}
            </div>
          </div>
        ))}

        {!loading && !error && risks.length === 0 && (
          <p className="text-sm text-white/40">리스크 포인트를 찾지 못했어요.</p>
        )}
      </div>
    </div>
  );
}
