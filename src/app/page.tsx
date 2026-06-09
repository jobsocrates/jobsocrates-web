"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { HowSection } from "@/components/HowSection";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const BG = "#0D0D18";
const DOTS = [{ c: "#C96442", d: 0 }, { c: "#6B8EFF", d: 150 }, { c: "#FFD166", d: 300 }];

const WHY_CARDS = [
  { num: "01", text: "합격 자소서를 봐도 내 경험엔 적용이 안 됨", color: ACCENT },
  { num: "02", text: "GPT가 써준 자소서 어딘가 어색하고 내 말투가 아님", color: BLUE },
  { num: "03", text: "현직자 단어를 넣어도 내 이야기 같지 않음", color: "#FFD166" },
  { num: "04", text: "경험은 있는데 어떻게 풀어야 할지 모르겠음", color: "#A78BFA" },
];

function ChatPreviewCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden w-full"
      style={{
        background: "#0A0A18",
        border: `1px solid rgba(107,142,255,0.18)`,
        boxShadow: `0 0 0 1px rgba(107,142,255,0.06), 0 40px 90px rgba(0,0,0,0.7), 0 0 100px rgba(107,142,255,0.1)`,
        maxWidth: "460px",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1.5 flex-shrink-0">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="flex-1 text-center text-sm tracking-wide font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>취업소크라테스</span>
        <div className="flex-shrink-0" style={{ width: "42px" }} />
      </div>

      {/* 스텝 바 */}
      <div className="flex items-center px-4 py-3 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.05)", gap: "4px" }}>
        {[["진단", BLUE], ["논리 보강", "#FFD166"], ["자소서 완성", ACCENT], ["예상 질문", "#A78BFA"]].map(([label, color], i) => (
          <div key={label as string} className="flex items-center flex-shrink-0">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 4px" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: i === 0 ? color as string : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.18)",
                  fontSize: "8px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: "11px", color: i === 0 ? color as string : "rgba(255,255,255,0.2)", fontWeight: i === 0 ? 600 : 400, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 메시지 */}
      <div className="p-5 flex flex-col gap-3.5">
        {/* 진단 카드 */}
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "8px", fontWeight: 700 }}>AI</div>
            <span className="text-xs font-semibold tracking-wide" style={{ color: BLUE }}>초안 진단</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {[
              ["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.85)"],
              ["②", "핵심 경험이 너무 추상적이에요", "rgba(255,255,255,0.52)"],
              ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.52)"],
            ].map(([num, text, clr]) => (
              <div key={num as string} className="flex items-start gap-2">
                <span className="text-xs flex-shrink-0 font-bold" style={{ color: BLUE }}>{num}</span>
                <p className="text-sm leading-relaxed" style={{ color: clr as string }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Q&A */}
        <div className="flex items-end gap-2.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "8px", fontWeight: 700 }}>AI</div>
          <div className="px-3.5 py-2.5 text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderRadius: "4px 14px 14px 14px", maxWidth: "82%" }}>
            「팀 성과」라고 하셨는데 — 당신이 직접 한 게 뭔가요?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="px-3.5 py-2.5 text-sm leading-relaxed" style={{ background: ACCENT, color: "#fff", borderRadius: "14px 4px 14px 14px", maxWidth: "75%" }}>
            API 설계랑 QA를 혼자 담당했어요
          </div>
        </div>

        {/* 수정본 진행 중 */}
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "8px", fontWeight: 700 }}>AI</div>
            <span className="text-xs font-semibold tracking-wide" style={{ color: BLUE }}>자소서 완성중</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex gap-1.5 items-center h-4">
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

  useEffect(() => {
    supabase.from("page_views").insert({ path: "/" });
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  function openAuth(tab: "login" | "signup") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function handleStartChat() {
    if (userEmail) {
      window.location.href = "/chat";
    } else {
      openAuth("login");
    }
  }

  return (
    <>
      <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)" }}>

        {/* ── 네비게이션 ── */}
        <nav
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(13,13,24,0.92)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          }}
        >
          <div className="max-w-[1300px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">
              취업소크라테스
              <span className="hidden sm:inline">
                {" "}<span style={{ color: "rgba(255,255,255,0.18)", fontWeight: 300 }}>·</span>{" "}
                <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, fontSize: "13px" }}>JobSocrates</span>
              </span>
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {userEmail ? (
                <>
                  <span className="text-sm mr-1 hidden sm:block" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {userEmail.split("@")[0]}님
                  </span>
                  {userEmail === "ijhan6403@gmail.com" && (
                    <a
                      href="/admin"
                      className="hidden sm:flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.18)" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      관리자
                    </a>
                  )}
                  <a
                    href="/chat"
                    className="text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                    style={{ background: ACCENT, color: "#fff", boxShadow: "0 2px 16px rgba(201,100,66,0.3)" }}
                  >
                    <span className="sm:hidden">채팅</span>
                    <span className="hidden sm:inline">채팅 시작하기</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:block text-sm px-4 py-2 rounded-xl transition-colors hover:text-white whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("login")}
                    className="text-sm px-4 py-2 rounded-xl transition-colors hover:text-white whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="text-sm px-4 py-2 rounded-xl font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── 히어로 ── */}
        <section className="min-h-screen flex items-center pt-16 overflow-hidden relative">
          {/* 앰비언트 글로우 */}
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: "absolute", top: "-5%", left: "-10%", width: "800px", height: "800px", background: `radial-gradient(circle, ${ACCENT}0A 0%, transparent 60%)` }} />
            <div style={{ position: "absolute", top: "10%", right: "-8%", width: "700px", height: "700px", background: `radial-gradient(circle, ${BLUE}0E 0%, transparent 60%)` }} />
          </div>

          <div className="max-w-[1300px] mx-auto px-6 sm:px-8 py-20 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative">
            {/* 텍스트 */}
            <div className="flex-1 flex flex-col items-start gap-8 anim">
              <div
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: `${ACCENT}14`, color: ACCENT, border: `1px solid ${ACCENT}30`, letterSpacing: "0.01em" }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
                첫 문항 무료 · 지금 바로 시작
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-5xl sm:text-6xl xl:text-[4.25rem] font-bold leading-[1.1] tracking-tight text-white">
                  베끼는 자소서는
                </h1>
                <h1
                  className="text-5xl sm:text-6xl xl:text-[4.25rem] font-bold leading-[1.1] tracking-tight"
                  style={{
                    background: `linear-gradient(135deg, #fff 20%, ${ACCENT} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  끝났습니다.
                </h1>
              </div>

              <p className="text-lg sm:text-xl leading-[1.8] max-w-lg" style={{ color: "rgba(255,255,255,0.62)" }}>
                합격 사례를 베껴도, GPT에 맡겨도<br />
                내 이야기가 되지 않는 자소서.<br />
                직접 고민할 때, 비로소 진짜 내 무기가 됩니다.
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{ background: ACCENT, boxShadow: `0 6px 28px ${ACCENT}38`, fontSize: "17px" }}
                >
                  무료로 시작하기
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.32)", letterSpacing: "0.01em" }}>로그인 후 바로 시작 · 첫 문항 무료</p>
              </div>
            </div>

            {/* 미리보기 카드 */}
            <div className="anim anim-delay-2 flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <ChatPreviewCard />
            </div>
          </div>
        </section>

        {/* ── WHY ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "#0B0C1C" }}>
          <div className="max-w-[1300px] mx-auto">
            <div className="text-center mb-14 anim">
              <p className="text-sm font-bold tracking-[0.2em] uppercase mb-4" style={{ color: ACCENT }}>WHY</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>이런 경험 있으신가요?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHY_CARDS.map((c, i) => (
                <div
                  key={c.num}
                  className={`anim anim-delay-${i + 1} rounded-2xl p-6 flex flex-col gap-4`}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${c.color}50`,
                    borderRadius: "16px",
                  }}
                >
                  <span className="text-sm font-bold tabular-nums tracking-widest" style={{ color: `${c.color}80` }}>{c.num}</span>
                  <p className="text-base lg:text-[17px] leading-relaxed font-medium" style={{ color: "rgba(255,255,255,0.78)", wordBreak: "keep-all" }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 브릿지: WHY → HOW ── */}
        <section className="px-6 sm:px-8" style={{ background: "#0D0E1F" }}>
          <div className="max-w-3xl mx-auto py-24 anim text-center flex flex-col items-center gap-6">
            <p className="text-base" style={{ color: "rgba(255,255,255,0.4)", wordBreak: "keep-all" }}>
              이 네 가지, 공통점이 하나 있어요.
            </p>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-snug"
              style={{ wordBreak: "keep-all", letterSpacing: "-0.02em" }}
            >
              할 말이 없는 게 아니라,<br />어떻게 꺼내야 할지<br className="sm:hidden" /> 모르는 거예요.
            </h2>
            <p className="text-base sm:text-lg leading-[1.85] max-w-lg" style={{ color: "rgba(255,255,255,0.5)", wordBreak: "keep-all" }}>
              지금까지 모든 도구는 문장을 고쳐주는 데만 집중했어요.<br />
              취업소크라테스는 꺼내는 것부터 시작합니다.
            </p>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── 사용 철학 ── */}
        <section className="py-28 px-6 sm:px-8" style={{ background: "#090A1B" }}>
          <div className="max-w-2xl mx-auto anim flex flex-col gap-12">
            {/* 헤드 */}
            <div className="flex flex-col gap-4">
              <p className="text-base" style={{ color: "rgba(255,255,255,0.4)", wordBreak: "keep-all" }}>
                단, 이것만큼은 지켜야 진짜가 됩니다.
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white leading-snug"
                style={{ wordBreak: "keep-all", letterSpacing: "-0.02em" }}
              >
                진짜 고민하며 쓴 자소서와<br />대충 쓴 자소서는 결과가 다릅니다.
              </h2>
            </div>

            {/* 규칙 리스트 */}
            <div className="flex flex-col">
              {[
                {
                  num: "01",
                  color: BLUE,
                  title: "본인의 언어로, 본인의 단어로 대화하세요.",
                  desc: "이곳에서 나누는 대화가 자소서의 재료가 됩니다.",
                },
                {
                  num: "02",
                  color: ACCENT,
                  title: "대화 중엔 AI를 쓰지 마세요.",
                  desc: "이 시간만큼은 온전히 당신의 생각이어야 합니다.",
                },
                {
                  num: "03",
                  color: "#FFD166",
                  title: "깊이 고민할수록, 완성이 달라집니다.",
                  desc: "그 차이는 생각보다 훨씬 큽니다.",
                },
              ].map(({ num, color, title, desc }) => (
                <div
                  key={num}
                  className="flex items-start gap-6 py-7 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <span
                    className="flex-shrink-0 text-sm font-bold tabular-nums mt-1"
                    style={{ color, letterSpacing: "0.06em" }}
                  >
                    {num}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-lg font-semibold text-white" style={{ wordBreak: "keep-all" }}>{title}</p>
                    <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.48)", wordBreak: "keep-all" }}>{desc}</p>
                  </div>
                </div>
              ))}
              <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }} />
            </div>
          </div>
        </section>

        {/* ── 브릿지 ── */}
        <section className="py-28 px-6 sm:px-8 text-center anim" style={{ background: "#080919" }}>
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <p
              className="text-base sm:text-lg leading-[2]"
              style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all", letterSpacing: "0.01em" }}
            >
              질문에 자세하게 답할수록, 더 좋은 질문이 돌아옵니다.
            </p>
            <p
              className="text-2xl sm:text-3xl font-bold leading-[1.6]"
              style={{ color: "rgba(255,255,255,0.92)", wordBreak: "keep-all", letterSpacing: "-0.02em" }}
            >
              그 대화가 쌓이면서,<br />당신만의 자소서가 완성됩니다.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 px-6 sm:px-8 text-center relative overflow-hidden" style={{ background: "#070818" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${ACCENT}12 0%, transparent 60%)` }} />
          </div>
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 relative">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight anim" style={{ letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
              준비됐으면,<br />지금 시작하세요.
            </h2>
            <p className="text-lg anim anim-delay-1" style={{ color: "rgba(255,255,255,0.45)" }}>첫 문항은 무료입니다.</p>
            <button
              onClick={handleStartChat}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
              style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}38`, fontSize: "18px" }}
            >
              무료로 시작하기
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-10 px-6 sm:px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#07091A" }}>
          <div className="max-w-[1300px] mx-auto flex flex-col items-center gap-2.5">
            <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              취업소크라테스 <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span> <span style={{ color: "rgba(255,255,255,0.22)" }}>JobSocrates</span>
            </span>
            <a
              href="mailto:jobsocrates76@gmail.com"
              className="text-sm transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.32)", letterSpacing: "0.01em" }}
            >
              co-work · jobsocrates76@gmail.com
            </a>
          </div>
        </footer>
      </div>

      {authOpen && <AuthModal tab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
