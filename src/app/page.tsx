"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        border: `1px solid rgba(107,142,255,0.16)`,
        boxShadow: `0 0 0 1px rgba(107,142,255,0.06), 0 32px 72px rgba(0,0,0,0.65), 0 0 80px rgba(107,142,255,0.08)`,
        maxWidth: "420px",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1.5 flex-shrink-0">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="flex-1 text-center text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>취업소크라테스</span>
        <div className="flex-shrink-0" style={{ width: "30px" }} />
      </div>

      {/* 스텝 바 */}
      <div className="flex items-center px-3 py-2.5 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.05)", gap: "2px" }}>
        {[["진단", BLUE], ["논리 보강", "#FFD166"], ["자소서 완성", ACCENT], ["예상 질문", "#A78BFA"]].map(([label, color], i) => (
          <div key={label as string} className="flex items-center flex-shrink-0">
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 4px" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <div className="flex items-center gap-1">
              <div
                style={{
                  width: "14px", height: "14px", borderRadius: "50%",
                  background: i === 0 ? color as string : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.18)",
                  fontSize: "7px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: "9px", color: i === 0 ? color as string : "rgba(255,255,255,0.18)", fontWeight: i === 0 ? 600 : 400, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 메시지 */}
      <div className="p-4 flex flex-col gap-3">
        {/* 진단 카드 */}
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}1E` }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}12` }}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
            <span className="text-xs font-semibold tracking-wide" style={{ color: BLUE }}>초안 진단</span>
          </div>
          <div className="px-3 py-2.5 flex flex-col gap-1.5">
            {[
              ["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.82)"],
              ["②", "핵심 경험이 너무 추상적이에요", "rgba(255,255,255,0.52)"],
              ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.52)"],
            ].map(([num, text, clr]) => (
              <div key={num as string} className="flex items-start gap-1.5">
                <span className="text-xs flex-shrink-0 font-semibold" style={{ color: BLUE }}>{num}</span>
                <p className="text-xs leading-relaxed" style={{ color: clr as string }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Q&A */}
        <div className="flex items-end gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
          <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", borderRadius: "4px 12px 12px 12px", maxWidth: "82%" }}>
            「팀 성과」라고 하셨는데 — 당신이 직접 한 게 뭔가요?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: ACCENT, color: "#fff", borderRadius: "12px 4px 12px 12px", maxWidth: "75%" }}>
            API 설계랑 QA를 혼자 담당했어요
          </div>
        </div>

        {/* 수정본 진행 중 */}
        <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}1E` }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}12` }}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
            <span className="text-xs font-semibold tracking-wide" style={{ color: BLUE }}>자소서 완성중</span>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex gap-1 items-center h-3.5">
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

  return (
    <>
      <div style={{ background: BG, minHeight: "100vh", color: "rgba(255,255,255,0.88)" }}>

        {/* ── 네비게이션 ── */}
        <nav
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{
            background: scrolled ? "rgba(13,13,24,0.9)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <span className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">
              취업소크라테스
              <span className="hidden sm:inline">
                {" "}<span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>·</span>{" "}
                <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: "12px" }}>JobSocrates</span>
              </span>
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {userEmail ? (
                <>
                  <span className="text-xs mr-1 hidden sm:block" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {userEmail.split("@")[0]}님
                  </span>
                  {userEmail === "ijhan6403@gmail.com" && (
                    <a
                      href="/admin"
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      관리자
                    </a>
                  )}
                  <a
                    href="/chat"
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                    style={{ background: ACCENT, color: "#fff" }}
                  >
                    <span className="sm:hidden">채팅</span>
                    <span className="hidden sm:inline">채팅 시작하기</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors hover:text-white whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    <span className="sm:hidden">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </span>
                    <span className="hidden sm:inline">로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("login")}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors hover:text-white whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
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
            <div style={{ position: "absolute", top: "-10%", left: "-15%", width: "700px", height: "700px", background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 60%)` }} />
            <div style={{ position: "absolute", top: "5%", right: "-10%", width: "600px", height: "600px", background: `radial-gradient(circle, ${BLUE}0C 0%, transparent 60%)` }} />
          </div>

          <div className="max-w-6xl mx-auto px-6 py-20 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative">
            {/* 텍스트 */}
            <div className="flex-1 flex flex-col items-start gap-7 anim">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
                style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}28`, letterSpacing: "0.02em" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                첫 문항 무료 · 지금 바로 시작
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="text-4xl sm:text-5xl xl:text-[3.75rem] font-bold leading-[1.15] tracking-tight text-white">
                  베끼는 자소서는
                </h1>
                <h1
                  className="text-4xl sm:text-5xl xl:text-[3.75rem] font-bold leading-[1.15] tracking-tight"
                  style={{
                    background: `linear-gradient(135deg, #fff 30%, ${ACCENT} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  끝났습니다.
                </h1>
              </div>

              <p className="text-base sm:text-[17px] leading-[1.75] max-w-md" style={{ color: "rgba(255,255,255,0.48)" }}>
                합격 사례를 베껴도, GPT에 맡겨도<br className="hidden sm:block" />
                내 이야기가 되지 않는 자소서.<br />
                직접 고민할 때, 비로소 진짜 내 무기가 됩니다.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}30` }}
                >
                  무료로 시작하기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.01em" }}>가입 없이 바로 시작 · 첫 문항 무료</p>
              </div>
            </div>

            {/* 미리보기 카드 */}
            <div className="anim anim-delay-2 flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <ChatPreviewCard />
            </div>
          </div>
        </section>

        {/* ── WHY ── */}
        <section className="py-24 px-6" style={{ background: "#0B0C1C" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 anim">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: ACCENT }}>WHY</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: "-0.01em" }}>이런 경험 있으신가요?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHY_CARDS.map((c, i) => (
                <div
                  key={c.num}
                  className={`anim anim-delay-${i + 1} rounded-2xl p-5 flex items-start gap-4`}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `2px solid ${c.color}45`,
                    borderRadius: "16px",
                  }}
                >
                  <span className="text-xs font-bold tabular-nums flex-shrink-0 mt-0.5 tracking-wider" style={{ color: `${c.color}70` }}>{c.num}</span>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", wordBreak: "keep-all" }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 브릿지: WHY → HOW ── */}
        <section className="px-6" style={{ background: "#0D0E1F" }}>
          <div className="max-w-lg mx-auto py-20 anim text-center flex flex-col items-center gap-5">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)", wordBreak: "keep-all" }}>
              이 네 가지, 공통점이 하나 있어요.
            </p>
            <h2
              className="text-2xl sm:text-[1.9rem] font-bold text-white leading-snug"
              style={{ wordBreak: "keep-all", letterSpacing: "-0.01em" }}
            >
              할 말이 없는 게 아니라,<br />어떻게 꺼내야 할지 모르는 거예요.
            </h2>
            <p className="text-sm leading-[1.85] max-w-sm" style={{ color: "rgba(255,255,255,0.4)", wordBreak: "keep-all" }}>
              지금까지 모든 도구는 문장을 고쳐주는 데만 집중했어요.<br />
              취업소크라테스는 꺼내는 것부터 시작합니다.
            </p>
          </div>
        </section>

        {/* ── HOW ── */}
        <HowSection />

        {/* ── 사용 철학 ── */}
        <section className="py-24 px-6" style={{ background: "#090A1B" }}>
          <div className="max-w-xl mx-auto anim flex flex-col gap-10">
            {/* 헤드 */}
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)", wordBreak: "keep-all" }}>
                단, 이것만큼은 지켜야 진짜가 됩니다.
              </p>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                이 사이트를 제대로 활용하는 법
              </p>
              <h2
                className="text-2xl sm:text-[1.75rem] font-bold text-white leading-snug"
                style={{ wordBreak: "keep-all", letterSpacing: "-0.01em" }}
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
                  className="flex items-start gap-5 py-5 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="flex-shrink-0 text-xs font-bold tabular-nums mt-0.5"
                    style={{ color, letterSpacing: "0.04em" }}
                  >
                    {num}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-white" style={{ wordBreak: "keep-all" }}>{title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all" }}>{desc}</p>
                  </div>
                </div>
              ))}
              <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
            </div>

          </div>
        </section>

        {/* ── 브릿지 ── */}
        <section className="py-24 px-6 text-center anim" style={{ background: "#080919" }}>
          <div className="max-w-md mx-auto flex flex-col gap-3">
            <p
              className="text-sm leading-[2]"
              style={{ color: "rgba(255,255,255,0.38)", wordBreak: "keep-all", letterSpacing: "0.01em" }}
            >
              질문에 자세하게 답할수록, 더 좋은 질문이 돌아옵니다.
            </p>
            <p
              className="text-xl font-semibold leading-[1.7]"
              style={{ color: "rgba(255,255,255,0.88)", wordBreak: "keep-all", letterSpacing: "-0.02em" }}
            >
              그 대화가 쌓이면서,<br />당신만의 자소서가 완성됩니다.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 px-6 text-center relative overflow-hidden" style={{ background: "#070818" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${ACCENT}0E 0%, transparent 60%)` }} />
          </div>
          <div className="max-w-lg mx-auto flex flex-col items-center gap-6 relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight anim" style={{ letterSpacing: "-0.01em", wordBreak: "keep-all" }}>
              준비됐으면,<br />지금 시작하세요.
            </h2>
            <p className="text-base anim anim-delay-1" style={{ color: "rgba(255,255,255,0.38)" }}>첫 문항은 무료입니다.</p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.04] active:scale-[0.97]"
              style={{ background: ACCENT, boxShadow: `0 4px 24px ${ACCENT}30` }}
            >
              무료로 시작하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── 푸터 ── */}
        <footer className="py-8 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#07091A" }}>
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              취업소크라테스 <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span> <span style={{ color: "rgba(255,255,255,0.2)" }}>JobSocrates</span>
            </span>
            <a
              href="mailto:jobsocrates76@gmail.com"
              className="text-xs transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "0.01em" }}
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
