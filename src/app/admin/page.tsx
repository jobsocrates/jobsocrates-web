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

type Tab = "dashboard" | "review" | "notes" | "users";
type Filter = "all" | "good" | "bad" | "none";

interface SessionItem {
  id: string;
  job_title: string;
  created_at: string;
  user_id: string;
  profiles?: { email: string } | null;
  admin_reviews: { id?: string; rating: string | null; comment: string }[];
}

interface CoverItemFull {
  id: string;
  question: string;
  draft: string;
  status: string;
  order_index: number;
  messages: { id: string; role: string; content: string; created_at: string }[];
  interview_questions: {
    id: string;
    question: string;
    order_index: number;
    interview_answers: { user_answer: string; ai_feedback: string }[];
  }[];
}

interface UserProfile { id: string; email: string; credits: number; created_at?: string; }
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
    const { data, error } = await supabase
      .from("sessions")
      .select("id, job_title, created_at, user_id, profiles(email), admin_reviews(id, rating, comment)")
      .order("created_at", { ascending: false });
    if (error) console.error("[Admin] fetchSessions error:", error);
    console.log("[Admin] sessions fetched:", data?.length, data);
    setSessions((data as unknown as SessionItem[]) || []);
    setSessionsLoading(false);
  }

  async function selectSession(id: string) {
    if (selectedId === id) return;
    setSelectedId(id);
    const s = sessions.find((x) => x.id === id);
    const rev = s?.admin_reviews?.[0];
    setRating((rev?.rating as "good" | "bad" | null) || null);
    setComment(rev?.comment || "");
    setSaved(false);

    setDetailLoading(true);
    setCoverItems([]);
    const { data } = await supabase
      .from("cover_items")
      .select(
        "id, question, draft, status, order_index, messages(id, role, content, created_at), interview_questions(id, question, order_index, interview_answers(user_answer, ai_feedback))"
      )
      .eq("session_id", id)
      .order("order_index");
    setCoverItems((data as unknown as CoverItemFull[]) || []);
    setDetailLoading(false);
  }

  async function saveReview() {
    if (!selectedId) return;
    setSaving(true);
    await supabase
      .from("admin_reviews")
      .upsert({ session_id: selectedId, rating, comment, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
    await fetchSessions();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        @media (max-width: 640px) {
          .admin-stat-grid { grid-template-columns: 1fr !important; }
          .admin-notes-grid { grid-template-columns: 1fr !important; }
          .admin-review-left { width: 100% !important; min-width: 0 !important; }
          .has-selection .admin-review-left { display: none !important; }
          .admin-review-right { width: 100%; }
          .admin-review-empty { display: none !important; }
          .admin-mobile-back { display: flex; }
        }
      `}</style>

      {/* Header */}
      <header style={{ height: 56, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(13,13,24,0.98)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Admin</span>

        <nav style={{ display: "flex", gap: 4 }}>
          {(["dashboard", "review", "notes", "users"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: tab === t ? 700 : 500, border: tab === t ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent", cursor: "pointer", transition: "all 0.15s", background: tab === t ? "rgba(255,255,255,0.1)" : "transparent", color: tab === t ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)" }}>
              {t === "dashboard" ? "대시보드" : t === "review" ? "대화 리뷰" : t === "notes" ? "프롬프트 노트" : "유저 관리"}
            </button>
          ))}
        </nav>

        <a href="/" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          홈
        </a>
      </header>

      {/* ─── DASHBOARD ─── */}
      {tab === "dashboard" && (
        <div style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>

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
        <div className={selectedId ? "has-selection" : ""} style={{ display: "flex", height: "calc(100vh - 52px)" }}>
          {/* Left panel: session list */}
          <div className="admin-review-left" style={{ width: 272, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Filters */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(["all", "good", "bad", "none"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 11px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", transition: "all 0.15s", background: filter === f ? "rgba(255,255,255,0.1)" : "transparent", color: filter === f ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                  {f === "all" ? `전체 (${sessions.length})` : f === "good" ? "👍 Good" : f === "bad" ? "👎 Bad" : "미평가"}
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
                  <div key={s.id} onClick={() => selectSession(s.id)} style={{ padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSelected ? "rgba(255,255,255,0.07)" : "transparent", transition: "background 0.12s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      {rev?.rating === "good" && <span style={{ fontSize: 10, lineHeight: 1 }}>👍</span>}
                      {rev?.rating === "bad" && <span style={{ fontSize: 10, lineHeight: 1 }}>👎</span>}
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.82)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.job_title || "직무 미입력"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                      {(s.profiles as any)?.email || s.user_id?.slice(0, 8) || "—"}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                      {s.created_at.slice(0, 10)}
                    </p>
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
                <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
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

                {/* Conversation scroll area */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {detailLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.2)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
                    </div>
                  ) : coverItems.length === 0 ? (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", paddingTop: 40 }}>대화 기록이 없습니다</p>
                  ) : coverItems.map((item, idx) => (
                    <div key={item.id} style={{ marginBottom: 36 }}>
                      {/* Cover letter question + draft */}
                      <div style={{ padding: "12px 16px", borderRadius: 12, background: `rgba(107,142,255,0.06)`, border: `1px solid rgba(107,142,255,0.15)`, marginBottom: 16 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: BLUE, marginBottom: 7 }}>문항 {idx + 1}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", marginBottom: 8, lineHeight: 1.55 }}>{item.question}</p>
                        {item.draft && (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{item.draft}</p>
                        )}
                      </div>

                      {/* Chat messages */}
                      {item.messages
                        .sort((a, b) => a.created_at.localeCompare(b.created_at))
                        .map((msg) => (
                          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                            <div style={{ maxWidth: "78%", padding: "9px 14px", borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? ACCENT : "rgba(255,255,255,0.07)", fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                              {msg.role === "assistant" ? stripMsg(msg.content) : msg.content}
                            </div>
                          </div>
                        ))}

                      {/* Interview questions */}
                      {item.interview_questions.length > 0 && (
                        <div style={{ marginTop: 18 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: VIOLET, marginBottom: 10 }}>면접 예상 질문</p>
                          {item.interview_questions
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((q) => (
                              <div key={q.id} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: q.interview_answers.length ? 10 : 0 }}>{q.question}</p>
                                {q.interview_answers.map((a, i) => (
                                  <div key={i} style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                                      <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>유저: </span>{a.user_answer}
                                    </p>
                                    <p style={{ fontSize: 11, color: `rgba(107,142,255,0.8)` }}>
                                      <span style={{ fontWeight: 600 }}>AI: </span>{a.ai_feedback}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

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
                    <button onClick={saveReview} disabled={saving} style={{ padding: "6px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: saving ? "default" : "pointer", border: "none", background: saved ? "rgba(74,222,128,0.2)" : ACCENT, color: saved ? GREEN : "#fff", opacity: saving ? 0.6 : 1, transition: "all 0.15s" }}>
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
        <div style={{ padding: "24px", maxWidth: 1000, margin: "0 auto" }}>
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
        <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 90px auto 44px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>이메일 / 가입일</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>뱃지</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", paddingRight: 12 }}>수량 입력 후 지급 / 차감</span>
              <span />
            </div>

            {users.length === 0 ? (
              <p style={{ padding: "24px 18px", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>유저 없음</p>
            ) : users.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 90px auto 44px", gap: 0, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <div style={{ paddingRight: 12, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                  {u.created_at && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                      가입 {u.created_at.slice(0, 10)}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: u.credits > 0 ? "rgba(255,209,102,0.9)" : "rgba(255,255,255,0.25)", textAlign: "center" }}>
                  🏅 {u.credits}
                </p>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
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
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
