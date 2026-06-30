"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { ProcessShowcase } from "@/components/ProcessShowcase";
import { trackVisitor } from "@/lib/track";
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

function ChatPreviewCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden w-full relative"
      style={{
        background: "linear-gradient(165deg, #0F1E42 0%, #0B1733 100%)",
        border: "1px solid rgba(129,140,248,0.18)",
        boxShadow: "0 28px 64px -24px rgba(6,12,32,0.85), 0 0 0 1px rgba(129,140,248,0.05)",
        maxWidth: "480px",
      }}
    >
      {/* 내부 오로라 글로우 */}
      <div style={{ position: "absolute", top: "-28%", right: "-16%", width: "320px", height: "320px", borderRadius: "50%", background: "#3B62CC", filter: "blur(90px)", opacity: 0.20, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-24%", left: "-12%", width: "260px", height: "260px", borderRadius: "50%", background: "#A78BFA", filter: "blur(90px)", opacity: 0.10, pointerEvents: "none" }} />

      <div className="relative">
      <div className="flex items-center px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex gap-1.5 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          ))}
        </div>
        <span className="flex-1 text-center text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>취업소크라테스</span>
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
            {[["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.85)"], ["②", "판단 과정이 보이지 않아요", "rgba(255,255,255,0.5)"], ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.5)"]].map(([num, text, clr]) => (
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
            그 방법, 왜 택했어요? 다른 선택지도 있었을 텐데.
          </div>
        </div>
        <div className="flex justify-end">
          <div className="px-4 py-2.5 text-sm leading-relaxed" style={{ background: "linear-gradient(135deg, #2A3B7A 0%, #1E2C5C 100%)", color: "rgba(255,255,255,0.94)", borderRadius: "14px 4px 14px 14px", maxWidth: "75%", border: "1px solid rgba(129,140,248,0.22)" }}>
            리스크는 컸지만, 마감 안에 검증 가능한 건 그거뿐이라고 봤어요
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
    trackVisitor();
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

              {userEmail ? (
                <>
                  {badgeCount !== null && badgeCount > 0 && userEmail !== ADMIN_EMAIL && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold" style={{ background: `${GOLD}18`, color: GOLD }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                      {badgeCount}
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
                  경험은 있는데,
                </h1>
                <h1
                  className="text-[2.8rem] sm:text-[3.8rem] lg:text-[4.6rem] xl:text-[5.4rem] font-bold leading-[1.05]"
                  style={{ background: "linear-gradient(125deg, #60A5FA 0%, #818CF8 32%, #A78BFA 58%, #5EEAD4 88%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.025em" }}
                >
                  글로는 안 풀립니다.
                </h1>
              </div>

              <p className="text-base sm:text-lg leading-[1.85] max-w-md" style={{ color: "rgba(255,255,255,0.48)", wordBreak: "keep-all" }}>
                프로젝트도, 인턴도, 직접 부딪혀도 봤는데<br />
                자소서엔 <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>"열심히 했습니다"</span>만 남습니다.<br />
                <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>질문으로, 그 안의 판단을 꺼냅니다.</span>
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

        {/* ── 차별점 (WHY US) ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "#FFFFFF" }}>
          <div className="max-w-[1000px] mx-auto">
            <div className="mb-14 anim">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: BLUE }}>WHY US</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.18, wordBreak: "keep-all" }}>
                잘 쓴 자소서보다,<br /><span style={{ color: BLUE }}>끝까지 설명할 수 있는 자소서.</span>
              </h2>
              <p className="text-base sm:text-lg leading-[1.9] max-w-xl" style={{ color: "rgba(10,22,40,0.50)", wordBreak: "keep-all" }}>
                좋은 문장은 누구나 만들 수 있는 시대입니다.<br />
                차이는 그다음에 드러납니다 — 면접에서 <span style={{ color: TEXT, fontWeight: 600 }}>“왜 그렇게 하셨어요?”</span> 앞에서.<br />
                취업소크라테스는 <span style={{ color: TEXT, fontWeight: 600 }}>그 답까지 당신 안에서 꺼냅니다.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 흔한 AI 툴 */}
              <div className="anim anim-delay-1 rounded-2xl p-7 flex flex-col" style={{ background: "#F6F7F9", border: "1px solid rgba(10,22,40,0.06)" }}>
                <span className="self-start text-xs font-semibold px-3 py-1 rounded-full mb-5" style={{ background: "rgba(10,22,40,0.05)", color: "rgba(10,22,40,0.42)" }}>AI에게 맡기면</span>
                <p className="text-xl font-bold mb-5" style={{ color: "rgba(10,22,40,0.72)", letterSpacing: "-0.01em" }}>문장이 완성됩니다</p>
                <ul className="flex flex-col gap-3.5">
                  {["버튼 한 번에 문장이 나옵니다", "빠르고, 매끄럽습니다", "다만 면접에선 다시 내 말로 설명해야 합니다"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(10,22,40,0.08)" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(10,22,40,0.4)" strokeWidth="3" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12"/></svg>
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(10,22,40,0.5)", wordBreak: "keep-all" }}>{t}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 취업소크라테스 */}
              <div className="anim anim-delay-2 rounded-2xl p-7 flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1A3461 100%)", border: `1px solid ${BLUE}` }}>
                <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"260px", height:"260px", borderRadius:"50%", background:BLUE, filter:"blur(90px)", opacity:0.25 }} />
                <span className="self-start text-xs font-semibold px-3 py-1 rounded-full mb-5 relative" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>취업소크라테스</span>
                <p className="text-xl font-bold mb-5 relative" style={{ color: "#fff", letterSpacing: "-0.01em" }}>생각을 꺼냅니다</p>
                <ul className="flex flex-col gap-3.5 relative">
                  {["질문에 답하며 직접 생각합니다", "그래서 전부 내 언어, 내 판단입니다", "그 대화가 그대로 면접 답변이 됩니다"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: BLUE }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>{t}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 취업소크라테스 특징 (FEATURES) ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "linear-gradient(180deg, #F7F8FB 0%, #FFFFFF 100%)" }}>
          <div className="max-w-[1000px] mx-auto">
            <div className="mb-14 anim">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: BLUE }}>FEATURES</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.18, wordBreak: "keep-all" }}>
                마케팅은 빼고,<br /><span style={{ color: BLUE }}>오직 여러분의 합격만 생각했습니다.</span>
              </h2>
              <p className="text-base sm:text-lg leading-[1.9] max-w-xl" style={{ color: "rgba(10,22,40,0.50)", wordBreak: "keep-all" }}>
                화려한 포장 대신, 합격에 필요한 곳에만 기술을 쏟았습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 분석량 — 네이비 강조 카드 (전체 폭) */}
              <div className="sm:col-span-2 anim anim-delay-1 rounded-2xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1A3461 100%)", border: `1px solid ${BLUE}` }}>
                <div style={{ position: "absolute", top: "-30%", right: "-5%", width: "300px", height: "300px", borderRadius: "50%", background: BLUE, filter: "blur(100px)", opacity: 0.25 }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-9">
                  <div className="flex-shrink-0">
                    <p className="text-4xl sm:text-5xl font-bold" style={{ color: "#fff", letterSpacing: "-0.02em" }}>20~30만 자</p>
                    <p className="text-sm mt-1.5" style={{ color: BLUE }}>1,000자 한 편을 위한 평균 분석량</p>
                  </div>
                  <p className="text-sm sm:text-base leading-[1.8]" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
                    여러분이 받는 1,000자 뒤에는 평균 <b style={{ color: "#fff" }}>그 200~300배</b>의 분석이 숨어 있습니다. 디깅 대화부터 완성본, 면접 준비까지, 보이지 않는 곳에서 더 깊이 파고듭니다.
                  </p>
                </div>
              </div>

              {/* 나머지 특징 카드 */}
              {[
                { icon: "💸", title: "문항당 초저가", desc: "지갑 사정이 가벼운 취준생 분들을 위해, 부담 없는 가격으로 만들었습니다." },
                { icon: "🛠️", title: "타협 없는 구현", desc: "분석·디깅·검증을 잇는 파이프라인을 직접 설계해 품질을 끌어올렸습니다." },
                { icon: "🔁", title: "최대 3개 완성본", desc: "최대 3개의 완성본 중 나에게 가장 잘 맞는 하나를 선택합니다." },
                { icon: "🎤", title: "면접까지 한 번에", desc: "압박형 예상질문, 답변, 피드백, 보강, 문장 첨삭. 면접 방향성 제시와 PDF 출력까지." },
              ].map((f, i) => (
                <div key={f.title} className={`anim anim-delay-${(i % 2) + 1} rounded-2xl p-7 flex flex-col`} style={{ background: "#F6F7F9", border: "1px solid rgba(10,22,40,0.06)" }}>
                  <span className="text-2xl mb-4">{f.icon}</span>
                  <p className="text-lg font-bold mb-2.5" style={{ color: TEXT, letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p className="text-sm leading-[1.75]" style={{ color: "rgba(10,22,40,0.55)", wordBreak: "keep-all" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 프로세스 쇼케이스 (왜+이득 / 실제화면) ── */}
        <ProcessShowcase />

        {/* ── 후기 ── */}
        <section className="py-24 px-6 sm:px-8" style={{ background: "linear-gradient(180deg, #F0F2F8 0%, #F5F7FC 100%)" }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-12 anim">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: BLUE }}>REVIEW</p>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                직접 써본 분들의 이야기
              </h2>
            </div>
            <div className="anim columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: "12px" }}>
              {([
                { src: "/review1.png" },
                { src: "/review2.png" },
                { src: "/review3.png" },
                { src: "/review4.png" },
                { src: "/review5.png" },
              ] as { src: string; cropTop?: number }[]).map(({ src, cropTop }, i) => (
                <div
                  key={i}
                  style={{
                    breakInside: "avoid",
                    marginBottom: "12px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 8px 30px -10px rgba(10,22,40,0.18)",
                    border: "1px solid rgba(10,22,40,0.05)",
                    background: "#fff",
                    padding: "6px",
                  }}
                >
                  <div style={{ overflow: "hidden", borderRadius: "12px" }}>
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        display: "block",
                        ...(cropTop ? { marginTop: `-${cropTop}px` } : {}),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 원칙 ── */}
        <section className="py-24 px-6 sm:px-8" style={{ background: "#F5F7FC" }}>
          <div className="max-w-[1100px] mx-auto anim">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(10,22,40,0.35)" }}>HOW TO USE</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold" style={{ color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.18, wordBreak: "keep-all" }}>
                진심으로 임한 만큼,<br />더 많은 걸 얻어갑니다.
              </h2>
              <p className="mt-4 text-base sm:text-lg" style={{ color: "rgba(10,22,40,0.45)", wordBreak: "keep-all" }}>
                대충 넘기면 딱 그만큼만 나와요. 진짜 면접이라 생각하고, 이 세 가지만 지켜주세요.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { num: "01", color: BLUE, title: "진짜 면접이라 생각하세요", desc: "실무자 앞이라 여기고 답할수록 더 깊은 질문이 돌아와요. 날것으로 대충 넘기지 마세요." },
                { num: "02", color: VIOLET, title: "막히면 공부하고 조사해 오세요", desc: "그 자리에서 지어내기보다, 찾아보고 정리해서 오면 글이 훨씬 단단해져요." },
                { num: "03", color: "#C4890A", title: "고민한 만큼 결과가 달라집니다", desc: "성의껏 답할수록 자소서도, 면접 준비도 좋아져요. 그 차이는 생각보다 큽니다." },
              ].map(({ num, color, title, desc }) => (
                <div
                  key={num}
                  className="card-lift rounded-2xl p-7 flex flex-col gap-5"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(10,22,40,0.07)", boxShadow: "0 1px 3px rgba(10,22,40,0.04)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center rounded-lg text-sm font-bold" style={{ width: "30px", height: "30px", background: `${color}12`, color }}>{num}</span>
                    <span style={{ width: "22px", height: "2px", borderRadius: "2px", background: `${color}45` }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-lg font-bold leading-snug" style={{ color: TEXT, wordBreak: "keep-all", letterSpacing: "-0.01em" }}>{title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(10,22,40,0.45)", wordBreak: "keep-all" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 우리가 믿는 것 (manifesto) ── */}
        <section className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse 85% 62% at 50% 50%, #16294D 0%, #0A1228 68%)" }}>
          <style>{`@keyframes mani-breathe { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.5; } 50% { transform: translate(-50%,-50%) scale(1.1); opacity: 0.85; } }`}</style>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "560px", height: "360px", borderRadius: "50%", background: "#5EEAD4", filter: "blur(175px)", opacity: 0.07, animation: "mani-breathe 13s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "-12%", left: "50%", transform: "translateX(-50%)", width: "660px", height: "320px", borderRadius: "50%", background: "#E8945E", filter: "blur(185px)", opacity: 0.05 }} />
          </div>
          <div className="relative max-w-[720px] mx-auto px-6 sm:px-8 py-40 text-center">
            <h2 className="anim text-[27px] sm:text-[40px] font-bold leading-[1.5]" style={{ color: "rgba(255,255,255,0.93)", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
              생각이 부족했던 게 아니에요.<br />
              <span style={{ color: "#7FF0DC", textShadow: "0 0 28px rgba(94,234,212,0.45)" }}>방향</span>을 몰랐을 뿐.
            </h2>
            <p className="anim anim-delay-2 text-[15px] sm:text-[17px] leading-[1.9] mt-7" style={{ color: "rgba(255,255,255,0.45)", wordBreak: "keep-all" }}>
              면접에서 진짜 통하는 건 직접 고민하다 나온<br className="hidden sm:block" /> <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>당신의 한마디</span>예요.
            </p>
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
              대화가 쌓이면서<br />
              당신만의 이야기가 완성됩니다.
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
        <footer className="py-10 px-6 sm:px-8" style={{ background: "#0A1628", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[1300px] mx-auto flex flex-col items-center gap-3">
            <img src="/ai-avatar.webp" alt="" className="w-8 h-8 rounded-full object-cover opacity-80" />
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>취업소크라테스 <span style={{ color: "rgba(255,255,255,0.25)" }}>JobSocrates</span></span>
            <div className="flex items-center gap-4">
              {userEmail === ADMIN_EMAIL && (
                <Link href="/board" className="text-sm transition-colors hover:opacity-70" style={{ color: "rgba(255,255,255,0.35)" }}>커뮤니티</Link>
              )}
              <a href="mailto:jobsocrates76@gmail.com" className="text-xs transition-colors hover:opacity-70" style={{ color: "rgba(255,255,255,0.3)" }}>co-work · jobsocrates76@gmail.com</a>
            </div>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
