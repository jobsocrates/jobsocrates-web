"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CoverLetterSummary } from "@/components/CoverLetterSummary";

const ACCENT = "#FF6B35";
const BG = "#0D0D18";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const VIOLET = "#A78BFA";

const DOTS = [
  { delay: 0, color: ACCENT },
  { delay: 150, color: BLUE },
  { delay: 300, color: "#FFD166" },
];

interface ChatMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

interface InterviewQItem {
  id: number;
  question: string;
  isExpanded: boolean;
  msgs: ChatMsg[];
  isLoadingFeedback: boolean;
  inputText: string;
}

interface CoverItem {
  id: number;
  question: string;
  draft: string;
  status: "idle" | "chatting";
  msgs: ChatMsg[];
  apiHistory: { role: string; content: string }[];
  interviewQs: InterviewQItem[];
  isLoadingQs: boolean;
}

let _id = 0;
const uid = () => ++_id;

function stripMd(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .trim();
}

/* 수정본 + 변경사항 마커 파싱 */
function parseRevisionMsg(text: string) {
  const revMatch = text.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/);
  const chgMatch = text.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const partialChgMatch = !chgMatch ? text.match(/\[변경사항\]([\s\S]*)$/) : null;

  const revision = revMatch ? revMatch[1].trim() : "";
  const changes = chgMatch ? chgMatch[1].trim() : "";
  const partialChanges = partialChgMatch ? partialChgMatch[1].trim() : "";

  const rest = text
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[변경사항\][\s\S]*$/, "")
    .trim();

  return { revision, changes, partialChanges, rest };
}

/* ── 진단 카드 (첫 번째 봇 메시지) ── */
function DiagnosisCard({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = stripMd(text).split("\n").filter(Boolean);
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}1C` }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}16` }}>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0"
          style={{ background: BLUE, color: "#fff", fontSize: "9px" }}
        >
          AI
        </div>
        <span className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</span>
      </div>
      <div className="px-4 py-3.5">
        {streaming && text === "" ? (
          <div className="flex gap-1.5 items-center h-5">
            {DOTS.map(({ delay, color }) => (
              <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => {
              const isSection = line.startsWith("①") || line.startsWith("②") || line.startsWith("③");
              return (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{
                    color: isSection ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.62)",
                    fontWeight: isSection ? 500 : 400,
                    marginTop: isSection && i !== 0 ? "8px" : undefined,
                    wordBreak: "keep-all",
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 변경사항 카드 ── */
function ChangesCard({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}28` }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${GOLD}20` }}>
        <span style={{ fontSize: "12px" }}>✏️</span>
        <span className="text-xs font-semibold" style={{ color: GOLD }}>바뀐 점</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-xs flex-shrink-0 mt-[3px] font-bold" style={{ color: GOLD }}>·</span>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 수정본 스트리밍 카드 ([수정본] 마커 감지 후, 완성 전) ── */
function StreamingRevisionCard({ text }: { text: string }) {
  const parts = text.split("[수정본]");
  const afterMarker = parts.length > 1 ? parts[1] : "";
  const partialRevision = afterMarker.replace(/\[\/수정본\][\s\S]*/, "").trim();

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="rounded-2xl overflow-hidden" style={{ background: `${BLUE}0D`, border: `1px solid ${BLUE}28` }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}20` }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "9px" }}>AI</div>
          <span className="text-xs font-semibold" style={{ color: BLUE }}>수정본</span>
        </div>
        <div className="px-4 py-4">
          {partialRevision ? (
            <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.9)", wordBreak: "keep-all" }}>
              {partialRevision}
            </p>
          ) : (
            <div className="flex gap-1.5 items-center h-5">
              {DOTS.map(({ delay, color }) => (
                <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 수정본 카드 (채팅 내 인라인) ── */
function RevisionMessage({ text }: { text: string }) {
  const { revision, changes, partialChanges, rest } = parseRevisionMsg(text);
  const displayChanges = changes || partialChanges;
  return (
    <div className="flex flex-col gap-3 w-full">
      {revision && (
        <div className="rounded-2xl overflow-hidden" style={{ background: `${BLUE}0D`, border: `1px solid ${BLUE}28` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}20` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "9px" }}>AI</div>
            <span className="text-xs font-semibold" style={{ color: BLUE }}>수정본</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.9)", wordBreak: "keep-all" }}>
              {revision}
            </p>
          </div>
        </div>
      )}
      {displayChanges && <ChangesCard text={displayChanges} />}
      {rest && (
        <div className="flex items-end gap-2.5">
          <BotBubbleAvatar />
          <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all" }}>
            {rest}
          </div>
        </div>
      )}
    </div>
  );
}

