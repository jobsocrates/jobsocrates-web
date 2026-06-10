"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buildPrintHtml, stripMd, parseRevisionMsg, type SummaryMsg, type SummaryInterviewQ } from "@/components/CoverLetterSummary";
import { TutorialModal } from "@/components/TutorialModal";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const GREEN = "rgb(74,222,128)";
const RED = "rgb(248,113,113)";

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
  messages?: { id: string; role: string }[];
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
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);

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

  useEffect(() => {
    setDismissedSessionId(sessionStorage.getItem("lastDismissedSessionId"));
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
          .select("id, job_title, created_at, cover_items(id, question, status, messages(id, role), revisions(id), interview_questions(id, interview_answers(id)))")
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


  async function handleDownloadPdf(jobTitle: string, item: CoverItemRecord) {
    setPdfLoadingId(item.id);
    try {
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
          .select("question, order_index, interview_answers(user_answer, ai_feedback)")
          .eq("cover_item_id", item.id)
          .order("order_index", { ascending: true }),
      ]);

      const msgs: SummaryMsg[] = (msgRows || []).map((m, i) => ({
        id: i,
        role: (m.role === "assistant" ? "bot" : "user") as "bot" | "user",
        text: m.content as string,
      }));

      // split at revision message
      const revMsgIdx = msgs.findIndex(m => m.role === "bot" && m.text.includes("[수정본]"));
      const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;

      let revision = "";
      let changes = "";
      if (revRows) {
        revision = (revRows.content as string) || "";
        const rawChanges = revRows.changes;
        changes = Array.isArray(rawChanges) ? rawChanges.join("\n") : String(rawChanges || "");
        if (revMsgIdx >= 0) {
          const { subtitle } = parseRevisionMsg(msgs[revMsgIdx].text);
          if (subtitle && !revision.startsWith("[")) revision = `[${subtitle}]\n\n${revision}`;
        }
      } else if (revMsgIdx >= 0) {
        const parsed = parseRevisionMsg(msgs[revMsgIdx].text);
        revision = parsed.revision;
        changes = parsed.changes;
      }

      // strip revision markup from diagMsgs for non-revision messages
      const cleanDiag = diagMsgs.map(m => {
        if (m.role === "bot" && m.text.includes("[수정본]")) return m;
        return { ...m, text: stripMd(m.text) ? m.text : m.text };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interviewQs: SummaryInterviewQ[] = (iqRows || []).map((iq: any) => {
        const answers = iq.interview_answers || [];
        const qMsgs: SummaryMsg[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers.forEach((a: any, j: number) => {
          if (a.user_answer) qMsgs.push({ id: j * 2, role: "user", text: a.user_answer });
          if (a.ai_feedback) qMsgs.push({ id: j * 2 + 1, role: "bot", text: a.ai_feedback });
        });
        return { question: iq.question as string, msgs: qMsgs };
      });

      const html = buildPrintHtml(jobTitle, item.question, revision, changes, cleanDiag, interviewQs, window.location.origin);
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

  async function handleViewHtml(jobTitle: string, item: CoverItemRecord) {
    setViewLoadingId(item.id);
    try {
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
          .select("question, order_index, interview_answers(user_answer, ai_feedback)")
          .eq("cover_item_id", item.id)
          .order("order_index", { ascending: true }),
      ]);

      const msgs: SummaryMsg[] = (msgRows || []).map((m, i) => ({
        id: i,
        role: (m.role === "assistant" ? "bot" : "user") as "bot" | "user",
        text: m.content as string,
      }));

      const revMsgIdx = msgs.findIndex(m => m.role === "bot" && m.text.includes("[수정본]"));
      const diagMsgs = revMsgIdx >= 0 ? msgs.slice(0, revMsgIdx + 1) : msgs;

      let revision = "";
      let changes = "";
      if (revRows) {
        revision = (revRows.content as string) || "";
        const rawChanges = revRows.changes;
        changes = Array.isArray(rawChanges) ? rawChanges.join("\n") : String(rawChanges || "");
        if (revMsgIdx >= 0) {
          const { subtitle } = parseRevisionMsg(msgs[revMsgIdx].text);
          if (subtitle && !revision.startsWith("[")) revision = `[${subtitle}]\n\n${revision}`;
        }
      } else if (revMsgIdx >= 0) {
        const parsed = parseRevisionMsg(msgs[revMsgIdx].text);
        revision = parsed.revision;
        changes = parsed.changes;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interviewQs: SummaryInterviewQ[] = (iqRows || []).map((iq: any) => {
        const answers = iq.interview_answers || [];
        const qMsgs: SummaryMsg[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers.forEach((a: any, j: number) => {
          if (a.user_answer) qMsgs.push({ id: j * 2, role: "user", text: a.user_answer });
          if (a.ai_feedback) qMsgs.push({ id: j * 2 + 1, role: "bot", text: a.ai_feedback });
        });
        return { question: iq.question as string, msgs: qMsgs };
      });

      const html = buildPrintHtml(jobTitle, item.question, revision, changes, diagMsgs, interviewQs, window.location.origin);
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

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid rgba(201,100,66,0.3)`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>로그인이 필요합니다.</p>
        <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← 홈으로</Link>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)", fontFamily: "inherit" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>

      {/* Header */}
      <header style={{ height: 56, padding: "0 20px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(13,13,24,0.98)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.82)", textDecoration: "none", display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          홈으로
        </Link>
      </header>

      {/* ── 뱃지 카드 (상단 풀폭) ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 0" }}>
        <div className="card-depth" style={{ borderRadius: 20, border: `1px solid ${credits > 0 ? "rgba(255,209,102,0.3)" : "rgba(248,113,113,0.25)"}`, background: credits > 0 ? "rgba(255,209,102,0.06)" : "rgba(248,113,113,0.05)", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{user.email}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: credits > 0 ? "rgba(255,209,102,0.7)" : "rgba(248,113,113,0.7)", marginBottom: 4 }}>남은 뱃지</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: credits > 0 ? GOLD : "rgb(248,113,113)", letterSpacing: "-0.03em", lineHeight: 1 }}>{credits}</span>
                <span style={{ fontSize: 18, color: credits > 0 ? "rgba(255,209,102,0.55)" : "rgba(248,113,113,0.55)" }}>개</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>뱃지 1개 = 완성 자소서 문항 1개 완성 · 분석 시작 시 차감</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <span style={{ fontSize: 52 }}>🏅</span>
              <button
                onClick={() => setShowTutorial(true)}
                style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 9, padding: "7px 16px", cursor: "pointer" }}
              >
                사용법
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2단 본문 ── */}
      <div className="mypage-grid" style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

        {/* 왼쪽: 이전 기록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(() => {
            const allItems = sessions.flatMap(s => s.cover_items || []);
            const totalCompleted = allItems.filter(i => (i.revisions || []).length > 0).length;
            const totalDigging = allItems.reduce((acc, i) => acc + (i.messages || []).filter(m => m.role === "user").length, 0);
            const totalInterviewDone = allItems.reduce((acc, i) => acc + (i.interview_questions || []).filter(q => (q.interview_answers || []).length > 0).length, 0);
            const firstSession = sessions[0];
            const firstHasIncomplete = firstSession?.id !== dismissedSessionId &&
              firstSession?.cover_items?.some(i =>
                (i.revisions || []).length === 0 && (i.messages || []).length > 0
              );

            if (sessions.length === 0) {
              return (
                <div className="card-depth-sm" style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "36px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>아직 기록이 없어요</p>
                  <Link href="/chat" style={{ display: "inline-block", fontSize: 14, fontWeight: 600, color: ACCENT, textDecoration: "none", padding: "10px 22px", borderRadius: 12, background: `rgba(201,100,66,0.12)`, border: `1px solid rgba(201,100,66,0.25)` }}>
                    자소서 분석 시작하기 →
                  </Link>
                </div>
              );
            }

            return (
              <>
                {/* 성과 요약 */}
                {totalCompleted > 0 && (
                  <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {[
                      { label: "완성 문항", value: totalCompleted, color: GREEN },
                      { label: "디깅 답변", value: totalDigging, color: BLUE },
                      { label: "면접 답변", value: totalInterviewDone, color: GOLD },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 이어하기 CTA */}
                {firstHasIncomplete && (
                  <Link href="/chat" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 14, background: `rgba(201,100,66,0.1)`, border: `1px solid rgba(201,100,66,0.3)`, textDecoration: "none" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 3 }}>작성 중인 자소서가 있어요</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{firstSession.job_title || "직무 미입력"} · 이어서 완성해보세요</p>
                    </div>
                    <span style={{ fontSize: 22, color: ACCENT, flexShrink: 0, marginLeft: 12, fontWeight: 700 }}>→</span>
                  </Link>
                )}

                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", textTransform: "uppercase", paddingLeft: 2, marginBottom: -4 }}>이전 기록</p>

                {(showAllSessions ? sessions : sessions.slice(0, 3)).map(session => {
                  const items = session.cover_items || [];
                  const completedItems = items.filter(i => (i.revisions || []).length > 0).length;
                  const hasAnyMessages = items.some(i => (i.messages || []).length > 0);
                  const isFullyDone = items.length > 0 && completedItems === items.length;

                  return (
                    <div key={session.id} className="card-depth-sm" style={{ borderRadius: 14, border: `1px solid ${isFullyDone ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)"}`, background: "rgba(255,255,255,0.025)", overflow: "hidden" }}>
                      {/* 세션 헤더 */}
                      <div style={{ padding: "12px 16px", borderBottom: items.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {session.job_title || "직무 미입력"}
                          </p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{formatDate(session.created_at)}</p>
                        </div>
                        {items.length > 0 && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, flexShrink: 0, padding: "3px 10px", borderRadius: 6,
                            color: isFullyDone ? GREEN : hasAnyMessages ? BLUE : "rgba(255,255,255,0.28)",
                            background: isFullyDone ? "rgba(74,222,128,0.1)" : hasAnyMessages ? "rgba(107,142,255,0.1)" : "rgba(255,255,255,0.05)",
                          }}>
                            {isFullyDone ? `✓ ${completedItems}/${items.length} 완성` : hasAnyMessages ? `${completedItems}/${items.length} 진행` : "미시작"}
                          </span>
                        )}
                      </div>

                      {/* 아이템 목록 */}
                      {items.map(item => {
                        const diggingCount = (item.messages || []).filter(m => m.role === "user").length;
                        const hasRevision = (item.revisions || []).length > 0;
                        const interviewTotal = (item.interview_questions || []).length;
                        const interviewDone = (item.interview_questions || []).filter(q => (q.interview_answers || []).length > 0).length;

                        return (
                          <div key={item.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                              <span style={{ color: hasRevision ? GREEN : diggingCount > 0 ? BLUE : "rgba(255,255,255,0.2)", fontSize: 11, flexShrink: 0, marginTop: 3 }}>
                                {hasRevision ? "✓" : diggingCount > 0 ? "◐" : "○"}
                              </span>
                              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, wordBreak: "keep-all", flex: 1, minWidth: 0 }}>
                                {item.question || "문항 미입력"}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 19 }}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {diggingCount > 0 && (
                                  <span style={{ fontSize: 11, color: "rgba(107,142,255,0.85)", fontWeight: 600 }}>💬 {diggingCount}회</span>
                                )}
                                {hasRevision && (
                                  <span style={{ fontSize: 11, color: "rgba(74,222,128,0.85)", fontWeight: 600 }}>✏️ 수정본</span>
                                )}
                                {interviewTotal > 0 && (
                                  <span style={{ fontSize: 11, color: interviewDone === interviewTotal ? "rgba(74,222,128,0.85)" : "rgba(255,209,102,0.75)", fontWeight: 600 }}>🎤 {interviewDone}/{interviewTotal}</span>
                                )}
                              </div>
                              {hasRevision && (
                                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                  <button
                                    onClick={() => handleViewHtml(session.job_title, item)}
                                    disabled={viewLoadingId === item.id || pdfLoadingId === item.id}
                                    style={{ fontSize: 11, fontWeight: 600, color: "rgba(107,142,255,0.85)", background: "rgba(107,142,255,0.08)", border: "1px solid rgba(107,142,255,0.2)", borderRadius: 7, padding: "4px 10px", cursor: viewLoadingId === item.id ? "default" : "pointer", opacity: viewLoadingId === item.id ? 0.5 : 1 }}
                                  >
                                    {viewLoadingId === item.id ? "..." : "바로 보기"}
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(session.job_title, item)}
                                    disabled={pdfLoadingId === item.id || viewLoadingId === item.id}
                                    style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "4px 10px", cursor: pdfLoadingId === item.id ? "default" : "pointer", opacity: pdfLoadingId === item.id ? 0.5 : 1 }}
                                  >
                                    {pdfLoadingId === item.id ? "..." : "PDF"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* 펼쳐보기 / 접기 버튼 */}
                {sessions.length > 3 && (
                  <button
                    onClick={() => setShowAllSessions(v => !v)}
                    style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
                  >
                    {showAllSessions ? "접기" : `펼쳐보기 (${sessions.length - 3}개 더)`}
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* 오른쪽: 뱃지 내역 + 계정 설정 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 뱃지 내역 */}
          {transactions.length > 0 && (() => {
            const totalGranted = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
            const totalUsed = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
            return (
              <div className="card-depth-sm" style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: "16px 18px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.32)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>뱃지 내역</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "사용", value: totalUsed, color: "rgba(255,255,255,0.45)" },
                    { label: "총 지급", value: totalGranted, color: GOLD },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{stat.value}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5, fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 비밀번호 변경 */}
          <div className="card-depth-sm" style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: "20px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>비밀번호 변경</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                className="glow-input"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "rgba(255,255,255,0.85)", outline: "none", boxSizing: "border-box" }}
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                className="glow-input"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "rgba(255,255,255,0.85)", outline: "none", boxSizing: "border-box" }}
              />
              {pwMsg && (
                <p style={{ fontSize: 13, fontWeight: 500, color: pwMsg.ok ? "rgb(74,222,128)" : "rgb(248,113,113)" }}>{pwMsg.text}</p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                style={{ padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600, cursor: pwLoading ? "default" : "pointer", opacity: pwLoading ? 0.5 : 1 }}
              >
                {pwLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>

          {/* 회원탈퇴 */}
          <div style={{ padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(248,113,113,0.15)", background: "rgba(248,113,113,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>회원탈퇴</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>계정과 모든 데이터가 삭제돼요.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ fontSize: 12, fontWeight: 600, color: "rgba(248,113,113,0.8)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 9, padding: "7px 14px", cursor: "pointer" }}
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
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!deleteLoading) { setShowDeleteConfirm(false); setDeletePw(""); setDeletePwError(""); } }}>
          <div style={{ background: "#18182A", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 20, padding: "28px 24px", maxWidth: 320, width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 20 }}>⚠️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 12, marginBottom: 8 }}>정말 탈퇴하시겠어요?</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20, wordBreak: "keep-all" }}>계정과 모든 분석 기록이 영구 삭제되며 복구할 수 없어요.</p>
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={deletePw}
              onChange={e => { setDeletePw(e.target.value); setDeletePwError(""); }}
              onKeyDown={e => e.key === "Enter" && handleDeleteAccount()}
              className="glow-input"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${deletePwError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.12)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "rgba(255,255,255,0.85)", outline: "none", boxSizing: "border-box", marginBottom: deletePwError ? 8 : 16, textAlign: "left" }}
            />
            {deletePwError && (
              <p style={{ fontSize: 13, color: "rgb(248,113,113)", marginBottom: 16, textAlign: "left" }}>{deletePwError}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePw(""); setDeletePwError(""); }}
                disabled={deleteLoading}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", color: "rgb(248,113,113)", fontSize: 14, fontWeight: 700, cursor: deleteLoading ? "default" : "pointer", opacity: deleteLoading ? 0.6 : 1 }}
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
