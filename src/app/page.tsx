"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { HowSection } from "@/components/HowSection";
import { supabase } from "@/lib/supabase";

const ACCENT = "#F06428";
const BG = "#07070F";
const ADMIN_EMAIL = "ijhan6403@gmail.com";

const DIFF_ROWS = [
  { label: "접근 방식",     other: "입력값으로 문장 생성",        ours: "대화로 경험을 발굴한 뒤 작성" },
  { label: "결과물의 주인", other: "AI가 만든 문장",              ours: "당신의 말과 경험" },
  { label: "한계 경험",     other: "그럴듯하게 채움",             ours: "없는 것은 채우지 않음" },
  { label: "면접 연계",     other: "없음",                        ours: "디깅 내용이 그대로 면접 준비로" },
  { label: "사용자 차별화", other: "누가 써도 비슷",              ours: "당신의 사고방식이 드러남" },
];

const BLUE = "#6B8EFF";
const DOTS = [{ c: "#C96442", d: 0 }, { c: "#6B8EFF", d: 150 }, { c: "#FFD166", d: 300 }];

function ChatPreviewCard() {
  return (
    <div
      className="w-full"
      style={{
        background: "#0A0A1A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        overflow: "hidden",
        maxWidth: "520px",
        boxShadow: "0 60px 140px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
        <div className="flex gap-1.5">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="flex-1 text-center text-xs font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>취업소크라테스</span>
        <div style={{ width: "42px" }} />
      </div>
      <div className="p-5 flex flex-col gap-3.5">
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}1A` }}>
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
            <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover" />
            <span className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</span>
          </div>
          <div className="px-3.5 py-3 flex flex-col gap-2">
            {[["①","논리 흐름은 잡혀있어요",true],["②","핵심 경험이 너무 추상적이에요",false],["③","직무 연결고리가 약해요",false]].map(([n,t,b])=>(
              <div key={n as string} className="flex items-start gap-2">
                <span className="text-xs font-bold flex-shrink-0" style={{ color: BLUE }}>{n}</span>
                <p className="text-xs leading-relaxed" style={{ color: b ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)" }}>{t as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          <div className="px-3.5 py-2.5 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.82)", borderRadius: "4px 14px 14px 14px", maxWidth: "84%" }}>
            「팀 성과」라고 하셨는데 — 당신이 직접 한 게 뭔가요?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="px-3.5 py-2.5 text-xs leading-relaxed" style={{ background: ACCENT, color: "#fff", borderRadius: "14px 4px 14px 14px", maxWidth: "76%" }}>
            API 설계랑 QA를 혼자 담당했어요
          </div>
        </div>
        <div className="flex items-end gap-2">
          <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}1A` }}>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
              <span className="text-xs font-semibold" style={{ color: BLUE }}>자소서 완성중</span>
            </div>
            <div className="px-3.5 py-3 flex gap-1.5 items-center">
              {DOTS.map(({ c, d }) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: c, animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);

  async function fetchBadge(uid: string) {
    const { data } = await supabase.from("profiles").select("credits").eq("id", uid).single();
    if (data) setBadgeCount(data.credits ?? 0);
  }

  useEffect(() => {
    supabase.from("page_views").insert({ path: "/" });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUserEmail(u?.email ?? null);
      if (u?.id) fetchBadge(u.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      const u = s?.user;
      setUserEmail(u?.email ?? null);
      if (u?.id) fetchBadge(u.id);
      else setBadgeCount(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".anim").forEach((el) => observer.observe(el));
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  function openAuth(tab: "login" | "signup") { setAuthTab(tab); setAuthOpen(true); }
  function handleStartChat() {
    if (userEmail) {
      sessionStorage.setItem("showTutorial", "1");
      window.location.href = "/chat";
    } else openAuth("login");
  }

  return (
    <>
      <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)" }}>

        {/* ── 네비 ── */}
        <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(7,7,15,0.92)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent"
          }}>
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 font-bold text-white text-base tracking-tight hover:opacity-80 transition-opacity">
              <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover" />
              취업소크라테스
            </button>
            <div className="flex items-center gap-2">
              {userEmail ? (
                <>
                  {badgeCount !== null && badgeCount > 0 && userEmail !== ADMIN_EMAIL && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: "rgba(255,209,102,0.1)", border: "1px solid rgba(255,209,102,0.2)", color: "rgba(255,209,102,0.9)" }}>
                      🏅 {badgeCount}
                    </div>
                  )}
                  {userEmail !== ADMIN_EMAIL && (
                    <Link href="/mypage" className="text-xs sm:text-sm px-3 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      마이페이지
                    </Link>
                  )}
                  {userEmail === ADMIN_EMAIL && (
                    <a href="/admin" className="text-xs sm:text-sm px-3 py-2 rounded-xl transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      관리자
                    </a>
                  )}
                  <a href="/chat" onClick={() => sessionStorage.setItem("showTutorial", "1")}
                    className="text-xs sm:text-sm px-4 py-2 rounded-xl font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: ACCENT, color: "#fff" }}>
                    시작하기
                  </a>
                  <button onClick={() => supabase.auth.signOut().then(() => { setUserEmail(null); setBadgeCount(null); })}
                    className="text-xs px-2 py-2 rounded-xl transition-colors hover:text-white hidden sm:block"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuth("login")} className="text-sm px-4 py-2 rounded-xl transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.55)" }}>
                    로그인
                  </button>
                  <button onClick={() => openAuth("signup")}
                    className="text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:scale-[1.03]"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.14)" }}>
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── 히어로 ── */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-16 relative overflow-hidden px-6">
          <style>{`
            @keyframes af1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.1)}}
            @keyframes af2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,40px) scale(1.08)}}
            @keyframes af3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(25px,25px) scale(1.05)}}
          `}</style>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position:"absolute", top:"-15%", left:"50%", transform:"translateX(-50%)", width:"900px", height:"700px", borderRadius:"50%", background:"#F06428", filter:"blur(200px)", opacity:0.08, animation:"af1 16s ease-in-out infinite" }} />
            <div style={{ position:"absolute", top:"25%", left:"8%", width:"550px", height:"550px", borderRadius:"50%", background:"#6B8EFF", filter:"blur(180px)", opacity:0.05, animation:"af2 19s ease-in-out infinite" }} />
            <div style={{ position:"absolute", top:"20%", right:"5%", width:"450px", height:"450px", borderRadius:"50%", background:"#A78BFA", filter:"blur(170px)", opacity:0.04, animation:"af3 22s ease-in-out infinite" }} />
          </div>

          <div className="max-w-[1100px] w-full mx-auto flex flex-col items-center text-center gap-7 relative">
            {/* 뱃지 */}
            <div className="anim inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>AI 기반 자소서 코칭</span>
            </div>

            {/* 헤드라인 */}
            <h1 className="anim"
              style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.04, wordBreak: "keep-all" }}>
              <span style={{ background: "linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.45) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                내 이야기로<br />완성하는 자소서
              </span>
            </h1>

            {/* 서브 */}
            <p className="anim anim-delay-1" style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)", color: "rgba(255,255,255,0.42)", lineHeight: 1.9, maxWidth: "460px", wordBreak: "keep-all" }}>
              경험은 있습니다.<br />꺼내는 방법을 몰랐을 뿐입니다.
            </p>

            {/* CTA */}
            <div className="anim anim-delay-2">
              <button
                onClick={handleStartChat}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: ACCENT, boxShadow: `0 0 40px ${ACCENT}35`, fontSize: "15px", letterSpacing: "-0.01em" }}>
                시작해보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* 프리뷰 */}
            <div className="anim anim-delay-2 w-full flex justify-center mt-4">
              <ChatPreviewCard />
            </div>
          </div>
        </section>

        {/* ── STATS 스트립 ── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          <div className="max-w-[700px] mx-auto px-6 py-14 grid grid-cols-2 gap-6">
            {[
              { num: "83%", color: "#FFD166", label: "취준생이 서류 작성을\n\"가장 막막하다\"고 했어요", src: "사람인 1,202명 조사" },
              { num: "7시간", color: "#6B8EFF", label: "자소서 1개 완성에\n평균 드는 시간", src: "서울경제 실태 조사" },
            ].map(({ num, color, label, src }) => (
              <div key={num} className="anim flex flex-col items-center text-center gap-2">
                <span style={{ fontSize: "clamp(2.4rem,7vw,3.5rem)", fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{num}</span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", whiteSpace: "pre-line", wordBreak: "keep-all" }}>{label}</p>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>{src}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 문제 정의 ── */}
        <section className="px-6 py-36">
          <div className="max-w-[800px] mx-auto anim flex flex-col gap-8">
            <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>Why</p>
            <h2 style={{ fontSize: "clamp(2rem, 5.5vw, 3.75rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.3, wordBreak: "keep-all" }}>
              <span style={{ color: "rgba(255,255,255,0.92)" }}>경험이 없어서가 아닙니다.</span>
              <br />
              <span style={{ background: "linear-gradient(90deg, #818CF8, #38BDF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                꺼내는 방법을 모르기 때문입니다.
              </span>
            </h2>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.9, maxWidth: "560px", wordBreak: "keep-all" }}>
              판단, 이유, 사고 과정 — 이것들이 자소서를 차별화합니다.<br />
              취업소크라테스는 대화로 그것을 꺼냅니다.
            </p>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── 비교 ── */}
        <section className="px-6 py-28" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[860px] mx-auto">
            <div className="mb-12 anim">
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: "1rem" }}>Difference</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)", wordBreak: "keep-all" }}>
                무엇이 다른가요
              </h2>
            </div>
            <div className="anim anim-delay-1" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", minWidth: "520px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.2)", width: "22%" }}>구분</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.02)", borderRadius: "8px 0 0 0", width: "36%" }}>일반 AI 도구</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: ACCENT, background: `${ACCENT}10`, borderRadius: "0 8px 0 0", width: "42%" }}>취업소크라테스</th>
                  </tr>
                </thead>
                <tbody>
                  {DIFF_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(255,255,255,0.28)", borderTop: "1px solid rgba(255,255,255,0.05)", fontWeight: 500 }}>{row.label}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(255,255,255,0.35)", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>{row.other}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.88)", borderTop: `1px solid ${ACCENT}15`, background: `${ACCENT}07` }}>{row.ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-40 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 60%, ${ACCENT}0A 0%, transparent 65%)` }} />
          </div>
          <div className="max-w-[720px] mx-auto flex flex-col items-center text-center gap-7 relative">
            <h2 className="anim" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, wordBreak: "keep-all" }}>
              <span style={{ background: "linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.45) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                한번 써보세요
              </span>
            </h2>
            <p className="anim anim-delay-1" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.38)", wordBreak: "keep-all" }}>
              초안이 있으면 충분합니다.
            </p>
            <div className="anim anim-delay-2">
              <button
                onClick={handleStartChat}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: ACCENT, boxShadow: `0 8px 40px ${ACCENT}40`, fontSize: "16px", letterSpacing: "-0.01em" }}>
                시작해보기
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-2.5">
            <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover" style={{ opacity: 0.6 }} />
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>취업소크라테스</span>
            <a href="mailto:jobsocrates76@gmail.com" className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.2)" }}>
              jobsocrates76@gmail.com
            </a>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
