"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buildPrintHtml, stripMd, parseRevisionMsg, type SummaryMsg, type SummaryInterviewQ } from "@/components/CoverLetterSummary";
import { TutorialModal } from "@/components/TutorialModal";

const PAGE_BG = "#F5F6F8";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const NAVY = "#1A3461";
const INDIGO = "#312E81";
const INDIGO_LT = "#6366F1";
const VIOLET = "#A78BFA";
const INK = "#111827";
const SUB = "#6B7280";
const FAINT = "#9CA3AF";
const GREEN = "#16A34A";
const GOLD = "#C99700";
const RED = "#DC2626";
const GRAD = "linear-gradient(135deg, #1A3461 0%, #312E81 100%)";

interface Transaction {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface CoverItemRecord {
  id: string;
  question: string;
  status: string;
  messages?: { id: string; role: string; content?: string }[];
  revisions?: { id: string }[];
  interview_questions?: { id: string; interview_answers?: { id: string }[] }[];
}

interface SessionRecord {
  id: string;
  job_title: string;
  created_at: string;
  cover_items: CoverItemRecord[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function MyPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // 비밀번호 변경
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // 회원탈퇴
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deletePwError, setDeletePwError] = useState("");

  // 검색 + 인라인 미리보기 + 복사
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, { revision: string; subtitle: string }>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      setUser({ id: data.user.id, email: data.user.email ?? "" });

      const [{ data: profile }, { data: txns }, { data: sessionData }] = await Promise.all([
        supabase.from("profiles").select("credits").eq("id", data.user.id).single(),
        supabase.from("credit_transactions")
          .select("id, amount, reason, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("sessions")
          .select("id, job_title, analysis_report, created_at, cover_items(id, question, status, messages(id, role, content), revisions(id), interview_questions(id, interview_answers(id)))")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setCredits(profile?.credits ?? 0);
      setTransactions(txns || []);
      setSessions((sessionData as unknown as SessionRecord[]) || []);
      setLoading(false);
    });
  }, []);

