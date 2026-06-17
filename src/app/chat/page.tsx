"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CoverLetterSummary } from "@/components/CoverLetterSummary";
import { TutorialModal } from "@/components/TutorialModal";
import { supabase } from "@/lib/supabase";

const ACCENT = "#4338CA";
const BG = "#0D0D18";
const BLUE = "#6366F1";   // indigo — DS primary family
const GOLD = "#F59E0B";   // DS warn/amber
const VIOLET = "#A78BFA"; // DS ring/lavender

// Design System tokens
const DS_BG      = "#F9FAFB";
const DS_FG      = "#111827";
const DS_CARD    = "#FFFFFF";
const DS_BORDER  = "#E5E7EB";
const DS_PRIMARY = "#312E81";
const DS_MUTED   = "#6B7280";
const DS_INPUT   = "#F3F4F6";
const DS_ACC_BG  = "#EDE9FE";
const DS_ACC_FG  = "#4C3F99";
const DS_LIFT    = "0 0 0 1px rgba(167,139,250,0.14), 0 0 28px -8px rgba(167,139,250,0.28), 0 2px 8px rgba(17,12,46,0.05)";
const DS_SOFT    = "0 0 0 1px rgba(167,139,250,0.08), 0 1px 2px rgba(17,12,46,0.04)";
const GLOW_PRIMARY = "0 0 0 1px rgba(99,102,241,0.22), 0 0 24px -6px rgba(99,102,241,0.32)";
const GLOW_ACCENT  = "0 0 0 1px rgba(167,139,250,0.24), 0 0 24px -6px rgba(167,139,250,0.34)";

const DRAFT_MAX = 1200;
const ADMIN_EMAIL = "ijhan6403@gmail.com";

const LOADING_MSGS = [
  "회사와 직무를 파악하고 있어요.",
  "초안에서 경험 연결 포인트를 찾는 중이에요.",
  "조금 시간이 걸리는 분석이에요. 잠시만요.",
  "거의 다 됐어요.",
  "금방 나올 거예요!",
];

function StreamingLoadingMsg() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= LOADING_MSGS.length - 1) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 3500);
    return () => clearTimeout(t);
  }, [idx]);
  return (
    <span className="text-sm" style={{ color: DS_MUTED }}>
      {LOADING_MSGS[idx]}
    </span>
  );
}

const DOTS = [
  { delay: 0, color: "#312E81" },
  { delay: 150, color: BLUE },
  { delay: 300, color: VIOLET },
];

interface ChatMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

interface InterviewQItem {
  id: number;
  dbId: string | null;
  question: string;
  isExpanded: boolean;
  msgs: ChatMsg[];
  isLoadingFeedback: boolean;
  inputText: string;
}

interface SetupMsg { id: number; role: "bot" | "user"; text: string; }

interface CoverItem {
  id: number;
  dbId: string | null;
  question: string;
  draft: string;
  charLimit: string;
  status: "idle" | "chatting";
  msgs: ChatMsg[];
  apiHistory: { role: string; content: string }[];
  interviewQs: InterviewQItem[];
  isLoadingQs: boolean;
  setupStep: "question" | "charLimit" | "draft" | "ready";
  setupMsgs: SetupMsg[];
}

let _id = 0;
const uid = () => ++_id;

interface ResumeSession {
  session: { id: string; job_title: string; created_at: string };
  items: { id: string; question: string; draft: string; char_limit: number | null; status: string; order_index: number }[];
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}일 전`;
  if (hours >= 1) return `${hours}시간 전`;
  const mins = Math.floor(diff / (1000 * 60));
  return mins > 0 ? `${mins}분 전` : "방금 전";
}

function stripMd(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[수정본\][\s\S]*$/, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[지원동기\][\s\S]*$/, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[완성준비\]/g, "")
    .replace(/---+/g, "")
    .trim();
}

/* 수정본 + 변경사항 마커 파싱 */
function parseRevisionMsg(text: string) {
  const subMatch = text.match(/\[소제목\]([\s\S]*?)\[\/소제목\]/);
  const revMatch = text.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/) || text.match(/\[지원동기\]([\s\S]*?)\[\/지원동기\]/);
  const partialRevMatch = !revMatch ? (text.match(/\[수정본\]([\s\S]*)$/) || text.match(/\[지원동기\]([\s\S]*)$/)) : null;
  const chgMatch = text.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const partialChgMatch = !chgMatch ? text.match(/\[변경사항\]([\s\S]*)$/) : null;

  const subtitle = subMatch ? subMatch[1].trim() : "";
  const rawRevision = (revMatch ?? partialRevMatch)
    ? (revMatch ?? partialRevMatch)![1]
        .replace(/\[소제목\][\s\S]*?\[\/소제목\]\s*/g, "")
        .replace(/\[소제목\]|\[\/소제목\]/g, "")
        .trim()
    : "";
  const revision = rawRevision;
  const changes = chgMatch ? chgMatch[1].trim() : "";
  const partialChanges = partialChgMatch ? partialChgMatch[1].trim() : "";

  const rest = text
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[수정본\][\s\S]*$/, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[지원동기\][\s\S]*$/, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[변경사항\][\s\S]*$/, "")
    .replace(/\[완성준비\]/g, "")
    .replace(/---+/g, "")
    .trim();

  return { subtitle, revision, changes, partialChanges, rest };
}

/* ── 진단 카드 (첫 번째 봇 메시지) ── */
function DiagnosisCard({ text, streaming }: { text: string; streaming: boolean }) {
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

      {/* "이 중에서 ~" 질문 — 별도 봇 버블 */}
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

/* ── 변경사항 카드 ── */
function ChangesCard({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^[-·•]\s*/, "").trim())
    .filter(Boolean);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#FDE68A" }}>
        <span style={{ fontSize: "12px" }}>✏️</span>
        <span className="text-sm font-semibold" style={{ color: "#92400E" }}>바뀐 점</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-xs flex-shrink-0 mt-[3px] font-bold" style={{ color: "#B45309" }}>·</span>
            <p className="text-sm leading-relaxed" style={{ color: "#111827", wordBreak: "keep-all" }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 완성본 생성 중 로딩 카드 ── */
const REVISION_LOADING_MSGS = [
  "잠시만 기다려주세요",
  "대화 내용을 꼼꼼히 읽고 있어요",
  "지원 직무와 문항을 분석하고 있어요",
  "어떤 역량을 드러낼지 정리하고 있어요",
  "자소서를 작성하고 있어요",
  "문장 흐름을 다듬고 있어요",
  "거의 다 됐어요",
];

function RevisionLoadingCard() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => Math.min(p + 1, REVISION_LOADING_MSGS.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
        <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>완성본</span>
      </div>
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="flex gap-1.5">
          {DOTS.map(({ delay, color }) => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
          ))}
        </div>
        <span className="text-sm" style={{ color: "#6B7280" }}>{REVISION_LOADING_MSGS[idx]}</span>
      </div>
    </div>
  );
}

/* ── 수정본 카드 (채팅 내 인라인) ── */
function RevisionMessage({
  text,
  companyName,
  jobTitle,
  question,
  charLimit,
}: {
  text: string;
  companyName: string;
  jobTitle: string;
  question: string;
  charLimit: string;
}) {
  const { revision, changes, partialChanges, rest } = parseRevisionMsg(text);
  const displayChanges = changes || partialChanges;
  const isComplete = !!revision && !!changes;

  return (
    <div className="flex flex-col gap-3 w-full">
      {rest && (
        <div className="flex items-end gap-2.5 justify-start">
          <BotBubbleAvatar />
          <div
            className="max-w-[80%] px-4 py-3.5 text-sm leading-[1.85] whitespace-pre-wrap"
            style={{ background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "none", border: "1px solid #E5E7EB" }}
          >
            {rest}
          </div>
        </div>
      )}
      {revision && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
            <div className="flex items-center gap-2">
              <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>완성본</span>
              <span className="text-xs" style={{ color: "#A78BFA" }}>{revision.replace(/\s/g, "").length}자</span>
            </div>
            {isComplete && (
              <button
                onClick={() => exportCoverLetterPDF(companyName, jobTitle, question, charLimit, revision, changes)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-70"
                style={{ background: "#DDD6FE", color: "#4C3F99", border: "none" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                PDF
              </button>
            )}
          </div>
          <div className="px-4 py-4">
            <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: "#111827", wordBreak: "keep-all" }}>
              {revision}
            </p>
          </div>
        </div>
      )}
      {displayChanges && <ChangesCard text={displayChanges} />}
    </div>
  );
}

function BotBubbleAvatar() {
  return (
    <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-0.5" />
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
        background: "#F5F3FF",
        border: `1px solid ${item.isExpanded ? "#C4B5FD" : "#DDD6FE"}`,
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

          {/* 답변 입력창 — 아직 답변하지 않은 경우에만 */}
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
                    border: `1.5px solid rgba(0,0,0,0.12)`,
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

/* ── 답변 팁 패널 ── */
function TipPanel({ hasRevision, revisionReady }: { hasRevision: boolean; revisionReady: boolean }) {
  const tips = [
    { icon: "💬", text: "① 상황 ② 내가 한 행동\n③ 결과\n이 세 가지가 다 들어가게 구체적으로 답해보세요.\n그럼 더 탄탄한 자소서가 탄생합니다." },
    { icon: "🎙️", text: "실제 면접이라 생각하고 작성해보세요.\n면접 준비가 함께 돼요." },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="w-1 h-3 rounded-full" style={{ background: GOLD }} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#6B7280", letterSpacing: "0.08em" }}>답변 팁</span>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-4 flex flex-col gap-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-lg flex-shrink-0 leading-none mt-0.5">{tip.icon}</span>
            <p className="text-sm leading-[1.7]" style={{ color: "#111827", wordBreak: "keep-all", whiteSpace: "pre-line", overflowWrap: "break-word" }}>{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseAnalysisForPDF(content: string): { heading: string; items: string[] }[] {
  return content
    .split(/(?=## \d)/)
    .filter(Boolean)
    .map((section) => {
      const lines = section.trim().split("\n").filter(Boolean);
      const heading = lines[0]?.replace(/^##\s*/, "") ?? "";
      const items = lines
        .slice(1)
        .filter((l) => l.startsWith("- "))
        .map((l) => l.replace(/^-\s*/, "").trim());
      return { heading, items };
    })
    .filter((s) => s.heading && s.items.length > 0);
}

function exportToPDF(title: string, sections: { heading: string; items: string[] }[], meta?: string) {
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 13px; line-height: 1.75; color: #111827; padding: 48px 52px; }
  h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; letter-spacing: -0.02em; }
  .meta { font-size: 12px; color: #6B7280; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1.5px solid #E5E7EB; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; color: #312E81; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #EDE9FE; }
  .item { display: flex; gap: 10px; margin-bottom: 6px; padding: 8px 12px; background: #F9FAFB; border-radius: 8px; }
  .dot { width: 3px; border-radius: 4px; background: #A78BFA; flex-shrink: 0; margin-top: 2px; }
  .item-text { font-size: 12.5px; color: #374151; line-height: 1.7; word-break: keep-all; }
  .item-label { font-weight: 600; color: #111827; }
  .divider { height: 1px; background: #F3F4F6; margin: 4px 0 28px; }
  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: right; }
  @page { margin: 0; size: A4; }
  @media print { body { padding: 36px 44px; } }
</style></head><body>
<h1>${title}</h1>
${meta ? `<div class="meta">${meta}</div>` : ""}
${sections.map((s, i) => `
  <div class="section">
    <div class="section-title">${s.heading}</div>
    ${s.items.map(item => {
      const colonIdx = item.indexOf(": ");
      if (colonIdx > 0 && colonIdx < 20) {
        return `<div class="item"><div class="dot"></div><div class="item-text"><span class="item-label">${item.slice(0, colonIdx)}</span>${item.slice(colonIdx)}</div></div>`;
      }
      return `<div class="item"><div class="dot"></div><div class="item-text">${item}</div></div>`;
    }).join("")}
  </div>
  ${i < sections.length - 1 ? '<div class="divider"></div>' : ''}
