"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { maskEmail, formatReviewDate } from "@/lib/reviewUtils";

const PAGE_BG = "#F5F6F8";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const INDIGO = "#312E81";
const INDIGO_LT = "#6366F1";
const VIOLET = "#A78BFA";
const INK = "#111827";
const SUB = "#6B7280";
const FAINT = "#9CA3AF";
const GOLD = "#C99700";
const GRAD = "linear-gradient(135deg, #1A3461 0%, #312E81 100%)";

interface Review {
  id: string;
  email: string | null;
  type: string;
  content: string | null;
  photo_url: string | null;
  job_title: string | null;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) setUser({ id: u.user.id, email: u.user.email ?? "" });
      const { data } = await supabase
        .from("reviews")
        .select("id, email, type, content, photo_url, job_title, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setReviews((data as Review[]) || []);
      setLoading(false);
    })();
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user) { setUploadErr("로그인 후 이용할 수 있어요."); return; }
    if (file.size > 6 * 1024 * 1024) { setUploadErr("이미지는 6MB 이하로 올려주세요."); return; }
    setUploading(true);
    setUploadErr("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("review-photos").upload(path, file, { upsert: false });
      if (upErr) { setUploadErr("업로드에 실패했어요. 다시 시도해주세요."); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("review-photos").getPublicUrl(path);
      const { error: insErr } = await supabase.from("reviews").insert({
        user_id: user.id,
        email: user.email,
        type: "photo",
        photo_url: pub.publicUrl,
        status: "pending",
      });
      if (insErr) { setUploadErr("저장에 실패했어요. 다시 시도해주세요."); setUploading(false); return; }
      setUploadDone(true);
    } finally {
      setUploading(false);
    }
  }

  const visible = reviews.filter(r => (r.type === "photo" && r.photo_url) || (r.type === "digging" && r.content));

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", color: INK }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <header style={{ height: 58, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: INK, textDecoration: "none", display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: CARD, border: `1px solid ${BORDER}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          홈으로
        </Link>
        <Link href="/chat" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", textDecoration: "none", padding: "9px 18px", borderRadius: 11, background: GRAD, boxShadow: "0 8px 22px -10px rgba(49,46,129,0.55)" }}>
          시작하기
        </Link>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 20px 64px" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: INDIGO_LT, marginBottom: 12 }}>REVIEW</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>직접 써본 분들의 이야기</h1>
        </div>

        {/* 손글씨 후기 CTA */}
        <div style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: CARD, padding: "22px 24px", marginBottom: 36, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, boxShadow: "0 8px 28px -16px rgba(17,24,39,0.18)" }}>
          <div>
            <p style={{ fontSize: 15.5, fontWeight: 800, color: INK, marginBottom: 5 }}>✍️ 손글씨 후기 남기고 20% 할인받기</p>
            <p style={{ fontSize: 13, color: SUB, wordBreak: "keep-all", lineHeight: 1.6 }}>
              종이에 취업 목표나 짧은 후기를 손으로 적어 사진으로 올려주세요.{" "}
              <span style={{ color: GOLD, fontWeight: 600 }}>확인을 위해 관리자 승인 후 게시판에 노출되고 쿠폰이 지급됩니다.</span>
            </p>
          </div>
          {uploadDone ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", background: "rgba(22,163,74,0.1)", padding: "10px 18px", borderRadius: 12, flexShrink: 0, textAlign: "center", lineHeight: 1.5 }}>접수 완료! 🙌<br />관리자 승인 후 게시판에 노출돼요</span>
          ) : (
            <label style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: GRAD, padding: "11px 22px", borderRadius: 12, cursor: uploading ? "default" : "pointer", flexShrink: 0, opacity: uploading ? 0.6 : 1, boxShadow: "0 8px 22px -10px rgba(49,46,129,0.5)" }}>
              {uploading ? "올리는 중..." : "사진 올리기"}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: "none" }} />
            </label>
          )}
        </div>
        {uploadErr && <p style={{ fontSize: 13, color: "#DC2626", textAlign: "center", marginTop: -24, marginBottom: 28 }}>{uploadErr}</p>}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(49,46,129,0.18)", borderTopColor: INDIGO, animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : visible.length === 0 ? (
          <p style={{ textAlign: "center", color: FAINT, fontSize: 15, padding: "60px 0" }}>아직 등록된 후기가 없어요.</p>
        ) : (
          <div style={{ columnCount: 3, columnGap: 16 }} className="review-cols">
            {visible.map(r => (
              r.type === "photo" ? (
                <div key={r.id} className="rv-card" style={{ breakInside: "avoid", marginBottom: 16, borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}`, background: CARD, boxShadow: "0 6px 20px -14px rgba(17,24,39,0.2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.photo_url!} alt="손글씨 후기" style={{ width: "100%", display: "block", objectFit: "cover" }} />
                  <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: SUB, minWidth: 0 }}>
                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: GOLD, background: "rgba(201,151,0,0.1)", padding: "4px 11px", borderRadius: 999 }}>✍️ 손글씨 리뷰</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskEmail(r.email)}</span>
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 11, color: FAINT }}>{formatReviewDate(r.created_at)}</span>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="rv-card" style={{ breakInside: "avoid", marginBottom: 16, borderRadius: 16, border: `1px solid ${BORDER}`, background: CARD, padding: "18px 20px", boxShadow: "0 6px 20px -14px rgba(17,24,39,0.2)" }}>
                  <span style={{ display: "block", fontSize: 30, lineHeight: 1, fontWeight: 800, color: VIOLET, opacity: 0.5, marginBottom: 4 }}>&ldquo;</span>
                  <p style={{ fontSize: 14.5, color: INK, lineHeight: 1.75, wordBreak: "keep-all", marginBottom: 14 }}>{r.content}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, borderTop: "1px solid #F3F4F6", paddingTop: 11 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: SUB, minWidth: 0 }}>
                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: INDIGO_LT, background: "rgba(99,102,241,0.1)", padding: "4px 11px", borderRadius: 999 }}>💬 디깅 리뷰</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskEmail(r.email)}{r.job_title ? ` · ${r.job_title}` : ""}</span>
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 11, color: FAINT }}>{formatReviewDate(r.created_at)}</span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <style>{`.rv-card{ transition: transform .18s ease, box-shadow .18s ease; } .rv-card:hover{ transform: translateY(-3px); box-shadow: 0 16px 32px -16px rgba(17,24,39,0.3); } @media (max-width: 760px){ .review-cols{ column-count: 1 !important; } } @media (min-width: 761px) and (max-width: 1024px){ .review-cols{ column-count: 2 !important; } }`}</style>
    </div>
  );
}
