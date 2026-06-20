"use client";

import { DOTS } from "@/lib/chatConstants";
import { stripMd } from "@/lib/chatUtils";

export function DiagnosisCard({ text, streaming }: { text: string; streaming: boolean }) {
  const stripped = stripMd(text);
  const lines = stripped.split("\n");

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
        <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>초안 진단</span>
      </div>
      <div className="px-5 py-4">
        {streaming && text === "" ? (
          <div className="flex gap-1.5 items-center h-5">
            {DOTS.map(({ delay, color }) => (
              <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {lines.map((line, i) => {
              if (line.trim() === "" ) {
                return <div key={i} style={{ height: "12px" }} />;
              }
              if (line === "---" || line === "——" || line === "──────────") {
                return <div key={i} className="my-3" style={{ height: 1, background: "#C4B5FD" }} />;
              }
              const isCircled = line.startsWith("①") || line.startsWith("②") || line.startsWith("③");
              const isShortHeader = !isCircled && line.trim().length <= 14 && !/[요다,。？！]$/.test(line) && !/\.\.\.$/.test(line);
              if (isCircled || isShortHeader) {
                return (
                  <p
                    key={i}
                    className="text-sm font-semibold"
                    style={{
                      color: "#111827",
                      marginTop: i !== 0 ? "18px" : 0,
                      marginBottom: "6px",
                      wordBreak: "keep-all",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {line}
                  </p>
                );
              }
              return (
                <p
                  key={i}
                  className="text-sm leading-[1.85]"
                  style={{ color: "#111827", wordBreak: "keep-all" }}
                >
                  {line}
                </p>
              );
            })}
            {streaming && lines.length > 0 && (
              <div className="flex gap-1.5 items-center h-5 mt-2">
                {DOTS.map(({ delay, color }) => (
                  <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
