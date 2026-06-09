"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CoverLetterSummary } from "@/components/CoverLetterSummary";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const BG = "#0D0D18";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const VIOLET = "#A78BFA";
const DRAFT_MAX = 1200;
const ADMIN_EMAIL = "ijhan6403@gmail.com";

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
  dbId: string | null;
  question: string;
  isExpanded: boolean;
  msgs: ChatMsg[];
  isLoadingFeedback: boolean;
  inputText: string;
}

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
}

let _id = 0;
const uid = () => ++_id;

interface ResumeSession {
  session: { id: string; job_title: string; jd_keywords: string[] | null; created_at: string };
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
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[참조\]([\s\S]*?)\[\/참조\]/g, "$1")
    .replace(/\[참조\]|\[\/참조\]/g, "")
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
  const stripped = stripMd(text);
  const splitIdx = stripped.indexOf("이 중에서");
  const mainText = splitIdx !== -1 ? stripped.slice(0, splitIdx).trim() : stripped;
  const followText = splitIdx !== -1 ? stripped.slice(splitIdx).trim() : null;
  const lines = mainText.split("\n").filter(Boolean);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ①②③ 진단 카드 */}
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
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5 font-bold" style={{ background: BLUE, color: "#fff" }}>AI</div>
          <div
            className="max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all" }}
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
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${VIOLET}28`,
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "rgba(255,255,255,0.9)",
                  maxHeight: "200px",
                  overflowY: "auto",
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

/* ── 초안 뷰어 (하이라이팅 포함) ── */
function DraftViewer({ draft, referenceText, onClose }: { draft: string; referenceText: string | null; onClose: () => void }) {
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (referenceText && markRef.current) {
      markRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [referenceText]);

  const segments: { text: string; highlighted: boolean }[] = (() => {
    if (!referenceText || !draft.includes(referenceText)) {
      return [{ text: draft, highlighted: false }];
    }
    const idx = draft.indexOf(referenceText);
    return [
      { text: draft.slice(0, idx), highlighted: false },
      { text: referenceText, highlighted: true },
      { text: draft.slice(idx + referenceText.length), highlighted: false },
    ].filter(s => s.text.length > 0);
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 rounded-full" style={{ background: BLUE }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>내 초안</span>
          {referenceText && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT, fontSize: "10px" }}>참조 중</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
        >✕</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.5)", wordBreak: "keep-all" }}>
          {segments.map((seg, i) =>
            seg.highlighted ? (
              <mark
                key={i}
                ref={markRef as React.RefObject<HTMLElement>}
                style={{
                  background: `${ACCENT}28`,
                  color: "rgba(255,255,255,0.92)",
                  borderRadius: "3px",
                  padding: "2px 4px",
                  border: `1px solid ${ACCENT}45`,
                  boxShadow: `0 0 10px ${ACCENT}20`,
                  display: "inline",
                }}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </p>
      </div>
    </div>
  );
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
  const [showDraftPanel, setShowDraftPanel] = useState(false);
  const [toast, setToast] = useState("");
  const [toastField, setToastField] = useState<"jobTitle" | "question" | "charLimit" | "draft" | "">("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dbSessionIdRef = useRef<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const idleWarnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleLogoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(300);
  const resumeCheckedRef = useRef(false);
  const [resumeSession, setResumeSession] = useState<ResumeSession | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [showInterviewWarning, setShowInterviewWarning] = useState(false);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [discardConfirmMode, setDiscardConfirmMode] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [welcome, setWelcome] = useState("");

  const selected = items.find((it) => it.id === selectedId) ?? null;

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
    const item: CoverItem = { id: uid(), dbId: null, question: "", draft: "", charLimit: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }

  function removeItem(id: number) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (next.length === 0) {
        const fresh: CoverItem = { id: uid(), dbId: null, question: "", draft: "", charLimit: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false };
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
        .update({ job_title: jobTitle, jd_keywords: jdKeywords, updated_at: new Date().toISOString() })
        .eq("id", dbSessionIdRef.current);
      return dbSessionIdRef.current;
    }
    const { data, error } = await supabase.from("sessions")
      .insert({ user_id: currentUser.id, job_title: jobTitle, jd_keywords: jdKeywords })
      .select("id").single();
    if (error) console.error("[DB] sessions insert error:", error);
    if (!data) return null;
    dbSessionIdRef.current = data.id;
    return data.id;
  }

  // messages 테이블에 단일 메시지 저장
  async function saveDbMessage(coverItemDbId: string, role: "user" | "assistant", content: string) {
    const { error } = await supabase.from("messages").insert({ cover_item_id: coverItemDbId, role, content });
    if (error) console.error("[DB] messages insert error:", error);
  }

  // revisions 테이블에 수정본 저장 + cover_item 상태 done으로 갱신
  async function saveDbRevision(coverItemDbId: string, content: string, changesText: string) {
    const changes = changesText
      .split("\n")
      .map(l => l.replace(/^[-·•]\s*/, "").trim())
      .filter(Boolean);
    const { error: revErr } = await supabase.from("revisions").insert({ cover_item_id: coverItemDbId, content, changes });
    if (revErr) console.error("[DB] revisions insert error:", revErr);
    const { error: updateErr } = await supabase.from("cover_items")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", coverItemDbId);
    if (updateErr) console.error("[DB] cover_items update error:", updateErr);
  }

  // ─────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ type: "analyze", jobTitle, question, jdKeywords, draft, charLimit, messages: history }),
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
      if (itemDbId) {
        const userMsg = history[history.length - 1];
        if (userMsg?.role === "user") {
          await saveDbMessage(itemDbId, "user", userMsg.content);
        }
        await saveDbMessage(itemDbId, "assistant", full);

        // 수정본 감지 → revisions 테이블에도 저장
        const revMatch = full.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/);
        const chgMatch = full.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
        if (revMatch && chgMatch) {
          await saveDbRevision(itemDbId, revMatch[1].trim(), chgMatch[1].trim());
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

  async function checkResumeSession(userId: string) {
    if (resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    try {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, job_title, jd_keywords, created_at")
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
      if (sessionStorage.getItem("lastDismissedSessionId") === parentSession.id) return;

      const { data: allItems } = await supabase
        .from("cover_items")
        .select("id, question, draft, char_limit, status, order_index")
        .eq("session_id", parentSession.id)
        .order("order_index");

      setResumeSession({ session: parentSession, items: allItems || [] });
    } catch { /* 무시 */ }
  }

  async function fetchCredits(userId: string) {
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
      setJdKeywords(Array.isArray(resumeSession.session.jd_keywords) ? resumeSession.session.jd_keywords : []);
      dbSessionIdRef.current = resumeSession.session.id;

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

          return {
            id: uid(),
            dbId: ci.id,
            question: ci.question || "",
            draft: ci.draft || "",
            charLimit: ci.char_limit ? String(ci.char_limit) : "",
            status: (msgs.length > 0 ? "chatting" : "idle") as "idle" | "chatting",
            msgs,
            apiHistory,
            interviewQs: [],
            isLoadingQs: false,
          };
        })
      );

      if (newItems.length > 0) {
        setItems(newItems);
        setSelectedId(newItems[0].id);
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

  function handleStartClick() {
    if (!selected) return;
    if (!jobTitle.trim()) { showToast("지원 직무를 먼저 입력해주세요", "jobTitle"); return; }
    if (!selected.question.trim()) { showToast("자소서 문항을 먼저 입력해주세요", "question"); return; }
    if (!selected.charLimit.trim()) { showToast("글자수 제한을 먼저 입력해주세요", "charLimit"); return; }
    if (!selected.draft.trim()) { showToast("자소서 초안을 먼저 입력해주세요", "draft"); return; }
    if (selected.draft.length > DRAFT_MAX) { showToast(`초안이 너무 길어요. ${DRAFT_MAX}자까지만 가능해요`, "draft"); return; }

    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    if (!isAdmin && userCredits !== null && userCredits <= 0) {
      showToast("뱃지가 없어요. 관리자에게 문의해주세요", "");
      return;
    }
    if (isAdmin || userCredits === null) {
      startAnalysis();
    } else {
      setShowCreditConfirm(true);
    }
  }

  async function startAnalysis() {
    if (!selected) return;
    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    const seed = [{ role: "user", content: "초안 진단을 시작해줘." }];
    let itemDbId: string | null = null;

    try {
      const sessionId = await ensureDbSession();
      console.log("[DB] currentUser:", currentUser, "sessionId:", sessionId);
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
    await fetchBotReply(newHistory, selectedId, selected.draft, selected.question, selected.charLimit, selected.dbId);
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

  const referenceText: string | null = (() => {
    if (!selected) return null;
    for (let i = selected.msgs.length - 1; i >= 0; i--) {
      const msg = selected.msgs[i];
      if (msg.role === "bot") {
        const match = msg.text.match(/\[참조\]([\s\S]*?)\[\/참조\]/);
        if (match) return match[1].trim();
      }
    }
    return null;
  })();

  return (
    <>
      <div className="h-dvh flex flex-col" style={{ background: BG, color: "rgba(255,255,255,0.88)" }}>

        {/* ── 헤더 ── */}
        <header
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: "52px",
            background: "rgba(13,13,24,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 1px 0 rgba(107,142,255,0.06)",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            홈
          </Link>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
            <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em" }}>취업소크라테스</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentUser && userCredits !== null && currentUser.email !== ADMIN_EMAIL && (
              <Link
                href="/mypage"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(255,209,102,0.12)", border: "1px solid rgba(255,209,102,0.25)", color: "rgba(255,209,102,0.85)" }}
              >
                🏅 {userCredits}
              </Link>
            )}
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: `rgba(201,100,66,0.12)`, border: `1px solid rgba(201,100,66,0.25)`, color: `rgba(201,100,66,0.85)` }}
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* 환영 토스트 */}
        {welcome && (
          <div
            className="fixed top-16 left-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg"
            style={{
              transform: "translateX(-50%)",
              background: "rgba(255,107,53,0.15)",
              border: "1px solid rgba(255,107,53,0.35)",
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
            className="fixed bottom-6 left-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg"
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

          {/* ────────── 왼쪽 패널 (lg 이상에서만) ────────── */}
          <div className="hidden lg:flex flex-shrink-0 flex-col border-r relative overflow-hidden" style={{ width: "272px", borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,22,0.6)" }}>
            {/* 앰비언트 글로우 */}
            <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 220, height: 140, background: `radial-gradient(circle, ${BLUE}16 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

            {/* 지원 정보 */}
            <div
              className="flex flex-col gap-3 border-b flex-shrink-0 relative"
              style={{ borderColor: "rgba(255,255,255,0.06)", padding: "16px 14px 18px", zIndex: 1 }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${BLUE})` }} />
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                  지원 정보
                </span>
              </div>

              {/* 직무 입력 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: toastField === "jobTitle" ? `rgba(201,100,66,0.9)` : "rgba(255,255,255,0.32)" }}>지원 직무</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="예: 연구개발"
                  className="glow-input w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${toastField === "jobTitle" ? "rgba(201,100,66,0.5)" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: toastField === "jobTitle" ? "0 0 0 2px rgba(201,100,66,0.15)" : "none",
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
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 relative" style={{ zIndex: 1 }}>
              <p className="text-xs px-1 pt-0.5 pb-1.5 font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>자소서 항목</p>

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
                      background: isSel ? `${BLUE}0E` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSel ? `${BLUE}35` : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isSel ? `0 0 14px ${BLUE}14, inset 0 0 0 1px ${BLUE}18` : "none",
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

                {/* ── 모바일 전용: 지원정보 + 항목 탭 ── */}
                <div className="lg:hidden flex flex-col gap-3 px-4 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,22,0.55)" }}>
                  {/* 직무 + JD */}
                  <div className="flex gap-2">
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="예: 연구개발"
                      className="glow-input flex-1 px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${toastField === "jobTitle" ? "rgba(201,100,66,0.5)" : "rgba(255,255,255,0.09)"}`, boxShadow: toastField === "jobTitle" ? "0 0 0 2px rgba(201,100,66,0.15)" : "none", color: "rgba(255,255,255,0.9)" }}
                    />
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all"
                      style={{ background: jdFile ? `${ACCENT}15` : "rgba(255,255,255,0.05)", border: `1px solid ${jdFile ? `${ACCENT}40` : "rgba(255,255,255,0.09)"}` }}
                    >
                      {isExtractingJD ? (
                        <div className="flex gap-0.5 items-center">
                          {DOTS.map(({ delay, color }) => (
                            <span key={delay} className="w-1 h-1 rounded-full animate-bounce" style={{ background: color, animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      ) : jdFile ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">📄</span>
                          {jdKeywords.length > 0 && <span className="text-xs font-bold" style={{ color: ACCENT }}>{jdKeywords.length}</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📎</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>JD</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 항목 탭 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {items.map((item, idx) => {
                      const isSel = item.id === selectedId;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: isSel ? `${BLUE}18` : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isSel ? `${BLUE}40` : "rgba(255,255,255,0.08)"}`,
                            color: isSel ? BLUE : "rgba(255,255,255,0.42)",
                            boxShadow: isSel ? `0 0 10px ${BLUE}18` : "none",
                          }}
                        >
                          <span>{String(idx + 1).padStart(2, "0")}</span>
                          {item.question && (
                            <span className="max-w-[72px] truncate">{item.question}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">

                  {/* 문항 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: toastField === "question" ? "rgba(201,100,66,0.9)" : "rgba(255,255,255,0.28)", letterSpacing: "0.08em" }}>자소서 문항</label>
                    <input
                      value={selected.question}
                      onChange={(e) => updateItem(selectedId, { question: e.target.value })}
                      placeholder="예: 성장 과정 및 지원 동기를 작성해주세요."
                      className="glow-input w-full px-4 py-3 rounded-xl text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${toastField === "question" ? "rgba(201,100,66,0.5)" : "rgba(255,255,255,0.08)"}`, boxShadow: toastField === "question" ? "0 0 0 2px rgba(201,100,66,0.15)" : "none", color: "rgba(255,255,255,0.9)" }}
                    />
                  </div>

                  {/* 글자 수 제한 */}
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                    style={{
                      background: selected.charLimit ? `${ACCENT}0E` : "rgba(255,255,255,0.025)",
                      border: `1px solid ${selected.charLimit ? `${ACCENT}45` : toast ? "rgba(201,100,66,0.5)" : "rgba(255,255,255,0.07)"}`,
                      transition: "all 0.2s ease",
                      boxShadow: toast && !selected.charLimit ? `0 0 0 2px rgba(201,100,66,0.15)` : "none",
                    }}
                  >
                    <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: selected.charLimit ? ACCENT : toast ? `rgba(201,100,66,0.6)` : "rgba(255,255,255,0.15)", transition: "background 0.2s" }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: selected.charLimit ? "rgba(255,255,255,0.82)" : toast ? `rgba(201,100,66,0.9)` : "rgba(255,255,255,0.45)" }}>글자 수 제한 <span style={{ color: "rgba(201,100,66,0.6)", fontSize: "10px" }}>필수</span></p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>첨삭 시 이 글자 수에 맞춰드려요</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={selected.charLimit}
                        onChange={(e) => {
                          const v = e.target.value === "" ? "" : String(Math.min(1000, Math.max(0, Number(e.target.value))));
                          updateItem(selectedId, { charLimit: v });
                        }}
                        placeholder="예: 700"
                        className="glow-input-accent w-24 px-2.5 py-1.5 rounded-lg text-sm text-right"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${selected.charLimit ? `${ACCENT}50` : "rgba(255,255,255,0.1)"}`,
                          color: selected.charLimit ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)",
                          MozAppearance: "textfield",
                          appearance: "none" as React.CSSProperties["appearance"],
                        }}
                      />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>자</span>
                    </div>
                  </div>

                  {/* 초안 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em" }}>내 초안</label>
                      {selected.draft.length > DRAFT_MAX ? (
                        <span className="text-xs tabular-nums font-semibold" style={{ color: "#FF6B6B" }}>
                          {selected.draft.length.toLocaleString()}자 · 최대 {DRAFT_MAX}자
                        </span>
                      ) : selected.charLimit && selected.draft.length > 0 ? (
                        <span className="text-xs tabular-nums" style={{ color: selected.draft.length > Number(selected.charLimit) ? "#FF6B6B" : "rgba(255,255,255,0.2)" }}>
                          {selected.draft.length.toLocaleString()}자 / {Number(selected.charLimit).toLocaleString()}자
                        </span>
                      ) : null}
                    </div>
                    <textarea
                      value={selected.draft}
                      onChange={(e) => updateItem(selectedId, { draft: e.target.value })}
                      placeholder="작성한 자소서 초안을 붙여넣어요."
                      rows={13}
                      className="glow-input w-full px-4 py-3.5 rounded-xl text-sm resize-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${selected.draft.length > DRAFT_MAX ? "rgba(255,107,107,0.5)" : toastField === "draft" ? "rgba(201,100,66,0.5)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: selected.draft.length > DRAFT_MAX ? "0 0 0 2px rgba(255,107,107,0.15)" : toastField === "draft" ? "0 0 0 2px rgba(201,100,66,0.15)" : "none",
                        color: "rgba(255,255,255,0.88)",
                        lineHeight: "1.85",
                      }}
                    />
                    {selected.draft.length > DRAFT_MAX && (
                      <p className="text-xs" style={{ color: "#FF6B6B" }}>
                        글자수가 너무 많아요. {DRAFT_MAX}자까지만 입력 가능해요. ({selected.draft.length - DRAFT_MAX}자 초과)
                      </p>
                    )}
                  </div>

                  {/* 시작 버튼 */}
                  <div className="flex flex-col gap-2.5 pb-4 sm:pb-0">
                    {selected.draft.length > DRAFT_MAX ? (
                      <div
                        className="w-full py-4 rounded-2xl text-sm font-semibold text-center cursor-not-allowed"
                        style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", color: "rgba(255,107,107,0.8)" }}
                      >
                        초안을 {DRAFT_MAX}자 이하로 줄여주세요 ({selected.draft.length - DRAFT_MAX}자 초과)
                      </div>
                    ) : (
                      <button
                        onClick={handleStartClick}
                        disabled={selected?.status !== "idle"}
                        className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{
                          background: canStart ? ACCENT : "rgba(255,255,255,0.08)",
                          boxShadow: canStart ? `0 4px 20px ${ACCENT}28` : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        분석 시작하기 →
                      </button>
                    )}

                    <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.18)" }}>
                      {selected.draft.length > DRAFT_MAX
                        ? ""
                        : canStart
                        ? "논리 흐름 · 문맥 연결 · 직무 이해도를 진단하고 질문으로 이어가요"
                        : "문항과 초안을 모두 입력하면 분석을 시작할 수 있어요"}
                    </p>
                  </div>

                </div>
              </div>

            ) : (

              /* ── 채팅 패널 ── */
              <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* 항목 헤더 바 */}
                <div className="flex-shrink-0 flex flex-col border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {/* 모바일 항목 탭 */}
                  {items.length > 1 && (
                    <div className="lg:hidden flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-b" style={{ borderColor: "rgba(255,255,255,0.04)", scrollbarWidth: "none" }}>
                      {items.map((item, idx) => {
                        const isSel = item.id === selectedId;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: isSel ? `${BLUE}18` : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isSel ? `${BLUE}35` : "rgba(255,255,255,0.07)"}`,
                              color: isSel ? BLUE : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0" style={{ background: `${BLUE}18`, color: BLUE, fontSize: "11px" }}>
                    {String(items.findIndex((it) => it.id === selectedId) + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm truncate flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>{selected.question}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {["진단", "질문", "보강"].map((step, i) => {
                      const userCount = selected.msgs.filter((m) => m.role === "user").length;
                      const active = i === 0 ? userCount === 0 : i === 1 ? userCount < 3 : userCount >= 3;
                      return (
                        <span key={step} className="hidden sm:block text-xs px-2 py-0.5 rounded-full" style={{ background: active ? `${BLUE}22` : "rgba(255,255,255,0.05)", color: active ? BLUE : "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                          {step}
                        </span>
                      );
                    })}
                  </div>
                  </div>
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {/* 초안 보기 — sticky 상단 고정 */}
                  <div className="sticky top-0 z-10 pb-3 pt-1 flex justify-end pointer-events-none">
                    <button
                      onClick={() => setShowDraftPanel(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative pointer-events-auto"
                      style={{
                        background: showDraftPanel ? `${BLUE}22` : "rgba(13,13,24,0.82)",
                        border: `1px solid ${showDraftPanel ? `${BLUE}45` : "rgba(255,255,255,0.12)"}`,
                        color: showDraftPanel ? BLUE : "rgba(255,255,255,0.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        boxShadow: showDraftPanel ? `0 0 12px ${BLUE}18` : "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>내 초안 보기</span>
                      {referenceText && !showDraftPanel && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                      )}
                    </button>
                  </div>
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
                        style={{ background: ACCENT, color: "#fff", boxShadow: `0 4px 16px ${ACCENT}28` }}
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
                          ref={chatInputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          disabled={isStreaming}
                          placeholder="답변을 입력하세요"
                          rows={1}
                          className="glow-input flex-1 disabled:opacity-30 resize-none placeholder:opacity-40"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", padding: "11px 18px", fontSize: "14px", lineHeight: "1.5", color: "rgba(255,255,255,0.9)", height: "46px", maxHeight: "160px", overflowY: "auto" }}
                        />
                        <button
                          onClick={handleSend}
                          disabled={isStreaming || !input.trim()}
                          className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-25"
                          style={{ background: ACCENT, width: "46px", height: "46px", boxShadow: input.trim() ? `0 4px 14px ${ACCENT}30` : "none", transition: "all 0.2s ease" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      </div>
                    ) : null}

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

              {/* ── 오른쪽 초안 패널 — 데스크탑 ── */}
              {showDraftPanel && (
                <div
                  className="hidden lg:flex flex-shrink-0 flex-col border-l"
                  style={{ width: "288px", borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,22,0.55)" }}
                >
                  <DraftViewer
                    draft={selected.draft}
                    referenceText={referenceText}
                    onClose={() => setShowDraftPanel(false)}
                  />
                </div>
              )}

              {/* ── 모바일 바텀시트 ── */}
              {showDraftPanel && (
                <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                  <div
                    className="absolute inset-0"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                    onClick={() => setShowDraftPanel(false)}
                  />
                  <div
                    className="relative flex flex-col rounded-t-2xl overflow-hidden"
                    style={{ height: "72vh", background: "#0C0C1E", border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none" }}
                  >
                    <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                      <div className="w-8 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                    </div>
                    <DraftViewer
                      draft={selected.draft}
                      referenceText={referenceText}
                      onClose={() => setShowDraftPanel(false)}
                    />
                  </div>
                </div>
              )}

              </div>
            )}
          </div>
        </div>
      </div>

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
                        sessionStorage.setItem("lastDismissedSessionId", resumeSession.session.id);
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
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full flex flex-col gap-5 rounded-2xl p-6"
            style={{ maxWidth: "360px", background: "#0D0D18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span style={{ fontSize: 22 }}>🏅</span>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>분석을 시작할까요?</p>
              </div>
              {userCredits !== null && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)" }}
                >
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>현재 잔액</span>
                  <span className="text-xs font-bold" style={{ color: GOLD }}>{userCredits}개</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>→ 분석 후</span>
                  <span className="text-xs font-bold" style={{ color: userCredits - 1 > 0 ? GOLD : "rgba(248,113,113,0.8)" }}>{userCredits - 1}개</span>
                </div>
              )}
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                이 문항 분석에 뱃지 1개가 사용돼요. 중간에 나가도 같은 문항은 추가 차감 없이 이어서 할 수 있으니 걱정 마세요!
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setShowCreditConfirm(false); startAnalysis(); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}30` }}
              >
                시작하기
              </button>
              <button
                onClick={() => setShowCreditConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm transition-all hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                취소
              </button>
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
          onClose={() => setShowSummary(false)}
          onNextItem={() => { setShowSummary(false); addItem(); }}
        />
      )}
    </>
  );
}