function BotBubbleAvatar() {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5 font-bold" style={{ background: BLUE, color: "#fff" }}>
      AI
    </div>
  );
}

/* ── 면접 예상 질문 카드 ── */
function InterviewQCard({
  item,
  index,
  onToggle,
  onInputChange,
  onSubmit,
}: {
  item: InterviewQItem;
  index: number;
  onToggle: () => void;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `${VIOLET}08`,
        border: `1px solid ${VIOLET}${item.isExpanded ? "38" : "22"}`,
        transition: "border-color 0.2s",
      }}
    >
      {/* 질문 헤더 — 항상 표시 */}
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
        <p className="flex-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.88)", wordBreak: "keep-all" }}>
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

      {/* 확장: 미니 채팅 */}
      {item.isExpanded && (
        <div className="border-t" style={{ borderColor: `${VIOLET}1C` }}>
          {/* 메시지 목록 */}
          {item.msgs.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex flex-col gap-2.5">
              {item.msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-0.5"
                      style={{ background: VIOLET, color: "#fff" }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? { background: ACCENT, color: "#fff", borderRadius: "14px 4px 14px 14px", wordBreak: "keep-all" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", borderRadius: "4px 14px 14px 14px", wordBreak: "keep-all" }
                    }
                  >
                    {msg.role === "bot" && msg.text === "" ? (
                      <div className="flex gap-1.5 items-center h-4">
                        {DOTS.map(({ delay, color }) => (
                          <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    ) : msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 답변 입력창 — 아직 답변하지 않은 경우에만 */}
          {item.msgs.length === 0 && (
            <div className="px-4 py-3 flex items-end gap-2">
              <textarea
                value={item.inputText}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                disabled={item.isLoadingFeedback}
                placeholder="답변을 입력해요  (Enter 전송)"
                rows={2}
                className="flex-1 focus:outline-none disabled:opacity-30 resize-none placeholder:opacity-35"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${VIOLET}28`,
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "rgba(255,255,255,0.9)",
                }}
              />
              <button
                onClick={onSubmit}
                disabled={item.isLoadingFeedback || !item.inputText.trim()}
                className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-25"
                style={{ background: VIOLET, width: "40px", height: "40px" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const initItem: CoverItem = {
  id: uid(),
  question: "",
  draft: "",
  status: "idle",
  msgs: [],
  apiHistory: [],
  interviewQs: [],
  isLoadingQs: false,
};

export default function ChatPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jdKeywords, setJdKeywords] = useState<string[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isExtractingJD, setIsExtractingJD] = useState(false);

  const [items, setItems] = useState<CoverItem[]>([initItem]);
  const [selectedId, setSelectedId] = useState<number>(initItem.id);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = items.find((it) => it.id === selectedId) ?? null;

  function updateItem(id: number, patch: Partial<CoverItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    const item: CoverItem = { id: uid(), question: "", draft: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }

  function removeItem(id: number) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (next.length === 0) {
        const fresh: CoverItem = { id: uid(), question: "", draft: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false };
        setSelectedId(fresh.id);
        return [fresh];
      }
      if (selectedId === id) setSelectedId(next[0].id);
      return next;
    });
  }

  function updateInterviewQ(qId: number, patch: Partial<InterviewQItem>) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId
          ? { ...it, interviewQs: it.interviewQs.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
          : it
      )
    );
  }

  function toBase64(f: File): Promise<string> {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.readAsDataURL(f);
    });
  }

  async function handleJDUpload(f: File) {
    setJdFile(f);
    setIsExtractingJD(true);
    try {
      const base64 = await toBase64(f);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "jd-extract", imageData: base64, mediaType: f.type }),
      });
      const data = await res.json();
      setJdKeywords(Array.isArray(data) ? data : []);
    } catch {
      setJdKeywords([]);
    } finally {
      setIsExtractingJD(false);
    }
  }

  async function fetchBotReply(
    history: { role: string; content: string }[],
    itemId: number,
    draft: string,
    question: string
  ) {
    setIsStreaming(true);
    const msgId = uid();
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, msgs: [...it.msgs, { id: msgId, role: "bot" as const, text: "" }] }
          : it
      )
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

    let full = "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", jobTitle, question, jdKeywords, draft, messages: history }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? { ...it, msgs: it.msgs.map((m) => (m.id === msgId ? { ...m, text: full } : m)) }
              : it
          )
        );
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, apiHistory: [...it.apiHistory, { role: "assistant", content: full }] }
            : it
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, msgs: it.msgs.map((m) => (m.id === msgId ? { ...m, text: "오류가 발생했어요. 다시 시도해줘요." } : m)) }
            : it
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function startAnalysis() {
    if (!selected || !selected.question.trim() || !selected.draft.trim()) return;
    const seed = [{ role: "user", content: "초안 진단을 시작해줘." }];
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId ? { ...it, status: "chatting" as const, apiHistory: seed } : it
      )
    );
    await fetchBotReply(seed, selectedId, selected.draft, selected.question);
  }

  async function handleSend() {
    if (!selected) return;
    const t = input.trim();
    if (!t || isStreaming) return;
    setInput("");
    const newHistory = [...selected.apiHistory, { role: "user", content: t }];
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId
          ? { ...it, msgs: [...it.msgs, { id: uid(), role: "user" as const, text: t }], apiHistory: newHistory }
          : it
      )
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    await fetchBotReply(newHistory, selectedId, selected.draft, selected.question);
  }

  async function handleRevisionRequest() {
    if (!selected || isStreaming) return;
    const t = "수정본을 작성해줘.";
    const newHistory = [...selected.apiHistory, { role: "user", content: t }];
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId
          ? { ...it, msgs: [...it.msgs, { id: uid(), role: "user" as const, text: t }], apiHistory: newHistory }
          : it
      )
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    await fetchBotReply(newHistory, selectedId, selected.draft, selected.question);
  }

  async function fetchInterviewQuestions() {
    if (!selected) return;
    updateItem(selectedId, { isLoadingQs: true });
    const revMsg = selected.msgs.find(
      (m) => m.role === "bot" && m.text.includes("[수정본]") && m.text.includes("[/수정본]")
    );
    const { revision } = revMsg ? parseRevisionMsg(revMsg.text) : { revision: selected.draft };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "interview-questions",
          jobTitle,
          question: selected.question,
          coverLetter: revision || selected.draft,
        }),
      });
      const data = await res.json();
      let qs: string[] = [];
      if (Array.isArray(data)) qs = data;
      else if (typeof data.raw === "string") { try { qs = JSON.parse(data.raw); } catch { qs = []; } }
      updateItem(selectedId, {
        isLoadingQs: false,
        interviewQs: qs.slice(0, 4).map((q: string) => ({
          id: uid(), question: q, isExpanded: false, msgs: [], isLoadingFeedback: false, inputText: "",
        })),
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      updateItem(selectedId, { isLoadingQs: false });
    }
  }

  async function fetchInterviewFeedback(qId: number) {
    if (!selected) return;
    const qItem = selected.interviewQs.find((q) => q.id === qId);
    if (!qItem || !qItem.inputText.trim() || qItem.isLoadingFeedback) return;
    const answer = qItem.inputText.trim();
    const userMsgId = uid();
    const botMsgId = uid();
    const revMsg = selected.msgs.find(
      (m) => m.role === "bot" && m.text.includes("[수정본]") && m.text.includes("[/수정본]")
    );
    const { revision } = revMsg ? parseRevisionMsg(revMsg.text) : { revision: selected.draft };
    updateInterviewQ(qId, {
      inputText: "",
      isLoadingFeedback: true,
      msgs: [...qItem.msgs, { id: userMsgId, role: "user" as const, text: answer }, { id: botMsgId, role: "bot" as const, text: "" }],
    });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "interview-feedback",
          jobTitle,
          question: selected.question,
          interviewQuestion: qItem.question,
          coverLetter: revision || selected.draft,
          answer,
        }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setItems((prev) =>
          prev.map((it) =>
            it.id === selectedId
              ? { ...it, interviewQs: it.interviewQs.map((q) => q.id === qId ? { ...q, msgs: q.msgs.map((m) => m.id === botMsgId ? { ...m, text: full } : m) } : q) }
              : it
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedId
            ? { ...it, interviewQs: it.interviewQs.map((q) => q.id === qId ? { ...q, msgs: q.msgs.map((m) => m.id === botMsgId ? { ...m, text: "오류가 발생했어요. 다시 시도해줘요." } : m) } : q) }
            : it
        )
      );
    } finally {
      setItems((prev) =>
        prev.map((it) =>
          it.id === selectedId
            ? { ...it, interviewQs: it.interviewQs.map((q) => q.id === qId ? { ...q, isLoadingFeedback: false } : q) }
            : it
        )
      );
    }
  }

  const canStart =
    !!selected?.question.trim() && !!selected?.draft.trim() && selected?.status === "idle";

  const hasAnyRevision = selected?.msgs.some(
    (m) => m.role === "bot" && m.text.includes("[수정본]") && m.text.includes("[/수정본]")
  ) ?? false;

  const revisionReady = (selected?.msgs.some(
    (m) => m.role === "bot" && m.text.includes("수정본을 원하면")
  ) ?? false) && !hasAnyRevision;

  const interviewQs = selected?.interviewQs ?? [];
  const isLoadingQs = selected?.isLoadingQs ?? false;
  const showInterviewButton = hasAnyRevision && interviewQs.length === 0 && !isLoadingQs;
  const showSummaryButton = hasAnyRevision && interviewQs.length > 0;

  return (
    <>
      <div className="h-dvh flex flex-col" style={{ background: BG, color: "rgba(255,255,255,0.88)" }}>

        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/" className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>← 홈</Link>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>취업소크라테스</span>
          <div className="w-10" />
        </header>

        {/* ── 메인 ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ────────── 왼쪽 패널 ────────── */}
          <div className="flex-shrink-0 flex flex-col border-r" style={{ width: "272px", borderColor: "rgba(255,255,255,0.06)" }}>

            {/* 지원 정보 */}
            <div
              className="flex flex-col gap-3 border-b flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.07)", padding: "16px 14px 18px" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                  지원 정보
                </span>
              </div>

              {/* 직무 입력 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>지원 직무</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="예) 삼성전자 인프라설계"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                />
              </div>

              {/* JD 업로드 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  JD 업로드 <span style={{ color: "rgba(255,255,255,0.2)" }}>선택</span>
                </label>
                <div
                  className="rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all hover:opacity-80"
                  style={{
                    background: jdFile ? `${ACCENT}10` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${jdFile ? `${ACCENT}40` : "rgba(255,255,255,0.1)"}`,
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJDUpload(f); }} />
                  {isExtractingJD ? (
                    <div className="flex gap-1 items-center">
                      {DOTS.map(({ delay, color }) => (
                        <span key={delay} className="w-1 h-1 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                      ))}
                      <span className="text-xs ml-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>추출중...</span>
                    </div>
                  ) : jdFile ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-sm">📄</span>
                      <span className="text-xs truncate flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>{jdFile.name}</span>
                      {jdKeywords.length > 0 && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${ACCENT}20`, color: ACCENT }}>
                          {jdKeywords.length}개
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📎</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>PNG / JPG 업로드</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 항목 목록 */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              <p className="text-xs px-1 pt-0.5 pb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.22)" }}>자소서 항목</p>

              {items.map((item, idx) => {
                const isSel = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedId(item.id)}
                    className="w-full text-left rounded-xl px-3 py-2.5 flex flex-col gap-0.5 transition-all group relative cursor-pointer"
                    style={{
                      background: isSel ? "rgba(107,142,255,0.1)" : "rgba(255,255,255,0.035)",
                      border: `1px solid ${isSel ? "rgba(107,142,255,0.26)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 pr-6">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: isSel ? BLUE : "rgba(255,255,255,0.2)" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.78)" }}>
                        {item.question || <span style={{ color: "rgba(255,255,255,0.22)" }}>문항 미입력</span>}
                      </span>
                    </div>
                    {item.draft && (
                      <p className="text-xs truncate pl-6" style={{ color: "rgba(255,255,255,0.24)" }}>{item.draft}</p>
                    )}
                    <div className="absolute right-2 top-2.5 flex items-center gap-1">
                      {item.status === "chatting" && (
                        <span className="rounded-full font-medium px-1.5 py-0.5" style={{ background: `${BLUE}1C`, color: BLUE, fontSize: "10px", lineHeight: "1.4" }}>진행</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >×</button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addItem}
                className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2 mt-0.5 transition-opacity hover:opacity-60"
                style={{ border: "1px dashed rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.26)" }}
              >
                <span className="text-sm">+</span>
                <span className="text-xs">항목 추가</span>
              </button>
            </div>
          </div>

          {/* ────────── 오른쪽 패널 ────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.18)" }}>항목을 선택해주세요</p>
              </div>
            ) : selected.status === "idle" ? (

              /* ── 편집 패널 ── */
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>자소서 문항</label>
                    <input
                      value={selected.question}
                      onChange={(e) => updateItem(selectedId, { question: e.target.value })}
                      placeholder="예: 성장 과정 및 지원 동기를 작성해주세요."
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.9)" }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>내 초안</label>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>{selected.draft.length}자</span>
                    </div>
                    <textarea
                      value={selected.draft}
                      onChange={(e) => updateItem(selectedId, { draft: e.target.value })}
                      placeholder="작성한 자소서 초안을 붙여넣어요."
                      rows={13}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.88)", lineHeight: "1.8" }}
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={startAnalysis}
                      disabled={!canStart}
                      className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.015] active:scale-[0.985] disabled:opacity-25 disabled:cursor-not-allowed"
                      style={{ background: ACCENT, boxShadow: canStart ? `0 0 28px ${ACCENT}35` : "none" }}
                    >
                      분석 시작하기 →
                    </button>
                    <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {canStart
                        ? "논리 흐름 · 문맥 연결 · 직무 이해도를 먼저 진단하고 질문으로 이어가요"
                        : "문항과 초안을 모두 입력하면 분석을 시작할 수 있어요"}
                    </p>
                  </div>
                </div>
              </div>

            ) : (

              /* ── 채팅 패널 ── */
              <>
                {/* 항목 헤더 바 */}
                <div className="px-5 py-2.5 flex-shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0" style={{ background: `${BLUE}18`, color: BLUE, fontSize: "11px" }}>
                    {String(items.findIndex((it) => it.id === selectedId) + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm truncate flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>{selected.question}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {["진단", "질문", "보강"].map((step, i) => {
                      const userCount = selected.msgs.filter((m) => m.role === "user").length;
                      const active = i === 0 ? userCount === 0 : i === 1 ? userCount < 3 : userCount >= 3;
                      return (
                        <span key={step} className="text-xs px-2 py-0.5 rounded-full" style={{ background: active ? `${BLUE}22` : "rgba(255,255,255,0.05)", color: active ? BLUE : "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                          {step}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    {selected.msgs.map((msg, msgIdx) => {
                      const isDiagnosis = msgIdx === 0 && msg.role === "bot";
                      const isRevisionComplete = msg.role === "bot"
                        && msg.text.includes("[수정본]")
                        && msg.text.includes("[/수정본]");
                      const isRevisionStreaming = isStreaming
                        && msg.role === "bot"
                        && msg.text.includes("[수정본]")
                        && !msg.text.includes("[/수정본]");

                      if (isDiagnosis) {
                        return <DiagnosisCard key={msg.id} text={msg.text} streaming={isStreaming} />;
                      }

                      if (isRevisionStreaming) {
                        return <StreamingRevisionCard key={msg.id} text={msg.text} />;
                      }

                      if (isRevisionComplete) {
                        return <RevisionMessage key={msg.id} text={msg.text} />;
                      }

                      return (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.role === "bot" && <BotBubbleAvatar />}
                          <div
                            className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                            style={
                              msg.role === "bot"
                                ? { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all" }
                                : { background: ACCENT, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
                            }
                          >
                            {msg.role === "bot" ? stripMd(msg.text) : msg.text}
                            {isStreaming && msg.text === "" && (
                              <div className="flex gap-1.5 items-center h-4">
                                {DOTS.map(({ delay, color }) => (
                                  <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* 면접 예상 질문 카드 섹션 */}
                    {interviewQs.length > 0 && (
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px" style={{ background: `${VIOLET}20` }} />
                          <span className="text-xs font-semibold tracking-wide px-1" style={{ color: VIOLET }}>
                            면접 예상 질문 {interviewQs.length}개
                          </span>
                          <div className="flex-1 h-px" style={{ background: `${VIOLET}20` }} />
                        </div>
                        {interviewQs.map((q, i) => (
                          <InterviewQCard
                            key={q.id}
                            item={q}
                            index={i}
                            onToggle={() => updateInterviewQ(q.id, { isExpanded: !q.isExpanded })}
                            onInputChange={(text) => updateInterviewQ(q.id, { inputText: text })}
                            onSubmit={() => fetchInterviewFeedback(q.id)}
                          />
                        ))}
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </div>

                {/* 입력창 + 정리하기 버튼 */}
                <div className="px-5 py-4 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="max-w-2xl mx-auto flex flex-col gap-2.5">

                    {revisionReady ? (
                      /* 수정본 작성 요청 버튼 */
                      <button
                        onClick={handleRevisionRequest}
                        disabled={isStreaming}
                        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.985] disabled:opacity-30 flex items-center justify-center gap-2"
                        style={{ background: ACCENT, color: "#fff", boxShadow: `0 0 28px ${ACCENT}35` }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        수정본 작성 요청
                      </button>
                    ) : showInterviewButton ? (
                      /* 면접 예상질문 확인 버튼 */
                      <button
                        onClick={fetchInterviewQuestions}
                        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${VIOLET}30 0%, ${BLUE}20 100%)`, border: `1px solid ${VIOLET}40`, color: "rgba(255,255,255,0.85)", boxShadow: `0 0 24px ${VIOLET}20` }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={VIOLET} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        면접 예상질문 확인하기
                      </button>
                    ) : isLoadingQs ? (
                      /* 질문 생성 중 */
                      <div className="flex items-center justify-center gap-3 py-3">
                        <div className="flex gap-1.5">
                          {DOTS.map(({ delay, color }) => (
                            <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>예상 질문 생성 중...</span>
                      </div>
                    ) : !showSummaryButton ? (
                      /* 일반 입력창 */
                      <div className="flex items-center gap-3">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          disabled={isStreaming}
                          placeholder="답변을 입력하세요  (Enter 전송 · Shift+Enter 줄바꿈)"
                          rows={1}
                          className="flex-1 focus:outline-none disabled:opacity-30 resize-none placeholder:opacity-40"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px", padding: "11px 18px", fontSize: "14px", lineHeight: "1.5", color: "rgba(255,255,255,0.9)", height: "46px", overflow: "hidden" }}
                        />
                        <button
                          onClick={handleSend}
                          disabled={isStreaming || !input.trim()}
                          className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-25"
                          style={{ background: ACCENT, width: "46px", height: "46px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      </div>
                    ) : null}

                    {/* 대화 정리하기 — 면접 Q&A 완료 후에만 노출 */}
                    {showSummaryButton && (
                      <button
                        onClick={() => setShowSummary(true)}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                        style={{
                          background: `linear-gradient(135deg, ${BLUE}22 0%, ${ACCENT}18 100%)`,
                          border: `1px solid ${BLUE}35`,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        대화 내용 정리하기
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 정리 모달 */}
      {showSummary && selected && (
        <CoverLetterSummary
          jobTitle={jobTitle}
          question={selected.question}
          draft={selected.draft}
          msgs={selected.msgs}
          onClose={() => setShowSummary(false)}
        />
      )}
    </>
  );
}
