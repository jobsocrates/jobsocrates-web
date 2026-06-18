"use client";

import { DOTS, DS_MUTED } from "@/lib/chatConstants";
import { stripMd } from "@/lib/chatUtils";

export function DiagnosisCard({ text, streaming }: { text: string; streaming: boolean }) {
  const stripped = stripMd(text);
  let splitIdx = stripped.search(/(이 중에서|가장 약한 부분인)/);
  if (splitIdx === -1) {
    const afterThird = stripped.lastIndexOf("③");
    if (afterThird !== -1) {
      const nnIdx = stripped.indexOf("\n\n", afterThird);
      if (nnIdx !== -1) splitIdx = nnIdx;
    }
  }
  const mainText = splitIdx !== -1 ? stripped.slice(0, splitIdx).trim() : stripped;
  const followText = splitIdx !== -1 ? stripped.slice(splitIdx).trim() : null;
  const lines = mainText.split("\n").filter((l) => l.trim() !== "");

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}
      >
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
                if (line === "---" || line === "——" || line === "──────────") {
                  return <div key={i} className="my-3" style={{ height: 1, background: "#C4B5FD" }} />;
                }
                const isCircled = line.startsWith("①") || line.startsWith("②") || line.startsWith("③");
                const isShortHeader = !isCircled && line.length <= 14 && !/[요다요다,。？！]$/.test(line) && !/\.\.\.$/.test(line);
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
              {streaming && !followText && lines.length > 0 && (
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

      {followText && (
        <div className="flex items-end gap-2.5">
          <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-0.5" style={{ background: "#fff", padding: "2px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }} />
          <div
            className="max-w-[82%] px-4 py-3.5 text-sm leading-[1.85] whitespace-pre-wrap"
            style={{ background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "none", border: "1px solid #E5E7EB" }}
          >
            {followText}
            {streaming && (
              <span className="inline-flex gap-1 ml-2 items-center align-middle">
                {DOTS.map(({ delay, color }) => (
                  <span key={delay} className="w-1 h-1 rounded-full animate-bounce inline-block" style={{ background: color, animationDelay: `${delay}ms` }} />
                ))}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
