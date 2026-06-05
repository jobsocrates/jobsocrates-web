"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiMessage, BridgeData, DiggingContext } from "@/types";

const ACCENT = "#FF6B35";

interface Props {
  history: ApiMessage[];
  context: DiggingContext;
  bridge: BridgeData;
  onComplete: (coverLetter: string) => void;
}

function stripMd(t: string) {
  return t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

export function Step3CoverLetter({ history, context, bridge, onComplete }: Props) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "cover-letter", history, context, bridge }),
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = "";
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          full += dec.decode(value, { stream: true });
          setText(full);
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        setDone(true);
      } catch {
        setText("자소서 생성 중 오류가 발생했어요.");
        setDone(true);
      }
    })();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8">
      <div className="max-w-xl mx-auto flex flex-col gap-5">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-white/90">자소서 초안</h2>
          <p className="text-sm text-white/40 mt-1">
            {context.jobTitle} · {context.question.slice(0, 30)}{context.question.length > 30 ? "..." : ""}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 text-sm leading-[1.9] whitespace-pre-wrap relative"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", minHeight: "200px" }}
        >
          {stripMd(text)}
          {!done && (
            <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ background: ACCENT }} />
          )}
          {!text && !done && (
            <div className="flex gap-1.5 items-center absolute top-6 left-6">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: ACCENT, animationDelay: `${d}ms` }} />
              ))}
              <span className="text-sm text-white/40 ml-2">자소서 작성중...</span>
            </div>
          )}
        </div>

        {done && (
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all border"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: copied ? ACCENT : "rgba(255,255,255,0.6)" }}
            >
              {copied ? "복사됨 ✓" : "복사하기"}
            </button>
            <button
              onClick={() => onComplete(text)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              면접 준비 노트 보기 →
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
