"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { HowSection } from "@/components/HowSection";
import { MOCKS } from "@/components/StepMocks";

const ACCENT = "#FF6B35";
const BG = "#0D0D18";

const WHY_CARDS = [
  { num: "01", text: "합격 자소서를 봐도 내 경험엔 적용이 안 됨" },
  { num: "02", text: "GPT가 써준 자소서 어딘가 어색하고 내 말투가 아님" },
  { num: "03", text: "현직자 단어를 넣어도 내 이야기 같지 않음" },
  { num: "04", text: "경험은 있는데 어떻게 풀어야 할지 모르겠음" },
];

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [scrolled, setScrolled] = useState(false);
  const [activeHeroStep, setActiveHeroStep] = useState(0);
  const heroSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // scroll animations
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".anim").forEach((el) => observer.observe(el));

    // nav scroll + hero step tracking
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      if (window.innerWidth >= 1024 && heroSectionRef.current) {
        const rect = heroSectionRef.current.getBoundingClientRect();
        const scrolledIn = -rect.top;
        if (scrolledIn >= 0) {
          setActiveHeroStep(Math.min(Math.floor(scrolledIn / window.innerHeight), 4));
        } else {
          setActiveHeroStep(0);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  function openAuth(tab: "login" | "signup") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
      <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)" }}>

        {/* ── 네비게이션 ── */}
        <nav
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(13,13,24,0.85)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-semibold text-white text-sm tracking-tight">
              취업소크라테스 <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>{" "}
              <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>JobSocrates</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth("login")}
                className="text-sm px-4 py-2 rounded-xl transition-colors"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                로그인
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="text-sm px-4 py-2 rounded-xl font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                회원가입
              </button>
            </div>
          </div>
        </nav>

        {/* ── 히어로 ── */}
        <section
          ref={heroSectionRef}
          id="hero-section"
          className="relative hero-scroll-section"
        >
          <div className="sticky top-0 h-screen flex items-center overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 py-20 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* 텍스트 */}
              <div className="flex-1 flex flex-col items-start gap-6 anim">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                  첫 문항 무료 · 지금 바로 시작
                </div>

                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white">
                  베끼는 자소서는<br />끝났습니다.
                </h1>

                <p className="text-base sm:text-lg leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.52)" }}>
                  합격 사례를 베껴도, GPT에 맡겨도 내 이야기가 되지 않는 자소서.
                  <br className="hidden sm:block" />
                  직접 생각하고 치열하게 고민할 때, 비로소 진짜 내 무기가 됩니다.
                </p>

                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{ background: ACCENT, boxShadow: `0 0 32px ${ACCENT}55` }}
                >
                  지금 시작하기 →
                </Link>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>첫 문항 무료 · 가입 없이 바로 시작</p>
              </div>

              {/* 미리보기 카드 */}
              <div className="anim anim-delay-2 flex-shrink-0 flex justify-center" style={{ width: "min(100%, 360px)" }}>
                <div className="relative w-full" style={{ height: "min(460px, calc(100vh - 11rem))" }}>
                  {MOCKS.map((Mock, i) => (
                    <div
                      key={i}
                      className="absolute inset-0"
                      style={{
                        opacity: activeHeroStep === i ? 1 : 0,
                        transform: `translateY(${activeHeroStep === i ? 0 : activeHeroStep > i ? -20 : 20}px)`,
                        transition: "opacity 0.5s ease, transform 0.5s ease",
                        pointerEvents: activeHeroStep === i ? "auto" : "none",
                      }}
                    >
                      <Mock />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 스크롤 트리거 — 데스크탑 전용 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              id={`step-${i + 1}-preview`}
              className="absolute w-full hidden lg:block pointer-events-none"
              style={{ top: `${i * 100}vh`, height: "100vh" }}
            />
          ))}
        </section>

        {/* ── WHY ── */}
        <section className="py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14 anim">
              <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: ACCENT }}>WHY</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">이런 경험 있으신가요?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY_CARDS.map((c, i) => (
                <div
                  key={c.num}
                  className={`anim anim-delay-${i + 1} rounded-2xl p-6 flex items-start gap-4 transition-all hover:scale-[1.02]`}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-3xl font-black flex-shrink-0" style={{ color: "rgba(255,255,255,0.07)", lineHeight: 1 }}>{c.num}</span>
                  <p className="text-sm leading-relaxed pt-1" style={{ color: "rgba(255,255,255,0.72)" }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── CTA ── */}
        <section className="py-28 px-6 text-center" style={{ background: "#080B1A" }}>
          <div className="max-w-xl mx-auto anim flex flex-col items-center gap-5">
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: ACCENT }}>시작하기</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              그냥 한번 써보고<br />결정하세요.
            </h2>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>첫 문항은 무료입니다.</p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.04] active:scale-[0.97] mt-2"
              style={{ background: ACCENT, boxShadow: `0 0 40px ${ACCENT}45` }}
            >
              지금 첨삭 시작하기 →
            </Link>
          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              취업소크라테스 · <span style={{ color: "rgba(255,255,255,0.25)" }}>JobSocrates</span>
            </span>
            <a
              href="mailto:jobsocrates76@gmail.com"
              className="text-sm transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              jobsocrates76@gmail.com
            </a>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