  async function buildItemReport(item: CoverItemRecord) {
    const [{ data: msgRows }, { data: revRows }, { data: iqRows }] = await Promise.all([
      supabase.from("messages")
        .select("id, role, content, created_at")
        .eq("cover_item_id", item.id)
        .order("created_at", { ascending: true }),
      supabase.from("revisions")
        .select("content, changes")
        .eq("cover_item_id", item.id)
        .limit(1)
        .maybeSingle(),
      supabase.from("interview_questions")
        .select("question, order_index, interview_answers(user_answer, ai_feedback, created_at)")
        .eq("cover_item_id", item.id)
        .order("order_index", { ascending: true }),
    ]);

    const msgs: SummaryMsg[] = (msgRows || []).map((m, i) => ({
      id: i,
      role: (m.role === "assistant" ? "bot" : "user") as "bot" | "user",
      text: m.content as string,
    }));

    const revMsgIdx = msgs.findIndex(m => m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]")));
    const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;

    let revision = "";
    let changes = "";
    let subtitle = "";
    if (revMsgIdx >= 0) subtitle = parseRevisionMsg(msgs[revMsgIdx].text).subtitle;
    if (revRows) {
      revision = (revRows.content as string) || "";
      const rawChanges = revRows.changes;
      changes = Array.isArray(rawChanges) ? rawChanges.join("\n") : String(rawChanges || "");
    } else if (revMsgIdx >= 0) {
      const parsed = parseRevisionMsg(msgs[revMsgIdx].text);
      revision = parsed.revision;
      changes = parsed.changes;
    }

    const cleanDiag = diagMsgs.map(m => {
      if (m.role === "bot" && (m.text.includes("[수정본]") || m.text.includes("[지원동기]"))) return m;
      return { ...m, text: stripMd(m.text) ? m.text : m.text };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interviewQs: SummaryInterviewQ[] = (iqRows || []).map((iq: any) => {
      const answers = [...(iq.interview_answers || [])].sort((a: any, b: any) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
      const qMsgs: SummaryMsg[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      answers.forEach((a: any, j: number) => {
        if (a.user_answer) qMsgs.push({ id: j * 2, role: "user", text: a.user_answer });
        if (a.ai_feedback) qMsgs.push({ id: j * 2 + 1, role: "bot", text: a.ai_feedback });
      });
      return { question: iq.question as string, msgs: qMsgs };
    });

    return { revision, changes, subtitle, cleanDiag, diagMsgs, interviewQs };
  }

  async function handleDownloadPdf(jobTitle: string, item: CoverItemRecord, analysisReport = "") {
    setPdfLoadingId(item.id);
    try {
      const { revision, changes, subtitle, cleanDiag, interviewQs } = await buildItemReport(item);
      const html = buildPrintHtml(jobTitle, item.question, revision, changes, cleanDiag, interviewQs, window.location.origin, analysisReport, subtitle);
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function handleViewHtml(jobTitle: string, item: CoverItemRecord, analysisReport = "") {
    setViewLoadingId(item.id);
    try {
      const { revision, changes, subtitle, diagMsgs, interviewQs } = await buildItemReport(item);
      const html = buildPrintHtml(jobTitle, item.question, revision, changes, diagMsgs, interviewQs, window.location.origin, analysisReport, subtitle);
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
    } finally {
      setViewLoadingId(null);
    }
  }

  async function handleChangePassword() {
    if (!pwNew.trim()) { setPwMsg({ text: "새 비밀번호를 입력해주세요.", ok: false }); return; }
    if (pwNew.length < 6) { setPwMsg({ text: "비밀번호는 6자 이상이어야 해요.", ok: false }); return; }
    if (pwNew !== pwConfirm) { setPwMsg({ text: "비밀번호가 일치하지 않아요.", ok: false }); return; }
    setPwLoading(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) setPwMsg({ text: error.message, ok: false });
    else { setPwMsg({ text: "비밀번호가 변경됐어요.", ok: true }); setPwNew(""); setPwConfirm(""); }
  }

  async function handleDeleteAccount() {
    if (!deletePw.trim()) { setDeletePwError("비밀번호를 입력해주세요."); return; }
    setDeleteLoading(true);
    setDeletePwError("");
    const { error } = await supabase.auth.signInWithPassword({ email: user!.email, password: deletePw });
    if (error) {
      setDeleteLoading(false);
      setDeletePwError("비밀번호가 맞지 않아요.");
      return;
    }
    if (user) await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function loadPreview(item: CoverItemRecord): Promise<{ revision: string; subtitle: string } | null> {
    if (previews[item.id]) return previews[item.id];
    setPreviewLoading(item.id);
    try {
      const [{ data: revRow }, { data: msgRows }] = await Promise.all([
        supabase.from("revisions").select("content").eq("cover_item_id", item.id).limit(1).maybeSingle(),
        supabase.from("messages").select("content, role, created_at").eq("cover_item_id", item.id).order("created_at", { ascending: true }),
      ]);
      let revision = (revRow?.content as string) || "";
      let subtitle = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revMsg = (msgRows || []).find((m: any) => m.role === "assistant" && (String(m.content).includes("[수정본]") || String(m.content).includes("[지원동기]")));
      if (revMsg) {
        const parsed = parseRevisionMsg(revMsg.content as string);
        subtitle = parsed.subtitle;
        if (!revision) revision = parsed.revision;
      }
      const data = { revision, subtitle };
      setPreviews(p => ({ ...p, [item.id]: data }));
      return data;
    } finally { setPreviewLoading(null); }
  }

  async function handleToggleExpand(item: CoverItemRecord) {
    if (expandedId === item.id) { setExpandedId(null); return; }
    setExpandedId(item.id);
    await loadPreview(item);
  }

  async function handleCopyRevision(item: CoverItemRecord) {
    const data = await loadPreview(item);
    if (data?.revision) {
      navigator.clipboard.writeText(data.revision);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  }

  if (loading) {
    return (
      <div style={{ background: PAGE_BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(49,46,129,0.18)", borderTopColor: INDIGO, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: PAGE_BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 14, color: SUB }}>로그인이 필요합니다.</p>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: INDIGO, textDecoration: "none" }}>← 홈으로</Link>
      </div>
    );
  }

  const allItems = sessions.flatMap(s => s.cover_items || []);
  const totalCompleted = allItems.filter(i => (i.revisions || []).length > 0).length;
  const CMD_MSGS = ["초안 진단을 시작해줘.", "수정본을 작성해줘.", "완성본을 작성해줘."];
  const totalDigging = allItems.reduce((acc, i) => acc + (i.messages || []).filter(m => m.role === "user" && !CMD_MSGS.includes(m.content || "")).length, 0);
  const totalInterviewDone = allItems.reduce((acc, i) => acc + (i.interview_questions || []).filter(q => (q.interview_answers || []).length > 0).length, 0);

  const q = search.trim().toLowerCase();
  const matched = q
    ? sessions.filter(s => (s.job_title || "").toLowerCase().includes(q) || (s.cover_items || []).some(i => (i.question || "").toLowerCase().includes(q)))
    : sessions;
  const visibleSessions = q ? matched : (showAllSessions ? sessions : sessions.slice(0, 3));

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", color: INK, fontFamily: "inherit" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .mp-input:focus { border-color: ${INDIGO_LT} !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }`}</style>

      {/* Header */}
      <header style={{ height: 58, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: INK, textDecoration: "none", display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: CARD, border: `1px solid ${BORDER}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          홈으로
        </Link>
        <Link href="/chat" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 11, background: GRAD, boxShadow: "0 8px 22px -10px rgba(49,46,129,0.55)" }}>
          새 자소서
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </Link>
      </header>

      {/* 뱃지 카드 */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ borderRadius: 20, border: `1px solid ${credits > 0 ? "rgba(201,151,0,0.3)" : "rgba(220,38,38,0.25)"}`, background: CARD, padding: "24px 28px", boxShadow: "0 8px 28px -16px rgba(17,24,39,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 12.5, color: SUB, marginBottom: 8 }}>{user.email}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: credits > 0 ? GOLD : RED, marginBottom: 4 }}>남은 뱃지</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: credits > 0 ? GOLD : RED, letterSpacing: "-0.03em", lineHeight: 1 }}>{credits}</span>
              <span style={{ fontSize: 18, color: credits > 0 ? "rgba(201,151,0,0.65)" : "rgba(220,38,38,0.6)" }}>개</span>
            </div>
            <p style={{ fontSize: 12, color: FAINT, marginTop: 10 }}>뱃지 1개 = 자소서 문항 1개 완성 · 분석 시작 시 차감</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#E0A82E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            <button
              onClick={() => setShowTutorial(true)}
              style={{ fontSize: 13, fontWeight: 600, color: INK, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: "7px 16px", cursor: "pointer" }}
            >
              사용법
            </button>
          </div>
        </div>
      </div>

      {/* 2단 본문 */}
      <div className="mypage-grid" style={{ maxWidth: 960, margin: "0 auto", padding: "16px 20px 48px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>

        {/* 왼쪽: 이전 기록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.length === 0 ? (
            <div style={{ borderRadius: 16, border: `1px solid ${BORDER}`, background: CARD, padding: "44px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 15, color: SUB, marginBottom: 16 }}>아직 기록이 없어요</p>
              <Link href="/chat" style={{ display: "inline-block", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", padding: "11px 24px", borderRadius: 12, background: GRAD, boxShadow: "0 8px 22px -10px rgba(49,46,129,0.5)" }}>
                자소서 분석 시작하기 →
              </Link>
            </div>
          ) : (
            <>
              {/* 성과 요약 */}
              {totalCompleted > 0 && (
                <div style={{ borderRadius: 14, border: `1px solid ${BORDER}`, background: CARD, padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", boxShadow: "0 4px 16px -12px rgba(17,24,39,0.15)" }}>
                  {[
                    { label: "완성 문항", value: totalCompleted, color: GREEN },
                    { label: "Q/A 답변", value: totalDigging, color: INDIGO_LT },
                    { label: "면접 답변", value: totalInterviewDone, color: GOLD },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{stat.value}</div>
                      <div style={{ fontSize: 11.5, color: SUB, marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 헤더 + 검색 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: FAINT, letterSpacing: "0.08em", textTransform: "uppercase" }}>이전 기록</p>
                <div style={{ position: "relative", flex: "0 1 200px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="mp-input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="직무·문항 검색"
                    style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px 8px 30px", fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {visibleSessions.length === 0 && (
                <p style={{ fontSize: 13, color: FAINT, padding: "20px 4px", textAlign: "center" }}>검색 결과가 없어요.</p>
              )}

              {visibleSessions.map(session => {
                const items = session.cover_items || [];
                const completedItems = items.filter(i => (i.revisions || []).length > 0).length;
                const hasAnyMessages = items.some(i => (i.messages || []).length > 0);
                const isFullyDone = items.length > 0 && completedItems === items.length;

                return (
                  <div key={session.id} style={{ borderRadius: 14, border: `1px solid ${isFullyDone ? "rgba(22,163,74,0.28)" : BORDER}`, background: CARD, overflow: "hidden", boxShadow: "0 4px 16px -12px rgba(17,24,39,0.15)" }}>
                    {/* 세션 헤더 */}
                    <div style={{ padding: "13px 16px", borderBottom: items.length > 0 ? `1px solid ${BORDER}` : "none", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14.5, fontWeight: 700, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {session.job_title || "직무 미입력"}
                        </p>
                        <p style={{ fontSize: 12, color: FAINT, marginTop: 2 }}>{formatDate(session.created_at)}</p>
                      </div>
                      {items.length > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, flexShrink: 0, padding: "3px 10px", borderRadius: 6,
                          color: isFullyDone ? GREEN : hasAnyMessages ? INDIGO_LT : FAINT,
                          background: isFullyDone ? "rgba(22,163,74,0.1)" : hasAnyMessages ? "rgba(99,102,241,0.1)" : "#F3F4F6",
                        }}>
                          {isFullyDone ? `✓ ${completedItems}/${items.length} 완성` : hasAnyMessages ? `${completedItems}/${items.length} 진행` : "미시작"}
                        </span>
                      )}
                    </div>

                    {/* 아이템 목록 */}
                    {items.map(item => {
                      const diggingCount = (item.messages || []).filter(m => m.role === "user" && !CMD_MSGS.includes(m.content || "")).length;
                      const hasRevision = (item.revisions || []).length > 0;
                      const interviewTotal = (item.interview_questions || []).length;
                      const interviewDone = (item.interview_questions || []).filter(qq => (qq.interview_answers || []).length > 0).length;
                      const expanded = expandedId === item.id;
                      const preview = previews[item.id];

                      return (
                        <div key={item.id} style={{ padding: "11px 16px", borderBottom: `1px solid #F3F4F6` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
                            <span style={{ color: hasRevision ? GREEN : diggingCount > 0 ? INDIGO_LT : "#D1D5DB", fontSize: 11, flexShrink: 0, marginTop: 3 }}>
                              {hasRevision ? "✓" : diggingCount > 0 ? "◐" : "○"}
                            </span>
                            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, wordBreak: "keep-all", flex: 1, minWidth: 0 }}>
                              {item.question || "문항 미입력"}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 19, gap: 8, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {diggingCount > 0 && <span style={{ fontSize: 11, color: INDIGO_LT, fontWeight: 600 }}>💬 {diggingCount}회</span>}
                              {hasRevision && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✏️ 완성본</span>}
                              {interviewTotal > 0 && <span style={{ fontSize: 11, color: interviewDone === interviewTotal ? GREEN : GOLD, fontWeight: 600 }}>🎤 {interviewDone}/{interviewTotal}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                              {hasRevision ? (
                                <>
                                  {!(interviewTotal > 0 && interviewDone === interviewTotal) && (
                                    <Link href={`/chat?resume=${session.id}`} style={{ ...btnStyle(INDIGO_LT, true), textDecoration: "none" }}>
                                      이어서 하기 →
                                    </Link>
                                  )}
                                  <button onClick={() => handleToggleExpand(item)} style={btnStyle(expanded ? INDIGO_LT : SUB, expanded)}>
                                    {previewLoading === item.id ? "..." : expanded ? "닫기" : "미리보기"}
                                  </button>
                                  <button onClick={() => handleCopyRevision(item)} style={btnStyle(copiedId === item.id ? GREEN : SUB, copiedId === item.id)}>
                                    {copiedId === item.id ? "복사됨" : "복사"}
                                  </button>
                                  <button onClick={() => handleViewHtml(session.job_title, item)} disabled={viewLoadingId === item.id || pdfLoadingId === item.id} style={btnStyle(INDIGO_LT, false)}>
                                    {viewLoadingId === item.id ? "..." : "바로 보기"}
                                  </button>
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  <button onClick={() => handleDownloadPdf(session.job_title, item, (session as any).analysis_report || "")} disabled={pdfLoadingId === item.id || viewLoadingId === item.id} style={btnStyle(SUB, false)}>
                                    {pdfLoadingId === item.id ? "..." : "PDF"}
                                  </button>
                                </>
                              ) : (
                                <Link href={`/chat?resume=${session.id}`} style={{ ...btnStyle(INDIGO_LT, true), textDecoration: "none" }}>
                                  이어서 하기 →
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* 인라인 미리보기 */}
                          {expanded && (
                            <div style={{ marginTop: 10, marginLeft: 19, borderRadius: 12, border: `1px solid ${BORDER}`, background: "#FBFAFF", padding: "14px 16px" }}>
                              {previewLoading === item.id && !preview ? (
                                <p style={{ fontSize: 12.5, color: FAINT }}>불러오는 중...</p>
                              ) : preview?.revision ? (
                                <>
                                  {preview.subtitle && (
                                    <p style={{ fontSize: 14, fontWeight: 800, color: "#4C3F99", marginBottom: 8, wordBreak: "keep-all" }}>{preview.subtitle}</p>
                                  )}
                                  <p style={{ fontSize: 13, color: INK, lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "keep-all", maxHeight: 280, overflowY: "auto" }}>{preview.revision}</p>
                                  <p style={{ fontSize: 11.5, color: FAINT, marginTop: 10, textAlign: "right" }}>{preview.revision.trim().length}자</p>
                                </>
                              ) : (
                                <p style={{ fontSize: 12.5, color: FAINT }}>완성본을 불러올 수 없어요.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* 펼쳐보기 / 접기 */}
              {!q && sessions.length > 3 && (
                <button
                  onClick={() => setShowAllSessions(v => !v)}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: CARD, border: `1px solid ${BORDER}`, fontSize: 13, fontWeight: 600, color: SUB, cursor: "pointer" }}
                >
                  {showAllSessions ? "접기" : `펼쳐보기 (${sessions.length - 3}개 더)`}
                </button>
              )}
            </>
          )}
        </div>

        {/* 오른쪽: 뱃지 내역 + 계정 설정 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 뱃지 내역 */}
          {transactions.length > 0 && (() => {
            const totalGranted = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
            const totalUsed = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
            return (
              <div style={{ borderRadius: 16, border: `1px solid ${BORDER}`, background: CARD, padding: "16px 18px", boxShadow: "0 4px 16px -12px rgba(17,24,39,0.15)" }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: FAINT, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>뱃지 내역</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "사용", value: totalUsed, color: SUB },
                    { label: "총 지급", value: totalGranted, color: GOLD },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{stat.value}</div>
                      <div style={{ fontSize: 12, color: SUB, marginTop: 5, fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 비밀번호 변경 */}
          <div style={{ borderRadius: 16, border: `1px solid ${BORDER}`, background: CARD, padding: "20px", boxShadow: "0 4px 16px -12px rgba(17,24,39,0.15)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 14 }}>비밀번호 변경</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                className="mp-input"
                style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: INK, outline: "none", boxSizing: "border-box" }}
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                className="mp-input"
                style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: INK, outline: "none", boxSizing: "border-box" }}
              />
              {pwMsg && (
                <p style={{ fontSize: 13, fontWeight: 500, color: pwMsg.ok ? GREEN : RED }}>{pwMsg.text}</p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                style={{ padding: "10px 0", borderRadius: 10, background: GRAD, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: pwLoading ? "default" : "pointer", opacity: pwLoading ? 0.5 : 1, boxShadow: "0 8px 22px -12px rgba(49,46,129,0.5)" }}
              >
                {pwLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>

          {/* 회원탈퇴 */}
          <div style={{ padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(220,38,38,0.18)", background: "rgba(220,38,38,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>회원탈퇴</p>
                <p style={{ fontSize: 12, color: SUB, marginTop: 3 }}>계정과 모든 데이터가 삭제돼요.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ fontSize: 12, fontWeight: 600, color: RED, background: CARD, border: "1px solid rgba(220,38,38,0.3)", borderRadius: 9, padding: "7px 14px", cursor: "pointer", flexShrink: 0 }}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTutorial && (
        <TutorialModal userId={user.id} onClose={() => setShowTutorial(false)} />
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!deleteLoading) { setShowDeleteConfirm(false); setDeletePw(""); setDeletePwError(""); } }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 24px 64px -12px rgba(17,24,39,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 22 }}>⚠️</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: INK, marginTop: 12, marginBottom: 8 }}>정말 탈퇴하시겠어요?</p>
            <p style={{ fontSize: 13, color: SUB, marginBottom: 20, wordBreak: "keep-all", lineHeight: 1.6 }}>계정과 모든 분석 기록이 영구 삭제되며 복구할 수 없어요.</p>
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={deletePw}
              onChange={e => { setDeletePw(e.target.value); setDeletePwError(""); }}
              onKeyDown={e => e.key === "Enter" && handleDeleteAccount()}
              className="mp-input"
              style={{ width: "100%", background: CARD, border: `1px solid ${deletePwError ? "rgba(220,38,38,0.5)" : BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: INK, outline: "none", boxSizing: "border-box", marginBottom: deletePwError ? 8 : 16, textAlign: "left" }}
            />
            {deletePwError && (
              <p style={{ fontSize: 13, color: RED, marginBottom: 16, textAlign: "left" }}>{deletePwError}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePw(""); setDeletePwError(""); }}
                disabled={deleteLoading}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "#F3F4F6", border: `1px solid ${BORDER}`, color: SUB, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: RED, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: deleteLoading ? "default" : "pointer", opacity: deleteLoading ? 0.6 : 1 }}
              >
                {deleteLoading ? "확인 중..." : "탈퇴 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(color: string, active: boolean): CSSProperties {
  return {
    fontSize: 11, fontWeight: 600, color,
    background: active ? `${color}14` : CARD,
    border: `1px solid ${active ? color : BORDER}`,
    borderRadius: 7, padding: "4px 10px", cursor: "pointer", lineHeight: 1.4,
  };
}
