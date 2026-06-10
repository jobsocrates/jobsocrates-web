"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiMessage, DiggingContext, Experience } from "@/types";

const ACCENT = "#FF6B35";
const EXP_TYPES = ["인턴", "알바", "프로젝트", "캡스톤", "대외활동", "기타"];

const CHIP_COLORS: Record<string, string> = {
  인턴: "#6B8EFF",
  알바: "#FFD166",
  프로젝트: "#4ECDC4",
  캡스톤: "#FF6B35",
  대외활동: "#A8E6CF",
  기타: "#C7B3FF",
};

const DOTS = [
  { delay: 0, color: "#FF6B35" },
  { delay: 150, color: "#6B8EFF" },
  { delay: 300, color: "#FFD166" },
];

const FIRST_MSG =
  "안녕하세요. 취업소크라테스에요 🏛️\n우리 같이 내 이야기로 자소서 만들어봐요!\n\n먼저 지원 직무가 어떻게 돼요?";

type SubStage = "greeting" | "question" | "expType" | "expInput" | "digging";
type MsgUI = "chips";

interface ChatMsg {
  id: number;
  role: "bot" | "user";
  text: string;
  ui?: MsgUI;
}

let _id = 0;
const uid = () => ++_id;

function stripMd(t: string) {
  return t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

function ChipBtn({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = CHIP_COLORS[label] || ACCENT;
  const lit = hovered || active;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-sm px-4 py-2 rounded-full border"
      style={{
        borderColor: color,
        color: lit ? "#0D0D18" : color,
        background: lit ? color : `${color}15`,
        boxShadow: lit ? `0 0 12px ${color}50` : "none",
        transform: lit ? "scale(1.06)" : "scale(1)",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

export function Step1Digging({
  onComplete,
}: {
  onComplete: (history: ApiMessage[], context: DiggingContext) => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ id: uid(), role: "bot", text: FIRST_MSG }]);
  const [stage, setStage] = useState<SubStage>("greeting");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [completionData, setCompletionData] = useState<{ history: ApiMessage[]; ctx: DiggingContext } | null>(null);

  // context
  const [jobTitle, setJobTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [currentExpType, setCurrentExpType] = useState<string | null>(null);
  const [etcMode, setEtcMode] = useState(false);
  const [etcText, setEtcText] = useState("");

  // digging
  const [digHistory, setDigHistory] = useState<ApiMessage[]>([]);
  const [digCount, setDigCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const charLimit = stage === "expInput" ? 150 : stage === "digging" ? 200 : null;
  const lastMsgId = msgs[msgs.length - 1]?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, isStreaming, completionData]);

  function pushBot(text: string, ui?: MsgUI) {
    const msg: ChatMsg = { id: uid(), role: "bot", text, ui };
    setMsgs((p) => [...p, msg]);
    return msg.id;
  }

  function pushUser(text: string) {
    setMsgs((p) => [...p, { id: uid(), role: "user", text }]);
  }

  function updateMsg(id: number, text: string) {
    setMsgs((p) => p.map((m) => (m.id === id ? { ...m, text } : m)));
  }

  // ── main send ──────────────────────────────────────────────────────────────

  function handleSend() {
    const t = input.trim();
    if (!t || isStreaming || completionData) return;
    setInput("");

    if (stage === "greeting") {
      setJobTitle(t);
      pushUser(t);
      pushBot("어떤 자소서 문항인지 알려줘요.");
      setStage("question");
    } else if (stage === "question") {
      setQuestion(t);
      pushUser(t);
      goToExpType();
    } else if (stage === "digging") {
      handleDiggingInput(t);
    }
  }

  // ── experience ─────────────────────────────────────────────────────────────

  function goToExpType() {
    pushBot("어떤 경험을 쓸 건지 골라볼게요.", "chips");
    setStage("expType");
  }

  function selectExpType(type: string) {
    if (type === "기타") {
      setEtcMode(true);
      return;
    }
    setEtcMode(false);
    setEtcText("");
    setCurrentExpType(type);
    pushUser(type);
    pushBot("이 문항에 어떤 경험을 쓰고 싶어요? 짧게 써도 괜찮아요. 어차피 더 물어볼거에요 😊");
    setStage("expInput");
  }

  function confirmEtcType() {
    const t = etcText.trim();
    if (!t) return;
    setCurrentExpType(t);
    pushUser(t);
    setEtcMode(false);
    setEtcText("");
    pushBot("이 문항에 어떤 경험을 쓰고 싶어요? 짧게 써도 괜찮아요. 어차피 더 물어볼거에요 😊");
    setStage("expInput");
  }

  function submitExpInput() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    const newExp: Experience = { type: currentExpType || "기타", text: t };
    setExperiences([newExp]);
    setCurrentExpType(null);
    pushUser(t);
    startDigging([newExp]);
  }

  // ── digging ────────────────────────────────────────────────────────────────

  async function startDigging(exps: Experience[]) {
    setStage("digging");
    const ctx: DiggingContext = { jobTitle, question, experiences: exps };
    const seed: ApiMessage[] = [{ role: "user", content: "첫 번째 질문을 시작해줘." }];
    setDigHistory(seed);
    setDigCount(0);
    await fetchDigQuestion(seed, ctx);
  }

  async function handleDiggingInput(text: string) {
    pushUser(text);
    const newHistory: ApiMessage[] = [...digHistory, { role: "user", content: text }];
    setDigHistory(newHistory);
    const next = digCount + 1;
    setDigCount(next);

    if (next >= 6) {
      pushBot("충분히 이야기 나눴어요. 이제 분석해드릴게요!");
      const ctx: DiggingContext = { jobTitle, question, experiences };
      setCompletionData({ history: newHistory, ctx });
    } else {
      const ctx: DiggingContext = { jobTitle, question, experiences };
      await fetchDigQuestion(newHistory, ctx);
    }
  }

  async function fetchDigQuestion(history: ApiMessage[], ctx: DiggingContext) {
    setIsStreaming(true);
    const id = uid();
    setMsgs((p) => [...p, { id, role: "bot", text: "" }]);

    let full = "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "digging", messages: history, context: ctx }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        updateMsg(id, full);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      setDigHistory([...history, { role: "assistant", content: full }]);
    } catch {
      updateMsg(id, "오류가 발생했어요. 다시 시도해줘요.");
    } finally {
      setIsStreaming(false);
    }
  }

  function handleTransition() {
    if (!completionData) return;
    setFadingOut(true);
    setTimeout(() => onComplete(completionData.history, completionData.ctx), 500);
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  const inputDisabled = isStreaming || !!completionData || ["expType", "jd"].includes(stage);
  const placeholder =
    stage === "expInput"
      ? "짧게 써도 괜찮아요. 어차피 더 물어볼게요 :)"
      : ["expType", "jd"].includes(stage)
      ? "위에서 선택해주세요"
      : "답변을 입력하세요...";

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ opacity: fadingOut ? 0 : 1, transition: "opacity 0.5s ease" }}
    >
      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto flex flex-col gap-5">
          {msgs.map((msg) => {
            // 빈 streaming placeholder는 숨김 — 아래 dots indicator가 담당
            if (isStreaming && msg.id === lastMsgId && msg.role === "bot" && msg.text === "") {
              return null;
            }
            return (
              <div key={msg.id}>
                <div
                  className={`flex items-end gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5"
                      style={{ background: "#6B8EFF", color: "#fff", fontWeight: 700 }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "bot"
                        ? { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderRadius: "4px 16px 16px 16px" }
                        : { background: ACCENT, color: "#fff", borderRadius: "16px 4px 16px 16px" }
                    }
                  >
                    {msg.role === "bot" ? stripMd(msg.text) : msg.text}
                    {/* streaming cursor */}
                    {isStreaming && msg.id === lastMsgId && msg.role === "bot" && msg.text !== "" && (
                      <span
                        className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                        style={{ background: ACCENT }}
                      />
                    )}
                  </div>
                </div>

                {/* UI elements — last bot msg only, not streaming */}
                {msg.ui && msg.id === lastMsgId && !isStreaming && !completionData && (
                  <div className="mt-3 ml-9">
                    {/* chips */}
                    {msg.ui === "chips" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                          {EXP_TYPES.map((opt) => (
                            <ChipBtn
                              key={opt}
                              label={opt}
                              onClick={() => selectExpType(opt)}
                              active={opt === "기타" && etcMode}
                            />
                          ))}
                        </div>
                        {etcMode && (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={etcText}
                              onChange={(e) => setEtcText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") confirmEtcType(); }}
                              placeholder="직접 입력해주세요"
                              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.15)" }}
                            />
                            <button
                              onClick={confirmEtcType}
                              disabled={!etcText.trim()}
                              className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30"
                              style={{ background: ACCENT, color: "#fff" }}
                            >
                              확인
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* typing dots — 스트리밍 대기 중에만 표시 */}
          {isStreaming && msgs[msgs.length - 1]?.text === "" && (
            <div className="flex items-end gap-2 justify-start">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: "#6B8EFF", color: "#fff", fontWeight: 700 }}
              >
                AI
              </div>
              <div
                className="px-4 py-3"
                style={{ background: "rgba(255,255,255,0.07)", borderRadius: "4px 16px 16px 16px" }}
              >
                <div className="flex gap-1.5 items-center h-4">
                  {DOTS.map(({ delay, color }) => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 전환 버튼 */}
          {completionData && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={handleTransition}
                className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #6B8EFF, #FF6B35)",
                  boxShadow: "0 0 24px rgba(107,142,255,0.35)",
                }}
              >
                이제 같이 분석해볼까요? →
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* input */}
      {!completionData && (
        <div className="px-4 py-4 pb-safe flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="max-w-xl mx-auto flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => {
                  if (charLimit && e.target.value.length > charLimit) return;
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (stage === "expInput") submitExpInput();
                    else handleSend();
                  }
                }}
                disabled={inputDisabled}
                placeholder={placeholder}
                rows={1}
                className="w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed focus:outline-none disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              {charLimit && (
                <span
                  className="absolute bottom-2 right-3 text-xs pointer-events-none"
                  style={{ color: input.length >= charLimit ? ACCENT : "rgba(255,255,255,0.25)" }}
                >
                  {input.length}/{charLimit}
                </span>
              )}
            </div>
            <button
              onClick={() => { if (stage === "expInput") submitExpInput(); else handleSend(); }}
              disabled={inputDisabled || !input.trim()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              style={{ background: ACCENT }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
