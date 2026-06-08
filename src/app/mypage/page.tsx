"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

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
          .select("id, job_title, created_at, cover_items(id, question, status)")
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
        <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>← 홈으로</Link>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)", fontFamily: "inherit" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}</style>

      {/* Header */}
      <header style={{ height: 52, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,13,24,0.96)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <Link href="/chat" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          채팅으로
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>마이페이지</span>
        <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>홈</Link>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>

        {/* 뱃지 카드 */}
        <div style={{ borderRadius: 20, border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.05)", padding: "24px 24px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>{user.email}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>내 뱃지 잔액</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: GOLD, letterSpacing: "-0.03em", lineHeight: 1 }}>{credits}</span>
                <span style={{ fontSize: 15, color: "rgba(255,209,102,0.55)" }}>개</span>
              </div>
            </div>
            <span style={{ fontSize: 44 }}>🏅</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 16 }}>뱃지 1개 = 자소서 문항 분석 1회 · 분석 시작 시 차감</p>
        </div>

        {/* 뱃지 내역 */}
        {transactions.length > 0 && (
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>뱃지 내역</p>
            </div>
            {transactions.map(txn => (
              <div key={txn.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>{txn.reason || (txn.amount > 0 ? "지급" : "차감")}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{formatDate(txn.created_at)}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: txn.amount > 0 ? GREEN : RED }}>
                  {txn.amount > 0 ? "+" : ""}{txn.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 이전 세션 기록 */}
        {sessions.length > 0 && (
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>이전 기록</p>
            </div>
            {sessions.map(session => (
              <div key={session.id} style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: session.cover_items?.length ? 8 : 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>
                    {session.job_title || "직무 미입력"}
                  </p>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{formatDate(session.created_at)}</span>
                </div>
                {session.cover_items?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {session.cover_items.map(item => (
                      <p key={item.id} style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", paddingLeft: 8 }}>
                        <span style={{ color: item.status === "done" ? "rgba(74,222,128,0.6)" : BLUE, marginRight: 6, fontSize: 10 }}>
                          {item.status === "done" ? "✓" : "·"}
                        </span>
                        {item.question || "문항 미입력"}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {transactions.length === 0 && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", marginBottom: 16 }}>아직 기록이 없어요</p>
            <Link href="/chat" style={{ display: "inline-block", fontSize: 13, color: ACCENT, textDecoration: "none", padding: "10px 24px", borderRadius: 12, background: `rgba(201,100,66,0.12)`, border: `1px solid rgba(201,100,66,0.25)` }}>
              자소서 분석 시작하기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
