"use client";

import { useEffect, useState } from "react";
import type { ApiMessage, BridgeData, DiggingContext } from "@/types";

const DOTS = [{ d: 0, c: "#FF6B35" }, { d: 150, c: "#6B8EFF" }, { d: 300, c: "#FFD166" }];

interface Props {
  history: ApiMessage[];
  context: DiggingContext;
  onComplete: (bridge: BridgeData) => void;
}

const SECTIONS: { key: keyof BridgeData; label: string; color: string; sub: string }[] = [
  { key: "section1", label: "직무 이해", color: "#6B8EFF", sub: "이 직무가 왜 존재하는지, 어떤 사람이 필요한지" },
  { key: "section2", label: "경험 비교", color: "#FFD166", sub: "직무 요구사항 vs 내 경험, 솔직한 갭 분석" },
  { key: "section3", label: "포지셔닝 전략", color: "#4ECDC4", sub: "자소서 + 면접 일관된 방향" },
];

export function Step2Bridge({ history, context, onComplete }: Props) {
  const [bridge, setBridge] = useState<BridgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "bridge", history, context }),
        });
        const data: BridgeData = await res.json();
        setBridge(data);
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
          <h2 className="text-xl font-semibold text-white/90">브릿지 분석</h2>
          <p className="text-sm text-white/40 mt-1">{context.jobTitle}</p>
        </div>

        {loading && (
          <div className="flex gap-1.5 items-center py-6">
            {DOTS.map(({ d, c }) => (
              <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: c, animationDelay: `${d}ms` }} />
            ))}
            <span className="text-sm text-white/40 ml-2">브릿지 분석중...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-white/40">분석 중 오류가 발생했어요. 새로고침해주세요.</p>
        )}

        {bridge && (
          <>
            {SECTIONS.map(({ key, label, color, sub }) => (
              <div
                key={key}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}22` }}
              >
                <div className="flex flex-col gap-0.5">
                  <p
                    className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color }}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-white/30">{sub}</p>
                </div>
                <p className="text-sm text-white/78 leading-relaxed">{bridge[key]}</p>
              </div>
            ))}

            <button
              onClick={() => onComplete(bridge)}
              className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
              style={{ background: "#FF6B35" }}
            >
              자소서 작성하기 →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
