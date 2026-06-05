"use client";

import { useState } from "react";
import type { BridgeData, InterviewRisk } from "@/types";

function stripMd(t: string) {
  return t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function Accordion({
  title,
  color,
  defaultOpen = false,
  children,
}: {
  title: string;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)" }}
      >
        <span className="text-sm font-semibold" style={{ color }}>
          {title}
        </span>
        <span
          className="text-xs transition-transform"
          style={{
            color: "rgba(255,255,255,0.3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          className="px-5 py-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface Props {
  bridge: BridgeData;
  coverLetter: string;
  risks: InterviewRisk[];
}

export function SummaryPage({ bridge, coverLetter, risks }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8">
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-white/90">전체 정리</h2>
        </div>

        {/* Bridge */}
        <Accordion title="브릿지 분석" color="#FFD166" defaultOpen>
          <div className="flex flex-col gap-4">
            {[
              { label: "직무 이해", text: bridge.section1, color: "#6B8EFF" },
              { label: "경험 비교", text: bridge.section2, color: "#FFD166" },
              { label: "포지셔닝 전략", text: bridge.section3, color: "#4ECDC4" },
            ].map(({ label, text, color }) => (
              <div key={label}>
                <p className="text-xs font-medium mb-1.5" style={{ color }}>{label}</p>
                <p className="text-sm text-white/70 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Accordion>

        {/* Cover Letter */}
        <Accordion title="자소서 초안" color="#4ECDC4">
          <p className="text-sm leading-[1.9] whitespace-pre-wrap text-white/80">
            {stripMd(coverLetter)}
          </p>
        </Accordion>

        {/* Risks */}
        <Accordion title="면접 준비 노트" color="#FF6B35">
          <div className="flex flex-col gap-4">
            {risks.map((risk, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-white/85">{risk.title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{risk.description}</p>
                <div
                  className="rounded-xl px-3 py-2 text-xs leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)" }}
                >
                  <span className="text-white/30 block mb-1">대응 방향</span>
                  {risk.response}
                </div>
                {i < risks.length - 1 && (
                  <div className="h-px mt-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
        </Accordion>
      </div>
    </div>
  );
}
