"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "ijhan6403@gmail.com";

function stripMsg(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[수정본\]([\s\S]*?)\[\/수정본\]/g, (_, content) => `\n📝 수정본:\n${content.trim()}\n`)
    .replace(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/g, (_, content) => `\n✏️ 바뀐점:\n${content.trim()}\n`)
    .replace(/\[참조\]([\s\S]*?)\[\/참조\]/g, "$1")
    .replace(/\[참조\]|\[\/참조\]/g, "")
    .trim();
}
const BG = "#0D0D18";
const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const VIOLET = "#A78BFA";
const GREEN = "rgb(74,222,128)";
const RED = "rgb(248,113,113)";

type Tab = "dashboard" | "review" | "notes" | "users" | "funnel" | "board";
type Filter = "all" | "good" | "bad" | "none";

interface SessionItem {
  id: string;
  job_title: string;
  created_at: string;
  user_id: string;
  profiles?: { email: string } | null;
  admin_reviews: { id?: string; rating: string | null; comment: string; created_at?: string }[];
}

interface CoverItemFull {
  id: string;
  question: string;
  draft: string;
  char_limit: number | null;
  status: string;
  order_index: number;
  messages: { id: string; role: string; content: string; created_at: string }[];
  interview_questions: {
    id: string;
    question: string;
    order_index: number;
    created_at: string;
    interview_answers: { user_answer: string; ai_feedback: string }[];
  }[];
}

interface UserProfile { id: string; email: string; credits: number; created_at?: string; }
interface PostItem {
  id: string;
  title: string;
  content: string;
  job_title: string;
  category: string;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
}

interface FunnelRow { userId: string; email: string; createdAt: string; stageIndex: number; stageLabel: string; diggingAsked: number; diggingAnswered: number; interviewAnswered: number; interviewTotal: number; dropReason: string; }
interface FunnelData {
  totalUsers: number;
  stages: { label: string; count: number; pct: number; dropCount: number }[];
  users: FunnelRow[];
}
interface Breakdown { today: number; week: number; month: number; total: number; }
interface DashStats {
  users: Breakdown;
  sessions: Breakdown;
  views: Breakdown;
  dailyViews: { date: string; count: number }[];
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");

  // Dashboard
  const [stats, setStats] = useState<DashStats | null>(null);