`).join("")}
<div class="footer">취업소크라테스 · ${new Date().toLocaleDateString("ko-KR")}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

function exportCoverLetterPDF(companyName: string, jobTitle: string, question: string, charLimit: string, revision: string, changes: string) {
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>자소서 완성본</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 13px; line-height: 1.85; color: #111827; padding: 48px 52px; }
  h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; letter-spacing: -0.02em; }
  .meta { font-size: 12px; color: #6B7280; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1.5px solid #E5E7EB; }
  .label { font-size: 11px; font-weight: 700; color: #6366F1; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
  .question-box { padding: 12px 16px; background: #F5F3FF; border-radius: 10px; font-size: 12.5px; color: #4C3F99; font-weight: 500; margin-bottom: 24px; line-height: 1.6; word-break: keep-all; }
  .body-text { font-size: 13px; color: #111827; line-height: 2; word-break: keep-all; white-space: pre-wrap; }
  .changes-section { margin-top: 28px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
  .change-item { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #374151; }
  .change-dot { width: 3px; border-radius: 4px; background: #F59E0B; flex-shrink: 0; margin-top: 3px; }
  .char-count { font-size: 11px; color: #9CA3AF; margin-top: 12px; text-align: right; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: right; }
  @page { margin: 0; size: A4; }
</style></head><body>
<h1>자소서 완성본</h1>
<div class="meta">${[companyName, jobTitle].filter(Boolean).join(" · ")}${charLimit ? ` · ${charLimit}자` : ""}</div>
${question ? `<div class="label">문항</div><div class="question-box">${question}</div>` : ""}
<div class="label">완성본</div>
<div class="body-text">${revision}</div>
<div class="char-count">${revision.replace(/\s/g,"").length}자</div>
${changes ? `<div class="changes-section"><div class="label">수정 포인트</div>${changes.split("\n").filter(Boolean).map(c => `<div class="change-item"><div class="change-dot"></div><span>${c.replace(/^[-·]\s*/,"")}</span></div>`).join("")}</div>` : ""}
<div class="footer">취업소크라테스 · ${new Date().toLocaleDateString("ko-KR")}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

const initItem: CoverItem = {
  id: uid(),
  dbId: null,
  question: "",
  draft: "",
  charLimit: "",
  status: "idle",
  msgs: [],
  apiHistory: [],
  interviewQs: [],
  isLoadingQs: false,
  setupStep: "question",
  setupMsgs: [],
};

export default function ChatPage() {
  const [stage, setStage] = useState<"info" | "chat">("info");
  const [stageLeaving, setStageLeaving] = useState(false);
  const [stageEntering, setStageEntering] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [jobPostText, setJobPostText] = useState("");
  const [jobPostImagePreview, setJobPostImagePreview] = useState("");
  const [showJobPostModal, setShowJobPostModal] = useState(false);
  const [jobPostTab, setJobPostTab] = useState<"link" | "text" | "image">("link");
  const jobPostFileRef = useRef<HTMLInputElement>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [analysisContent, setAnalysisContent] = useState("");
  const analysisContentRef = useRef("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [editingField, setEditingField] = useState<"question" | "charLimit" | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [setupInput, setSetupInput] = useState("");
  const setupBottomRef = useRef<HTMLDivElement>(null);
  const setupInputRef = useRef<HTMLTextAreaElement>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [chatMode, setChatMode] = useState<"analyze" | "personality" | "motivation">("analyze");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState("");

  const [items, setItems] = useState<CoverItem[]>([initItem]);
  const [selectedId, setSelectedId] = useState<number>(initItem.id);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [toast, setToast] = useState("");
  const [toastField, setToastField] = useState<"jobTitle" | "question" | "charLimit" | "draft" | "">("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const dbSessionIdRef = useRef<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const idleWarnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleLogoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(300);
  const resumeCheckedRef = useRef(false);
  const creditsFetchedRef = useRef(false);
  const [resumeSession, setResumeSession] = useState<ResumeSession | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [showInterviewWarning, setShowInterviewWarning] = useState(false);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [discardConfirmMode, setDiscardConfirmMode] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [welcome, setWelcome] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDuplicateDraft, setShowDuplicateDraft] = useState(false);
  const [duplicateDraftInfo, setDuplicateDraftInfo] = useState<{
    sessionId: string;
    jobTitle: string;
    question: string;
    createdAt: string;
  } | null>(null);

  const selected = items.find((it) => it.id === selectedId) ?? null;

  // 튜토리얼 표시 여부 — localStorage 즉시 체크 (비동기 없음)
  useEffect(() => {
    const forced = sessionStorage.getItem("showTutorial") === "1";
    if (forced) {
      sessionStorage.removeItem("showTutorial");
      localStorage.removeItem("tutorialSeen");
      setShowTutorial(true);
    } else if (localStorage.getItem("tutorialSeen") !== "true") {
      setShowTutorial(true);
    }
  }, []);

  // 로그인 유저 로드 + 환영 메시지
  useEffect(() => {
    supabase.from("page_views").insert({ path: "/chat" });
    // getSession: localStorage 세션을 즉시 읽어 currentUser 확보
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });
        supabase.from("profiles").upsert(
          { id: session.user.id, email: session.user.email ?? "" },
          { onConflict: "id" }
        );
        checkResumeSession(session.user.id);
        fetchCredits(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });
        supabase.from("profiles").upsert(
          { id: session.user.id, email: session.user.email ?? "" },
          { onConflict: "id" }
        );
        fetchCredits(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });
    const msg = sessionStorage.getItem("welcome");
    if (msg) {
      setWelcome(msg.split("@")[0]);
      sessionStorage.removeItem("welcome");
      setTimeout(() => setWelcome(""), 3000);
    }
    return () => subscription.unsubscribe();
  }, []);

  function updateItem(id: number, patch: Partial<CoverItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    const item: CoverItem = { id: uid(), dbId: null, question: "", draft: "", charLimit: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false, setupStep: "question", setupMsgs: [] };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }

  function removeItem(id: number) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (next.length === 0) {
        const fresh: CoverItem = { id: uid(), dbId: null, question: "", draft: "", charLimit: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false, setupStep: "question", setupMsgs: [] };
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

  // ── Supabase DB 헬퍼 ──────────────────────────────────────────────

  // sessions 테이블에 row 확보. 같은 페이지 세션 내에선 재사용.
  async function ensureDbSession(): Promise<string | null> {
    if (!currentUser) return null;
    // profiles FK 제약 충족: 프로필이 없으면 upsert로 생성
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({ id: currentUser.id, email: currentUser.email }, { onConflict: "id" });
    if (profileErr) console.error("[DB] profile upsert error:", profileErr);
    if (dbSessionIdRef.current) {
      await supabase.from("sessions")
        .update({ job_title: jobTitle, updated_at: new Date().toISOString() })
        .eq("id", dbSessionIdRef.current);
      return dbSessionIdRef.current;
    }
    const { data, error } = await supabase.from("sessions")
      .insert({ user_id: currentUser.id, job_title: jobTitle })
      .select("id").single();
    if (error) console.error("[DB] sessions insert error:", error);
    if (!data) return null;
    dbSessionIdRef.current = data.id;
    return data.id;
  }

  // messages 테이블에 단일 메시지 저장. id를 넘기면 명시적 UUID로 저장 후 반환
  async function saveDbMessage(coverItemDbId: string, role: "user" | "assistant", content: string, id?: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = { cover_item_id: coverItemDbId, role, content };
    if (id) row.id = id;
    const { error } = await supabase.from("messages").insert(row);
    if (error) { console.error("[DB] messages insert error:", error); return null; }
    return id ?? null;
  }

  // revisions 테이블에 수정본 저장 + cover_item 상태 done으로 갱신 (서버 API 경유 — RLS 우회)
  async function saveDbRevision(coverItemDbId: string, content: string, changesText: string): Promise<string | null> {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "save-revision", cover_item_id: coverItemDbId, content, changesText }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) { console.error("[DB] save-revision failed:", data); return null; }
      return data.id as string;
    } catch (e) {
      console.error("[DB] saveDbRevision error:", e);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────

  async function fetchBotReply(
    history: { role: string; content: string }[],
    itemId: number,
    draft: string,
    question: string,
    charLimit?: string,
    itemDbId?: string | null
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
        body: JSON.stringify(
          chatMode === "motivation"
            ? { type: "motivation", jobTitle, companyInfo, draft, charLimit, messages: history, analysisReport: analysisContent }
            : chatMode === "personality"
            ? { type: "personality", jobTitle, companyInfo, draft, charLimit, messages: history, analysisReport: analysisContent }
            : { type: "analyze", jobTitle, companyInfo, question, draft, charLimit, messages: history, analysisReport: analysisContent }
        ),
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

      // ── DB 저장: 유저 메시지 + AI 응답 ──
      const revMatch = chatMode === "motivation"
        ? full.match(/\[지원동기\]([\s\S]*?)\[\/지원동기\]/)
        : full.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/);
      const chgMatch = full.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
      let assistantMsgDbId: string | null = null;
      if (itemDbId) {
        const userMsg = history[history.length - 1];
        if (userMsg?.role === "user") {
          await saveDbMessage(itemDbId, "user", userMsg.content);
        }
        const aId = crypto.randomUUID();
        assistantMsgDbId = await saveDbMessage(itemDbId, "assistant", full, aId);

        if (revMatch) {
          await saveDbRevision(itemDbId, revMatch[1].trim(), chgMatch ? chgMatch[1].trim() : "");
        }
      }

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

  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "46px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  useEffect(() => {
    setTimeout(() => setupBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [selected?.setupMsgs.length]);

  useEffect(() => {
    setSetupInput("");
  }, [selectedId]);

  async function checkResumeSession(userId: string) {
    if (resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    try {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, job_title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!sessions?.length) return;

      const { data: unfinished } = await supabase
        .from("cover_items")
        .select("id, session_id, question, draft, char_limit, status, order_index")
        .in("session_id", sessions.map(s => s.id))
        .eq("status", "chatting")
        .order("order_index")
        .limit(1);
      if (!unfinished?.length) return;

      const parentSession = sessions.find(s => s.id === unfinished[0].session_id);
      if (!parentSession) return;

      // 이미 이 세션을 dismiss한 경우 다시 표시하지 않음
      if (localStorage.getItem("lastDismissedSessionId") === parentSession.id) return;

      const { data: allItems } = await supabase
        .from("cover_items")
        .select("id, question, draft, char_limit, status, order_index")
        .eq("session_id", parentSession.id)
        .order("order_index");

      setResumeSession({ session: parentSession, items: allItems || [] });
    } catch { /* 무시 */ }
  }

  async function checkDuplicateDraft(draft: string): Promise<{ sessionId: string; jobTitle: string; question: string; createdAt: string } | null> {
    if (!currentUser) return null;
    try {
      const { data: userSessions } = await supabase
        .from("sessions")
        .select("id, job_title, created_at")
        .eq("user_id", currentUser.id);
      if (!userSessions?.length) return null;

      const { data: dupes } = await supabase
        .from("cover_items")
        .select("id, question, session_id")
        .in("session_id", userSessions.map((s: { id: string }) => s.id))
        .eq("draft", draft.trim())
        .limit(1);

      if (!dupes?.length) return null;
      const parentSession = userSessions.find((s: { id: string }) => s.id === dupes[0].session_id);
      if (!parentSession) return null;
      return {
        sessionId: parentSession.id,
        jobTitle: parentSession.job_title || "",
        question: dupes[0].question || "",
        createdAt: parentSession.created_at,
      };
    } catch {
      return null;
    }
  }

  async function loadSessionById(sessionId: string, sessionJobTitle: string) {
    try {
      dbSessionIdRef.current = sessionId;
      setJobTitle(sessionJobTitle);
      const { data: sessionData } = await supabase.from("sessions").select("analysis_report").eq("id", sessionId).single();
      if (sessionData?.analysis_report) { setAnalysisContent(sessionData.analysis_report); analysisContentRef.current = sessionData.analysis_report; }

      const { data: allItems } = await supabase
        .from("cover_items")
        .select("id, question, draft, char_limit, status, order_index")
        .eq("session_id", sessionId)
        .order("order_index");

      if (!allItems?.length) return;

      const newItems: CoverItem[] = await Promise.all(
        allItems.map(async (ci) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("cover_item_id", ci.id)
            .order("created_at");

          const msgs: ChatMsg[] = (messages || []).map(m => ({
            id: uid(),
            role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
            text: m.content,
          }));
          const apiHistory = (messages || []).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          }));

          const { data: iqs } = await supabase
            .from("interview_questions")
            .select("id, question, order_index")
            .eq("cover_item_id", ci.id)
            .order("order_index");
          const loadedInterviewQs: InterviewQItem[] = await Promise.all(
            (iqs || []).map(async (iq) => {
              const { data: answers } = await supabase
                .from("interview_answers")
                .select("user_answer, ai_feedback, created_at")
                .eq("interview_question_id", iq.id)
                .order("created_at");
              const qMsgs: ChatMsg[] = [];
              for (const a of (answers || [])) {
                if (a.user_answer) qMsgs.push({ id: uid(), role: "user" as const, text: a.user_answer });
                if (a.ai_feedback) qMsgs.push({ id: uid(), role: "bot" as const, text: a.ai_feedback });
              }
              return { id: uid(), dbId: iq.id, question: iq.question, isExpanded: false, msgs: qMsgs, isLoadingFeedback: false, inputText: "" };
            })
          );

          return {
            id: uid(),
            dbId: ci.id,
            question: ci.question || "",
            draft: ci.draft || "",
            charLimit: ci.char_limit ? String(ci.char_limit) : "",
            status: (msgs.length > 0 ? "chatting" : "idle") as "idle" | "chatting",
            msgs,
            apiHistory,
            interviewQs: loadedInterviewQs,
            isLoadingQs: false,
            setupStep: "ready" as const,
            setupMsgs: [] as SetupMsg[],
          };
        })
      );

      if (newItems.length > 0) {
        setItems(newItems);
        setSelectedId(newItems[0].id);
        setStage("chat");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } catch { /* 무시 */ }
  }

  async function fetchCredits(userId: string) {
    if (creditsFetchedRef.current) return;
    creditsFetchedRef.current = true;
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    if (data) setUserCredits(data.credits ?? 0);
  }


  async function loadResumeSession() {
    if (!resumeSession) return;
    setIsLoadingResume(true);
    try {
      setJobTitle(resumeSession.session.job_title || "");
      dbSessionIdRef.current = resumeSession.session.id;
      const { data: sessionData } = await supabase.from("sessions").select("analysis_report").eq("id", resumeSession.session.id).single();
      if (sessionData?.analysis_report) { setAnalysisContent(sessionData.analysis_report); analysisContentRef.current = sessionData.analysis_report; }

      const newItems: CoverItem[] = await Promise.all(
        resumeSession.items.map(async (ci) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("role, content, created_at")
            .eq("cover_item_id", ci.id)
            .order("created_at");

          const msgs: ChatMsg[] = (messages || []).map(m => ({
            id: uid(),
            role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
            text: m.content,
          }));
          const apiHistory = (messages || []).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          }));

          const { data: iqs } = await supabase
            .from("interview_questions")
            .select("id, question, order_index")
            .eq("cover_item_id", ci.id)
            .order("order_index");
          const loadedInterviewQs: InterviewQItem[] = await Promise.all(
            (iqs || []).map(async (iq) => {
              const { data: answers } = await supabase
                .from("interview_answers")
                .select("user_answer, ai_feedback, created_at")
                .eq("interview_question_id", iq.id)
                .order("created_at");
              const qMsgs: ChatMsg[] = [];
              for (const a of (answers || [])) {
                if (a.user_answer) qMsgs.push({ id: uid(), role: "user" as const, text: a.user_answer });
                if (a.ai_feedback) qMsgs.push({ id: uid(), role: "bot" as const, text: a.ai_feedback });
              }
              return { id: uid(), dbId: iq.id, question: iq.question, isExpanded: false, msgs: qMsgs, isLoadingFeedback: false, inputText: "" };
            })
          );

          return {
            id: uid(),
            dbId: ci.id,
            question: ci.question || "",
            draft: ci.draft || "",
            charLimit: ci.char_limit ? String(ci.char_limit) : "",
            status: (msgs.length > 0 ? "chatting" : "idle") as "idle" | "chatting",
            msgs,
            apiHistory,
            interviewQs: loadedInterviewQs,
            isLoadingQs: false,
            setupStep: "ready" as const,
            setupMsgs: [] as SetupMsg[],
          };
        })
      );

      if (newItems.length > 0) {
        setItems(newItems);
        setSelectedId(newItems[0].id);
        setStage("chat");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } catch { /* 무시 */ }
    setIsLoadingResume(false);
    setDiscardConfirmMode(false);
    setResumeSession(null);
  }

  const extendSession = useCallback(() => {
    if (idleWarnRef.current) clearTimeout(idleWarnRef.current);
    if (idleLogoutRef.current) clearTimeout(idleLogoutRef.current);
    setIdleWarning(false);
    idleWarnRef.current = setTimeout(() => setIdleWarning(true), 25 * 60 * 1000);
    idleLogoutRef.current = setTimeout(() => {
      supabase.auth.signOut().then(() => { window.location.href = "/"; });
    }, 30 * 60 * 1000);
  }, []);

  useEffect(() => {
    extendSession();
    const events = ["mousedown", "keydown", "touchstart"];
    events.forEach(e => document.addEventListener(e, extendSession, { passive: true }));
    return () => {
      events.forEach(e => document.removeEventListener(e, extendSession));
      if (idleWarnRef.current) clearTimeout(idleWarnRef.current);
      if (idleLogoutRef.current) clearTimeout(idleLogoutRef.current);
    };
  }, [extendSession]);

  useEffect(() => {
    if (!idleWarning) { setIdleCountdown(300); return; }
    const interval = setInterval(() => setIdleCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(interval);
  }, [idleWarning]);

  function showToast(msg: string, field: typeof toastField = "") {
    setToast(msg);
    setToastField(field);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => { setToast(""); setToastField(""); }, 2500);
  }

  function handleGoToChat() {
    if (!companyName.trim()) { showToast("회사명을 입력해주세요", ""); return; }
    if (!jobTitle.trim()) { showToast("지원 직무를 입력해주세요", "jobTitle"); return; }
    const siteNote = companyWebsite.trim() ? ` 사이트: ${companyWebsite.trim()}` : "";
    const jobPostNote = jobLink.trim()
      ? ` 채용공고 링크: ${jobLink.trim()}`
      : jobPostText.trim()
      ? ` 채용공고 내용: ${jobPostText.trim()}`
      : jobPostImagePreview
      ? " (채용공고 이미지 첨부)"
      : "";
    setCompanyInfo(companyName.trim() + siteNote + jobPostNote);
    const firstText = chatMode === "analyze"
      ? "📝 분석할 자소서 문항을 알려주세요.\n예: '팀 프로젝트에서 발휘한 리더십 경험을 서술하시오.'"
      : chatMode === "motivation"
      ? "📝 어떤 문항인가요?\n예: '지원 동기와 입사 후 포부를 서술하시오.'"
      : "📝 어떤 문항인가요?\n예: '본인의 성격 장단점을 서술하시오.'";
    updateItem(selectedId, { setupStep: "question", setupMsgs: [{ id: uid(), role: "bot", text: firstText }] });
    setAnalysisContent("");
    setShowAnalysisPanel(false);
    setStageLeaving(true);
    setTimeout(() => {
      setStage("chat");
      setStageLeaving(false);
      setStageEntering(true);
      setTimeout(() => setStageEntering(false), 380);
      fetchAnalysisReport(false);
    }, 260);
  }

  async function fetchAnalysisReport(showPanel = true) {
    if (isLoadingAnalysis) return;
    setAnalysisContent("");
    setIsLoadingAnalysis(true);
    if (showPanel) setShowAnalysisPanel(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "company-analysis",
          companyName,
          jobTitle,
          companyWebsite,
          jobLink,
          jobPostText,
          jobPostImage: jobPostImagePreview || "",
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
        setAnalysisContent(full);
      }
      analysisContentRef.current = full;
      if (dbSessionIdRef.current && full) {
        supabase.from("sessions").update({ analysis_report: full }).eq("id", dbSessionIdRef.current).then(() => {});
      }
    } catch {
      setAnalysisContent("분석 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }

  function handleSetupSubmit() {
    if (!selected) return;
    const t = setupInput.trim();
    if (!t) return;
    setSetupInput("");
    const userMsg: SetupMsg = { id: uid(), role: "user", text: t };
    const step = selected.setupStep;
    const base = [...selected.setupMsgs, userMsg];
    updateItem(selectedId, { setupMsgs: base });

    if (step === "question") {
      updateItem(selectedId, { question: t });
      setTimeout(() => {
        const bot: SetupMsg = { id: uid(), role: "bot", text: "✏️ 몇 글자로 작성할까요?\n숫자만 입력해주세요. 예: 700" };
        updateItem(selectedId, { setupStep: "charLimit", setupMsgs: [...base, bot] });
      }, 480);
    } else if (step === "charLimit") {
      const num = parseInt(t.replace(/[^0-9]/g, ""));
      if (!num || num < 50 || num > 2000) {
        setTimeout(() => {
          const bot: SetupMsg = { id: uid(), role: "bot", text: "50~2000 사이 숫자로 입력해주세요. 예: 700" };
          updateItem(selectedId, { setupMsgs: [...base, bot] });
        }, 300);
        return;
      }
      updateItem(selectedId, { charLimit: String(num) });
      setTimeout(() => {
        const bot: SetupMsg = { id: uid(), role: "bot", text: "📋 자소서 초안을 붙여넣어주세요." };
        updateItem(selectedId, { setupStep: "draft", setupMsgs: [...base, bot] });
      }, 480);
    } else if (step === "draft") {
      if (t.length > DRAFT_MAX) {
        setTimeout(() => {
          const bot: SetupMsg = { id: uid(), role: "bot", text: `초안이 너무 길어요. ${DRAFT_MAX}자 이하로 줄여주세요.` };
          updateItem(selectedId, { setupMsgs: [...base, bot] });
        }, 300);
        return;
      }
      updateItem(selectedId, { draft: t });
      setTimeout(() => {
        const bot: SetupMsg = { id: uid(), role: "bot", text: "✅ 준비됐어요!\n논리 흐름 · 문맥 · 직무 이해도를 짚어드릴게요." };
        updateItem(selectedId, { setupStep: "ready", setupMsgs: [...base, bot] });
      }, 480);
    }
  }

  function proceedWithAnalysis() {
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    if (isAdmin || userCredits === null) {
      startAnalysis();
    } else {
      setShowCreditConfirm(true);
    }
  }

  async function handleStartClick() {
    if (!selected) return;
    if (!jobTitle.trim()) { showToast("지원 직무를 먼저 입력해주세요", "jobTitle"); return; }
    if (!selected.question.trim()) { showToast("자소서 문항을 먼저 입력해주세요", "question"); return; }
    if (!selected.charLimit.trim()) { showToast("글자수 제한을 먼저 입력해주세요", "charLimit"); return; }
    if (!selected.draft.trim()) { showToast("자소서 초안을 먼저 입력해주세요", "draft"); return; }

    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    if (!isAdmin && userCredits !== null && userCredits <= 0) {
      showToast("뱃지가 없어요. 관리자에게 문의해주세요", "");
      return;
    }

    proceedWithAnalysis();
  }

  async function startAnalysis() {
    if (!selected) return;
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    const seed = [{ role: "user", content: "초안 진단을 시작해줘." }];
    let itemDbId: string | null = null;

    try {
      const sessionId = await ensureDbSession();
      console.log("[DB] currentUser:", currentUser, "sessionId:", sessionId);
      if (sessionId && analysisContentRef.current) {
        supabase.from("sessions").update({ analysis_report: analysisContentRef.current }).eq("id", sessionId).then(() => {});
      }
      if (sessionId) {
        const orderIndex = items.findIndex(it => it.id === selectedId);
        const { data, error } = await supabase.from("cover_items").insert({
          session_id: sessionId,
          question: selected.question,
          draft: selected.draft,
          char_limit: selected.charLimit ? parseInt(selected.charLimit) : null,
          status: "chatting",
          order_index: orderIndex,
        }).select("id").single();
        if (error) console.error("[DB] cover_items insert error:", error);
        if (data) itemDbId = data.id;
      }

      if (!isAdmin && itemDbId && currentUser) {
        const { data: creditResult, error: creditErr } = await supabase.rpc("use_credit", {
          p_user_id: currentUser.id,
          p_cover_item_id: itemDbId,
        });
        if (creditErr) console.error("[DB] use_credit error:", creditErr);
        if (creditResult === "insufficient") {
          await supabase.from("cover_items").delete().eq("id", itemDbId);
          showToast("뱃지가 없어요. 관리자에게 문의해주세요", "");
          return;
        }
        if (creditResult === "ok") {
          setUserCredits(prev => (prev !== null ? prev - 1 : null));
        }
        // already_charged: 이어서 하기 케이스, 조용히 통과
      }
    } catch (e) {
      console.error("[DB] startAnalysis error:", e);
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId ? { ...it, status: "chatting" as const, apiHistory: seed, dbId: itemDbId } : it
      )
    );
    await fetchBotReply(seed, selectedId, selected.draft, selected.question, selected.charLimit, itemDbId);
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
    await fetchBotReply(newHistory, selectedId, selected.draft, selected.question, selected.charLimit, selected.dbId);
  }

  async function handleRevisionRequest() {
    if (!selected || isStreaming) return;
    const t = "완성본을 작성해줘.";
    const newHistory = [...selected.apiHistory, { role: "user", content: t }];
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId
          ? { ...it, msgs: [...it.msgs, { id: uid(), role: "user" as const, text: t }], apiHistory: newHistory }
          : it
      )
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    await fetchBotReply(newHistory, selectedId, selected.draft, selected.question, selected.charLimit, selected.dbId);
  }

  async function handleAdminRegenerate() {
    if (!selected || isStreaming) return;
    const revIdx = selected.msgs.findIndex(m => m.role === "user" && m.text === "완성본을 작성해줘.");
    const histIdx = selected.apiHistory.findIndex(h => h.role === "user" && h.content === "완성본을 작성해줘.");
    const newMsgs = revIdx !== -1 ? selected.msgs.slice(0, revIdx) : selected.msgs;
    const newHistory = histIdx !== -1 ? selected.apiHistory.slice(0, histIdx) : selected.apiHistory;
    const t = "완성본을 작성해줘.";
    const newHistoryWithReq = [...newHistory, { role: "user", content: t }];
    setItems(prev => prev.map(it => it.id === selectedId
      ? { ...it, msgs: [...newMsgs, { id: uid(), role: "user" as const, text: t }], apiHistory: newHistoryWithReq, interviewQs: [] }
      : it
    ));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    await fetchBotReply(newHistoryWithReq, selectedId, selected.draft, selected.question, selected.charLimit, selected.dbId);
  }

  async function fetchInterviewQuestions() {
    if (!selected || selected.isLoadingQs || selected.interviewQs.length > 0) return;
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
      // ── DB: interview_questions 저장 ──
      const sliced = qs.slice(0, 4);
      const dbIdByIndex: Record<number, string> = {};
      const coverDbId = items.find(it => it.id === selectedId)?.dbId;
      if (coverDbId && sliced.length > 0) {
        const rows = sliced.map((q: string, idx: number) => ({
          cover_item_id: coverDbId,
          question: q,
          order_index: idx,
        }));
        const { data: savedQs, error: iqErr } = await supabase.from("interview_questions").insert(rows).select("id, order_index");
        if (iqErr) console.error("[DB] interview_questions insert error:", iqErr);
        if (savedQs) savedQs.forEach(row => { dbIdByIndex[row.order_index] = row.id; });
      }

      updateItem(selectedId, {
        isLoadingQs: false,
        interviewQs: sliced.map((q: string, idx: number) => ({
          id: uid(), dbId: dbIdByIndex[idx] ?? null, question: q, isExpanded: false, msgs: [], isLoadingFeedback: false, inputText: "",
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

      // ── DB: 면접 답변 + AI 피드백 저장 ──
      if (qItem.dbId) {
        const { error: iaErr } = await supabase.from("interview_answers").insert({
          interview_question_id: qItem.dbId,
          user_answer: answer,
          ai_feedback: full,
        });
        if (iaErr) console.error("[DB] interview_answers insert error:", iaErr);
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

  const canStart = chatMode === "analyze"
    ? !!jobTitle.trim() && !!selected?.question.trim() && !!selected?.charLimit.trim() && !!selected?.draft.trim() && selected?.status === "idle"
    : !!jobTitle.trim() && !!selected?.draft.trim() && selected?.status === "idle";

  const hasAnyRevision = !isStreaming && (selected?.msgs.some(
    (m) => m.role === "bot" && (
      (chatMode === "motivation" && m.text.includes("[지원동기]") && m.text.includes("[/지원동기]")) ||
      (chatMode !== "motivation" && m.text.includes("[수정본]") && m.text.includes("[/수정본]") && m.text.includes("[변경사항]") && m.text.includes("[/변경사항]"))
    )
  ) ?? false);

  const revisionReady = (selected?.msgs.some(
    (m) => m.role === "bot" && m.text.includes("[완성준비]")
  ) ?? false) && !hasAnyRevision;

  const interviewQs = selected?.interviewQs ?? [];
  const isLoadingQs = selected?.isLoadingQs ?? false;
  const showInterviewButton = !isStreaming && hasAnyRevision && interviewQs.length === 0 && !isLoadingQs;
  const showSummaryButton = hasAnyRevision && interviewQs.length > 0;



  return (
    <>
      {/* ── STAGE 1: 정보 입력 ── */}
      {stage === "info" && (
        <div className="h-dvh flex flex-col" style={{ background: "#F9FAFB", opacity: stageLeaving ? 0 : 1, transform: stageLeaving ? "scale(0.97) translateY(-6px)" : "scale(1) translateY(0)", transition: "opacity 0.26s ease, transform 0.26s ease" }}>
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: "#111827" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              홈
            </Link>
            <div className="flex items-center gap-2">
              <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>취업소크라테스</span>
            </div>
            <div style={{ width: "52px" }} />
          </div>
          <div className="flex-1 flex items-center justify-center px-5">
            <div className="w-full max-w-[460px] flex flex-col gap-5">
              <p className="text-sm pl-1" style={{ color: "#6B7280" }}>정보를 입력하면 채팅으로 바로 시작합니다</p>
              {/* 회사 정보 */}
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold pl-1 flex items-center gap-0.5" style={{ color: "#111827" }}>
                      기업명 <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoToChat()} placeholder="삼성전자" className="ds-input w-full px-4 py-3.5 rounded-2xl text-sm placeholder:text-[#9CA3AF]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", boxShadow: "none" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold pl-1" style={{ color: "#6B7280" }}>회사 사이트</label>
                    <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." className="ds-input w-full px-4 py-3.5 rounded-2xl text-sm placeholder:text-[#9CA3AF]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", boxShadow: "none" }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold pl-1 flex items-center gap-0.5" style={{ color: "#111827" }}>
                    지원 직무 <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoToChat()} placeholder="마케팅 기획" className="ds-input w-full px-4 py-3.5 rounded-2xl text-sm placeholder:text-[#9CA3AF]" style={{ background: "#FFFFFF", border: `1.5px solid ${toastField === "jobTitle" ? "#EF4444" : "#E5E7EB"}`, color: "#111827", outline: "none", boxShadow: "none" }} />
                </div>
                {/* 채용공고 입력 버튼 */}
                {(() => {
                  const hasContent = jobLink.trim() || jobPostText.trim() || jobPostImagePreview;
                  return (
                    <button
                      type="button"
                      onClick={() => setShowJobPostModal(true)}
                      className="w-full px-4 py-3.5 rounded-2xl text-sm text-left flex items-center justify-between transition-all hover:opacity-80"
                      style={{
                        background: hasContent ? "#F5F3FF" : "#FFFFFF",
                        border: `1.5px solid ${hasContent ? "#A78BFA" : "#E5E7EB"}`,
                        color: hasContent ? "#4C3F99" : "#6B7280",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none">{hasContent ? "📎" : "📋"}</span>
                        <span>
                          {hasContent
                            ? jobLink.trim()
                              ? `링크: ${jobLink.trim().slice(0, 30)}${jobLink.trim().length > 30 ? "…" : ""}`
                              : jobPostText.trim()
                              ? `텍스트: ${jobPostText.trim().slice(0, 25)}${jobPostText.trim().length > 25 ? "…" : ""}`
                              : "이미지 첨부됨"
                            : "채용공고 입력하기 (선택)"}
                        </span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  );
                })()}
              </div>
              {/* 카테고리 */}
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { key: "analyze",     label: "직무역량",    desc: "경험과 역량을 꺼냅니다",  color: BLUE,   emoji: "💼" },
                  { key: "motivation",  label: "지원동기",    desc: "나만의 동기를 찾습니다",  color: GOLD,   emoji: "✨" },
                  { key: "personality", label: "성격 장단점", desc: "나다운 문장으로 씁니다",  color: VIOLET, emoji: "🌱" },
                ] as { key: typeof chatMode; label: string; desc: string; color: string; emoji: string }[]).map(({ key, label, desc, color, emoji }) => (
                  <button key={key} onClick={() => setChatMode(key)} className="flex flex-col gap-2 px-4 py-4 rounded-2xl text-left transition-all" style={{ background: "#FFFFFF", border: `${chatMode === key ? "2px" : "1px"} solid ${chatMode === key ? color : "#E5E7EB"}`, boxShadow: chatMode === key ? `0 2px 8px rgba(0,0,0,0.08)` : "none", transition: "all 0.15s ease" }}>
                    <span className="text-xl leading-none">{emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</span>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all" }}>{desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleGoToChat}
                  className="flex items-center gap-2 pl-4 hover:opacity-60 transition-opacity active:scale-[0.97]"
                >
                  <span className="text-base font-bold" style={{ color: "#111827", letterSpacing: "-0.01em" }}>시작하기</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 2: 채팅 ── */}
      {stage === "chat" && (
      <div style={{ opacity: stageEntering ? 0 : 1, transform: stageEntering ? "translateY(14px)" : "translateY(0)", transition: "opacity 0.38s ease, transform 0.38s ease", height: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F9FAFB" }}>

        {/* ── 헤더 ── */}
        <header
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: "52px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <button
            onClick={() => { setStage("info"); setShowAnalysisPanel(false); setAnalysisContent(""); }}
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: "#111827" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            공고
          </button>
          <button
            className="flex items-center gap-1.5 min-w-0 hover:opacity-75 transition-opacity"
            onClick={() => {
              document.querySelectorAll(".overflow-y-auto").forEach((el) => { (el as HTMLElement).scrollTop = 0; });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-[15px] font-semibold truncate" style={{ color: "#111827", letterSpacing: "-0.01em" }}>취업소크라테스</span>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentUser && userCredits !== null && currentUser.email !== ADMIN_EMAIL && (
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(212,146,10,0.10)", border: "1px solid rgba(212,146,10,0.22)", color: "#8B6A0A" }}
              >
                🏅 {userCredits}
              </div>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-xs lg:text-sm px-2.5 py-1.5 rounded-lg transition-all hover:opacity-70"
              style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280" }}
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* 환영 토스트 */}
        {welcome && (
          <div
            className="fixed top-16 left-1/2 lg:left-[calc(136px+50vw)] z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg"
            style={{
              transform: "translateX(-50%)",
              background: "rgba(67,56,202,0.15)",
              border: "1px solid rgba(67,56,202,0.35)",
              color: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
            }}
          >
            {welcome}님, 환영합니다! 🎉
          </div>
        )}

        {/* 알림 토스트 */}
        {toast && (
          <div
            className="fixed top-16 left-1/2 lg:left-[calc(136px+50vw)] z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg"
            style={{
              transform: "translateX(-50%)",
              background: "rgba(201,100,66,0.18)",
              border: "1px solid rgba(201,100,66,0.45)",
              color: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              whiteSpace: "nowrap",
            }}
          >
            ✏️ {toast}
          </div>
        )}

        {/* ── 메인 ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ────────── 왼쪽 패널 (lg 이상) ────────── */}
          <div className="hidden lg:flex flex-shrink-0 flex-col border-r overflow-hidden" style={{ width: "260px", borderColor: "#E5E7EB", background: "#FFFFFF" }}>

            {/* 지원 정보 */}
            <div className="flex flex-col gap-3 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB", padding: "18px 16px" }}>
              {/* 선택된 카테고리 — 텍스트만 */}
              {(() => {
                const modeMap = {
                  analyze:     { label: "직무역량",    color: BLUE,   emoji: "💼" },
                  motivation:  { label: "지원동기",    color: GOLD,   emoji: "✨" },
                  personality: { label: "성격 장단점", color: VIOLET, emoji: "🌱" },
                } as const;
                const { label, color, emoji } = modeMap[chatMode];
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</span>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-0.5" style={{ background: color }} />
                  </div>
                );
              })()}

              {/* 회사 + 직무 정보 표시 */}
              {companyName && (
                <div className="px-3 py-2.5 rounded-xl" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{companyName}</p>
                  {jobTitle && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{jobTitle}</p>}
                </div>
              )}
              {!companyName && jobTitle && (
                <div className="px-3 py-2.5 rounded-xl" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{jobTitle}</p>
                </div>
              )}

              {/* 분석 보고서 버튼 */}
              <button
                onClick={() => {
                  if (showAnalysisPanel) { setShowAnalysisPanel(false); }
                  else if (analysisContent || isLoadingAnalysis) { setShowAnalysisPanel(true); }
                  else { fetchAnalysisReport(); }
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{
                  background: showAnalysisPanel ? "#312E81" : "#EDE9FE",
                  color: showAnalysisPanel ? "#fff" : "#4338CA",
                  border: `1px solid ${showAnalysisPanel ? "#312E81" : "#C4B5FD"}`,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                {showAnalysisPanel ? "보고서 닫기" : "분석 보고서"}
              </button>
            </div>

            {/* 항목 목록 */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              <p className="text-xs px-1 pt-0.5 pb-1.5 font-semibold tracking-wider uppercase" style={{ color: "#6B7280", letterSpacing: "0.10em" }}>자소서 항목</p>

              {items.map((item, idx) => {
                const isSel = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    role="button" tabIndex={0}
                    onClick={() => setSelectedId(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedId(item.id)}
                    className="w-full text-left rounded-xl px-3 py-2.5 flex flex-col gap-0.5 transition-all group relative cursor-pointer"
                    style={{
                      background: isSel ? "#F5F3FF" : "transparent",
                      border: `${isSel ? "2px" : "1px"} solid ${isSel ? "#A78BFA" : "#E5E7EB"}`,
                      boxShadow: "none",
                    }}
                  >
                    <div className="flex items-center gap-2 pr-6">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: isSel ? "#4C3F99" : "#6B7280" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13px] font-medium truncate" style={{ color: "#111827" }}>
                        {item.question || <span style={{ color: "#6B7280" }}>문항 미입력</span>}
                      </span>
                    </div>
                    {item.draft && (
                      <p className="text-xs truncate pl-6" style={{ color: "#6B7280" }}>{item.draft}</p>
                    )}
                    <div className="absolute right-2 top-2.5 flex items-center gap-1">
                      {item.status === "chatting" && (
                        <span className="rounded-full font-medium px-1.5 py-0.5" style={{ background: `${BLUE}10`, color: BLUE, fontSize: "10px", lineHeight: "1.4" }}>진행</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-xs"
                        style={{ color: "#6B7280" }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────────── 오른쪽 패널 ────────── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F9FAFB" }}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: "#6B7280" }}>항목을 선택해주세요</p>
              </div>
            ) : selected.status === "idle" ? (

              /* ── Setup Chat (라이트 테마) ── */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 모바일 항목 탭 */}
                {items.length > 1 && (
                  <div className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                    {items.map((item, idx) => {
                      const isSel = item.id === selectedId;
                      return (
                        <button key={item.id} onClick={() => setSelectedId(item.id)}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: isSel ? `${BLUE}12` : "#F0F1F3", border: `1px solid ${isSel ? `${BLUE}30` : "transparent"}`, color: isSel ? BLUE : "#6B7280" }}
                        >{String(idx + 1).padStart(2, "0")}</button>
                      );
                    })}
                  </div>
                )}

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-10">
                  <div className="max-w-[660px] mx-auto flex flex-col gap-4">
                    {selected.setupMsgs.map((msg) => (
                      <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "bot" && (
                          <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-0.5" style={{ background: "#fff", padding: "2px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }} />
                        )}
                        <div
                          className="max-w-[78%] px-4 py-3.5 text-sm leading-[1.85] whitespace-pre-wrap"
                          style={msg.role === "bot"
                            ? { background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "none", border: "1px solid #E5E7EB" }
                            : { background: ACCENT, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
                          }
                        >{msg.text}</div>
                      </div>
                    ))}
                    <div ref={setupBottomRef} />
                  </div>
                </div>

                {/* 입력 영역 — floating pill */}
                <div className="px-5 pb-6 pt-2 flex-shrink-0" style={{ background: "#F9FAFB" }}>
                  <div className="max-w-[660px] mx-auto">
                    {selected.setupStep === "ready" ? (
                      <button
                        onClick={handleStartClick}
                        className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${BLUE}CC 100%)`, boxShadow: `0 4px 24px ${ACCENT}28` }}
                      >
                        분석하기 →
                      </button>
                    ) : (
                      <div
                        className="pill-input flex items-end gap-2"
                        style={{
                          background: "#FFFFFF",
                          border: `1.5px solid ${setupInput.trim() ? "#A78BFA" : "#E5E7EB"}`,
                          borderRadius: selected.setupStep === "draft" ? "20px" : "100px",
                          boxShadow: setupInput.trim() ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                          padding: selected.setupStep === "draft" ? "14px 14px 14px 18px" : "8px 8px 8px 20px",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease, border-radius 0.2s ease",
                        }}
                      >
                        <textarea
                          ref={setupInputRef}
                          value={setupInput}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSetupInput(selected.setupStep === "charLimit" ? v.replace(/[^0-9]/g, "").slice(0, 4) : v);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && selected.setupStep !== "draft") { e.preventDefault(); handleSetupSubmit(); } }}
                          placeholder={
                            selected.setupStep === "question" ? "자소서 문항을 입력하세요"
                            : selected.setupStep === "charLimit" ? "글자 수 (예: 700)"
                            : "초안을 붙여넣어주세요"
                          }
                          rows={selected.setupStep === "draft" ? 5 : 1}
                          className="flex-1 resize-none placeholder:text-[#6B7280]"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: selected.setupStep === "draft" ? "0 4px 0 0" : "6px 0",
                            fontSize: "15px",
                            lineHeight: "1.6",
                            color: "#111827",
                            outline: "none",
                            overflowY: "auto",
                          }}
                        />
                        <button
                          onClick={handleSetupSubmit}
                          disabled={!setupInput.trim()}
                          className="flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95"
                          style={{
                            background: setupInput.trim() ? DS_PRIMARY : "#F3F4F6",
                            color: setupInput.trim() ? "#fff" : "#6B7280",
                            width: selected.setupStep === "draft" ? "38px" : "36px",
                            height: selected.setupStep === "draft" ? "38px" : "36px",
                            alignSelf: selected.setupStep === "draft" ? "flex-end" : "center",
                            boxShadow: setupInput.trim() ? GLOW_PRIMARY : "none",
                            transition: "background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            ) : (

              /* ── 채팅 패널 ── */
              <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* 항목 헤더 바 */}
                <div className="flex-shrink-0 flex flex-col border-b" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                  {/* 모바일 항목 탭 */}
                  {items.length > 1 && (
                    <div className="lg:hidden flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-b" style={{ borderColor: "rgba(0,0,0,0.05)", scrollbarWidth: "none" }}>
                      {items.map((item, idx) => {
                        const isSel = item.id === selectedId;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: isSel ? `${BLUE}12` : "#F0F1F3",
                              border: `1px solid ${isSel ? `${BLUE}30` : "transparent"}`,
                              color: isSel ? BLUE : "#6B7280",
                            }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* 메인 헤더 행 */}
                  <div className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0" style={{ background: `${BLUE}10`, color: BLUE, fontSize: "11px" }}>
                      {String(items.findIndex((it) => it.id === selectedId) + 1).padStart(2, "0")}
                    </div>
                    <button
                      onClick={() => { setEditingField("question"); setEditFieldValue(selected.question); }}
                      className="text-sm flex-1 text-left truncate hover:opacity-60 transition-opacity"
                      style={{ color: "#111827" }}
                      title="클릭해서 문항 수정"
                    >
                      {selected.question}
                    </button>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {selected.charLimit && editingField !== "charLimit" && (
                        <button
                          onClick={() => { setEditingField("charLimit"); setEditFieldValue(selected.charLimit); }}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full hover:opacity-70 transition-opacity"
                          style={{ background: "#EDE9FE", color: "#4338CA" }}
                        >
                          {selected.charLimit}자
                        </button>
                      )}
                      {editingField === "charLimit" && (
                        <div className="flex items-center gap-1">
                          <input
                            value={editFieldValue}
                            onChange={(e) => setEditFieldValue(e.target.value.replace(/[^0-9]/g, ""))}
                            onKeyDown={(e) => { if (e.key === "Enter") { updateItem(selectedId, { charLimit: editFieldValue }); setEditingField(null); } if (e.key === "Escape") setEditingField(null); }}
                            className="w-14 text-xs rounded-lg px-2 py-1 text-center"
                            style={{ background: "#F9FAFB", border: "1.5px solid #A78BFA", color: "#111827", outline: "none" }}
                            autoFocus
                          />
                          <button
                            onClick={() => { updateItem(selectedId, { charLimit: editFieldValue }); setEditingField(null); }}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white"
                            style={{ background: "#312E81" }}
                          >저장</button>
                          <button onClick={() => setEditingField(null)} className="text-[10px]" style={{ color: "#9CA3AF" }}>✕</button>
                        </div>
                      )}
                      {["진단", "질문", "보강"].map((step, i) => {
                        const userCount = selected.msgs.filter((m) => m.role === "user").length;
                        const active = i === 0 ? userCount === 0 : i === 1 ? userCount < 3 : userCount >= 3;
                        return (
                          <span key={step} className="hidden sm:block text-xs px-2 py-0.5 rounded-full" style={{ background: active ? `${BLUE}18` : "rgba(0,0,0,0.05)", color: active ? BLUE : "#6B7280", fontSize: "10px" }}>
                            {step}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* 문항 편집 패널 */}
                  {editingField === "question" && (
                    <div className="px-4 pb-3 flex flex-col gap-2 border-t" style={{ borderColor: "#F3F4F6" }}>
                      <textarea
                        value={editFieldValue}
                        onChange={(e) => setEditFieldValue(e.target.value)}
                        rows={3}
                        className="w-full text-sm rounded-xl px-3 py-2 resize-none"
                        style={{ background: "#F9FAFB", border: "1.5px solid #A78BFA", color: "#111827", outline: "none", marginTop: "8px" }}
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { updateItem(selectedId, { question: editFieldValue.trim() }); setEditingField(null); }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "#312E81" }}
                        >저장</button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "#F3F4F6", color: "#6B7280" }}
                        >취소</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-5" style={{ background: "#F3F4F6" }}>
                  <div className="max-w-2xl lg:max-w-3xl mx-auto flex flex-col gap-4">
                    {selected.msgs.map((msg, msgIdx) => {
                      const isDiagnosis = msgIdx === 0 && msg.role === "bot";
                      const isRevisionComplete = msg.role === "bot"
                        && (
                          (msg.text.includes("[수정본]") && msg.text.includes("[/수정본]")) ||
                          (msg.text.includes("[지원동기]") && msg.text.includes("[/지원동기]"))
                        );
                      const isRevisionStreaming = isStreaming
                        && msg.role === "bot"
                        && (
                          (msg.text.includes("[수정본]") && !msg.text.includes("[/수정본]")) ||
                          (msg.text.includes("[지원동기]") && !msg.text.includes("[/지원동기]"))
                        );
                      const isPrevRevisionRequest = msgIdx > 0
                        && selected.msgs[msgIdx - 1]?.role === "user"
                        && selected.msgs[msgIdx - 1]?.text === "완성본을 작성해줘.";
                      const isRevisionInProgress = (isStreaming && isPrevRevisionRequest && msg.role === "bot" && !isRevisionComplete)
                        || isRevisionStreaming
                        || (isRevisionComplete && isStreaming);

                      if (isDiagnosis) {
                        return <DiagnosisCard key={msg.id} text={msg.text} streaming={isStreaming} />;
                      }

                      if (isRevisionInProgress && !isRevisionStreaming && !isRevisionComplete) {
                        return <RevisionLoadingCard key={msg.id} />;
                      }

                      if (isRevisionStreaming || isRevisionComplete) {
                        return (
                          <RevisionMessage
                            key={msg.id}
                            text={msg.text}
                            companyName={companyName}
                            jobTitle={jobTitle}
                            question={selected.question}
                            charLimit={selected.charLimit}
                          />
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.role === "bot" && <BotBubbleAvatar />}
                          <div
                            className="max-w-[80%] px-4 py-3.5 text-sm leading-[1.85] whitespace-pre-wrap"
                            style={
                              msg.role === "bot"
                                ? { background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #E5E7EB" }
                                : { background: ACCENT, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
                            }
                          >
                            {msg.role === "bot" ? stripMd(msg.text) : msg.text}
                            {isStreaming && msg.text === "" && (
                              <div className="flex items-center h-6">
                                <StreamingLoadingMsg />
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
                          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.09)" }} />
                          <span className="text-xs font-semibold tracking-wide px-1" style={{ color: VIOLET }}>
                            면접 예상 질문 {interviewQs.length}개
                          </span>
                          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.09)" }} />
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
                <div className="px-5 py-4 flex-shrink-0 border-t" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                  <div className="max-w-2xl lg:max-w-3xl mx-auto flex flex-col gap-2.5">

                    {revisionReady ? (
                      /* 수정본 작성 요청 버튼 */
                      <button
                        onClick={handleRevisionRequest}
                        disabled={isStreaming}
                        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.985] disabled:opacity-30 flex items-center justify-center gap-2"
                        style={{ background: ACCENT, color: "#fff", boxShadow: `0 4px 16px ${ACCENT}28` }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        자소서 완성하기
                      </button>
                    ) : showInterviewButton ? (
                      /* 면접 예상질문 확인 버튼 */
                      <button
                        onClick={fetchInterviewQuestions}
                        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.985] flex items-center justify-center gap-2"
                        style={{ background: VIOLET, color: "#fff", boxShadow: `0 4px 16px ${VIOLET}35` }}
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
                        <span className="text-sm" style={{ color: "#6B7280" }}>예상 질문 생성 중...</span>
                      </div>
                    ) : !showSummaryButton ? (
                      /* 일반 입력창 */
                      <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-3">
                          <textarea
                            ref={chatInputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value.slice(0, 250))}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={isStreaming}
                            placeholder="답변을 입력하세요"
                            rows={1}
                            className="ds-input flex-1 disabled:opacity-30 resize-none placeholder:text-[#6B7280]"
                            style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "16px", padding: "11px 18px", fontSize: "15px", lineHeight: "1.6", color: "#111827", height: "46px", maxHeight: "160px", overflowY: "auto", outline: "none", boxShadow: "none" }}
                          />
                          <button
                            onClick={handleSend}
                            disabled={isStreaming || !input.trim()}
                            className="flex-shrink-0 flex items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30"
                            style={{ background: input.trim() ? DS_PRIMARY : "#F3F4F6", color: input.trim() ? "#fff" : "#6B7280", padding: "0 18px", height: "46px", boxShadow: input.trim() ? GLOW_PRIMARY : "none", whiteSpace: "nowrap", transition: "background 0.15s, color 0.15s, box-shadow 0.15s" }}
                          >
                            전송
                          </button>
                        </div>
                        <div className="flex justify-end pr-1">
                          <span className="text-xs tabular-nums" style={{ color: input.length >= 230 ? "rgba(239,68,68,0.8)" : "#6B7280" }}>
                            {input.length}/250
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* 어드민 전용: 완성본 재생성 */}
                    {currentUser?.email === ADMIN_EMAIL && hasAnyRevision && (
                      <button
                        onClick={handleAdminRegenerate}
                        disabled={isStreaming}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-30 flex items-center justify-center gap-1.5"
                        style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.25)", color: "rgba(255,209,102,0.7)" }}
                      >
                        🔄 완성본 재생성 (어드민)
                      </button>
                    )}

                    {/* 대화 정리하기 + 홈 — 면접 Q&A 완료 후에만 노출 */}
                    {showSummaryButton && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            const allAnswered = interviewQs.every(q => q.msgs.length > 0);
                            if (!allAnswered) { setShowInterviewWarning(true); } else { setShowSummary(true); }
                          }}
                          className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                          style={{
                            background: `linear-gradient(135deg, ${BLUE}14 0%, ${ACCENT}10 100%)`,
                            border: `1px solid ${BLUE}30`,
                            color: "#111827",
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
                        <Link
                          href="/"
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:opacity-70 flex items-center justify-center gap-2"
                          style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          홈으로 가기
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── 오른쪽 분석 보고서 패널 — 데스크탑 ── */}
              {showAnalysisPanel && (
              <div
                className="hidden lg:flex flex-shrink-0 flex-col border-l overflow-hidden"
                style={{ width: "clamp(420px, 42vw, 560px)", borderColor: "#E5E7EB", background: "#FAFAFA" }}
              >
                {/* 패널 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "#6366F1", letterSpacing: "0.1em" }}>분석 보고서</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isLoadingAnalysis && analysisContent && (
                      <>
                        <button
                          onClick={() => { const s = parseAnalysisForPDF(analysisContent); exportToPDF("분석 보고서", s, [companyName, jobTitle].filter(Boolean).join(" · ")); }}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg hover:opacity-70"
                          style={{ background: "#EDE9FE", color: "#4C3F99" }}
                        >PDF</button>
                        <button onClick={() => fetchAnalysisReport()} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg hover:opacity-70" style={{ background: "#F3F4F6", color: "#6B7280" }}>재조사</button>
                      </>
                    )}
                    <button
                      onClick={() => setShowAnalysisPanel(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity"
                      style={{ background: "#F3F4F6", color: "#6B7280" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                  {!analysisContent && !isLoadingAnalysis && (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 pt-16 pb-6 text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#111827" }}>기업·직무 분석 보고서</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all" }}>회사와 직무를 분석해서 자소서 작성 방향을 잡아드려요</p>
                      </div>
                      <button
                        onClick={() => fetchAnalysisReport()}
                        className="mt-1 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
                        style={{ background: "#312E81" }}
                      >보고서 생성하기</button>
                    </div>
                  )}

                  {isLoadingAnalysis && !analysisContent && (
                    <div className="flex flex-col items-center justify-center gap-3 pt-16">
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366F1", animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: "#6B7280" }}>조사 중...</p>
                    </div>
                  )}

                  {analysisContent && (
                    <div className="flex flex-col">
                      {/* 문서 헤더 */}
                      <div className="px-7 pt-7 pb-6" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
                        <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "#A78BFA", letterSpacing: "0.12em" }}>COMPANY · JOB ANALYSIS</p>
                        <h1 className="text-xl font-black leading-tight" style={{ color: "#111827", letterSpacing: "-0.03em" }}>
                          {companyName || "기업"}
                          <span style={{ color: "#6366F1" }}> · </span>
                          {jobTitle || "직무"}
                        </h1>
                        <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 기준
                        </p>
                      </div>

                      {/* 섹션들 */}
                      <div className="px-7 py-6 flex flex-col gap-8">
                        {analysisContent.split(/(?=##\s)/).filter(s => s.trim()).map((section, i) => {
                          const lines = section.trim().split("\n").filter(Boolean);
                          const rawTitle = lines[0]?.replace(/^##\s*/, "") ?? "";
                          const bullets = lines.slice(1).filter((l) => l.startsWith("- ")).map((l) => l.replace(/^-\s*/, ""));
                          const numMatch = rawTitle.match(/^(\S+)\s+(\d+)\.\s*(.+)$/);
                          const emoji = numMatch ? numMatch[1] : "";
                          const num = numMatch ? numMatch[2] : String(i + 1);
                          const sectionTitle = numMatch ? numMatch[3] : rawTitle;
                          return (
                            <div key={i} className="flex flex-col gap-4">
                              {/* 섹션 제목 */}
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: "#EDE9FE", color: "#4338CA" }}>
                                  {num}
                                </div>
                                <div className="flex items-center gap-1.5 flex-1">
                                  {emoji && <span className="text-base leading-none">{emoji}</span>}
                                  <h2 className="text-base font-black" style={{ color: "#111827", letterSpacing: "-0.02em" }}>{sectionTitle}</h2>
                                </div>
                              </div>

                              {/* 불릿 항목 */}
                              <div className="flex flex-col gap-3 pl-10">
                                {bullets.map((b, j) => {
                                  const colonIdx = b.indexOf(": ");
                                  const label = colonIdx > 0 && colonIdx < 22 ? b.slice(0, colonIdx) : null;
                                  const body = label ? b.slice(colonIdx + 2) : b;
                                  return (
                                    <div key={j} className="flex flex-col gap-1 pl-3" style={{ borderLeft: "2px solid #EDE9FE" }}>
                                      {label && (
                                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#6366F1", letterSpacing: "0.08em" }}>{label}</p>
                                      )}
                                      <p className="text-sm leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all" }}>{body}</p>
                                    </div>
                                  );
                                })}
                              </div>

                              {i < 5 && <div style={{ height: "1px", background: "#F3F4F6" }} />}
                            </div>
                          );
                        })}
                        {isLoadingAnalysis && (
                          <div className="flex gap-1.5 pb-2">
                            {[0, 150, 300].map((d) => (
                              <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366F1", animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              </div>
            )}
          </div>
        </div>
      </div>

      </div>
      )}  {/* /stage2 */}

      {/* 세션 복원 모달 */}
      {resumeSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full flex flex-col gap-5 rounded-2xl p-6"
            style={{ maxWidth: "360px", background: "#0D0D18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
          >
            {(() => {
              const hasBadgeUsed = resumeSession.items.some(i => i.status === "chatting");

              if (!discardConfirmMode && hasBadgeUsed) {
                return (
                  /* ── 뱃지 사용 문항 있음 — 첫 화면 ── */
                  <>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <span style={{ fontSize: 20 }}>🏅</span>
                        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>뱃지가 사용된 문항이 있어요</p>
                      </div>
                      <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(248,113,113,0.82)" }}>
                          분석이 시작된 문항이 있어요. 이어서 진행하면 추가 뱃지 차감 없이 계속할 수 있어요.
                        </p>
                      </div>
                      {resumeSession.items.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {resumeSession.items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="text-xs font-bold flex-shrink-0 mt-px" style={{ color: `${BLUE}80` }}>{String(i + 1).padStart(2, "0")}</span>
                              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)", wordBreak: "keep-all" }}>
                                {item.question || "문항 미입력"}
                              </p>
                            </div>
                          ))}
                          {resumeSession.items.length > 3 && (
                            <p className="text-xs pl-5" style={{ color: "rgba(255,255,255,0.25)" }}>외 {resumeSession.items.length - 3}개 항목</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={loadResumeSession}
                        disabled={isLoadingResume}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
                      >
                        {isLoadingResume ? "불러오는 중..." : "계속하기"}
                      </button>
                      <button
                        onClick={() => setDiscardConfirmMode(true)}
                        disabled={isLoadingResume}
                        className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        새로 시작
                      </button>
                    </div>
                  </>
                );
              }

              if (!discardConfirmMode && !hasBadgeUsed) {
                return (
                  /* ── 이어서하기 ── */
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                        <p className="text-sm font-semibold text-white">이어서 진행할까요?</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", paddingLeft: "16px" }}>
                        {formatRelativeTime(resumeSession.session.created_at)} 작업하던
                        {resumeSession.session.job_title ? ` "${resumeSession.session.job_title}"` : ""} 자소서가 있어요.
                      </p>
                      {resumeSession.items.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5 pl-4">
                          {resumeSession.items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="text-xs font-bold flex-shrink-0 mt-px" style={{ color: `${BLUE}80` }}>{String(i + 1).padStart(2, "0")}</span>
                              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)", wordBreak: "keep-all" }}>
                                {item.question || "문항 미입력"}
                              </p>
                            </div>
                          ))}
                          {resumeSession.items.length > 3 && (
                            <p className="text-xs pl-5" style={{ color: "rgba(255,255,255,0.25)" }}>외 {resumeSession.items.length - 3}개 항목</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={loadResumeSession}
                        disabled={isLoadingResume}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
                      >
                        {isLoadingResume ? "불러오는 중..." : "이어서 하기"}
                      </button>
                      <button
                        onClick={() => setDiscardConfirmMode(true)}
                        disabled={isLoadingResume}
                        className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        새로 시작
                      </button>
                    </div>
                  </>
                );
              }

              /* ── 새로 시작 확인 ── */
              return (
                <>
                  <div className="flex flex-col gap-3">
                    {hasBadgeUsed ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
                          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>정말 새로 시작할까요?</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                          차감된 뱃지는 돌아오지 않아요. 이전 작업 내용은 더 이상 불러오지 않아요.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
                          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>새로 시작할까요?</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                          분석을 시작하지 않은 문항은 뱃지가 차감되지 않았어요. 이전 작업 내용은 더 이상 불러오지 않아요.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setDiscardConfirmMode(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
                    >
                      돌아가기
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("lastDismissedSessionId", resumeSession.session.id);
                        setDiscardConfirmMode(false);
                        setResumeSession(null);
                      }}
                      className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      새로 시작
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 크레딧 차감 확인 모달 */}
      {showCreditConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
        >
          <div
            className="w-full flex flex-col rounded-3xl overflow-hidden"
            style={{
              maxWidth: "520px",
              background: "#0E0E1C",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 60px ${ACCENT}12`,
            }}
          >
            {/* 상단 강조 영역 */}
            <div className="px-8 pt-8 pb-6 flex flex-col gap-4" style={{ background: `linear-gradient(to bottom, ${ACCENT}0A, transparent)`, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 32, lineHeight: 1 }}>🏅</span>
                <div>
                  <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>분석을 시작할까요?</p>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>뱃지 1개가 사용돼요</p>
                </div>
              </div>

              {userCredits !== null && (
                <div
                  className="flex items-center justify-center gap-8 px-5 py-4 rounded-2xl"
                  style={{ background: "rgba(255,209,102,0.07)", border: "1px solid rgba(255,209,102,0.22)" }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>현재 잔액</span>
                    <span className="text-2xl font-bold" style={{ color: GOLD, lineHeight: 1.2 }}>{userCredits}개</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>분석 후</span>
                    <span className="text-2xl font-bold" style={{ color: userCredits - 1 > 0 ? GOLD : "rgba(248,113,113,0.85)", lineHeight: 1.2 }}>{userCredits - 1}개</span>
                  </div>
                </div>
              )}
            </div>

            {/* 안내 + 버튼 */}
            <div className="px-8 py-6 flex flex-col gap-5">
              <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                중간에 나가도 같은 문항은 <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>추가 차감 없이</span> 이어서 할 수 있어요.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreditConfirm(false); startAnalysis(); }}
                  className="flex-1 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: ACCENT, boxShadow: `0 6px 24px ${ACCENT}35` }}
                >
                  시작하기
                </button>
                <button
                  onClick={() => setShowCreditConfirm(false)}
                  className="flex-1 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-70"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 면접 답변 미완 경고 */}
      {showInterviewWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full flex flex-col gap-5 rounded-2xl p-6"
            style={{ maxWidth: "360px", background: "#0D0D18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                면접 답변이 작성되지 않았어요!
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                이대로 완료하면 정리본에 면접 Q&A 내용이 나오지 않아요. 그래도 완료하시겠어요?
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setShowInterviewWarning(false); setShowSummary(true); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
              >
                그냥 완료
              </button>
              <button
                onClick={() => setShowInterviewWarning(false)}
                className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자동 로그아웃 경고 */}
      {idleWarning && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex flex-col items-center gap-3 px-6 py-5 rounded-2xl text-center"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(10,10,22,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            minWidth: "260px",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>잠시 자리를 비우셨나요?</p>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {Math.floor(idleCountdown / 60) > 0
              ? `${Math.floor(idleCountdown / 60)}분 ${idleCountdown % 60}초`
              : `${idleCountdown}초`} 후 자동 로그아웃됩니다
          </p>
          <button
            onClick={extendSession}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: ACCENT, boxShadow: `0 2px 12px ${ACCENT}35` }}
          >
            계속 사용하기
          </button>
        </div>
      )}

      {/* 정리 모달 */}
      {showSummary && selected && (
        <CoverLetterSummary
          jobTitle={jobTitle}
          question={selected.question}
          draft={selected.draft}
          msgs={selected.msgs}
          interviewQs={selected.interviewQs.map(q => ({ question: q.question, msgs: q.msgs }))}
          onClose={() => setShowSummary(false)}
          onNextItem={() => { setShowSummary(false); addItem(); }}
        />
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: "#18182A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", maxWidth: 300, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>로그아웃 하시겠어요?</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 22, wordBreak: "keep-all" }}>대화 내용은 자동 저장돼 있어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                취소
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(201,100,66,0.15)", border: "1px solid rgba(201,100,66,0.4)", color: "#C96442", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 중복 초안 경고 모달 */}
      {showDuplicateDraft && duplicateDraftInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full flex flex-col gap-5 rounded-2xl p-6"
            style={{ maxWidth: "380px", background: "#0D0D18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span style={{ fontSize: 20 }}>📋</span>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>이전에 같은 초안을 분석한 기록이 있어요</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(107,142,255,0.08)", border: "1px solid rgba(107,142,255,0.2)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(107,142,255,0.85)" }}>
                  새로 분석하면 질문이 완전히 달라질 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>이전 분석</p>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)", wordBreak: "keep-all" }}>
                  {duplicateDraftInfo.jobTitle && <span style={{ color: ACCENT }}>【{duplicateDraftInfo.jobTitle}】</span>}{" "}
                  {duplicateDraftInfo.question || "문항 미입력"}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelativeTime(duplicateDraftInfo.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  setShowDuplicateDraft(false);
                  await loadSessionById(duplicateDraftInfo.sessionId, duplicateDraftInfo.jobTitle);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
              >
                이전 기록 보기
              </button>
              <button
                onClick={() => { setShowDuplicateDraft(false); proceedWithAnalysis(); }}
                className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                새로 분석하기
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 채용공고 입력 모달 */}
      {showJobPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowJobPostModal(false); }}
        >
          <div
            className="w-full sm:max-w-[480px] rounded-t-3xl sm:rounded-3xl flex flex-col"
            style={{ background: "#FFFFFF", boxShadow: "0 -4px 40px rgba(0,0,0,0.18)", maxHeight: "85dvh" }}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <span className="text-base font-bold" style={{ color: "#111827" }}>채용공고 입력</span>
              <button
                onClick={() => setShowJobPostModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
                style={{ background: "#F3F4F6", color: "#6B7280" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-1 px-5 pb-3 flex-shrink-0">
              {(["link", "text", "image"] as const).map((tab) => {
                const labels = { link: "🔗 링크", text: "📝 텍스트", image: "🖼️ 이미지" };
                const isActive = jobPostTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setJobPostTab(tab)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? "#312E81" : "#F3F4F6",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                      border: "none",
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {/* 링크 탭 */}
              {jobPostTab === "link" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    여러 지원 직무가 있을 경우를 대비해 채용공고와 동일한 직무명으로 입력해주세요.
                  </p>
                  <input
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                    placeholder="https://..."
                    className="ds-input w-full px-4 py-3.5 rounded-2xl text-sm placeholder:text-[#6B7280]"
                    style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none" }}
                  />
                </div>
              )}

              {/* 텍스트 탭 */}
              {jobPostTab === "text" && (
                <textarea
                  value={jobPostText}
                  onChange={(e) => setJobPostText(e.target.value)}
                  placeholder="채용공고 내용을 붙여넣어주세요"
                  className="ds-input w-full px-4 py-3.5 rounded-2xl text-sm placeholder:text-[#6B7280] resize-none"
                  rows={8}
                  style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none" }}
                />
              )}

              {/* 이미지 탭 */}
              {jobPostTab === "image" && (
                <div className="flex flex-col gap-3">
                  <input
                    ref={jobPostFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setJobPostImagePreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  {jobPostImagePreview ? (
                    <div className="relative">
                      <img src={jobPostImagePreview} alt="채용공고" className="w-full rounded-2xl object-contain max-h-[280px]" style={{ border: "1.5px solid #E5E7EB" }} />
                      <button
                        onClick={() => { setJobPostImagePreview(""); if (jobPostFileRef.current) jobPostFileRef.current.value = ""; }}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full"
                        style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => jobPostFileRef.current?.click()}
                      className="w-full py-10 rounded-2xl flex flex-col items-center gap-3 transition-all hover:opacity-80"
                      style={{ background: "#F9FAFB", border: "2px dashed #E5E7EB", color: "#6B7280" }}
                    >
                      <span className="text-3xl">🖼️</span>
                      <span className="text-sm font-medium">이미지 선택하기</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 확인 버튼 */}
            <div className="px-5 pb-6 pt-2 flex-shrink-0">
              <button
                onClick={() => setShowJobPostModal(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "#312E81" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <TutorialModal
          userId={currentUser?.id ?? null}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </>
  );
}
