"use client";

import { VIOLET, ACCENT, DOTS } from "@/lib/chatConstants";
import type { InterviewQItem } from "@/types/chat";

interface Props {
  item: InterviewQItem;
  index: number;
  onToggle: () => void;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onFinish: () => void;
}

export function InterviewQCard({ item, index, onToggle, onInputChange, onSubmit, onRetry, onFinish }: Props) {
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

          {(item.phase === "initial" || item.phase === "retrying") && !item.isLoadingFeedback && (
            <div className="px-4 py-3 flex flex-col gap-1.5">
              {item.phase === "retrying" && (
                <p className="text-xs mb-0.5 leading-relaxed" style={{ color: VIOLET }}>
                  피드백을 반영해 다시 써보세요. 문장은 제가 다듬어드릴게요.
                </p>
              )}
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
                  placeholder={item.phase === "retrying" ? "피드백을 반영해 다시 답해보세요\n실전처럼, 50초 분량(약 300자)으로 정리해보세요" : "실제 면접이라 생각하고 말하듯 답해보세요\n50초 분량(약 300자)이 면접에서 가장 좋아요"}
                  rows={2}
                  className="flex-1 focus:outline-none disabled:opacity-30 resize-none placeholder:opacity-60"
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
                  {item.inputText.length}/300자 · 약 50초
                </span>
              </div>
            </div>
          )}

          {item.phase === "feedback" && (
            <div className="px-4 pb-3 pt-1 flex gap-2">
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center rounded-xl text-xs font-semibold py-2.5 transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ background: VIOLET, color: "#fff" }}
              >
                피드백대로 다시 써보기
              </button>
              <button
                onClick={onFinish}
                className="flex items-center justify-center rounded-xl text-xs font-semibold py-2.5 px-4 transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ background: "#FFFFFF", color: "#6B7280", border: "1px solid #E5E7EB" }}
              >
                그냥 마무리
              </button>
            </div>
          )}

          {item.phase === "polished" && (
            <div className="px-4 pb-3 pt-0.5">
              <span className="text-xs" style={{ color: VIOLET }}>문장을 다듬었어요. 이렇게 말하면 더 깔끔해요.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
