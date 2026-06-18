"use client";

import { VIOLET, ACCENT, DOTS } from "@/lib/chatConstants";
import type { InterviewQItem } from "@/types/chat";

interface Props {
  item: InterviewQItem;
  index: number;
  onToggle: () => void;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
}

export function InterviewQCard({ item, index, onToggle, onInputChange, onSubmit }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#F5F3FF",
        border: `1px solid ${item.isExpanded ? "#C4B5FD" : "#DDD6FE"}`,
        transition: "border-color 0.2s",
      }}
    >
      <button
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:opacity-80 transition-opacity"
        onClick={onToggle}
      >
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-[1px]"
          style={{ background: VIOLET, color: "#fff" }}
        >
          {index + 1}
        </div>
        <p className="flex-1 text-sm leading-relaxed" style={{ color: "#111827", wordBreak: "keep-all" }}>
          {item.question}
        </p>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={VIOLET} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 mt-[1px]"
          style={{ transform: item.isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {item.isExpanded && (
        <div className="border-t" style={{ borderColor: `${VIOLET}1C` }}>
          {item.msgs.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex flex-col gap-2.5">
              {item.msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <img src="/logo.jpg" alt="" className="w-6 h-6 rounded-md object-contain flex-shrink-0 mb-0.5" style={{ background: "#fff", padding: "1px" }} />
                  )}
                  <div
                    className="max-w-[85%] px-4 py-3 text-sm leading-[1.8] whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? { background: ACCENT, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
                        : { background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #E5E7EB" }
                    }
                  >
                    {msg.role === "bot" && msg.text === "" ? (
                      <div className="flex gap-1.5 items-center h-4">
                        {DOTS.map(({ delay, color }) => (
                          <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    ) : msg.role === "bot" ? msg.text.replace(/^AI:\s*/i, "") : msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {item.msgs.length === 0 && (
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-end gap-2">
                <textarea
                  value={item.inputText}
                  onChange={(e) => onInputChange(e.target.value.slice(0, 300))}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 200) + "px";
                  }}
                  disabled={item.isLoadingFeedback}
                  placeholder="답변을 입력하세요"
                  rows={2}
                  className="flex-1 focus:outline-none disabled:opacity-30 resize-none placeholder:opacity-35"
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "#111827",
                    maxHeight: "200px",
                    overflowY: "auto",
                    outline: "none",
                  }}
                />
                <button
                  onClick={onSubmit}
                  disabled={item.isLoadingFeedback || !item.inputText.trim()}
                  className="flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25"
                  style={{ background: VIOLET, color: "#fff", padding: "0 14px", height: "40px", whiteSpace: "nowrap" }}
                >
                  전송
                </button>
              </div>
              <div className="flex justify-end">
                <span className="text-xs tabular-nums" style={{ color: item.inputText.length >= 270 ? "rgba(239,68,68,0.8)" : "#6B7280" }}>
                  {item.inputText.length}/300
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
