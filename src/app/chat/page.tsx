"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CoverLetterSummary, type FinalAnalysis } from "@/components/CoverLetterSummary";
import { TutorialModal } from "@/components/TutorialModal";
import { supabase } from "@/lib/supabase";
import { trackVisitor } from "@/lib/track";
import type { ChatMsg, InterviewQItem, SetupMsg, CoverItem, ResumeSession } from "@/types/chat";
import { formatRelativeTime, stripMd, parseRevisionMsg } from "@/lib/chatUtils";
import { StreamingLoadingMsg } from "@/components/chat/StreamingLoadingMsg";
import { DiagnosisCard } from "@/components/chat/DiagnosisCard";
import { ChangesCard } from "@/components/chat/ChangesCard";
import { RevisionLoadingCard } from "@/components/chat/RevisionLoadingCard";
import { RevisionMessage } from "@/components/chat/RevisionMessage";
import { BotBubbleAvatar } from "@/components/chat/BotBubbleAvatar";
import { InterviewQCard } from "@/components/chat/InterviewQCard";
import { TipPanel } from "@/components/chat/TipPanel";


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

const DOTS = [
  { delay: 0, color: "#312E81" },
  { delay: 150, color: BLUE },
  { delay: 300, color: VIOLET },
];

let _id = 0;
const uid = () => ++_id;

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
  const [jobPostTab, setJobPostTab] = useState<"text" | "image">("text");
  const jobPostFileRef = useRef<HTMLInputElement>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [analysisContent, setAnalysisContent] = useState("");
  const analysisContentRef = useRef("");
  const companyAnalysisKeyRef = useRef("");
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
  const [finalAnalysis, setFinalAnalysis] = useState<FinalAnalysis | null>(null);
  const [finalAnalysisLoading, setFinalAnalysisLoading] = useState(false);
  const [finalAnalysisFor, setFinalAnalysisFor] = useState<number | null>(null);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showReviewGate, setShowReviewGate] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
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
  const [showPersonalityBlock, setShowPersonalityBlock] = useState(false);
  const [showGoBackConfirm, setShowGoBackConfirm] = useState(false);
  const [showResumeItemModal, setShowResumeItemModal] = useState(false);
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
    trackVisitor();
    // getSession: localStorage 세션을 즉시 읽어 currentUser 확보
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });
        supabase.from("profiles").upsert(
          { id: session.user.id, email: session.user.email ?? "" },
          { onConflict: "id" }
        );
        const resumeId = new URLSearchParams(window.location.search).get("resume");
        if (resumeId && !resumeCheckedRef.current) {
          resumeCheckedRef.current = true;
          loadSessionById(resumeId, "");
        } else if (!resumeId) {
          checkResumeSession(session.user.id);
        }
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

  function addItem(mode: typeof chatMode = chatMode) {
    const id = uid();
    const firstText = mode === "analyze"
      ? "📝 분석할 자소서 문항을 알려주세요.\n예: '팀 프로젝트에서 발휘한 리더십 경험을 서술하시오.'"
      : mode === "motivation"
      ? "📝 어떤 문항인가요?\n예: '지원 동기와 입사 후 포부를 서술하시오.'"
      : "📝 어떤 문항인가요?\n예: '본인의 성격 장단점을 서술하시오.'";
    const item: CoverItem = { id, dbId: null, question: "", draft: "", charLimit: "", status: "idle", msgs: [], apiHistory: [], interviewQs: [], isLoadingQs: false, setupStep: "question", setupMsgs: [{ id: uid(), role: "bot", text: firstText }] };
    setItems((prev) => [...prev, item]);
    setSelectedId(id);
  }

  // 완성본 소제목 선택 → 메시지에 [소제목] 마커로 박고 DB 영속화 (PDF·마이페이지 반영)
  async function applySubtitle(msg: { id: number; text: string; dbId?: string }, subtitle: string) {
    const cleaned = msg.text.replace(/\[소제목\][\s\S]*?\[\/소제목\]\s*/g, "");
    const newText = `[소제목]${subtitle}[/소제목]\n${cleaned}`;
    setItems((prev) => prev.map((it) => it.id === selectedId ? { ...it, msgs: it.msgs.map((m) => m.id === msg.id ? { ...m, text: newText } : m) } : it));
    if (msg.dbId) {
      try {
        await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update-message", message_id: msg.dbId, content: newText }) });
      } catch { /* 무시 */ }
    }
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
            ? { type: "motivation", jobTitle, companyInfo, draft, charLimit, messages: history, analysisReport: analysisContent, jobPostText, jobPostImage: history.length <= 1 ? jobPostImagePreview : "" }
            : chatMode === "personality"
            ? { type: "personality", jobTitle, companyInfo, draft, charLimit, messages: history, analysisReport: analysisContent, jobPostText, jobPostImage: history.length <= 1 ? jobPostImagePreview : "" }
            : { type: "analyze", jobTitle, companyInfo, question, draft, charLimit, messages: history, analysisReport: analysisContent, jobPostText, jobPostImage: history.length <= 1 ? jobPostImagePreview : "" }
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
        if (assistantMsgDbId) {
          setItems((prev) => prev.map((it) => it.id === itemId ? { ...it, msgs: it.msgs.map((m) => m.id === msgId ? { ...m, dbId: assistantMsgDbId! } : m) } : it));
        }

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

  // 셋업 입력칸(문항·글자수) 자동 높이 — draft는 rows=5 유지
  useEffect(() => {
    const el = setupInputRef.current;
    if (!el) return;
    if (selected?.setupStep === "draft") { el.style.height = ""; return; }
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [setupInput, selected?.setupStep, selectedId]);

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
      const { data: sessionData } = await supabase.from("sessions").select("analysis_report, job_title").eq("id", sessionId).single();
      setJobTitle(sessionJobTitle || sessionData?.job_title || "");
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

          // 완성본 복원 — 완성본 메시지가 msgs에 없으면 revisions에서 재구성해 넣어야 면접 단계가 살아난다
          const { data: revRows } = await supabase
            .from("revisions")
            .select("content, changes, created_at")
            .eq("cover_item_id", ci.id)
            .order("created_at", { ascending: true });
          const lastRev = revRows && revRows.length ? revRows[revRows.length - 1] : null;
          const hasRevMsg = msgs.some(m => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
          if (lastRev?.content && !hasRevMsg) {
            const changesArr: string[] = Array.isArray(lastRev.changes) ? (lastRev.changes as string[]) : [];
            const revText = `[수정본]\n${lastRev.content}\n[/수정본]\n[변경사항]\n${changesArr.map(c => `- ${c}`).join("\n")}\n[/변경사항]`;
            msgs.push({ id: uid(), role: "bot", text: revText });
            apiHistory.push({ role: "assistant", content: revText });
          }

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
              return { id: uid(), dbId: iq.id, question: iq.question, isExpanded: false, msgs: qMsgs, isLoadingFeedback: false, inputText: "", phase: qMsgs.length > 0 ? "done" as const : "initial" as const };
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

          // 완성본 복원 — 완성본 메시지가 msgs에 없으면 revisions에서 재구성해 넣어야 면접 단계가 살아난다
          const { data: revRows } = await supabase
            .from("revisions")
            .select("content, changes, created_at")
            .eq("cover_item_id", ci.id)
            .order("created_at", { ascending: true });
          const lastRev = revRows && revRows.length ? revRows[revRows.length - 1] : null;
          const hasRevMsg = msgs.some(m => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
          if (lastRev?.content && !hasRevMsg) {
            const changesArr: string[] = Array.isArray(lastRev.changes) ? (lastRev.changes as string[]) : [];
            const revText = `[수정본]\n${lastRev.content}\n[/수정본]\n[변경사항]\n${changesArr.map(c => `- ${c}`).join("\n")}\n[/변경사항]`;
            msgs.push({ id: uid(), role: "bot", text: revText });
            apiHistory.push({ role: "assistant", content: revText });
          }

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
              return { id: uid(), dbId: iq.id, question: iq.question, isExpanded: false, msgs: qMsgs, isLoadingFeedback: false, inputText: "", phase: qMsgs.length > 0 ? "done" as const : "initial" as const };
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
    if (!jobTitle.trim()) { showToast("지원 직무를 입력해주세요", "jobTitle"); return; }
    setCompanyInfo(companyName.trim());
    const firstText = chatMode === "analyze"
      ? "📝 분석할 자소서 문항을 알려주세요.\n예: '팀 프로젝트에서 발휘한 리더십 경험을 서술하시오.'"
      : chatMode === "motivation"
      ? "📝 어떤 문항인가요?\n예: '지원 동기와 입사 후 포부를 서술하시오.'"
      : "📝 어떤 문항인가요?\n예: '본인의 성격 장단점을 서술하시오.'";
    updateItem(selectedId, { setupStep: "question", setupMsgs: [{ id: uid(), role: "bot", text: firstText }] });
    // 회사가 바뀐 경우에만 분석 보고서 초기화
    const newKey = `${companyName.trim()}||${companyWebsite.trim()}`;
    if (companyAnalysisKeyRef.current !== newKey) {
      setAnalysisContent("");
      analysisContentRef.current = "";
      companyAnalysisKeyRef.current = newKey;
    }
    setShowAnalysisPanel(false);
    setStageLeaving(true);
    setTimeout(() => {
      setStage("chat");
      setStageLeaving(false);
      setStageEntering(true);
      setTimeout(() => setStageEntering(false), 380);
    }, 260);
  }

  async function fetchAnalysisReport(showPanel = true) {
    if (isLoadingAnalysis) return;
    // 같은 회사 분석이 이미 있으면 패널만 열고 재분석 생략
    if (analysisContentRef.current) {
      if (showPanel) setShowAnalysisPanel(true);
      return;
    }
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
        const setupReadyText = chatMode === "analyze"
          ? "✅ 준비됐어요!\n논리 흐름 · 문맥 · 직무 이해도를 짚어드릴게요."
          : chatMode === "motivation"
          ? "✅ 준비됐어요!\n논리 흐름 · 문맥 · 회사·직무 연결성을 짚어드릴게요."
          : "✅ 준비됐어요!\n초안 살펴볼게요.";
        const bot: SetupMsg = { id: uid(), role: "bot", text: setupReadyText };
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

    if (selected.msgs.length > 0) {
      setShowResumeItemModal(true);
      return;
    }

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
        it.id === selectedId ? { ...it, msgs: [], status: "chatting" as const, apiHistory: seed, dbId: itemDbId } : it
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

  // 완성본 직전 후기 게이트
  function requestRevision() {
    if (reviewDone || currentUser?.email === ADMIN_EMAIL) { handleRevisionRequest(); return; }
    setShowReviewGate(true);
  }
  async function submitReviewAndProceed() {
    const text = reviewText.trim();
    if (!text || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      if (currentUser) {
        await supabase.from("reviews").insert({
          user_id: currentUser.id,
          email: currentUser.email,
          type: "digging",
          content: text,
          job_title: jobTitle || null,
          status: "approved",
        });
      }
    } catch { /* 무시 */ }
    setReviewSubmitting(false);
    setReviewDone(true);
    setShowReviewGate(false);
    setReviewText("");
    handleRevisionRequest();
  }

  // 정리 모달 열기 + 종합 분석(자기이해 리포트) 생성
  async function openSummary() {
    setShowSummary(true);
    if (!selected) return;
    if (finalAnalysisFor === selected.id && (finalAnalysis || finalAnalysisLoading)) return;
    const revMsg = selected.msgs.find(
      (m) => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]"))
    );
    const coverLetter = revMsg ? parseRevisionMsg(revMsg.text).revision : "";
    if (!coverLetter) return;
    const revIdx = revMsg ? selected.msgs.indexOf(revMsg) : -1;
    const diggingMsgs = revIdx >= 0 ? selected.msgs.slice(0, revIdx + 1) : selected.msgs;
    const digging = diggingMsgs
      .map((m) => `${m.role === "bot" ? "코치" : "학생"}: ${stripMd(m.text)}`)
      .filter((l) => l.replace(/^(코치|학생): /, "").trim())
      .join("\n")
      .slice(0, 6000);
    const interviewAnswers = selected.interviewQs
      .map((q) => `Q: ${q.question}\nA: ${q.msgs.filter((m) => m.role === "user").map((m) => m.text).join(" / ") || "(미답변)"}`)
      .join("\n\n");
    setFinalAnalysis(null);
    setFinalAnalysisFor(selected.id);
    setFinalAnalysisLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "final-analysis", jobTitle, companyInfo: companyName, question: selected.question, coverLetter, draft: selected.draft, digging, interviewAnswers, analysisContent }),
      });
      const data = await res.json();
      if (data && Array.isArray(data.weapons)) setFinalAnalysis(data as FinalAnalysis);
    } catch { /* 무시 */ } finally {
      setFinalAnalysisLoading(false);
    }
  }

  async function handleAdminRegenerate() {
    if (!selected || isStreaming) return;
    // 완성본(수정본) 봇 메시지 기준으로 그 앞까지만 남긴다 — resume 세션(완성본 재구성)에서도 안전
    const revMsgIdx = selected.msgs.findIndex(m => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
    let newMsgs = revMsgIdx !== -1 ? selected.msgs.slice(0, revMsgIdx) : selected.msgs;
    if (newMsgs.length && newMsgs[newMsgs.length - 1].role === "user" && newMsgs[newMsgs.length - 1].text === "완성본을 작성해줘.") newMsgs = newMsgs.slice(0, -1);
    const revHistIdx = selected.apiHistory.findIndex(h => h.role === "assistant" && (h.content.includes("[수정본]") || h.content.includes("[지원동기]")));
    let newHistory = revHistIdx !== -1 ? selected.apiHistory.slice(0, revHistIdx) : selected.apiHistory;
    if (newHistory.length && newHistory[newHistory.length - 1].role === "user" && newHistory[newHistory.length - 1].content === "완성본을 작성해줘.") newHistory = newHistory.slice(0, -1);
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
          chatMode,
          jobTitle,
          companyInfo,
          jobPostText,
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
          id: uid(), dbId: dbIdByIndex[idx] ?? null, question: q, isExpanded: false, msgs: [], isLoadingFeedback: false, inputText: "", phase: "initial" as const,
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
    const isRetry = qItem.phase === "retrying";
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
          type: isRetry ? "interview-polish" : "interview-feedback",
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

      // ── DB: 면접 답변 + AI 응답 저장 (최초=답변+피드백, 재작성=재답변+다듬은문장) ──
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
            ? { ...it, interviewQs: it.interviewQs.map((q) => q.id === qId ? { ...q, isLoadingFeedback: false, phase: isRetry ? "polished" as const : "feedback" as const } : q) }
            : it
        )
      );
    }
  }

  function retryInterviewAnswer(qId: number) {
    updateInterviewQ(qId, { phase: "retrying", inputText: "" });
  }

  function finishInterviewQ(qId: number) {
    updateInterviewQ(qId, { phase: "done" });
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
        <div className="h-dvh flex overflow-hidden" style={{ background: "#F9FAFB", opacity: stageLeaving ? 0 : 1, transform: stageLeaving ? "scale(0.97) translateY(-6px)" : "scale(1) translateY(0)", transition: "opacity 0.26s ease, transform 0.26s ease" }}>
          <style>{`
            @keyframes infoOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(36px,-30px) scale(1.14)} }
            @keyframes infoOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,34px) scale(1.1)} }
            @keyframes infoRise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
            .info-rise-1 { animation: infoRise 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
            .info-rise-2 { animation: infoRise 0.6s cubic-bezier(0.22,1,0.36,1) 0.13s both; }
            .info-rise-3 { animation: infoRise 0.6s cubic-bezier(0.22,1,0.36,1) 0.21s both; }
            .info-rise-4 { animation: infoRise 0.6s cubic-bezier(0.22,1,0.36,1) 0.29s both; }
          `}</style>

          {/* ── 왼쪽: 작업 사이드바(항목 있을 때) or 브랜드 패널(첫 진입) ── */}
          {items.some(it => it.msgs.length > 0 || it.question) ? (
            <div className="hidden lg:flex flex-shrink-0 flex-col border-r overflow-hidden" style={{ width: "240px", borderColor: "#EDEFF2", background: "#FFFFFF" }}>
              <Link href="/" className="px-5 py-4 flex items-center gap-2 border-b hover:opacity-70 transition-opacity" style={{ borderColor: "#F0F1F3" }}>
                <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>취업소크라테스</span>
              </Link>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                <p className="text-xs px-1 pt-0.5 pb-1.5 font-semibold tracking-wider uppercase" style={{ color: "#9CA3AF", letterSpacing: "0.10em" }}>자소서 항목</p>
                {items.map((item, idx) => {
                  const isSel = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      role="button" tabIndex={0}
                      onClick={() => { setSelectedId(item.id); if (item.msgs.length > 0 || item.status === "chatting") setStage("chat"); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setSelectedId(item.id); if (item.msgs.length > 0 || item.status === "chatting") setStage("chat"); } }}
                      className="w-full text-left rounded-xl px-3 py-2.5 flex flex-col gap-0.5 transition-all group relative cursor-pointer"
                      style={{ background: isSel ? "#F5F3FF" : "transparent", border: `${isSel ? "1.5px" : "1px"} solid ${isSel ? "#A78BFA" : "#EDEFF2"}` }}
                    >
                      <div className="flex items-center gap-2 pr-6">
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: isSel ? "#4C3F99" : "#9CA3AF" }}>{String(idx + 1).padStart(2, "0")}</span>
                        <span className="text-[13px] font-medium truncate" style={{ color: "#111827" }}>
                          {item.question || <span style={{ color: "#9CA3AF" }}>문항 미입력</span>}
                        </span>
                      </div>
                      {item.draft && (
                        <p className="text-xs truncate pl-6" style={{ color: "#9CA3AF" }}>{item.draft}</p>
                      )}
                      <div className="absolute right-2 top-2.5 flex items-center gap-1">
                        {item.status === "chatting" && (
                          <span className="rounded-full font-medium px-1.5 py-0.5" style={{ background: `${BLUE}10`, color: BLUE, fontSize: "10px", lineHeight: "1.4" }}>진행</span>
                        )}
                        {item.msgs.length > 0 && item.status !== "chatting" && (
                          <span className="rounded-full font-medium px-1.5 py-0.5" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", fontSize: "10px", lineHeight: "1.4" }}>완료</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-shrink-0 flex-col relative overflow-hidden" style={{ width: "44%", maxWidth: "560px", background: "linear-gradient(160deg, #07101F 0%, #0C1A3A 52%, #081424 100%)" }}>
              {/* 오로라 오브 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position:"absolute", top:"10%", left:"-10%", width:"460px", height:"420px", borderRadius:"50%", background:"#3B62CC", filter:"blur(120px)", opacity:0.20, animation:"infoOrb1 15s ease-in-out infinite" }} />
                <div style={{ position:"absolute", bottom:"4%", right:"-8%", width:"400px", height:"380px", borderRadius:"50%", background:"#A78BFA", filter:"blur(120px)", opacity:0.16, animation:"infoOrb2 18s ease-in-out infinite" }} />
              </div>

              <Link href="/" className="relative px-10 pt-9 flex items-center gap-2 hover:opacity-80 transition-opacity info-rise-1">
                <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover" />
                <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>취업소크라테스</span>
              </Link>

              <div className="relative flex-1 flex flex-col justify-center px-10 pb-[16%]">
                <h2 className="font-bold leading-[0.98] tracking-tight info-rise-2" style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)", color: "#FFFFFF", letterSpacing: "-0.03em" }}>Redesign</h2>
                <h2 className="font-bold leading-[0.98] tracking-tight mb-6 info-rise-2" style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)", letterSpacing: "-0.03em", background: "linear-gradient(125deg, #60A5FA 0%, #818CF8 32%, #A78BFA 58%, #5EEAD4 88%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Story</h2>
                <p className="text-base leading-[1.8] info-rise-3" style={{ color: "rgba(255,255,255,0.50)", wordBreak: "keep-all", maxWidth: "340px" }}>
                  당신의 경험을,<br />
                  <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>면접까지 살아남는 자소서</span>로.
                </p>

                {/* 스텝 흐름 */}
                <div className="flex items-center gap-2 flex-wrap mt-9 info-rise-4">
                  {[
                    { label: "초안 분석", color: "#60A5FA" },
                    { label: "이야기 발굴", color: "#FFD166" },
                    { label: "문장 완성", color: "#FF8A65" },
                    { label: "실전 대비", color: "#C4B5FD" },
                  ].map(({ label, color }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      {i > 0 && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      )}
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 오른쪽: 입력 폼 ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 상단 바 */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 lg:justify-end">
              <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity lg:hidden" style={{ color: "#111827" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                홈
              </Link>
              <div className="flex items-center gap-2 lg:hidden">
                <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm font-bold" style={{ color: "#111827" }}>취업소크라테스</span>
              </div>
              <Link href="/" className="hidden lg:flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity px-3.5 py-2 rounded-[10px]" style={{ color: "#374151", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                홈으로
              </Link>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 pb-8 overflow-y-auto">
              <div className="w-full max-w-[480px] flex flex-col gap-6 info-rise-2">
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-2xl sm:text-[1.75rem] font-bold" style={{ color: "#111827", letterSpacing: "-0.02em" }}>어떤 공고에 지원하나요?</h1>
                  <p className="text-sm" style={{ color: "#6B7280" }}>정보를 입력하면 바로 채팅으로 이어집니다.</p>
                </div>

                {/* 회사 정보 */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold pl-0.5" style={{ color: "#374151", letterSpacing: "0.06em" }}>회사 정보 <span className="font-normal" style={{ color: "#9CA3AF" }}>(선택)</span></p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs pl-1" style={{ color: "#6B7280" }}>기업명</label>
                      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoToChat()} placeholder="삼성전자" className="ds-input w-full px-4 py-3.5 rounded-xl text-sm placeholder:text-[#B6BCC6]" style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none" }} />
                    </div>
                    <p className="text-xs pl-0.5 flex items-start gap-1" style={{ color: "#9CA3AF", wordBreak: "keep-all" }}>
                      <span style={{ flexShrink: 0 }}>ⓘ</span>
                      <span>기업 정보가 부족할 경우 분석이 제한될 수 있어요. 채용공고를 함께 넣어주면 더 정확해져요.</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold pl-0.5" style={{ color: "#374151", letterSpacing: "0.06em" }}>직무 정보</p>
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: "2fr 3fr" }}>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs pl-1 flex items-center gap-1" style={{ color: "#6B7280" }}>
                          지원 직무 <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGoToChat()} placeholder="마케팅 기획" className="ds-input w-full px-4 py-3.5 rounded-xl text-sm placeholder:text-[#B6BCC6]" style={{ background: "#FFFFFF", border: `1.5px solid ${toastField === "jobTitle" ? "#EF4444" : "#E5E7EB"}`, color: "#111827", outline: "none" }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs pl-1" style={{ color: "#6B7280" }}>채용공고 <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(선택)</span></label>
                        {(() => {
                          const hasContent = jobPostText.trim() || jobPostImagePreview;
                          return (
                            <button
                              type="button"
                              onClick={() => setShowJobPostModal(true)}
                              className="w-full px-4 py-3.5 rounded-xl text-sm text-left flex items-center justify-between transition-all hover:opacity-80 h-full"
                              style={{
                                background: hasContent ? "#F5F3FF" : "#FFFFFF",
                                border: `1.5px solid ${hasContent ? "#A78BFA" : "#E5E7EB"}`,
                                color: hasContent ? "#4C3F99" : "#9CA3AF",
                              }}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="text-base leading-none flex-shrink-0">{hasContent ? "📎" : "📋"}</span>
                                <span className="truncate text-xs">
                                  {hasContent
                                    ? jobPostText.trim()
                                      ? `텍스트 입력됨`
                                      : "이미지 첨부됨"
                                    : "입력하기"}
                                </span>
                              </span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 카테고리 */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold pl-0.5" style={{ color: "#374151", letterSpacing: "0.06em" }}>자소서 유형</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { key: "analyze",     label: "직무 역량",      desc: "경험으로 직무 적합성을 보여주고 싶다면",  color: BLUE,   emoji: "💼" },
                      { key: "motivation",  label: "지원 동기·포부", desc: "왜 이 회사·직무인지, 포부를 쓴다면",     color: GOLD,   emoji: "✨" },
                      { key: "personality", label: "성격·인성",      desc: "성격 장단점·가치관, 갈등·협업·도전 경험",  color: VIOLET, emoji: "🌱" },
                    ] as { key: typeof chatMode; label: string; desc: string; color: string; emoji: string }[]).map(({ key, label, desc, color, emoji }) => {
                      const on = chatMode === key;
                      return (
                        <button key={key} onClick={() => { if (key === "personality" && process.env.NODE_ENV === "production") { setShowPersonalityBlock(true); return; } setChatMode(key); }} className="flex flex-col gap-2 px-4 py-4 rounded-xl text-left transition-all active:scale-[0.98]" style={{ background: on ? `${color}0C` : "#FFFFFF", border: `1.5px solid ${on ? color : "#E5E7EB"}`, boxShadow: on ? `0 6px 18px -8px ${color}80` : "none" }}>
                          <span className="text-xl leading-none">{emoji}</span>
                          <span className="text-sm font-bold" style={{ color: on ? color : "#111827" }}>{label}</span>
                          <p className="text-xs leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all" }}>{desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleGoToChat}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-[15px] transition-all hover:opacity-92 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", color: "#FFFFFF", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)", letterSpacing: "-0.01em" }}
                >
                  채팅 시작하기
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            onClick={() => { if (selected?.status === "chatting" || (selected?.msgs ?? []).length > 0) { setShowGoBackConfirm(true); } else { window.location.href = "/"; } }}
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: "#111827" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            나가기
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(212,146,10,0.10)", border: "1px solid rgba(212,146,10,0.22)", color: "#8B6A0A" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                {userCredits}
              </div>
            )}
          </div>
        </header>

        {/* 환영 토스트 */}
        {welcome && (
          <div
            className="fixed top-16 left-1/2 lg:left-[calc(136px+50vw)] z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg"
            style={{
              transform: "translateX(-50%)",
              background: "#312E81",
              border: "1px solid #312E81",
              color: "#FFFFFF",
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
              background: "#1A3461",
              border: "1px solid #1A3461",
              color: "#FFFFFF",
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
                            : { background: DS_PRIMARY, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
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
                        disabled={isStreaming}
                        className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)" }}
                      >
                        {isStreaming ? "분석 중..." : "분석하기 →"}
                      </button>
                    ) : (
                      <>
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
                      {selected.setupStep === "draft" && setupInput.length > 0 && (
                        <div className="px-1 pt-1.5 pb-0.5 text-right">
                          <span className="text-[11px]" style={{ color: selected.charLimit && setupInput.length > Number(selected.charLimit) ? "#EF4444" : "#9CA3AF" }}>
                            {setupInput.length}{selected.charLimit ? ` / ${selected.charLimit}자` : "자"}
                          </span>
                        </div>
                      )}
                      </>
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
                            draft={selected.draft}
                            interviewQs={selected.interviewQs.map((q) => ({ question: q.question, msgs: q.msgs }))}
                            onSelectSubtitle={(s) => applySubtitle(msg, s)}
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
                                : { background: DS_PRIMARY, color: "#fff", borderRadius: "16px 4px 16px 16px", wordBreak: "keep-all" }
                            }
                          >
                            {msg.role === "bot" && msg.text === "" ? (
                              isStreaming ? (
                                <div className="flex items-center h-6">
                                  <StreamingLoadingMsg />
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: "#9CA3AF" }}>응답을 불러오지 못했어요. 다시 시도해주세요.</span>
                              )
                            ) : msg.role === "bot" ? stripMd(msg.text) : msg.text}
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
                            onRetry={() => retryInterviewAnswer(q.id)}
                            onFinish={() => finishInterviewQ(q.id)}
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
                        onClick={requestRevision}
                        disabled={isStreaming}
                        className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.985] disabled:opacity-30 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", color: "#fff", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)" }}
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
                        style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", color: "#fff", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

                    {/* 어드민 전용: 완성본 재생성 (localhost에선 로컬 테스트용으로 항상 노출) */}
                    {((currentUser?.email === ADMIN_EMAIL) || (typeof window !== "undefined" && window.location.hostname === "localhost")) && hasAnyRevision && (
                      <button
                        onClick={handleAdminRegenerate}
                        disabled={isStreaming}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-1.5"
                        style={{ background: "#FFF7ED", border: "1.5px solid #FDBA74", color: "#C2410C" }}
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
                            if (!allAnswered) { setShowInterviewWarning(true); } else { openSummary(); }
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
                          내 경험 전체 분석 보기
                        </button>
                        <Link
                          href="/"
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:opacity-70 flex items-center justify-center gap-2"
                          style={{ color: "#9CA3AF", border: "1px solid #E5E7EB" }}
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

              {/* ── 오른쪽 디깅 가이드 패널 — 데스크탑 ── */}
              {guideOpen ? (
              <div
                className="hidden lg:flex flex-shrink-0 flex-col border-l overflow-hidden"
                style={{ width: "300px", borderColor: "#E5E7EB", background: "#FAFAFB" }}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#312E81", letterSpacing: "0.1em" }}>가이드</span>
                  <button
                    onClick={() => setGuideOpen(false)}
                    className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                    style={{ color: "#9CA3AF" }}
                  >
                    접기
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm font-bold px-1" style={{ color: "#111827" }}>더 좋은 결과를 위한 안내</p>
                  {[
                    { icon: "🎤", title: "지금부터 면접이라 생각하세요", body: "여기서 받는 질문은 실제 면접에서 나오는 꼬리질문 수준이에요. 면접 연습이라 생각하고, 면접관 앞에서 답하듯 진지하게 답해주세요. 날것·구어체로 대충 넘기면 완성본도 그대로 거칠어져요.", color: "#312E81" },
                    { icon: "💬", title: "깊게 답할수록 좋아져요", body: "답변이 얕으면 결과도 얕아져요. 생각이 안 나면 대충 만들어 넘기지 말고, 천천히 떠올려보거나 찾아보고 답해주세요.", color: "#3B62CC" },
                    { icon: "💾", title: "오늘 다 못 해도 괜찮아요", body: "내일 이어서 할 수 있어요. 대화는 자동으로 저장됩니다.", color: "#7C5CBF" },
                  ].map((t) => (
                    <div key={t.title} className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: "#FFFFFF", border: "1px solid #EDEFF2", boxShadow: "0 1px 2px rgba(17,24,39,0.03)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{t.icon}</span>
                        <span className="text-sm font-bold" style={{ color: t.color }}>{t.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all" }}>{t.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              ) : (
              <button
                onClick={() => setGuideOpen(true)}
                className="hidden lg:flex flex-shrink-0 flex-col items-center justify-center gap-3 border-l hover:bg-[#F9FAFB] transition-colors"
                style={{ width: "44px", borderColor: "#E5E7EB", background: "#FFFFFF" }}
                title="가이드 펼치기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                <span className="text-xs font-bold tracking-wide" style={{ color: "#6B7280", writingMode: "vertical-rl" }}>가이드</span>
              </button>
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
            className="w-full flex flex-col gap-5 rounded-3xl p-6"
            style={{ maxWidth: "360px", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 24px 60px -12px rgba(17,24,39,0.25)" }}
          >
            {(() => {
              const hasBadgeUsed = resumeSession.items.some(i => i.status === "chatting");

              if (!discardConfirmMode && hasBadgeUsed) {
                return (
                  /* ── 뱃지 사용 문항 있음 — 첫 화면 ── */
                  <>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D4920A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                        <p className="text-base font-bold" style={{ color: "#111827" }}>뱃지가 사용된 문항이 있어요</p>
                      </div>
                      <div className="px-3.5 py-2.5 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                        <p className="text-xs leading-relaxed" style={{ color: "#DC2626" }}>
                          분석이 시작된 문항이 있어요. 이어서 진행하면 추가 뱃지 차감 없이 계속할 수 있어요.
                        </p>
                      </div>
                      {resumeSession.items.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {resumeSession.items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="text-xs font-bold flex-shrink-0 mt-px" style={{ color: "#6366F1" }}>{String(i + 1).padStart(2, "0")}</span>
                              <p className="text-xs truncate" style={{ color: "#6B7280", wordBreak: "keep-all" }}>
                                {item.question || "문항 미입력"}
                              </p>
                            </div>
                          ))}
                          {resumeSession.items.length > 3 && (
                            <p className="text-xs pl-5" style={{ color: "#9CA3AF" }}>외 {resumeSession.items.length - 3}개 항목</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={loadResumeSession}
                        disabled={isLoadingResume}
                        className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
                      >
                        {isLoadingResume ? "불러오는 중..." : "계속하기"}
                      </button>
                      <button
                        onClick={() => setDiscardConfirmMode(true)}
                        disabled={isLoadingResume}
                        className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
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
                        <span className="w-2 h-2 rounded-full" style={{ background: "#312E81" }} />
                        <p className="text-base font-bold" style={{ color: "#111827" }}>이어서 진행할까요?</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B7280", paddingLeft: "16px" }}>
                        {formatRelativeTime(resumeSession.session.created_at)} 작업하던
                        {resumeSession.session.job_title ? ` "${resumeSession.session.job_title}"` : ""} 자소서가 있어요.
                      </p>
                      {resumeSession.items.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5 pl-4">
                          {resumeSession.items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="text-xs font-bold flex-shrink-0 mt-px" style={{ color: "#6366F1" }}>{String(i + 1).padStart(2, "0")}</span>
                              <p className="text-xs truncate" style={{ color: "#6B7280", wordBreak: "keep-all" }}>
                                {item.question || "문항 미입력"}
                              </p>
                            </div>
                          ))}
                          {resumeSession.items.length > 3 && (
                            <p className="text-xs pl-5" style={{ color: "#9CA3AF" }}>외 {resumeSession.items.length - 3}개 항목</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={loadResumeSession}
                        disabled={isLoadingResume}
                        className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
                      >
                        {isLoadingResume ? "불러오는 중..." : "이어서 하기"}
                      </button>
                      <button
                        onClick={() => setDiscardConfirmMode(true)}
                        disabled={isLoadingResume}
                        className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
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
                          <span className="w-2 h-2 rounded-full" style={{ background: "#D1D5DB" }} />
                          <p className="text-base font-bold" style={{ color: "#111827" }}>정말 새로 시작할까요?</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                          차감된 뱃지는 돌아오지 않아요. 이전 작업 내용은 더 이상 불러오지 않아요.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: "#D1D5DB" }} />
                          <p className="text-base font-bold" style={{ color: "#111827" }}>새로 시작할까요?</p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                          분석을 시작하지 않은 문항은 뱃지가 차감되지 않았어요. 이전 작업 내용은 더 이상 불러오지 않아요.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setDiscardConfirmMode(false)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
                    >
                      돌아가기
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("lastDismissedSessionId", resumeSession.session.id);
                        setDiscardConfirmMode(false);
                        setResumeSession(null);
                      }}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
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
          style={{ background: "rgba(17,24,39,0.5)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full flex flex-col rounded-3xl overflow-hidden"
            style={{
              maxWidth: "420px",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow: "0 24px 64px -12px rgba(17,24,39,0.28)",
            }}
          >
            <div className="px-7 pt-7 pb-1">
              <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2" style={{ color: "#A78BFA" }}>CONFIRM</p>
              <h2 className="text-2xl font-bold" style={{ color: "#111827", letterSpacing: "-0.02em" }}>자소서 분석을 시작할까요?</h2>
            </div>

            <div className="px-7 py-5 flex flex-col gap-3.5">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ background: "#312E81" }} />
                <div className="flex flex-col gap-1">
                  <p className="text-sm leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all" }}>
                    이 문항을 분석하면 뱃지 1개가 사용돼요.
                  </p>
                  {userCredits !== null && (
                    <p className="text-sm" style={{ color: "#374151", whiteSpace: "nowrap" }}>
                      남은 뱃지 <span style={{ color: "#111827", fontWeight: 700 }}>{userCredits}개</span> → <span style={{ color: userCredits - 1 > 0 ? "#111827" : "#DC2626", fontWeight: 700 }}>{userCredits - 1}개</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ background: "#312E81" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all" }}>
                  중간에 나가도 같은 문항은 <span style={{ color: "#111827", fontWeight: 600 }}>추가 차감 없이</span> 이어서 할 수 있어요.
                </p>
              </div>
            </div>

            <div className="px-7 pt-2 pb-6 flex gap-3">
              <button
                onClick={() => setShowCreditConfirm(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
              >
                취소
              </button>
              <button
                onClick={() => { setShowCreditConfirm(false); startAnalysis(); }}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)" }}
              >
                시작하기
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
            className="w-full flex flex-col gap-5 rounded-3xl p-6"
            style={{ maxWidth: "360px", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 24px 60px -12px rgba(17,24,39,0.25)" }}
          >
            <div className="flex flex-col gap-2">
              <p className="text-base font-bold" style={{ color: "#111827" }}>
                면접 답변이 작성되지 않았어요
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all" }}>
                이대로 완료하면 정리본에 면접 Q&A 내용이 나오지 않아요. 그래도 완료하시겠어요?
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setShowInterviewWarning(false); openSummary(); }}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
              >
                그냥 완료
              </button>
              <button
                onClick={() => setShowInterviewWarning(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
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
            background: "rgba(255,255,255,0.98)",
            border: "1px solid #E5E7EB",
            boxShadow: "0 12px 40px -8px rgba(17,24,39,0.22)",
            backdropFilter: "blur(20px)",
            minWidth: "260px",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#312E81" }} />
            <p className="text-sm font-bold" style={{ color: "#111827" }}>잠시 자리를 비우셨나요?</p>
          </div>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            {Math.floor(idleCountdown / 60) > 0
              ? `${Math.floor(idleCountdown / 60)}분 ${idleCountdown % 60}초`
              : `${idleCountdown}초`} 후 자동 로그아웃됩니다
          </p>
          <button
            onClick={extendSession}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-92 active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 6px 18px -6px rgba(49,46,129,0.5)" }}
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
          analysisContent={analysisContent}
          finalAnalysis={finalAnalysis}
          finalAnalysisLoading={finalAnalysisLoading}
          onClose={() => setShowSummary(false)}
          onNextItem={() => { setShowSummary(false); setShowModeSelect(true); }}
        />
      )}

      {/* 새 문항 유형 선택 모달 */}
      {showModeSelect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowModeSelect(false)}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "26px 24px", maxWidth: 420, width: "100%", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>어떤 자소서를 쓸까요?</p>
            <p style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 18, lineHeight: 1.6 }}>
              {jobTitle ? `${jobTitle} ` : ""}같은 회사·직무로 새 문항을 시작해요. 유형을 골라주세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "analyze",     label: "직무 역량",      desc: "경험으로 직무 적합성을 보여주고 싶다면",  color: BLUE,   emoji: "💼" },
                { key: "motivation",  label: "지원 동기·포부", desc: "왜 이 회사·직무인지, 포부를 쓴다면",     color: GOLD,   emoji: "✨" },
                { key: "personality", label: "성격·인성",      desc: "성격 장단점·가치관, 갈등·협업·도전 경험",  color: VIOLET, emoji: "🌱" },
              ] as { key: typeof chatMode; label: string; desc: string; color: string; emoji: string }[]).map(({ key, label, desc, color, emoji }) => (
                <button key={key}
                  onClick={() => {
                    if (key === "personality" && process.env.NODE_ENV === "production") { setShowModeSelect(false); setShowPersonalityBlock(true); return; }
                    setChatMode(key);
                    setShowModeSelect(false);
                    addItem(key);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#FFFFFF", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}0A`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#FFFFFF"; }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowModeSelect(false)}
              style={{ marginTop: 16, width: "100%", padding: "11px", borderRadius: 12, background: "#F3F4F6", color: "#6B7280", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 완성본 직전 후기 게이트 */}
      {showReviewGate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(17,24,39,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => { if (!reviewSubmitting) setShowReviewGate(false); }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "26px 24px", maxWidth: 400, width: "100%", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 6 }}>디깅은 잘 해보셨나요? 🎉</p>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 16 }}>지금 <b style={{ color: "#4C3F99" }}>리뷰 이벤트</b> 중이에요. 한 줄 남겨주시면 <b style={{ color: "#4C3F99" }}>완성본·면접 예상질문·답변 연습</b>이 바로 열려요. 디깅에서 어떤 부분이 좋았어요?</p>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value.slice(0, 100))}
              placeholder="예: 질문이 날카로워서 생각이 정리됐어요"
              rows={3}
              autoFocus
              style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#111827", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: reviewText.length >= 90 ? "#DC2626" : "#9CA3AF" }}>{reviewText.length}/100</span>
            </div>
            <button
              onClick={submitReviewAndProceed}
              disabled={!reviewText.trim() || reviewSubmitting}
              style={{ width: "100%", padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: (!reviewText.trim() || reviewSubmitting) ? "default" : "pointer", opacity: (!reviewText.trim() || reviewSubmitting) ? 0.5 : 1, boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)" }}
            >
              {reviewSubmitting ? "저장 중..." : "리뷰 남기고 완성본 받기 →"}
            </button>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showGoBackConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowGoBackConfirm(false)}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>나가시겠어요?</p>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22, lineHeight: 1.75, wordBreak: "keep-all" }}>지금까지 나눈 대화는 자동으로 저장돼 있어요.<br />언제든 다시 들어와서 이어서 할 수 있어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowGoBackConfirm(false)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                계속하기
              </button>
              <button onClick={() => { window.location.href = "/"; }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", border: "none", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px -10px rgba(49,46,129,0.55)" }}>
                홈으로 나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {showResumeItemModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowResumeItemModal(false)}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>이어서 할까요, 새로 시작할까요?</p>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22, lineHeight: 1.75, wordBreak: "keep-all" }}>이전에 나눈 대화가 있어요.<br />이어서 진행하면 추가 뱃지가 차감되지 않아요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowResumeItemModal(false); setStage("chat"); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", border: "none", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px -10px rgba(49,46,129,0.55)" }}>
                이어서 하기
              </button>
              <button onClick={() => {
                setShowResumeItemModal(false);
                updateItem(selectedId, { interviewQs: [] });
                const isAdmin = currentUser?.email === ADMIN_EMAIL;
                if (!isAdmin && userCredits !== null && userCredits <= 0) {
                  showToast("뱃지가 없어요. 관리자에게 문의해주세요", "");
                  return;
                }
                proceedWithAnalysis();
              }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                새로 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {showPersonalityBlock && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowPersonalityBlock(false)}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "32px 24px", maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🌱</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>업데이트 예정이에요 🙏</p>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, wordBreak: "keep-all" }}>성격·인성 기능을 더 잘 만들고 있어요. 잠시만 기다려주세요!</p>
            <button onClick={() => setShowPersonalityBlock(false)} style={{ marginTop: 20, width: "100%", padding: "13px 0", borderRadius: 12, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>확인</button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 24, padding: "28px 24px", maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>로그아웃 하시겠어요?</p>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22, wordBreak: "keep-all" }}>대화 내용은 자동 저장돼 있어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                취소
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
            className="w-full flex flex-col gap-5 rounded-3xl p-6"
            style={{ maxWidth: "380px", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 24px 60px -12px rgba(17,24,39,0.25)" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span style={{ fontSize: 20 }}>📋</span>
                <p className="text-base font-bold" style={{ color: "#111827" }}>이전에 같은 초안을 분석한 기록이 있어요</p>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl" style={{ background: "#F5F3FF", border: "1px solid #E9E4FB" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#4C3F99" }}>
                  새로 분석하면 질문이 완전히 달라질 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <p className="text-xs" style={{ color: "#9CA3AF" }}>이전 분석</p>
                <p className="text-sm font-medium" style={{ color: "#374151", wordBreak: "keep-all" }}>
                  {duplicateDraftInfo.jobTitle && <span style={{ color: "#312E81", fontWeight: 700 }}>【{duplicateDraftInfo.jobTitle}】</span>}{" "}
                  {duplicateDraftInfo.question || "문항 미입력"}
                </p>
                <p className="text-xs" style={{ color: "#B6BCC6" }}>{formatRelativeTime(duplicateDraftInfo.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={async () => {
                  setShowDuplicateDraft(false);
                  await loadSessionById(duplicateDraftInfo.sessionId, duplicateDraftInfo.jobTitle);
                }}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.5)" }}
              >
                이전 기록 보기
              </button>
              <button
                onClick={() => { setShowDuplicateDraft(false); proceedWithAnalysis(); }}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
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
              {(["text", "image"] as const).map((tab) => {
                const labels = { text: "📝 텍스트", image: "🖼️ 이미지" };
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
                className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all hover:opacity-92 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)", letterSpacing: "-0.01em" }}
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
