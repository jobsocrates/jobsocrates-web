"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { maskEmail, formatReviewDate, ADMIN_EMAIL } from "@/lib/reviewUtils";

const BG = "#0D0D18";
const ACCENT = "#C96442";
const GREEN = "rgb(74,222,128)";
const GOLD = "rgb(255,209,102)";
const RED = "rgb(248,113,113)";

interface Review {
  id: string;
  email: string | null;
  type: string;
  content: string | null;
  photo_url: string | null;
  job_title: string | null;
  status: string;
  created_at: string;
}

const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "rgba(255,255,255,0.9)", outline: "none" };

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [token, setToken] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sEmail, setSEmail] = useState("");
  const [sJob, setSJob] = useState("");
  const [sContent, setSContent] = useState("");
  const [seeding, setSeeding] = useState(false);

  const callApi = useCallback(async (payload: Record<string, unknown>, accessToken: string) => {
    const res = await fetch("/api/admin-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, accessToken }),
    });
    return res.json();
  }, []);

  const refresh = useCallback(async (accessToken: string) => {
    const data = await callApi({ action: "listAll" }, accessToken);
    setReviews(data.reviews || []);
  }, [callApi]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user?.email !== ADMIN_EMAIL) { setLoading(false); return; }
      setAllowed(true);
      setToken(session.access_token);
      await refresh(session.access_token);
      setLoading(false);
    })();
  }, [refresh]);

  async function handleSeed() {
    if (!sContent.trim()) return;
    setSeeding(true);
    await callApi({ action: "seed", email: sEmail.trim() || null, content: sContent.trim(), job_title: sJob.trim() || null }, token);
    setSEmail(""); setSJob(""); setSContent("");
    await refresh(token);
    setSeeding(false);
  }
  async function handleApprove(id: string) { setBusyId(id); await callApi({ action: "approve", id }, token); await refresh(token); setBusyId(null); }
  async function handleDelete(id: string) { if (!confirm("이 후기를 삭제할까요?")) return; setBusyId(id); await callApi({ action: "delete", id }, token); await refresh(token); setBusyId(null); }

  if (loading) {
    return <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(201,100,66,0.3)", borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>;
  }
  if (!allowed) {
    return <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>접근 권한이 없습니다.</p>
      <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>← 홈으로</Link>
    </div>;
  }

  const groups = [
    { key: "pending", label: "승인 대기", color: GOLD },
    { key: "approved", label: "공개 중", color: GREEN },
  ];

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)" }}>
      <header style={{ height: 56, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(13,13,24,0.98)", position: "sticky", top: 0, zIndex: 40 }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Admin · 후기</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "7px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>관리자 홈</Link>
          <Link href="/reviews" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "7px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>게시판</Link>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 56px", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* 시딩 */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 14 }}>디깅 후기 직접 등록</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="이메일 (예: hong@gmail.com)" style={{ ...inputStyle, flex: "1 1 180px" }} />
              <input value={sJob} onChange={e => setSJob(e.target.value)} placeholder="직무 (선택)" style={{ ...inputStyle, flex: "1 1 120px" }} />
            </div>
            <textarea value={sContent} onChange={e => setSContent(e.target.value)} placeholder="후기 내용" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <button onClick={handleSeed} disabled={seeding || !sContent.trim()} style={{ alignSelf: "flex-start", fontSize: 13, fontWeight: 700, color: "#fff", background: ACCENT, border: "none", borderRadius: 10, padding: "9px 20px", cursor: "pointer", opacity: seeding || !sContent.trim() ? 0.5 : 1 }}>{seeding ? "등록 중..." : "등록"}</button>
          </div>
        </div>

        {groups.map(grp => {
          const list = reviews.filter(r => r.status === grp.key);
          return (
            <div key={grp.key}>
              <p style={{ fontSize: 13, fontWeight: 700, color: grp.color, marginBottom: 10 }}>{grp.label} ({list.length})</p>
              {list.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>없음</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {list.map(r => (
                    <div key={r.id} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{maskEmail(r.email)}{r.job_title ? ` · ${r.job_title}` : ""}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{formatReviewDate(r.created_at)} · {r.type === "photo" ? "사진" : "디깅"}</span>
                      </div>
                      {r.type === "photo" && r.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo_url} alt="" style={{ maxWidth: 280, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ) : (
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, wordBreak: "keep-all" }}>{r.content}</p>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        {r.status === "pending" && <button onClick={() => handleApprove(r.id)} disabled={busyId === r.id} style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: GREEN, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", opacity: busyId === r.id ? 0.5 : 1 }}>승인</button>}
                        <button onClick={() => handleDelete(r.id)} disabled={busyId === r.id} style={{ fontSize: 12, fontWeight: 600, color: RED, background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", opacity: busyId === r.id ? 0.5 : 1 }}>삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
