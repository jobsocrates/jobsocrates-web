"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { HowSection } from "@/components/HowSection";
import { supabase } from "@/lib/supabase";

const NAVY = "#1A3461";
const NAVY_BTN = "#1A3461";
const BLUE = "#3B62CC";
const GOLD = "#D4920A";
const VIOLET = "#7C5CBF";
const DRAFT_MAX = 1200;
const ADMIN_EMAIL = "ijhan6403@gmail.com";
const DOTS = [{ c: NAVY, d: 0 }, { c: BLUE, d: 150 }, { c: GOLD, d: 300 }];
const TEXT = "#0A1628";

const WHY_CARDS = [
  {
    num: "01", color: "#E05A3A",
    text: "합격 자소서를 봐도 내 경험엔 적용이 안 됨",
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="18" height="24" rx="3" stroke="#E05A3A" strokeWidth="2"/>
        <rect x="10" y="8" width="18" height="24" rx="3" fill="#E05A3A10" stroke="#E05A3A" strokeWidth="2"/>
        <line x1="14" y1="16" x2="24" y2="16" stroke="#E05A3A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="20" x2="22" y2="20" stroke="#E05A3A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="24" x2="20" y2="24" stroke="#E05A3A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02", color: BLUE,
    text: "GPT가 써준 자소서 어딘가 어색하고 내 말투가 아님",
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="6" width="22" height="16" rx="4" stroke={BLUE} strokeWidth="2"/>
        <path d="M10 26L14 22H25" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="14" r="2" fill={BLUE}/>
        <circle cx="16" cy="14" r="2" fill={BLUE}/>
        <circle cx="22" cy="14" r="2" fill={BLUE}/>
      </svg>
    ),
  },
  {
    num: "03", color: "#C4890A",
    text: "현직자 단어를 넣어도 내 이야기 같지 않음",
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <circle cx="14" cy="14" r="9" stroke="#C4890A" strokeWidth="2"/>
        <line x1="21" y1="21" x2="28" y2="28" stroke="#C4890A" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="14" x2="18" y2="14" stroke="#C4890A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="10" x2="14" y2="18" stroke="#C4890A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "04", color: VIOLET,
    text: "경험은 있는데 어떻게 풀어야 할지 모르겠음",
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C11.6 4 8 7.6 8 12c0 3 1.6 5.6 4 7.1V22h8v-2.9c2.4-1.5 4-4.1 4-7.1 0-4.4-3.6-8-8-8z" stroke={VIOLET} strokeWidth="2" strokeLinejoin="round"/>
        <line x1="12" y1="26" x2="20" y2="26" stroke={VIOLET} strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="29" x2="19" y2="29" stroke={VIOLET} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function ChatPreviewCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden w-full"
      style={{
        background: "#0A0A18",
        border: `1px solid rgba(107,142,255,0.20)`,
        boxShadow: `0 0 0 1px rgba(107,142,255,0.06), 0 40px 80px rgba(10,20,60,0.40), 0 0 120px rgba(107,142,255,0.12)`,
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
        {([["초안 분석", BLUE], ["이야기 발굴", "#FFD166"], ["문장 완성", "#E05A3A"], ["실전 대비", "#A78BFA"]] as [string, string][]).map(([label, color], i) => (
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
          <div className="px-4 py-2.5 text-sm leading-relaxed" style={{ background: NAVY, color: "#fff", borderRadius: "14px 4px 14px 14px", maxWidth: "75%" }}>
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
    const onScroll = () => setScrolled(window.scrollY > 60);
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

  /* ── nav 색상: 히어로(다크)일 때 흰색, 스크롤 후 다크 ── */
  const navText = scrolled ? "rgba(10,22,40,0.65)" : "rgba(255,255,255,0.80)";
  const navLogo = scrolled ? TEXT : "#FFFFFF";

  return (
    <>
      <div style={{ background: "#FFFFFF", minHeight: "100vh", color: TEXT }}>
        <style>{`
          @keyframes af1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,-40px) scale(1.12)} }
          @keyframes af2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,50px) scale(1.1)} }
          @keyframes af3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,30px) scale(1.06)} }
          @keyframes aurora-r {
            0%   { transform: translateX(-115%) skewX(-8deg); opacity: 0; }
            7%   { opacity: 1; }
            88%  { opacity: 0.7; }
            100% { transform: translateX(215%) skewX(-8deg); opacity: 0; }
          }
          @keyframes aurora-l {
            0%   { transform: translateX(115%) skewX(8deg); opacity: 0; }
            7%   { opacity: 1; }
            88%  { opacity: 0.65; }
            100% { transform: translateX(-215%) skewX(8deg); opacity: 0; }
          }
          @keyframes aurora-ripple {
            0%,100% { transform: skewX(-8deg) scaleY(1); }
            33%     { transform: skewX(4deg) scaleY(1.04); }
            66%     { transform: skewX(-12deg) scaleY(0.97); }
          }
          @keyframes light-sweep {
            0%   { transform: translateY(-120%) rotate(-6deg); opacity: 0; }
            8%   { opacity: 1; }
            88%  { opacity: 0.7; }
            100% { transform: translateY(160%) rotate(-6deg); opacity: 0; }
          }
          @keyframes orb-breathe {
            0%,100% { opacity: 0.10; transform: scale(1); }
            50%     { opacity: 0.22; transform: scale(1.15); }
          }
          @keyframes story-glow {
            0%,100% { filter: brightness(1); }
            50%     { filter: brightness(1.18); }
          }
          .anim { opacity:0; transform:translateY(24px); transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
          .anim.in-view { opacity:1; transform:none; }
          .anim-delay-1 { transition-delay:0.1s; }
          .anim-delay-2 { transition-delay:0.18s; }
          .anim-delay-3 { transition-delay:0.26s; }
          .anim-delay-4 { transition-delay:0.34s; }
          .card-lift { transition:transform 0.2s ease, box-shadow 0.2s ease; }
          .card-lift:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(10,22,40,0.09); }
        `}</style>

        {/* ── 네비 ── */}
        <nav
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(7,14,32,0.40)",
            backdropFilter: "blur(20px)",
            borderBottom: scrolled ? "1px solid rgba(10,22,40,0.08)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="max-w-[1300px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 font-bold text-base tracking-tight hover:opacity-70 transition-opacity"
              style={{ color: navLogo }}
            >
              <img src="/ai-avatar.webp" alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              <span className="hidden sm:inline">취업소크라테스</span>
              <span className="hidden sm:inline text-sm font-normal" style={{ color: scrolled ? "rgba(10,22,40,0.32)" : "rgba(255,255,255,0.38)" }}>JobSocrates</span>
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              {userEmail === ADMIN_EMAIL && (
                <Link href="/board" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: navText }}>
                  커뮤니티
                </Link>
              )}

              {userEmail ? (
                <>
                  {badgeCount !== null && badgeCount > 0 && userEmail !== ADMIN_EMAIL && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: `${GOLD}18`, color: GOLD }}>
                      🏅 {badgeCount}
                    </div>
                  )}
                  {userEmail !== ADMIN_EMAIL && (
                    <Link href="/mypage" className="text-sm font-medium transition-colors hover:opacity-70 flex items-center gap-1" style={{ color: navText }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="hidden sm:inline">마이페이지</span>
                    </Link>
                  )}
                  {userEmail === ADMIN_EMAIL && (
                    <a href="/admin" className="text-sm font-medium transition-colors hover:opacity-70 flex items-center gap-1" style={{ color: navText }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      <span className="hidden sm:inline">관리자</span>
                    </a>
                  )}
                  <a
                    href="/chat"
                    onClick={() => sessionStorage.setItem("showTutorial", "1")}
                    className="text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-85 active:scale-[0.97]"
                    style={scrolled
                      ? { background: NAVY_BTN, color: "#fff" }
                      : { background: "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)" }
                    }
                  >
                    시작하기
                  </a>
                  <button
                    onClick={() => supabase.auth.signOut().then(() => { setUserEmail(null); setBadgeCount(null); })}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: scrolled ? "rgba(10,22,40,0.38)" : "rgba(255,255,255,0.45)" }}
                  >
                    <span className="hidden sm:inline">로그아웃</span>
                    <svg className="sm:hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuth("login")} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: navText }}>
                    로그인
                  </button>
                  <button onClick={() => openAuth("signup")} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: navText }}>
                    회원가입
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-85 active:scale-[0.97]"
                    style={scrolled
                      ? { background: NAVY_BTN, color: "#fff" }
                      : { background: "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)" }
                    }
                  >
                    시작하기
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── 히어로 (다크) ── */}
        <section
          className="min-h-screen flex items-center pt-16 overflow-hidden relative"
          style={{ background: "linear-gradient(145deg, #07101F 0%, #0C1A3A 50%, #081424 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position:"absolute", top:"8%", left:"-6%", width:"650px", height:"580px", borderRadius:"50%", background:BLUE, filter:"blur(130px)", opacity:0.14, animation:"af1 14s ease-in-out infinite" }} />
            <div style={{ position:"absolute", top:"-8%", right:"3%", width:"560px", height:"500px", borderRadius:"50%", background:VIOLET, filter:"blur(120px)", opacity:0.10, animation:"af2 17s ease-in-out infinite" }} />
            <div style={{ position:"absolute", bottom:"8%", left:"30%", width:"480px", height:"400px", borderRadius:"50%", background:"#5EEAD4", filter:"blur(140px)", opacity:0.06, animation:"af3 20s ease-in-out infinite" }} />
          </div>

          <div className="max-w-[1300px] mx-auto px-6 sm:px-8 pt-10 pb-20 w-full flex flex-col lg:flex-row items-center gap-14 lg:gap-20 relative">
            <div className="flex-1 flex flex-col items-start gap-7 anim">

              <div className="flex flex-col gap-0">
                <h1
                  className="text-[2.8rem] sm:text-[3.8rem] lg:text-[4.6rem] xl:text-[5.4rem] font-bold leading-[1.05]"
                  style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.025em" }}
                >
                  베끼는 자소서는
                </h1>
                <h1
                  className="text-[2.8rem] sm:text-[3.8rem] lg:text-[4.6rem] xl:text-[5.4rem] font-bold leading-[1.05]"
                  style={{ background: "linear-gradient(125deg, #60A5FA 0%, #818CF8 32%, #A78BFA 58%, #5EEAD4 88%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.025em" }}
                >
                  끝났습니다.
                </h1>
              </div>

              <p className="text-base sm:text-lg leading-[1.85] max-w-md" style={{ color: "rgba(255,255,255,0.48)", wordBreak: "keep-all" }}>
                당신의 경험은 이미 충분합니다.<br />
                <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>꺼내는 방법</span>이 필요했을 뿐.
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "초안 분석", color: "#60A5FA" },
                  { label: "이야기 발굴", color: "#FFD166" },
                  { label: "문장 완성", color: "#FF8A65" },
                  { label: "실전 대비", color: "#C4B5FD" },
                ].map(({ label, color }, i) => (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartChat}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all hover:opacity-88 active:scale-[0.97]"
                style={{ background: "#FFFFFF", color: NAVY, fontSize: "15px" }}
              >
                시작하기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div className="anim anim-delay-2 flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <ChatPreviewCard />
            </div>
          </div>
        </section>

        {/* ── WHY ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "#FFFFFF" }}>
          <div className="max-w-[900px] mx-auto">
            <div className="mb-14 anim">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: BLUE }}>WHY</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                이런 경험, 있으신가요?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHY_CARDS.map((c, i) => (
                <div
                  key={c.num}
                  className={`card-lift anim anim-delay-${i + 1} rounded-2xl p-6 flex gap-4 items-start`}
                  style={{ background: "#FFFFFF", border: "1px solid rgba(10,22,40,0.08)", boxShadow: "0 1px 6px rgba(10,22,40,0.05)" }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: `${c.color}12`, color: c.color, minWidth: "40px" }}
                  >
                    {c.num}
                  </div>
                  <div className="flex flex-col gap-3 pt-0.5">
                    <div style={{ color: c.color }}>{c.icon}</div>
                    <p className="text-base font-semibold leading-snug" style={{ color: "rgba(10,22,40,0.82)", wordBreak: "keep-all" }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 임팩트 섹션 ── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1A3461 55%, #1C3A78 100%)" }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position:"absolute", top:"-30%", right:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:BLUE, filter:"blur(160px)", opacity:0.12 }} />
            <div style={{ position:"absolute", bottom:"-20%", left:"-5%", width:"400px", height:"400px", borderRadius:"50%", background:"#A78BFA", filter:"blur(130px)", opacity:0.07 }} />
          </div>
          <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-32 relative anim">
            <div className="flex flex-col gap-8">
              <h2
                className="text-4xl sm:text-5xl lg:text-[3.6rem] font-bold leading-[1.15]"
                style={{ color: "#FFFFFF", letterSpacing: "-0.02em", wordBreak: "keep-all" }}
              >
                할 말이 없는 게 아니라,<br />
                <span style={{ background: "linear-gradient(125deg, #60A5FA 0%, #A78BFA 45%, #5EEAD4 85%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  어떻게 꺼낼지
                </span><br />
                몰랐던 거예요.
              </h2>
              <div style={{ width: "36px", height: "2px", background: "rgba(255,255,255,0.20)", borderRadius: "2px" }} />
              <p className="text-base sm:text-lg leading-[1.9] max-w-lg" style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all" }}>
                지금까지 모든 도구는 문장을 고쳐주는 데만 집중했어요.<br />
                취업소크라테스는 <span style={{ color: "rgba(255,255,255,0.82)", fontWeight: 600 }}>꺼내는 것부터</span> 시작합니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── 원칙 ── */}
        <section className="py-24 px-6 sm:px-8" style={{ background: "#F5F7FC" }}>
          <div className="max-w-[1100px] mx-auto anim">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(10,22,40,0.35)" }}>PRINCIPLE</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.15, wordBreak: "keep-all" }}>
                딱 하나만 요청드려요.
              </h2>
              <p className="mt-3 text-base" style={{ color: "rgba(10,22,40,0.4)", wordBreak: "keep-all" }}>
                이것만 지키면, 나머지는 취업소크라테스가 합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { num: "01", color: BLUE, title: "본인의 언어로 대화하세요.", desc: "이곳에서 나누는 대화가 자소서의 재료가 됩니다." },
                { num: "02", color: NAVY, title: "대화 중엔 AI를 쓰지 마세요.", desc: "이 시간만큼은 온전히 당신의 생각이어야 합니다." },
                { num: "03", color: "#C4890A", title: "깊이 고민할수록 달라집니다.", desc: "그 차이는 생각보다 훨씬 큽니다." },
              ].map(({ num, color, title, desc }) => (
                <div
                  key={num}
                  className="card-lift relative rounded-2xl p-6 flex flex-col gap-3 overflow-hidden"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(10,22,40,0.08)", boxShadow: "0 1px 8px rgba(10,22,40,0.05)" }}
                >
                  <span className="absolute right-5 top-4 font-bold tabular-nums select-none pointer-events-none" style={{ fontSize: "4rem", lineHeight: 1, color: `${color}07`, letterSpacing: "-0.03em" }}>{num}</span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${color}12`, color }}>
                    {num}
                  </div>
                  <p className="text-lg font-semibold leading-snug" style={{ color: TEXT, wordBreak: "keep-all", letterSpacing: "-0.01em" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(10,22,40,0.45)", wordBreak: "keep-all" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Redesign Your Story ── */}
        <section className="relative overflow-hidden" style={{ background: "#07090F", minHeight: "600px" }}>

          {/* 위→아래 스위핑 라이트 */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0, left: "-30%", right: "-30%", height: "55%",
              background: "linear-gradient(180deg, transparent 0%, rgba(59,98,204,0.10) 25%, rgba(129,140,248,0.18) 50%, rgba(94,234,212,0.10) 75%, transparent 100%)",
              filter: "blur(32px)",
              animation: "light-sweep 7s cubic-bezier(0.4,0,0.2,1) infinite",
              animationDelay: "0.5s",
            }}
          />

          {/* 배경 오브 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position:"absolute", top:"15%", left:"5%", width:"420px", height:"420px", borderRadius:"50%", background:BLUE, filter:"blur(130px)", opacity:0.10, animation:"orb-breathe 9s ease-in-out infinite" }} />
            <div style={{ position:"absolute", bottom:"10%", right:"8%", width:"360px", height:"360px", borderRadius:"50%", background:VIOLET, filter:"blur(120px)", opacity:0.12, animation:"orb-breathe 11s ease-in-out infinite 2s" }} />
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"280px", height:"280px", borderRadius:"50%", background:"#5EEAD4", filter:"blur(140px)", opacity:0.05, animation:"orb-breathe 13s ease-in-out infinite 4s" }} />
          </div>

          <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-40 relative flex flex-col items-center text-center">

            {/* 브릿지 문구 */}
            <p className="anim text-base sm:text-lg leading-[1.9] mb-14" style={{ color: "rgba(255,255,255,0.30)", wordBreak: "keep-all" }}>
              그 대화가 쌓이면서<br />
              당신만의 자소서가 완성됩니다.
            </p>

            {/* 슬로건 */}
            <div className="anim anim-delay-1 mb-14" style={{ animation: "story-glow 5s ease-in-out infinite" }}>
              <h2
                className="font-bold leading-[0.95] tracking-tight select-none"
                style={{ fontSize: "clamp(3.2rem, 10vw, 7rem)", color: "#FFFFFF", letterSpacing: "-0.03em" }}
              >
                Redesign
              </h2>
              <h2
                className="font-bold leading-[0.95] tracking-tight select-none"
                style={{
                  fontSize: "clamp(3.2rem, 10vw, 7rem)",
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(125deg, #60A5FA 0%, #818CF8 30%, #A78BFA 55%, #5EEAD4 85%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Your Story
              </h2>
            </div>

            {/* 얇은 구분선 */}
            <div className="anim anim-delay-2 mb-10" style={{ width: "1px", height: "52px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.18), transparent)" }} />

            {/* CTA */}
            <div className="anim anim-delay-3">
              <button
                onClick={handleStartChat}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:opacity-88 active:scale-[0.97]"
                style={{ background: "#FFFFFF", color: NAVY, fontSize: "15px", letterSpacing: "-0.01em" }}
              >
                지금 시작하기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-10 px-6 sm:px-8" style={{ borderTop: "1px solid rgba(10,22,40,0.07)", background: "#F5F7FC" }}>
          <div className="max-w-[1300px] mx-auto flex flex-col items-center gap-2.5">
            <img src="/ai-avatar.webp" alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm font-medium" style={{ color: "rgba(10,22,40,0.45)" }}>취업소크라테스 <span style={{ color: "rgba(10,22,40,0.25)" }}>JobSocrates</span></span>
            <div className="flex items-center gap-4">
              {userEmail === ADMIN_EMAIL && (
                <Link href="/board" className="text-sm transition-colors hover:opacity-70" style={{ color: "rgba(10,22,40,0.35)" }}>커뮤니티</Link>
              )}
              <a href="mailto:jobsocrates76@gmail.com" className="text-sm transition-colors hover:opacity-70" style={{ color: "rgba(10,22,40,0.35)" }}>co-work · jobsocrates76@gmail.com</a>
            </div>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