  // Review
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coverItems, setCoverItems] = useState<CoverItemFull[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regenItemId, setRegenItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [rating, setRating] = useState<"good" | "bad" | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [grantedId, setGrantedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Review — 세션 삭제
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<{ id: string; jobTitle: string } | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Funnel
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(false);

  // Board
  const [boardPosts, setBoardPosts] = useState<PostItem[]>([]);
  const [boardPostsLoading, setBoardPostsLoading] = useState(false);
  const [boardVisible, setBoardVisible] = useState(false);
  const [boardVisibleSaving, setBoardVisibleSaving] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeCategory, setWriteCategory] = useState("쥔장 잡담");
  const [writeContent, setWriteContent] = useState("");
  const [writeSaving, setWriteSaving] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [boardCategory, setBoardCategory] = useState("전체");
  const [viewPost, setViewPost] = useState<PostItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Notes
  const [goodNotes, setGoodNotes] = useState("");
  const [badNotes, setBadNotes] = useState("");
  const [improvementNotes, setImprovementNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === ADMIN_EMAIL) {
        setAuthed(true);
        fetchDashboard();
        fetchSessions();
        fetchNotes();
        fetchUsers();
      }
      setLoading(false);
    });
  }, []);

  async function fetchBoard() {
    setBoardPostsLoading(true);
    const [{ data: postsData }, { data: config }] = await Promise.all([
      supabase.from("posts").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("site_config").select("value").eq("key", "board_visible").single(),
    ]);
    setBoardPosts(postsData || []);
    setBoardVisible(config?.value === true);
    setBoardPostsLoading(false);
  }

  function openViewPost(post: PostItem) {
    setViewPost(post);
    setEditMode(false);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
  }

  async function savePostEdit() {
    if (!viewPost) return;
    setEditSaving(true);
    await supabase.from("posts").update({ title: editTitle.trim(), content: editContent.trim(), category: editCategory }).eq("id", viewPost.id);
    const updated = { ...viewPost, title: editTitle.trim(), content: editContent.trim(), category: editCategory };
    setBoardPosts(prev => prev.map(p => p.id === viewPost.id ? updated : p));
    setViewPost(updated);
    setEditMode(false);
    setEditSaving(false);
  }

  async function togglePostPin(id: string, current: boolean) {
    await supabase.from("posts").update({ is_pinned: !current }).eq("id", id);
    setBoardPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: !current } : p));
  }

  async function togglePostPublish(id: string, current: boolean) {
    await supabase.from("posts").update({ is_published: !current }).eq("id", id);
    setBoardPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_published: !current } : p));
  }

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    setBoardPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function submitPost() {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setWriteSaving(true);
    const { data } = await supabase
      .from("posts")
      .insert({ title: writeTitle.trim(), content: writeContent.trim(), category: writeCategory, is_published: true })
      .select()
      .single();
    if (data) {
      setBoardPosts((prev) => [data, ...prev]);
      setWriteTitle("");
      setWriteContent("");
      setWriteCategory("쥔장 잡담");
      setWriteOpen(false);
    }
    setWriteSaving(false);
  }

  async function toggleBoardVisible() {
    const next = !boardVisible;
    setBoardVisibleSaving(true);
    await supabase.from("site_config").update({ value: next }).eq("key", "board_visible");
    setBoardVisible(next);
    setBoardVisibleSaving(false);
  }

  async function fetchDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const q = (table: string, from?: string) => {
      const base = supabase.from(table).select("*", { count: "exact", head: true });
      return from ? base.gte("created_at", from) : base;
    };

    const [
      { count: uTotal }, { count: uToday }, { count: uWeek }, { count: uMonth },
      { count: sTotal }, { count: sToday }, { count: sWeek }, { count: sMonth },
      { count: vTotal }, { count: vToday }, { count: vWeek }, { count: vMonth },
      { data: recentViews },
    ] = await Promise.all([
      q("profiles"), q("profiles", todayStart), q("profiles", weekStart), q("profiles", monthStart),
      q("sessions"), q("sessions", todayStart), q("sessions", weekStart), q("sessions", monthStart),
      q("page_views"), q("page_views", todayStart), q("page_views", weekStart), q("page_views", monthStart),
      supabase.from("page_views").select("created_at").gte("created_at", twoWeeksAgo),
    ]);

    const dailyMap: Record<string, number> = {};
    (recentViews || []).forEach((v) => {
      const d = v.created_at.slice(0, 10);
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });
    const dailyViews = Object.entries(dailyMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, count]) => ({ date, count }));

    setStats({
      users:    { today: uToday || 0, week: uWeek || 0, month: uMonth || 0, total: uTotal || 0 },
      sessions: { today: sToday || 0, week: sWeek || 0, month: sMonth || 0, total: sTotal || 0 },
      views:    { today: vToday || 0, week: vWeek || 0, month: vMonth || 0, total: vTotal || 0 },
      dailyViews,
    });
  }

  async function fetchSessions() {
    setSessionsLoading(true);
    const [{ data, error }, sessionRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, job_title, created_at, user_id, profiles(email)")
        .order("created_at", { ascending: false }),
      supabase.auth.getSession(),
    ]);
    if (error) console.error("[Admin] fetchSessions error:", error);

    const token = sessionRes.data.session?.access_token;
    let reviewsMap: Record<string, { id: string; rating: string | null; comment: string; created_at: string }[]> = {};
    if (token) {
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const reviews: { id: string; session_id: string; rating: string | null; comment: string; created_at: string }[] = await res.json();
        for (const r of reviews) {
          if (!reviewsMap[r.session_id]) reviewsMap[r.session_id] = [];
          reviewsMap[r.session_id].push(r);
        }
      }
    }

    const merged = (data || []).map((s: any) => ({
      ...s,
      admin_reviews: reviewsMap[s.id] || [],
    }));
    setSessions(merged as SessionItem[]);
    setSessionsLoading(false);
  }

  async function selectSession(id: string) {
    if (selectedId === id) return;
    setSelectedId(id);
    setRating(null);
    setComment("");
    setSaved(false);

    setDetailLoading(true);
    setCoverItems([]);
    const { data } = await supabase
      .from("cover_items")
      .select(
        "id, question, draft, char_limit, status, order_index, messages(id, role, content, created_at), interview_questions(id, question, order_index, created_at, interview_answers(user_answer, ai_feedback))"
      )
      .eq("session_id", id)
      .order("order_index");
    setCoverItems((data as unknown as CoverItemFull[]) || []);
    setDetailLoading(false);
  }

  async function regenCoverLetter(item: CoverItemFull) {
    if (regenItemId) return;
    setRegenItemId(item.id);
    try {
      const sorted = [...item.messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const cutIdx = sorted.findIndex(m => m.role === "user" && m.content === "완성본을 작성해줘.");
      const baseHistory = (cutIdx !== -1 ? sorted.slice(0, cutIdx) : sorted).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

      // DB에서 완성본 요청 이후 메시지 삭제
      if (cutIdx !== -1) {
        const toDelete = sorted.slice(cutIdx).map(m => m.id);
        await supabase.from("messages").delete().in("id", toDelete);
      }

      const newHistory = [...baseHistory, { role: "user", content: "완성본을 작성해줘." }];
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", jobTitle: selectedSession?.job_title || "", question: item.question, draft: item.draft, charLimit: item.char_limit ? String(item.char_limit) : "", messages: newHistory }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
      }
      await supabase.from("messages").insert([
        { cover_item_id: item.id, role: "user", content: "완성본을 작성해줘." },
        { cover_item_id: item.id, role: "assistant", content: full },
      ]);
      // 직접 리로드 (selectSession은 같은 ID면 무시하므로)
      if (selectedId) {
        const { data } = await supabase
          .from("cover_items")
          .select("id, question, draft, char_limit, status, order_index, messages(id, role, content, created_at), interview_questions(id, question, order_index, created_at, interview_answers(user_answer, ai_feedback))")
          .eq("session_id", selectedId)
          .order("order_index");
        setCoverItems((data as unknown as CoverItemFull[]) || []);
      }
    } catch { /* 무시 */ }
    setRegenItemId(null);
  }

  async function saveReview() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedId, rating, comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved_review = await res.json();
      setSessions((prev) => prev.map((s) =>
        s.id === selectedId
          ? { ...s, admin_reviews: [{ id: saved_review.id, rating, comment, created_at: saved_review.created_at }, ...s.admin_reviews] }
          : s
      ));
      setRating(null);
      setComment("");
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("[saveReview]", e);
      setSaving(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, credits, created_at")
        .order("created_at", { ascending: false });
      if (error) console.error("[fetchUsers]", error);
      setUsers((data || []) as UserProfile[]);
    } finally {
      setUsersLoading(false);
    }
  }

  async function adjustCredit(userId: string, sign: 1 | -1) {
    const amount = parseInt(creditInputs[userId] || "0");
    if (!amount || isNaN(amount) || amount <= 0) return;
    const delta = amount * sign;
    setGrantingId(userId);
    const { error } = await supabase.rpc("grant_credit", { p_user_id: userId, p_amount: delta });
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: u.credits + delta } : u));
      setCreditInputs(prev => ({ ...prev, [userId]: "" }));
      setGrantedId(userId);
      setTimeout(() => setGrantedId(null), 2000);
    }
    setGrantingId(null);
  }

  async function handleDeleteUser(userId: string) {
    setDeletingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("[handleDeleteUser]", err);
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } finally {
      setDeleteTarget(null);
      setDeletingUserId(null);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    setDeletingSessionId(sessionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/admin/delete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (selectedId === sessionId) { setSelectedId(null); setCoverItems([]); }
      } else {
        console.error("[handleDeleteSession]", await res.text());
      }
    } catch (e) {
      console.error("[handleDeleteSession]", e);
    } finally {
      setDeleteSessionTarget(null);
      setDeletingSessionId(null);
    }
  }

  async function fetchNotes() {
    const { data } = await supabase
      .from("prompt_notes")
      .select("good_notes, bad_notes, improvement_notes")
      .limit(1)
      .maybeSingle();
    if (data) {
      setGoodNotes(data.good_notes || "");
      setBadNotes(data.bad_notes || "");
      setImprovementNotes(data.improvement_notes || "");
    }
  }

  async function fetchFunnel() {
    setFunnelLoading(true);
    const [{ data: profiles }, { data: sesData }, { data: ciData }, { data: msgData }] = await Promise.all([
      supabase.from("profiles").select("id, email, created_at").order("created_at", { ascending: false }),
      supabase.from("sessions").select("id, user_id"),
      supabase.from("cover_items").select("id, session_id, revisions(id), interview_questions(id, interview_answers(id))"),
      supabase.from("messages").select("cover_item_id, role, content"),
    ]);

    // session_id → user_id 역방향 매핑
    const sessionToUser: Record<string, string> = {};
    (sesData || []).forEach((s: any) => { sessionToUser[s.id] = s.user_id; });

    const sessionByUser: Record<string, string[]> = {};
    (sesData || []).forEach((s: any) => {
      if (!sessionByUser[s.user_id]) sessionByUser[s.user_id] = [];
      sessionByUser[s.user_id].push(s.id);
    });

    const coverBySession: Record<string, any[]> = {};
    (ciData || []).forEach((ci: any) => {
      if (!coverBySession[ci.session_id]) coverBySession[ci.session_id] = [];
      coverBySession[ci.session_id].push(ci);
    });

    // cover_item → user 매핑
    const ciToUser: Record<string, string> = {};
    (ciData || []).forEach((ci: any) => { ciToUser[ci.id] = sessionToUser[ci.session_id]; });

    // 유저별 단계 이벤트 집계
    const startedAnalysis = new Set<string>();   // "초안 진단을 시작해줘." 전송
    const finishedDigging = new Set<string>();    // AI가 "완성본을 원하면" 발송
    const CMD = ["초안 진단을 시작해줘.", "수정본을 작성해줘.", "완성본을 작성해줘."];
    const msgCountByCi: Record<string, { asked: number; answered: number }> = {};

    (msgData || []).forEach((m: any) => {
      const uid = ciToUser[m.cover_item_id];
      if (!msgCountByCi[m.cover_item_id]) msgCountByCi[m.cover_item_id] = { asked: 0, answered: 0 };
      if (m.role === "assistant") {
        msgCountByCi[m.cover_item_id].asked++;
        if (uid && (m.content?.includes("완성본을 원하면") || m.content?.includes("수정본을 원하면")))
          finishedDigging.add(uid);
      }
      if (m.role === "user") {
        if (uid && m.content === "초안 진단을 시작해줘.") startedAnalysis.add(uid);
        if (!CMD.includes(m.content)) msgCountByCi[m.cover_item_id].answered++;
      }
    });

    // 유저별 revision / interview 여부
    const hasRevisionUser = new Set<string>();
    (ciData || []).forEach((ci: any) => {
      if ((ci.revisions || []).length > 0) {
        const uid = sessionToUser[ci.session_id];
        if (uid) hasRevisionUser.add(uid);
      }
    });

    const STAGE_LABELS = ["가입", "분석 시작", "디깅 완주", "최종본 확인", "예상질문 진행"];
    const FUNNEL_NAMES = ["가입", "분석 시작", "디깅 완주", "최종본 확인", "예상질문 진행"];

    const userRows: FunnelRow[] = (profiles || []).map((p: any) => {
      const sids = sessionByUser[p.id] || [];
      const items = sids.flatMap(sid => coverBySession[sid] || []);

      let diggingAsked = 0;
      let diggingAnswered = 0;
      let interviewAnswered = 0;
      let interviewTotal = 0;
      items.forEach((ci: any) => {
        const counts = msgCountByCi[ci.id] || { asked: 0, answered: 0 };
        diggingAsked += counts.asked;
        diggingAnswered += counts.answered;
        (ci.interview_questions || []).forEach((iq: any) => {
          interviewTotal++;
          if ((iq.interview_answers || []).length > 0) interviewAnswered++;
        });
      });

      // 5단계: 각 이벤트 실제 발생 여부 기준
      let idx = 0;
      if (startedAnalysis.has(p.id)) {
        idx = 1;
        if (finishedDigging.has(p.id)) {
          idx = 2;
          if (hasRevisionUser.has(p.id)) {
            idx = 3;
            if (interviewAnswered > 0) idx = 4;
          }
        }
      }

      let dropReason: string;
      if (idx === 4) dropReason = "complete";
      else if (idx === 3) dropReason = "no_interview";
      else if (idx === 2) dropReason = "no_revision";
      else if (idx === 1) dropReason = "no_digging";
      else dropReason = "not_started";

      return { userId: p.id, email: p.email, createdAt: p.created_at || "", stageIndex: idx, stageLabel: STAGE_LABELS[idx], diggingAsked, diggingAnswered, interviewAnswered, interviewTotal, dropReason };
    });

    const totalUsers = userRows.length;
    const stages = FUNNEL_NAMES.map((label, i) => {
      const count = userRows.filter(u => u.stageIndex >= i).length;
      const dropCount = userRows.filter(u => u.stageIndex === i).length;
      const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      return { label, count, pct, dropCount };
    });

    setFunnelData({ totalUsers, stages, users: userRows });
    setFunnelLoading(false);
  }

  async function saveNotes() {
    setNotesSaving(true);
    const payload = { good_notes: goodNotes, bad_notes: badNotes, improvement_notes: improvementNotes, updated_at: new Date().toISOString() };
    const { data: ex } = await supabase.from("prompt_notes").select("id").limit(1).maybeSingle();
    if (ex) {
      await supabase.from("prompt_notes").update(payload).eq("id", ex.id);
    } else {
      await supabase.from("prompt_notes").insert(payload);
    }
    setNotesSaving(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  const filtered = sessions.filter((s) => {
    const r = s.admin_reviews?.[0]?.rating;
    if (filter === "good") return r === "good";
    if (filter === "bad") return r === "bad";
    if (filter === "none") return !r;
    return true;
  });

  const selectedSession = sessions.find((s) => s.id === selectedId);
  const maxDaily = Math.max(...(stats?.dailyViews.map((v) => v.count) || [1]), 1);

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>접근 권한이 없습니다.</p>
        <a href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>← 홈으로</a>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)", fontFamily: "inherit" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        textarea { font-family: inherit; }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
        .admin-mobile-back { display: none; }
        @media (max-width: 768px) {
          /* ─ Header: 2줄 레이아웃 ─ */
          .admin-header {
            height: auto !important;
            flex-wrap: wrap !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .admin-header-title {
            order: 1;
            padding: 0 16px !important;
            height: 44px;
            display: flex;
            align-items: center;
          }
          .admin-header-nav {
            order: 3;
            width: 100% !important;
            flex: none !important;
            justify-content: flex-start !important;
            height: 44px;
            padding: 0 8px !important;
            border-top: 1px solid rgba(255,255,255,0.06);
            overflow-x: auto;
            scrollbar-width: none;
          }
          .admin-header-nav::-webkit-scrollbar { display: none; }
          .admin-header-home {
            order: 2;
            margin-left: auto;
            padding: 0 16px !important;
            height: 44px;
            display: flex !important;
            align-items: center;
            gap: 5px;
          }
          /* ─ 패널 높이 (헤더 88px 기준) ─ */
          .admin-review-wrap { height: calc(100dvh - 88px) !important; }
          .admin-board-wrap  { height: calc(100dvh - 88px) !important; }
          /* ─ 콘텐츠 패딩 ─ */
          .admin-tab-content { padding: 16px !important; }
          /* ─ 대시보드 ─ */
          .admin-stat-grid { grid-template-columns: 1fr !important; }
          /* ─ 대화 리뷰 ─ */
          .admin-review-left { width: 100% !important; min-width: 0 !important; }
          .has-selection .admin-review-left { display: none !important; }
          .admin-review-right { width: 100%; }
          .admin-review-empty { display: none !important; }
          .admin-mobile-back { display: flex; }
          /* ─ 프롬프트 노트 ─ */
          .admin-notes-grid { grid-template-columns: 1fr !important; }
          /* ─ 게시판 ─ */
          .admin-board-sidebar { display: none !important; }
          .admin-board-cat-select { display: flex !important; }
          .admin-board-header-row { display: none !important; }
          .admin-board-action-bar { flex-wrap: wrap !important; gap: 8px !important; padding: 12px 14px !important; }
          .admin-board-action-left { flex-wrap: wrap !important; gap: 6px !important; }
          .admin-board-write-form { padding: 14px !important; }
          .admin-board-write-top { flex-direction: column !important; }
          .admin-board-item-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 14px 16px !important;
            gap: 8px !important;
          }
          .admin-board-item-title { font-size: 15px !important; white-space: normal !important; padding-right: 0 !important; width: 100% !important; }
          .admin-board-item-meta { display: flex !important; align-items: center !important; gap: 8px !important; flex-wrap: wrap !important; width: 100% !important; }
          .admin-board-item-actions { display: none !important; }
          .admin-board-item-row { cursor: pointer; }
          .admin-board-modal-backdrop { padding: 0 !important; align-items: flex-end !important; }
          .admin-board-modal-panel {
            border-radius: 20px 20px 0 0 !important;
            max-height: 94dvh !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 20px 16px 32px !important;
          }
          .admin-board-modal-actions { flex-direction: column !important; gap: 10px !important; }
          .admin-board-modal-actions > div { width: 100% !important; }
          .admin-board-modal-actions button {
            flex: 1 !important;
            padding: 14px 0 !important;
            font-size: 15px !important;
            border-radius: 12px !important;
            justify-content: center !important;
          }
          /* ─ 유저 관리 ─ */
          .admin-users-container { padding: 16px !important; }
          .admin-users-header { display: none !important; }
          .admin-users-row {
            grid-template-columns: 1fr 44px !important;
            grid-template-rows: auto auto !important;
            grid-template-areas: "info badge" "controls del" !important;
            padding: 12px 16px !important;
            row-gap: 8px !important;
            column-gap: 0 !important;
          }
          .admin-users-info     { grid-area: info !important; }
          .admin-users-badge    { grid-area: badge !important; justify-self: center !important; align-self: center !important; }
          .admin-users-controls { grid-area: controls !important; justify-content: flex-start !important; }
          .admin-users-delete   { grid-area: del !important; align-self: center !important; }
          /* ─ 통계 퍼널 테이블 → 카드 ─ */
          .admin-funnel-table-header { display: none !important; }
          .admin-funnel-user-row {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto auto !important;
            grid-template-areas:
              "femail  fstage"
              "fdate   fdate"
              "frev    fintv" !important;
            padding: 12px 16px !important;
            row-gap: 6px !important;
            column-gap: 8px !important;
            align-items: center !important;
          }
          .admin-funnel-cell-date      { grid-area: fdate !important; }
          .admin-funnel-cell-email     { grid-area: femail !important; }
          .admin-funnel-cell-revision  { grid-area: frev !important; justify-content: flex-start !important; }
          .admin-funnel-cell-interview { grid-area: fintv !important; justify-content: flex-start !important; }
          .admin-funnel-cell-stage     { grid-area: fstage !important; justify-content: flex-end !important; }
          .admin-funnel-analysis-sub   { display: none !important; }
          /* ─ 공통 ─ */
          button, a { min-height: 44px; }
          nav button { min-height: 36px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="admin-header" style={{ height: 56, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(13,13,24,0.98)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <span className="admin-header-title" style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>Admin</span>
        <nav className="admin-header-nav" style={{ flex: 1, display: "flex", gap: 2, justifyContent: "center", overflowX: "auto", padding: "0 8px", scrollbarWidth: "none" }}>
          {(["dashboard", "review", "notes", "users", "funnel", "board"] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); if (t === "funnel" && !funnelData) fetchFunnel(); if (t === "board") fetchBoard(); }}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: tab === t ? 700 : 500, border: tab === t ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent", cursor: "pointer", background: tab === t ? "rgba(255,255,255,0.1)" : "transparent", color: tab === t ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap", flexShrink: 0, minHeight: "unset" }}>
              {t === "dashboard" ? "대시보드" : t === "review" ? "대화 리뷰" : t === "notes" ? "프롬프트 노트" : t === "users" ? "유저 관리" : t === "funnel" ? "통계" : "게시판"}
            </button>
          ))}
        </nav>
        <a className="admin-header-home" href="/" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          홈
        </a>
      </header>

      {/* ─── DASHBOARD ─── */}
      {tab === "dashboard" && (
        <div className="admin-tab-content" style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>

          {/* 3-category cards */}
          <div className="admin-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "가입자", icon: "👤", color: ACCENT, borderColor: "rgba(201,100,66,0.25)", bgColor: "rgba(201,100,66,0.05)", data: stats?.users },
              { label: "방문자", icon: "👁",  color: VIOLET, borderColor: "rgba(167,139,250,0.25)", bgColor: "rgba(167,139,250,0.05)", data: stats?.views },
              { label: "세션",   icon: "💬", color: BLUE,   borderColor: "rgba(107,142,255,0.25)", bgColor: "rgba(107,142,255,0.05)", data: stats?.sessions },
            ].map(({ label, icon, color, borderColor, bgColor, data }) => (
              <div key={label} style={{ borderRadius: 18, border: `1px solid ${borderColor}`, background: bgColor, overflow: "hidden" }}>
                {/* Card header */}
                <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color }}>{label}</p>
                </div>
                {/* 4 stats */}
                <div style={{ padding: "4px 0 8px" }}>
                  {[
                    { key: "오늘", val: data?.today },
                    { key: "이번 주", val: data?.week },
                    { key: "이번 달", val: data?.month },
                    { key: "전체", val: data?.total },
                  ].map(({ key, val }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{key}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: val ? color : "rgba(255,255,255,0.2)", letterSpacing: "-0.02em" }}>
                        {val ?? "…"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Visitor trend chart */}
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>방문자 추이 (최근 14일)</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>page_views 기준</span>
            </div>
            <div style={{ padding: "8px 0 4px" }}>
              {stats?.dailyViews.length ? stats.dailyViews.map(({ date, count }) => (
                <div key={date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 18px" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", width: 80, flexShrink: 0 }}>{date.slice(5)}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxDaily) * 100}%`, background: VIOLET, borderRadius: 2, transition: "width 0.4s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", width: 20, textAlign: "right" }}>{count}</span>
                </div>
              )) : (
                <p style={{ padding: "16px 18px", fontSize: 12, color: "rgba(255,255,255,0.18)" }}>아직 방문 데이터가 없어요</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── REVIEW ─── */}
      {tab === "review" && (
        <div className={`admin-review-wrap${selectedId ? " has-selection" : ""}`} style={{ display: "flex", height: "calc(100vh - 56px)" }}>
          {/* Left panel: session list */}
          <div className="admin-review-left" style={{ width: 272, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Filters */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["all", "good", "bad", "none"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 11px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", transition: "all 0.15s", background: filter === f ? "rgba(255,255,255,0.1)" : "transparent", color: filter === f ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                  {f === "all"
                    ? `전체 (${sessions.length})`
                    : f === "good"
                    ? `👍 Good (${sessions.filter(s => s.admin_reviews?.[0]?.rating === "good").length})`
                    : f === "bad"
                    ? `👎 Bad (${sessions.filter(s => s.admin_reviews?.[0]?.rating === "bad").length})`
                    : `미평가 (${sessions.filter(s => !s.admin_reviews?.[0]?.rating).length})`}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {sessionsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ padding: 20, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>세션 없음</p>
              ) : filtered.map((s) => {
                const rev = s.admin_reviews?.[0];
                const isSelected = s.id === selectedId;
                return (
                  <div key={s.id} style={{ position: "relative", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div onClick={() => selectSession(s.id)} style={{ padding: "11px 14px", paddingRight: 34, cursor: "pointer", background: isSelected ? "rgba(255,255,255,0.07)" : "transparent", transition: "background 0.12s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {rev?.rating === "good" && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "rgba(74,222,128,0.9)", flexShrink: 0 }}>👍 Good</span>
                        )}
                        {rev?.rating === "bad" && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "rgba(248,113,113,0.9)", flexShrink: 0 }}>👎 Bad</span>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.82)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.job_title || "직무 미입력"}
                        </span>
                      </div>
                      {rev?.comment && (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3, fontStyle: "italic" }}>
                          {rev.comment}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                        {(s.profiles as any)?.email || s.user_id?.slice(0, 8) || "—"}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                        {s.created_at.slice(0, 10)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteSessionTarget({ id: s.id, jobTitle: s.job_title || "직무 미입력" }); }}
                      title="세션 삭제"
                      style={{ position: "absolute", top: 10, right: 8, width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(248,113,113,0.2)", background: "transparent", color: "rgba(248,113,113,0.4)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(248,113,113,0.12)"; (e.currentTarget).style.color = "rgba(248,113,113,0.85)"; }}
                      onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; (e.currentTarget).style.color = "rgba(248,113,113,0.4)"; }}
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: detail */}
          <div className="admin-review-right" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {!selectedId ? (
              <div className="admin-review-empty" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)" }}>← 세션을 선택하세요</p>
              </div>
            ) : (
              <>
                {/* Session header */}
                <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <button
                      className="admin-mobile-back"
                      onClick={() => setSelectedId(null)}
                      style={{ alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                      </svg>
                      목록으로
                    </button>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                      {selectedSession?.job_title || "직무 미입력"}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      {(selectedSession?.profiles as any)?.email || selectedSession?.user_id?.slice(0, 8)} &middot; {selectedSession?.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteSessionTarget({ id: selectedId!, jobTitle: selectedSession?.job_title || "직무 미입력" })}
                    style={{ flexShrink: 0, marginTop: 2, padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.07)", color: "rgba(248,113,113,0.7)", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(248,113,113,0.16)"; (e.currentTarget).style.color = "rgba(248,113,113,1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(248,113,113,0.07)"; (e.currentTarget).style.color = "rgba(248,113,113,0.7)"; }}
                  >
                    삭제
                  </button>
                </div>

                {/* Conversation scroll area */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {detailLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.2)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
                    </div>
                  ) : coverItems.length === 0 ? (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", paddingTop: 40 }}>대화 기록이 없습니다</p>
                  ) : coverItems.map((item, idx) => {
                    const aiMsgs = item.messages.filter(m => m.role === "assistant").length;
                    const userMsgs = item.messages.filter(m => m.role === "user").length;
                    const dropped = aiMsgs > 0 && userMsgs < aiMsgs - 1;
                    const notStarted = aiMsgs === 0;
                    const sortedForTime = [...item.messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
                    const firstMsg = sortedForTime[0];
                    const lastMsg = sortedForTime[sortedForTime.length - 1];
                    const lastIqTime = item.interview_questions.length > 0
                      ? item.interview_questions.reduce((max, iq) => iq.created_at > max ? iq.created_at : max, item.interview_questions[0].created_at)
                      : null;
                    const endTime = lastIqTime ?? lastMsg?.created_at ?? null;
                    const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                    const durationMin = firstMsg && endTime ? Math.round((new Date(endTime).getTime() - new Date(firstMsg.created_at).getTime()) / 60000) : null;
                    return (
                    <div key={item.id} style={{ marginBottom: 36 }}>
                      {/* Cover letter question + draft */}
                      <div style={{ padding: "12px 16px", borderRadius: 12, background: `rgba(107,142,255,0.06)`, border: `1px solid rgba(107,142,255,0.15)`, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BLUE }}>문항 {idx + 1}</p>
                          {notStarted ? (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 8px" }}>미시작</span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 600, color: dropped ? "rgb(248,113,113)" : "rgba(74,222,128,0.85)", background: dropped ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", borderRadius: 6, padding: "2px 8px", border: `1px solid ${dropped ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.2)"}` }}>
                              {dropped ? `⚠ 중간 이탈 · ` : "✓ "}질문 {aiMsgs}개 · 답변 {userMsgs}개
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", marginBottom: 8, lineHeight: 1.55 }}>{item.question}</p>
                        {item.draft && (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{item.draft}</p>
                        )}
                      </div>

                      {/* 시작/완성 시간 */}
                      {firstMsg && endTime && durationMin !== null && (
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                          <span>시작 {fmtTime(firstMsg.created_at)}</span>
                          <span style={{ color: "rgba(255,255,255,0.15)" }}>→</span>
                          <span>완성 {fmtTime(endTime)}</span>
                          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{durationMin}분</span>
                        </div>
                      )}

                      {/* Chat messages */}
                      {item.messages
                        .sort((a, b) => a.created_at.localeCompare(b.created_at))
                        .map((msg) => (
                          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                            <div style={{ maxWidth: "80%", padding: "11px 16px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? ACCENT : "rgba(255,255,255,0.09)", borderLeft: msg.role === "assistant" ? `2px solid ${BLUE}50` : undefined, borderRight: msg.role === "user" ? undefined : undefined, fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                              {msg.role === "assistant" ? stripMsg(msg.content) : msg.content}
                            </div>
                          </div>
                        ))}

                      {/* 완성본 재생성 버튼 */}
                      {item.messages.some(m => m.role === "assistant" && m.content.includes("[수정본]")) && (
                        <button
                          onClick={() => regenCoverLetter(item)}
                          disabled={!!regenItemId}
                          style={{ marginTop: 10, marginBottom: 6, width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: regenItemId ? "default" : "pointer", border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.07)", color: "rgba(255,209,102,0.75)", opacity: regenItemId ? 0.5 : 1 }}
                        >
                          {regenItemId === item.id ? "재생성 중..." : "🔄 완성본 재생성"}
                        </button>
                      )}

                      {/* Interview questions */}
                      {item.interview_questions.length > 0 && (
                        <div style={{ marginTop: 18 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: VIOLET, marginBottom: 10 }}>면접 예상 질문</p>
                          {item.interview_questions
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((q) => (
                              <div key={q.id} style={{ marginBottom: 10, padding: "14px 16px", borderRadius: 12, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: q.interview_answers.length ? 12 : 0, lineHeight: 1.65, wordBreak: "keep-all" }}>{q.question}</p>
                                {q.interview_answers.map((a, i) => (
                                  <div key={i} style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, lineHeight: 1.7, wordBreak: "keep-all" }}>
                                      <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>유저: </span>{a.user_answer}
                                    </p>
                                    <p style={{ fontSize: 13, color: `rgba(107,142,255,0.85)`, lineHeight: 1.7, wordBreak: "keep-all" }}>
                                      <span style={{ fontWeight: 600 }}>AI: </span>{a.ai_feedback}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>

                {/* Comment history */}
                {(() => {
                  const revs = sessions.find(s => s.id === selectedId)?.admin_reviews || [];
                  if (revs.length === 0) return null;
                  return (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, maxHeight: 220, overflowY: "auto", background: "rgba(9,9,22,0.5)" }}>
                      <div style={{ padding: "10px 20px 0", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>코멘트 기록</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{revs.length}개</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(74,222,128,0.6)", fontWeight: 600 }}>
                          👍 {revs.filter(r => r.rating === "good").length}
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(248,113,113,0.6)", fontWeight: 600 }}>
                          👎 {revs.filter(r => r.rating === "bad").length}
                        </span>
                      </div>
                      <div style={{ padding: "8px 20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {revs.map((rev, i) => (
                          <div key={rev.id || i} style={{
                            padding: "9px 12px",
                            borderRadius: 10,
                            background: rev.rating === "good" ? "rgba(74,222,128,0.06)" : rev.rating === "bad" ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${rev.rating === "good" ? "rgba(74,222,128,0.18)" : rev.rating === "bad" ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.07)"}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: rev.comment ? 5 : 0 }}>
                              {rev.rating === "good" && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "rgba(74,222,128,0.9)", flexShrink: 0 }}>👍 Good</span>
                              )}
                              {rev.rating === "bad" && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "rgba(248,113,113,0.9)", flexShrink: 0 }}>👎 Bad</span>
                              )}
                              {!rev.rating && (
                                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 5, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>메모</span>
                              )}
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginLeft: "auto", flexShrink: 0 }}>
                                {rev.created_at ? new Date(rev.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                            </div>
                            {rev.comment && (
                              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{rev.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Rating + comment footer */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(9,9,22,0.85)", backdropFilter: "blur(8px)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                    <button onClick={() => setRating((r) => (r === "good" ? null : "good"))} style={{ padding: "6px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${rating === "good" ? "rgba(74,222,128,0.45)" : "rgba(255,255,255,0.1)"}`, background: rating === "good" ? "rgba(74,222,128,0.12)" : "transparent", color: rating === "good" ? GREEN : "rgba(255,255,255,0.38)", transition: "all 0.15s" }}>
                      👍 Good
                    </button>
                    <button onClick={() => setRating((r) => (r === "bad" ? null : "bad"))} style={{ padding: "6px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${rating === "bad" ? "rgba(248,113,113,0.45)" : "rgba(255,255,255,0.1)"}`, background: rating === "bad" ? "rgba(248,113,113,0.12)" : "transparent", color: rating === "bad" ? RED : "rgba(255,255,255,0.38)", transition: "all 0.15s" }}>
                      👎 Bad
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={saveReview} disabled={saving || (!rating && !comment.trim())} style={{ padding: "6px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: (saving || (!rating && !comment.trim())) ? "default" : "pointer", border: "none", background: saved ? "rgba(74,222,128,0.2)" : ACCENT, color: saved ? GREEN : "#fff", opacity: (saving || (!rating && !comment.trim())) ? 0.45 : 1, transition: "all 0.15s" }}>
                      {saving ? "저장 중…" : saved ? "저장됨 ✓" : "저장"}
                    </button>
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="코멘트 (패턴 메모, 프롬프트 개선 포인트 등)" rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, fontSize: 12, lineHeight: 1.65, resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── NOTES ─── */}
      {tab === "notes" && (
        <div className="admin-tab-content" style={{ padding: "24px", maxWidth: 1000, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>프롬프트 개선 노트</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                대화 리뷰에서 발견한 패턴을 섹션별로 기록하세요. 다음 프롬프트 수정 시 바로 참고할 수 있어요.
              </p>
            </div>
            <button onClick={saveNotes} disabled={notesSaving} style={{ flexShrink: 0, padding: "8px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: notesSaving ? "default" : "pointer", border: "none", background: notesSaved ? "rgba(74,222,128,0.2)" : ACCENT, color: notesSaved ? GREEN : "#fff", opacity: notesSaving ? 0.6 : 1, transition: "all 0.15s" }}>
              {notesSaving ? "저장 중…" : notesSaved ? "저장됨 ✓" : "저장"}
            </button>
          </div>

          {/* Good / Bad 2-column */}
          <div className="admin-notes-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Good */}
            <div style={{ borderRadius: 16, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(74,222,128,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>👍</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>Good 패턴</p>
                <span style={{ fontSize: 11, color: "rgba(74,222,128,0.4)", marginLeft: "auto" }}>잘 작동하는 것들</span>
              </div>
              <textarea
                value={goodNotes}
                onChange={(e) => setGoodNotes(e.target.value)}
                placeholder={"- 경험이 구체적일 때 AI가 연결고리 질문을 잘 꺼냄\n- 수치/결과가 있는 경험에서 탁월함\n- 유저가 직무 맥락을 잘 설명할 때"}
                style={{ width: "100%", minHeight: 220, padding: "14px 16px", fontSize: 12, lineHeight: 1.8, resize: "vertical", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Bad */}
            <div style={{ borderRadius: 16, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(248,113,113,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>👎</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: RED }}>Bad 패턴</p>
                <span style={{ fontSize: 11, color: "rgba(248,113,113,0.4)", marginLeft: "auto" }}>개선이 필요한 것들</span>
              </div>
              <textarea
                value={badNotes}
                onChange={(e) => setBadNotes(e.target.value)}
                placeholder={"- 추상적 경험에서 AI가 너무 직접적으로 지적함\n- 직무 관련성 낮을 때 엉뚱한 방향으로 탐색\n- 짧은 초안에서 질문이 너무 많아짐"}
                style={{ width: "100%", minHeight: 220, padding: "14px 16px", fontSize: 12, lineHeight: 1.8, resize: "vertical", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Improvement — full width */}
          <div style={{ borderRadius: 16, border: "1px solid rgba(107,142,255,0.2)", background: "rgba(107,142,255,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(107,142,255,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>다음 프롬프트 수정 방향</p>
              <span style={{ fontSize: 11, color: "rgba(107,142,255,0.4)", marginLeft: "auto" }}>Bad 패턴을 어떻게 고칠지</span>
            </div>
            <textarea
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              placeholder={"- 추상 경험 → 먼저 공감 후 구체화 유도로 변경\n- 직무 키워드 매칭 강화 → JD 키워드를 프롬프트에 동적 삽입\n- 짧은 초안 감지 → 질문 1개로 제한하는 조건 추가"}
              style={{ width: "100%", minHeight: 140, padding: "14px 16px", fontSize: 12, lineHeight: 1.8, resize: "vertical", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      )}

      {/* ─── USERS ─── */}
      {tab === "users" && (
        <div className="admin-users-container" style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>유저 뱃지 관리</p>
                {users.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2px 9px" }}>
                    총 {users.length}명
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>가입일 최신순 · 뱃지 지급 및 차감</p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: usersLoading ? "default" : "pointer", border: "1px solid rgba(255,255,255,0.1)", background: usersLoading ? "rgba(255,255,255,0.04)" : "transparent", color: usersLoading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}
            >
              {usersLoading ? "로딩 중..." : "새로고침"}
            </button>
          </div>

          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
            {/* Header row */}
            <div className="admin-users-header" style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 90px auto 44px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>이메일 / 가입일</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>뱃지</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", paddingRight: 12 }}>수량 입력 후 지급 / 차감</span>
              <span />
            </div>

            {users.length === 0 ? (
              <p style={{ padding: "24px 18px", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>유저 없음</p>
            ) : users.map(u => (
              <div key={u.id} className="admin-users-row" style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 90px auto 44px", gap: 0, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <div className="admin-users-info" style={{ paddingRight: 12, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                  {u.created_at && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                      가입 {u.created_at.slice(0, 10)}
                    </p>
                  )}
                </div>
                <p className="admin-users-badge" style={{ fontSize: 17, fontWeight: 700, color: u.credits > 0 ? "rgba(255,209,102,0.9)" : "rgba(255,255,255,0.25)", textAlign: "center" }}>
                  🏅 {u.credits}
                </p>
                <div className="admin-users-controls" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <input
                    type="number"
                    min={1}
                    value={creditInputs[u.id] || ""}
                    onChange={e => setCreditInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                    placeholder="수량"
                    style={{ width: 60, padding: "6px 8px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.9)", outline: "none", textAlign: "center" }}
                  />
                  <button
                    onClick={() => adjustCredit(u.id, 1)}
                    disabled={!creditInputs[u.id] || grantingId === u.id}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: grantedId === u.id ? "rgba(74,222,128,0.2)" : ACCENT, color: grantedId === u.id ? GREEN : "#fff", opacity: (!creditInputs[u.id] || grantingId === u.id) ? 0.4 : 1, transition: "all 0.15s" }}
                  >
                    {grantingId === u.id ? "..." : grantedId === u.id ? "완료 ✓" : "지급"}
                  </button>
                  <button
                    onClick={() => adjustCredit(u.id, -1)}
                    disabled={!creditInputs[u.id] || grantingId === u.id || u.credits <= 0}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid rgba(248,113,113,0.3)`, background: "rgba(248,113,113,0.1)", color: "rgba(248,113,113,0.9)", opacity: (!creditInputs[u.id] || grantingId === u.id || u.credits <= 0) ? 0.35 : 1, transition: "all 0.15s" }}
                  >
                    차감
                  </button>
                </div>
                <div className="admin-users-delete" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                    title="계정 삭제"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.07)", color: "rgba(248,113,113,0.6)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FUNNEL / 통계 ─── */}
      {tab === "funnel" && (
        <div className="admin-tab-content" style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>완주율 퍼널</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>가입 → 완주까지 각 단계별 이탈 현황</p>
            </div>
            <button onClick={fetchFunnel} disabled={funnelLoading} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: funnelLoading ? "default" : "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: funnelLoading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}>
              {funnelLoading ? "로딩 중..." : "새로고침"}
            </button>
          </div>

          {funnelLoading && !funnelData ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : funnelData ? (() => {
            const stagePalette: Record<number, { color: string; bg: string; bar: string }> = {
              0: { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)",  bar: "rgba(255,255,255,0.2)" },
              1: { color: BLUE,                    bg: "rgba(107,142,255,0.15)",   bar: BLUE },
              2: { color: "rgba(255,165,0,0.85)",  bg: "rgba(255,165,0,0.12)",    bar: "rgba(255,165,0,0.7)" },
              3: { color: VIOLET,                  bg: "rgba(167,139,250,0.15)",   bar: VIOLET },
              4: { color: GREEN,                   bg: "rgba(74,222,128,0.15)",    bar: GREEN },
            };
            return (
              <>
                {/* ── 퍼널 차트 ── */}
                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>완주율 퍼널</p>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>총 {funnelData.totalUsers}명 기준</span>
                  </div>
                  <div style={{ padding: "8px 20px 18px" }}>
                    {funnelData.stages.map((stage, i) => {
                      const c = stagePalette[i];
                      const isLast = i === funnelData.stages.length - 1;
                      return (
                        <div key={stage.label} style={{ paddingTop: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: c.color, background: c.bg, borderRadius: 6, padding: "3px 10px" }}>{stage.label}</span>
                              {!isLast && stage.dropCount > 0 && (
                                <span style={{ fontSize: 11, color: "rgba(248,113,113,0.6)" }}>여기서 멈춤 {stage.dropCount}명</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: c.color, letterSpacing: "-0.03em" }}>{stage.count}명</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>{stage.pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${stage.pct}%`, background: c.bar, borderRadius: 4, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── 이탈 원인 분석 ── */}
                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>이탈 원인 분석</p>
                  </div>
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {(() => {
                      const reasons = [
                        { key: "not_started", label: "분석 전 이탈",   sub: "분석하기 버튼 미클릭",              color: "rgba(255,255,255,0.28)",  bg: "rgba(255,255,255,0.05)" },
                        { key: "no_digging",  label: "디깅 미완주",    sub: "분석 시작 후 Q/A 완료 못 함",       color: BLUE,                      bg: "rgba(107,142,255,0.1)" },
                        { key: "no_revision", label: "최종본 미확인",  sub: "디깅 완주 후 최종본 요청 안 함",     color: "rgba(255,165,0,0.85)",    bg: "rgba(255,165,0,0.08)" },
                        { key: "no_interview",label: "면접 미진행",    sub: "최종본 확인 후 예상질문 안 함",      color: VIOLET,                    bg: "rgba(167,139,250,0.1)" },
                        { key: "complete",    label: "완주",           sub: "예상질문까지 진행 완료",             color: GREEN,                     bg: "rgba(74,222,128,0.1)" },
                      ];
                      const total = funnelData.users.length;
                      return reasons.map(r => {
                        const count = funnelData.users.filter(u => u.dropReason === r.key).length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={r.key}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: r.color, background: r.bg, borderRadius: 6, padding: "2px 9px", whiteSpace: "nowrap" }}>{r.label}</span>
                                <span className="admin-funnel-analysis-sub" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{r.sub}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
                                <span style={{ fontSize: 17, fontWeight: 800, color: r.color, letterSpacing: "-0.02em" }}>{count}</span>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>{pct}%</span>
                              </div>
                            </div>
                            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: r.color, borderRadius: 3, transition: "width 0.6s ease", opacity: 0.65 }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* ── 유저별 상세 ── */}
                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                  <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>유저별 상세</p>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>최신 가입 순</span>
                  </div>
                  <div className="admin-funnel-table-header" style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 1fr", padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["가입일", "이메일", "완성본", "예상Q", "단계"].map((h, hi) => (
                      <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: hi === 0 ? "left" : "center" }}>{h}</span>
                    ))}
                  </div>
                  {funnelData.users.length === 0 ? (
                    <p style={{ padding: 20, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>유저 없음</p>
                  ) : funnelData.users.map((u, idx) => {
                    const c = stagePalette[u.stageIndex];
                    const hasRevision = u.stageIndex >= 3;
                    const inProgress = !hasRevision && u.diggingAsked > 0;
                    const hasInterview = u.interviewTotal > 0;
                    const allDone = hasInterview && u.interviewAnswered === u.interviewTotal;
                    return (
                      <div key={u.userId} className="admin-funnel-user-row" style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: idx < funnelData.users.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", alignItems: "center" }}>
                        <span className="admin-funnel-cell-date" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{u.createdAt.slice(0, 10)}</span>
                        <span className="admin-funnel-cell-email" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{u.email}</span>
                        <div className="admin-funnel-cell-revision" style={{ display: "flex", justifyContent: "center" }}>
                          {hasRevision ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.9)", background: "rgba(74,222,128,0.1)", borderRadius: 6, padding: "3px 10px" }}>완료</span>
                          ) : inProgress ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(107,142,255,0.9)", background: "rgba(107,142,255,0.1)", borderRadius: 6, padding: "3px 10px" }}>진행중</span>
                          ) : (
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.18)" }}>—</span>
                          )}
                        </div>
                        <div className="admin-funnel-cell-interview" style={{ display: "flex", justifyContent: "center" }}>
                          {hasInterview ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? GREEN : "rgba(255,255,255,0.45)", background: allDone ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 10px" }}>
                              {u.interviewAnswered}/{u.interviewTotal}
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.18)" }}>—</span>
                          )}
                        </div>
                        <div className="admin-funnel-cell-stage" style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.color, background: c.bg, borderRadius: 6, padding: "3px 12px", whiteSpace: "nowrap" }}>
                            {u.stageIndex === 3 ? "✓ 완주" : u.stageLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })() : null}
        </div>
      )}

      {/* 세션 삭제 확인 모달 */}
      {deleteSessionTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => !deletingSessionId && setDeleteSessionTarget(null)}>
          <div style={{ background: "#18182A", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 20 }}>🗑️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 12, marginBottom: 8 }}>이 세션을 삭제할까요?</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{deleteSessionTarget.jobTitle}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24, wordBreak: "keep-all" }}>대화 기록, 수정본, 면접 Q&A가 모두 삭제되며 복구할 수 없어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteSessionTarget(null)}
                disabled={!!deletingSessionId}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteSession(deleteSessionTarget.id)}
                disabled={!!deletingSessionId}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", color: "rgb(248,113,113)", fontSize: 14, fontWeight: 700, cursor: deletingSessionId ? "default" : "pointer", opacity: deletingSessionId ? 0.6 : 1 }}
              >
                {deletingSessionId ? "삭제 중..." : "삭제 확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOARD ─── */}
      {tab === "board" && (() => {
        const NEWS_CH = ["경제", "기술", "사회", "글로벌"];
        interface BCNode { name: string; children?: string[] }
        const BTREE: BCNode[] = [
          { name: "공지·업데이트" },
          { name: "──" },
          { name: "쥔장 잡담" }, { name: "자소서 팁" }, { name: "면접 팁" },
          { name: "뉴스", children: NEWS_CH },
          { name: "쥔장에게 묻고 바란다" },
        ];
        function bCount(cat: string) {
          if (cat === "전체") return boardPosts.length;
          if (cat === "뉴스") return boardPosts.filter(p => ["뉴스", ...NEWS_CH].includes(p.category)).length;
          return boardPosts.filter(p => p.category === cat).length;
        }
        function bFilter(cat: string) {
          if (cat === "전체") return boardPosts;
          if (cat === "뉴스") return boardPosts.filter(p => ["뉴스", ...NEWS_CH].includes(p.category));
          return boardPosts.filter(p => p.category === cat);
        }
        const visiblePosts = bFilter(boardCategory);

        return (
        <>
        <div className="admin-board-wrap" style={{ display: "flex", height: "calc(100vh - 56px)" }}>
          {/* 사이드바 (모바일 숨김) */}
          <aside className="admin-board-sidebar" style={{ width: 192, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, overflowY: "auto" }}>
            {/* 전체 */}
            <button onClick={() => setBoardCategory("전체")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: boardCategory === "전체" ? "rgba(255,255,255,0.06)" : "transparent", border: "none", borderLeft: `3px solid ${boardCategory === "전체" ? ACCENT : "transparent"}`, color: boardCategory === "전체" ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.48)", fontSize: 15, fontWeight: boardCategory === "전체" ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              <span>전체</span><span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginLeft: 6 }}>{boardPosts.length}</span>
            </button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 14px" }} />
            {BTREE.map(node =>
              node.name === "──"
                ? <div key="sep2" style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 14px" }} />
                : (
                  <div key={node.name}>
                    <button onClick={() => setBoardCategory(node.name)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: boardCategory === node.name ? "rgba(255,255,255,0.06)" : "transparent", border: "none", borderLeft: `3px solid ${boardCategory === node.name ? ACCENT : "transparent"}`, color: boardCategory === node.name ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.48)", fontSize: node.name === "쥔장에게 묻고 바란다" ? 13 : 15, fontWeight: boardCategory === node.name ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      <span>{node.name}</span>{bCount(node.name) > 0 && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginLeft: 6 }}>{bCount(node.name)}</span>}
                    </button>
                    {node.children?.map(child => (
                      <button key={child} onClick={() => setBoardCategory(child)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px 11px 28px", background: boardCategory === child ? "rgba(255,255,255,0.05)" : "transparent", border: "none", borderLeft: `3px solid ${boardCategory === child ? ACCENT : "transparent"}`, color: boardCategory === child ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)", fontSize: 13, fontWeight: boardCategory === child ? 600 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        <span>{child}</span>{bCount(child) > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginLeft: 6 }}>{bCount(child)}</span>}
                      </button>
                    ))}
                  </div>
                )
            )}
          </aside>

          {/* 우측 메인 */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* 모바일 카테고리 셀렉트 */}
            <div className="admin-board-cat-select" style={{ display: "none", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <select value={boardCategory} onChange={e => setBoardCategory(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a2e", color: "rgba(255,255,255,0.85)", fontSize: 15, fontFamily: "inherit" }}>
                {["전체","공지·업데이트","쥔장 잡담","자소서 팁","면접 팁","뉴스","경제","기술","사회","글로벌","쥔장에게 묻고 바란다"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* 액션 바 */}
            <div className="admin-board-action-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <div className="admin-board-action-left" style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{boardCategory}</span>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }}>{visiblePosts.length}개</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: boardVisible ? GREEN : "rgba(255,255,255,0.32)", marginLeft: 6 }}>
                  {boardVisible ? "● 공개 중" : "○ 비공개"}
                </span>
                <button onClick={toggleBoardVisible} disabled={boardVisibleSaving} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontFamily: "inherit" }}>
                  {boardVisible ? "비공개로" : "공개로"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={fetchBoard} disabled={boardPostsLoading} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontFamily: "inherit" }}>새로고침</button>
                <button onClick={() => setWriteOpen(v => !v)} style={{ padding: "7px 20px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", border: `1px solid ${ACCENT}66`, background: `${ACCENT}1a`, color: ACCENT, fontFamily: "inherit" }}>
                  {writeOpen ? "취소" : "+ 글쓰기"}
                </button>
              </div>
            </div>

            {/* 글쓰기 폼 */}
            {writeOpen && (
              <div className="admin-board-write-form" style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: `${ACCENT}08`, flexShrink: 0 }}>
                <div className="admin-board-write-top" style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <select value={writeCategory} onChange={e => setWriteCategory(e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a2e", color: "rgba(255,255,255,0.8)", fontSize: 15, fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}>
                    {["쥔장 잡담","자소서 팁","면접 팁","공지·업데이트","뉴스","경제","기술","사회","글로벌","쥔장에게 묻고 바란다"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder="제목"
                    style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a2e", color: "rgba(255,255,255,0.88)", fontSize: 16, fontFamily: "inherit", outline: "none" }} />
                </div>
                <textarea value={writeContent} onChange={e => setWriteContent(e.target.value)} placeholder="본문" rows={6}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#1a1a2e", color: "rgba(255,255,255,0.82)", fontSize: 15, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.75 }} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button onClick={submitPost} disabled={writeSaving || !writeTitle.trim() || !writeContent.trim()}
                    style={{ padding: "9px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", border: `1px solid ${ACCENT}88`, background: `${ACCENT}2a`, color: ACCENT, fontFamily: "inherit", opacity: writeSaving || !writeTitle.trim() || !writeContent.trim() ? 0.45 : 1 }}>
                    {writeSaving ? "등록 중..." : "등록"}
                  </button>
                </div>
              </div>
            )}

            {/* 글 목록 */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {boardPostsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : visiblePosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.28)", fontSize: 16 }}>글이 없어요</div>
              ) : (
                <>
                  <div className="admin-board-header-row" style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px 96px 156px", padding: "10px 28px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["제목", "카테고리", "날짜", "상태", ""].map(h => (
                      <span key={h} style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>{h}</span>
                    ))}
                  </div>
                  {visiblePosts.map((post, i, arr) => (
                    <div
                      key={post.id}
                      className="admin-board-item-row"
                      onClick={() => openViewPost(post)}
                      style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px 96px 156px", padding: "15px 28px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="admin-board-item-title" style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16, display: "flex", alignItems: "center", gap: 6 }}>
                        {post.is_pinned && <span style={{ fontSize: 13, flexShrink: 0 }}>📌</span>}
                        {post.title || <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>(제목 없음)</span>}
                      </span>
                      <div className="admin-board-item-meta" style={{ display: "contents" }}>
                        <span style={{ fontSize: 13, padding: "3px 10px", borderRadius: 20, background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT, fontWeight: 600, justifySelf: "start", whiteSpace: "nowrap" }}>{post.category}</span>
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap" }}>{new Date(post.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: post.is_published ? GREEN : "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{post.is_published ? "공개" : "비공개"}</span>
                      </div>
                      <div className="admin-board-item-actions" onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => togglePostPublish(post.id, post.is_published)}
                          style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", border: post.is_published ? `1px solid ${GREEN}55` : "1px solid rgba(255,255,255,0.15)", background: post.is_published ? `${GREEN}18` : "rgba(255,255,255,0.07)", color: post.is_published ? GREEN : "rgba(255,255,255,0.5)", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          {post.is_published ? "비공개로" : "공개로"}
                        </button>
                        <button onClick={() => deletePost(post.id)}
                          style={{ padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${RED}44`, background: "transparent", color: `${RED}cc`, whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 게시글 상세 / 수정 모달 ── */}
        {viewPost && (
          <div
            className="admin-board-modal-backdrop"
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
            onClick={() => { setViewPost(null); setEditMode(false); }}
          >
            <div
              className="admin-board-modal-panel"
              style={{ background: "#18182A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "24px 24px 20px", maxWidth: 700, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: 14 }}
              onClick={e => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editMode ? (
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "inherit", outline: "none" }}
                    />
                  ) : (
                    <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.4, wordBreak: "keep-all" }}>{viewPost.title || "(제목 없음)"}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    {editMode ? (
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "inherit", cursor: "pointer" }}
                      >
                        {["쥔장 잡담","자소서 팁","면접 팁","공지·업데이트","경제","기술","사회","글로벌","쥔장에게 묻고 바란다"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT }}>{viewPost.category}</span>
                    )}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(viewPost.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: viewPost.is_published ? GREEN : "rgba(255,255,255,0.35)" }}>
                      {viewPost.is_published ? "공개" : "임시저장"}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setViewPost(null); setEditMode(false); }} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>

              {/* 본문 */}
              <div style={{ flex: 1, overflowY: "auto", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 18px" }}>
                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{ width: "100%", minHeight: 320, background: "transparent", border: "none", outline: "none", fontSize: 14, lineHeight: 2, color: "rgba(255,255,255,0.78)", whiteSpace: "pre-wrap", wordBreak: "keep-all", resize: "vertical" }}
                  />
                ) : (
                  <p style={{ fontSize: 14, lineHeight: 2, color: "rgba(255,255,255,0.78)", whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{viewPost.content}</p>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="admin-board-modal-actions" style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* 고정 버튼 (수정 모드 아닐 때만 표시) */}
                  {!editMode && (
                    <button
                      onClick={() => { togglePostPin(viewPost.id, viewPost.is_pinned); setViewPost(p => p ? { ...p, is_pinned: !p.is_pinned } : null); }}
                      style={{ padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: viewPost.is_pinned ? "1px solid rgba(255,200,0,0.5)" : "1px solid rgba(255,255,255,0.12)", background: viewPost.is_pinned ? "rgba(255,200,0,0.12)" : "rgba(255,255,255,0.05)", color: viewPost.is_pinned ? "#FFD166" : "rgba(255,255,255,0.45)", fontFamily: "inherit" }}
                    >
                      {viewPost.is_pinned ? "📌 고정 해제" : "📌 고정"}
                    </button>
                  )}
                  {editMode ? (
                    <>
                      <button onClick={savePostEdit} disabled={editSaving}
                        style={{ padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: BLUE, border: "none", color: "#fff", fontFamily: "inherit", opacity: editSaving ? 0.6 : 1 }}>
                        {editSaving ? "저장 중..." : "저장"}
                      </button>
                      <button onClick={() => setEditMode(false)}
                        style={{ padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontFamily: "inherit" }}>
                        취소
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditMode(true)}
                      style={{ padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontFamily: "inherit" }}>
                      수정
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { togglePostPublish(viewPost.id, viewPost.is_published); setViewPost(p => p ? { ...p, is_published: !p.is_published } : null); }}
                    style={{ padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: viewPost.is_published ? `1px solid ${GREEN}55` : `1px solid ${ACCENT}55`, background: viewPost.is_published ? `${GREEN}18` : `${ACCENT}18`, color: viewPost.is_published ? GREEN : ACCENT, fontFamily: "inherit" }}
                  >
                    {viewPost.is_published ? "비공개로" : "공개로 발행"}
                  </button>
                  <button
                    onClick={() => { deletePost(viewPost.id); setViewPost(null); }}
                    style={{ padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${RED}44`, background: "transparent", color: `${RED}cc`, fontFamily: "inherit" }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        );
      })()}

      {/* 유저 삭제 확인 모달 */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => !deletingUserId && setDeleteTarget(null)}>
          <div style={{ background: "#18182A", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 20 }}>🗑️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 12, marginBottom: 8 }}>정말 삭제하시겠어요?</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6, wordBreak: "break-all" }}>{deleteTarget.email}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>계정과 모든 데이터가 삭제되며 복구할 수 없어요.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={!!deletingUserId}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteUser(deleteTarget.id)}
                disabled={!!deletingUserId}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", color: "rgb(248,113,113)", fontSize: 14, fontWeight: 700, cursor: deletingUserId ? "default" : "pointer", opacity: deletingUserId ? 0.6 : 1 }}
              >
                {deletingUserId ? "삭제 중..." : "삭제 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
