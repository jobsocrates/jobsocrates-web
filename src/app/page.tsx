"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { HowSection } from "@/components/HowSection";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const NAV_BTN = "#F06428";
const BLUE = "#6B8EFF";
const BG = "#0D0D18";
const ADMIN_EMAIL = "ijhan6403@gmail.com";
const DOTS = [{ c: "#C96442", d: 0 }, { c: "#6B8EFF", d: 150 }, { c: "#FFD166", d: 300 }];

/* ── WHY 카드 ── */
const WHY_CARDS = [
  {
    num: "01", color: "#FF7A5C",
    text: "합격 자소서를 봐도 내 경험엔 적용이 안 됨",
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="18" height="24" rx="3" stroke="#FF7A5C" strokeWidth="2"/>
        <rect x="10" y="8" width="18" height="24" rx="3" fill="#FF7A5C18" stroke="#FF7A5C" strokeWidth="2"/>
        <line x1="14" y1="16" x2="24" y2="16" stroke="#FF7A5C" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="20" x2="22" y2="20" stroke="#FF7A5C" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="24" x2="20" y2="24" stroke="#FF7A5C" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02", color: "#6B8EFF",
    text: "GPT가 써준 자소서 어딘가 어색하고 내 말투가 아님",
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="6" width="22" height="16" rx="4" stroke="#6B8EFF" strokeWidth="2"/>
        <path d="M10 26L14 22H25" stroke="#6B8EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="14" r="2" fill="#6B8EFF"/>
        <circle cx="16" cy="14" r="2" fill="#6B8EFF"/>
        <circle cx="22" cy="14" r="2" fill="#6B8EFF"/>
      </svg>
    ),
  },
  {
    num: "03", color: "#FFD166",
    text: "현직자 단어를 넣어도 내 이야기 같지 않음",
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="14" cy="14" r="9" stroke="#FFD166" strokeWidth="2"/>
        <line x1="21" y1="21" x2="28" y2="28" stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="14" x2="18" y2="14" stroke="#FFD166" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="10" x2="14" y2="18" stroke="#FFD166" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "04", color: "#A78BFA",
    text: "경험은 있는데 어떻게 풀어야 할지 모르겠음",
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C11.6 4 8 7.6 8 12c0 3 1.6 5.6 4 7.1V22h8v-2.9c2.4-1.5 4-4.1 4-7.1 0-4.4-3.6-8-8-8z" stroke="#A78BFA" strokeWidth="2" strokeLinejoin="round"/>
        <line x1="12" y1="26" x2="20" y2="26" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="29" x2="19" y2="29" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

/* ── 채팅 미리보기 ── */
function ChatPreviewCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden w-full"
      style={{
        background: "#0A0A18",
        border: `1px solid rgba(107,142,255,0.18)`,
        boxShadow: `0 0 0 1px rgba(107,142,255,0.06), 0 48px 100px rgba(0,0,0,0.75), 0 0 120px rgba(107,142,255,0.12)`,
        maxWidth: "480px",
      }}
    >
      <div className="flex items-center px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1.5 flex-shrink-0">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="flex-1 text-center text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>취업소크라테스</span>
        <div style={{ width: "42px" }} />
      </div>
      <div className="flex items-center px-4 py-3 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.05)", gap: "4px" }}>
        {([["진단", BLUE], ["논리 보강", "#FFD166"], ["자소서 완성", ACCENT], ["예상 질문", "#A78BFA"]] as [string, string][]).map(([label, color], i) => (
          <div key={label} className="flex items-center flex-shrink-0">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" style={{ margin: "0 4px" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <div className="flex items-center gap-1.5">
              <div style={{ width: "17px", height: "17px", borderRadius: "50%", background: i === 0 ? color : "rgba(255,255,255,0.05)", color: i === 0 ? "#fff" : "rgba(255,255,255,0.18)", fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: "11px", color: i === 0 ? color : "rgba(255,255,255,0.2)", fontWeight: i === 0 ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
            <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            <span className="text-sm font-semibold" style={{ color: BLUE }}>초안 진단</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {[["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.85)"], ["②", "핵심 경험이 너무 추상적이에요", "rgba(255,255,255,0.5)"], ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.5)"]].map(([num, text, clr]) => (
              <div key={num} className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0 font-bold" style={{ color: BLUE }}>{num}</span>
                <p className="text-sm leading-relaxed" style={{ color: clr }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2.5">
          <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          <div className="px-4 py-2.5 text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderRadius: "4px 14px 14px 14px", maxWidth: "82%" }}>
            「팀 성과」라고 하셨는데 — 당신이 직접 한 게 뭔가요?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="px-4 py-2.5 text-sm leading-relaxed" style={{ background: ACCENT, color: "#fff", borderRadius: "14px 4px 14px 14px", maxWidth: "75%" }}>
            API 설계랑 QA를 혼자 담당했어요
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
            <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            <span className="text-sm font-semibold" style={{ color: BLUE }}>자소서 완성중</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex gap-1.5 items-center h-4">
              {DOTS.map(({ c, d }) => (<span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: c, animationDelay: `${d}ms` }} />))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 ── */
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
        <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300" style={{ background: scrolled ? "rgba(13,13,24,0.94)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent" }}>
          <div className="max-w-[1300px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 font-bold text-white text-base tracking-tight hover:opacity-80 transition-opacity"
            >
              <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              취업소크라테스
              <span className="hidden sm:inline text-sm font-normal" style={{ color: "rgba(255,255,255,0.28)" }}>JobSocrates</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/board"
                className="text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                게시판
              </Link>
              {userEmail ? (
                <>
                  {/* 뱃지 카운트 */}
                  {badgeCount !== null && badgeCount > 0 && userEmail !== ADMIN_EMAIL && (
                    <div
                      className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold"
                      style={{ background: "rgba(255,209,102,0.12)", border: "1px solid rgba(255,209,102,0.25)", color: "rgba(255,209,102,0.9)" }}
                    >
                      🏅 {badgeCount}
                    </div>
                  )}
                  {userEmail !== ADMIN_EMAIL && (
                    <Link
                      href="/mypage"
                      className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="hidden sm:inline">마이페이지</span>
                    </Link>
                  )}
                  {userEmail === ADMIN_EMAIL && (
                    <a href="/admin" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.18)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      <span className="hidden sm:inline">관리자</span>
                    </a>
                  )}
                  <a href="/chat" onClick={() => sessionStorage.setItem("showTutorial", "1")} className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl font-bold transition-all hover:scale-[1.04] active:scale-[0.97]" style={{ background: NAV_BTN, color: "#fff", boxShadow: `0 2px 18px ${NAV_BTN}50` }}>
                    시작하기
                  </a>
                  <button onClick={() => supabase.auth.signOut().then(() => { setUserEmail(null); setBadgeCount(null); })} className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-xl transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span className="hidden sm:inline">로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuth("login")} className="text-sm px-4 py-2 rounded-xl transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.65)" }}>로그인</button>
                  <button onClick={() => openAuth("signup")} className="text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:scale-[1.03]" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.18)" }}>회원가입</button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── 히어로 ── */}
        <section className="min-h-screen flex items-center pt-16 overflow-hidden relative">
          <style>{`
            @keyframes af1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-40px) scale(1.12)} }
            @keyframes af2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,50px) scale(1.1)} }
            @keyframes af3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,30px) scale(1.06)} }
          `}</style>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position:"absolute", top:"5%", left:"-8%", width:"700px", height:"620px", borderRadius:"50%", background:"#F06428", filter:"blur(130px)", opacity:0.13, animation:"af1 14s ease-in-out infinite" }} />
            <div style={{ position:"absolute", top:"-12%", right:"2%", width:"620px", height:"540px", borderRadius:"50%", background:"#6B8EFF", filter:"blur(110px)", opacity:0.10, animation:"af2 17s ease-in-out infinite" }} />
            <div style={{ position:"absolute", bottom:"5%", left:"28%", width:"520px", height:"420px", borderRadius:"50%", background:"#A78BFA", filter:"blur(120px)", opacity:0.07, animation:"af3 20s ease-in-out infinite" }} />
          </div>

          <div className="max-w-[1300px] mx-auto px-6 sm:px-8 py-20 w-full flex flex-col lg:flex-row items-center gap-14 lg:gap-20 relative">
            <div className="flex-1 flex flex-col items-start gap-8 anim">
              <div className="flex flex-col gap-1">
                <h1 className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem] font-black leading-[1.05] tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
                  베끼는 자소서는
                </h1>
                <h1
                  className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem] font-black leading-[1.05] tracking-tight"
                  style={{ background: `linear-gradient(135deg, #fff 10%, ${NAV_BTN} 80%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.03em" }}
                >
                  끝났습니다
                </h1>
              </div>

              <p className="text-lg sm:text-xl lg:text-2xl leading-[1.7] max-w-xl" style={{ color: "rgba(255,255,255,0.52)" }}>
                합격 사례를 베껴도, GPT에 맡겨도<br />
                내 이야기가 되지 않는 자소서.<br />
                <span style={{ color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>직접 고민할 때, 비로소 진짜 내 무기</span>가 됩니다.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{ background: NAV_BTN, boxShadow: `0 6px 28px ${NAV_BTN}50`, fontSize: "16px", letterSpacing: "-0.01em" }}
                >
                  시작하기
                  <span style={{ fontSize: "18px", fontWeight: 300, lineHeight: "16px", display: "flex", alignItems: "center" }}>›</span>
                </button>
              </div>
            </div>

            <div className="anim anim-delay-2 flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <ChatPreviewCard />
            </div>
          </div>
        </section>

        {/* ── WHY (2×2 그리드, 가운데 정렬) ── */}
        <section className="py-32 px-6 sm:px-8" style={{ background: "#0B0C1C" }}>
          <div className="max-w-[900px] mx-auto">
            <div className="mb-16 text-center anim">
              <p className="text-sm font-bold tracking-[0.22em] uppercase mb-4" style={{ color: NAV_BTN }}>WHY</p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white" style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                이런 경험<br className="sm:hidden" /> 있으신가요?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY_CARDS.map((c, i) => (
                <div
                  key={c.num}
                  className={`card-depth anim anim-delay-${i + 1} rounded-2xl p-7 flex flex-col gap-5`}
                  style={{ background: "rgba(255,255,255,0.035)", border: `1px solid rgba(255,255,255,0.09)`, borderLeft: `3px solid ${c.color}70` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl" style={{ background: `${c.color}12` }}>
                      {c.icon}
                    </div>
                    <span className="text-xs font-black tabular-nums tracking-widest" style={{ color: `${c.color}60` }}>{c.num}</span>
                  </div>
                  <p className="text-lg font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)", wordBreak: "keep-all" }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 브릿지 WHY→HOW ── */}
        <section className="px-6 sm:px-8" style={{ background: "#0D0E1F" }}>
          <div className="max-w-[900px] mx-auto py-28 anim flex flex-col gap-10">
            <p className="text-base font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>이 네 가지, 공통점이 하나 있어요.</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black" style={{ wordBreak: "keep-all", letterSpacing: "-0.03em", lineHeight: 1.35 }}>
              <span className="text-white">할 말이 없는 게 아니라</span><br />
              <span style={{ background: "linear-gradient(120deg, #818CF8 0%, #38BDF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>어떻게 꺼내야 할지</span><br />
              <span className="text-white">모르는 거예요.</span>
            </h2>
            <p className="text-lg sm:text-xl leading-[1.9] max-w-2xl" style={{ color: "rgba(255,255,255,0.5)", wordBreak: "keep-all" }}>
              지금까지 모든 도구는 문장을 고쳐주는 데만 집중했어요.<br />
              취업소크라테스는 <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>꺼내는 것부터</span> 시작합니다.
            </p>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── 원칙 (MZ 3열 카드) ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "#0A0B1C" }}>
          <div className="max-w-[1100px] mx-auto anim">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>PRINCIPLE</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em", lineHeight: 1.1, wordBreak: "keep-all" }}>
                딱 하나만 요청드려요.
              </h2>
              <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,0.38)", wordBreak: "keep-all" }}>
                이것만 지키면, 나머지는 취업소크라테스가 합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { num: "01", color: BLUE, title: "본인의 언어로 대화하세요.", desc: "이곳에서 나누는 대화가 자소서의 재료가 됩니다." },
                { num: "02", color: NAV_BTN, title: "대화 중엔 AI를 쓰지 마세요.", desc: "이 시간만큼은 온전히 당신의 생각이어야 합니다." },
                { num: "03", color: "#FFD166", title: "깊이 고민할수록 달라집니다.", desc: "그 차이는 생각보다 훨씬 큽니다." },
              ].map(({ num, color, title, desc }) => (
                <div
                  key={num}
                  className="card-depth relative rounded-2xl p-7 flex flex-col gap-4 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.035)", border: `1px solid rgba(255,255,255,0.09)` }}
                >
                  <span
                    className="absolute right-5 top-4 font-black tabular-nums select-none pointer-events-none"
                    style={{ fontSize: "4.5rem", lineHeight: 1, color: `${color}0C`, letterSpacing: "-0.05em" }}
                  >
                    {num}
                  </span>
                  <span className="text-xs font-black tracking-[0.18em] uppercase" style={{ color }}>{num}</span>
                  <p className="text-xl font-bold text-white leading-snug" style={{ wordBreak: "keep-all", letterSpacing: "-0.01em" }}>{title}</p>
                  <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", wordBreak: "keep-all" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 클로징 브릿지 ── */}
        <section className="py-32 px-6 sm:px-8" style={{ background: "#07081A" }}>
          <div className="max-w-[800px] mx-auto text-center anim flex flex-col items-center gap-8">
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.35)", wordBreak: "keep-all" }}>
              질문에 자세하게 답할수록, 더 좋은 질문이 돌아옵니다.
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-black"
              style={{ letterSpacing: "-0.03em", wordBreak: "keep-all", lineHeight: 1.35 }}
            >
              <span className="text-white">그 대화가 쌓이면서</span><br />
              <span style={{ background: "linear-gradient(135deg, #FFD166 10%, #A78BFA 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>당신만의 자소서가</span><br />
              <span className="text-white">완성됩니다.</span>
            </h2>
            <div style={{ width: "48px", height: "2px", background: `${NAV_BTN}60`, borderRadius: "2px" }} />
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-36 px-6 sm:px-8 relative overflow-hidden" style={{ background: "#070818" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${NAV_BTN}10 0%, transparent 60%)` }} />
          </div>
          <div className="max-w-[800px] mx-auto flex flex-col items-center text-center gap-8 relative">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white anim" style={{ letterSpacing: "-0.03em", lineHeight: 1.3, wordBreak: "keep-all" }}>
              준비됐으면<br />지금 시작하세요
            </h2>
            <p className="text-xl anim anim-delay-1" style={{ color: "rgba(255,255,255,0.4)" }}>첫 문항은 무료입니다.</p>
            <div className="anim anim-delay-2">
              <button
                onClick={handleStartChat}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: NAV_BTN, boxShadow: `0 8px 36px ${NAV_BTN}50`, fontSize: "18px", letterSpacing: "-0.01em" }}
              >
                시작하기
                <span style={{ fontSize: "20px", fontWeight: 300, lineHeight: "18px", display: "flex", alignItems: "center" }}>›</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-10 px-6 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#07091A" }}>
          <div className="max-w-[1300px] mx-auto flex flex-col items-center gap-2.5">
            <img src="/ai-avatar.webp" alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>취업소크라테스 <span style={{ color: "rgba(255,255,255,0.2)" }}>JobSocrates</span></span>
            <div className="flex items-center gap-4">
              <Link href="/board" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.3)" }}>게시판</Link>
              <a href="mailto:jobsocrates76@gmail.com" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.3)" }}>co-work · jobsocrates76@gmail.com</a>
            </div>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
