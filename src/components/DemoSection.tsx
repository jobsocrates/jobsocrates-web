"use client";

import { useEffect, useRef, useState } from "react";

const BLUE = "#3B62CC";
const NAVY = "#1A3461";

const STEP_DELAYS = [0, 700, 1400, 2100, 2800, 3700];

export function DemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          STEP_DELAYS.forEach((d, i) => setTimeout(() => setStep(i), d));
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 블러-투-샤프 + 슬라이드 + 스케일 등장
  const vis = (n: number): React.CSSProperties => ({
    opacity: step >= n ? 1 : 0,
    transform: step >= n ? "none" : "translateY(22px) scale(0.97)",
    filter: step >= n ? "blur(0px)" : "blur(5px)",
    transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: step >= n ? "auto" : "none",
  });

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1A3461 55%, #1C3A78 100%)" }}
    >
      <style>{`
        @keyframes demoSpin { to { transform: rotate(360deg); } }
        @keyframes demoGlow {
          0%,100% { box-shadow: 0 0 0 1px rgba(129,140,248,0.25), 0 0 48px -12px rgba(129,140,248,0.45); }
          50%     { box-shadow: 0 0 0 1px rgba(129,140,248,0.45), 0 0 72px -6px rgba(129,140,248,0.7); }
        }
        @keyframes demoPop {
          0% { opacity: 0; transform: scale(0.8); }
          60% { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes demoArrow { 0%,100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(5px); opacity: 1; } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: BLUE, filter: "blur(160px)", opacity: 0.14 }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-5%", width: "420px", height: "420px", borderRadius: "50%", background: "#A78BFA", filter: "blur(140px)", opacity: 0.09 }} />
        <div style={{ position: "absolute", top: "40%", left: "55%", width: "300px", height: "300px", borderRadius: "50%", background: "#5EEAD4", filter: "blur(150px)", opacity: 0.05 }} />
      </div>

      <div ref={ref} className="max-w-[680px] mx-auto px-6 sm:px-8 py-28 relative">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.30)" }}>DEMO</p>
        <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, wordBreak: "keep-all" }}>
          막연한 한 줄이,<br />질문을 거쳐 이렇게 바뀝니다.
        </h2>

        {/* BEFORE */}
        <div style={{ ...vis(0), marginBottom: "28px" }}>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2 inline-block" style={{ color: "rgba(255,255,255,0.28)" }}>BEFORE · 막연한 초안</span>
          <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
              &ldquo;팀 프로젝트에서 일정이 밀렸지만, 역할을 다시 나눠 마감을 맞췄습니다.&rdquo;
            </p>
          </div>
        </div>

        {/* 디깅 대화 */}
        <div className="flex flex-col gap-3.5 mb-7">
          {/* Q1 */}
          <div style={vis(1)} className="flex items-start gap-3">
            <img src="/ai-avatar.webp" alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
            <div className="px-5 py-3.5" style={{ background: `${BLUE}28`, border: `1px solid ${BLUE}55`, borderRadius: "4px 18px 18px 18px", maxWidth: "84%" }}>
              <p className="text-[15px] leading-relaxed" style={{ color: "#fff" }}>
                역할을 다시 나눌 때, <span style={{ color: "#93C5FD", fontWeight: 600 }}>무슨 기준으로 누구한테 뭘 맡길지 정했어요?</span>
              </p>
            </div>
          </div>
          {/* A1 */}
          <div style={vis(2)} className="flex justify-end">
            <div className="px-5 py-3.5" style={{ background: NAVY, color: "rgba(255,255,255,0.92)", maxWidth: "76%", borderRadius: "18px 4px 18px 18px", border: "1px solid rgba(129,140,248,0.22)" }}>
              <p className="text-sm leading-relaxed">구현이 제일 밀려서, 발표 때 꼭 돌아가야 하는 기능부터 인원을 몰았어요.</p>
            </div>
          </div>
          {/* Q2 */}
          <div style={vis(3)} className="flex items-start gap-3">
            <img src="/ai-avatar.webp" alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
            <div className="px-5 py-3.5" style={{ background: `${BLUE}28`, border: `1px solid ${BLUE}55`, borderRadius: "4px 18px 18px 18px", maxWidth: "84%" }}>
              <p className="text-[15px] leading-relaxed" style={{ color: "#fff" }}>
                그럼 뒤로 미룬 것도 있을 텐데, <span style={{ color: "#93C5FD", fontWeight: 600 }}>뭘 미뤘고 왜 그게 괜찮다고 봤어요?</span>
              </p>
            </div>
          </div>
          {/* A2 */}
          <div style={vis(4)} className="flex justify-end">
            <div className="px-5 py-3.5" style={{ background: NAVY, color: "rgba(255,255,255,0.92)", maxWidth: "76%", borderRadius: "18px 4px 18px 18px", border: "1px solid rgba(129,140,248,0.22)" }}>
              <p className="text-sm leading-relaxed">디자인 다듬는 건 미뤘어요. 발표에선 화면이 예쁜 것보다 기능이 실제로 도는 게 더 설득력 있다고 봤거든요.</p>
            </div>
          </div>
        </div>

        {/* 흐름 화살표 */}
        <div style={{ ...vis(5), display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: step >= 5 ? "demoArrow 1.4s ease-in-out infinite" : "none" }}>
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
          <span className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>질문이 끌어낸 판단으로</span>
        </div>

        {/* AFTER — 회전 그라데이션 보더 + 글로우 */}
        <div style={vis(5)}>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2 inline-block" style={{ color: "#93C5FD" }}>AFTER · 완성본</span>
          <div
            style={{
              position: "relative",
              borderRadius: "20px",
              padding: "1.5px",
              overflow: "hidden",
              animation: step >= 5 ? "demoGlow 3.5s ease-in-out infinite" : "none",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-60%",
                background: "conic-gradient(from 0deg, transparent 0deg, #60A5FA 60deg, #A78BFA 130deg, #5EEAD4 200deg, transparent 280deg)",
                animation: step >= 5 ? "demoSpin 5s linear infinite" : "none",
              }}
            />
            <div style={{ position: "relative", borderRadius: "18.5px", background: "linear-gradient(160deg, #11203F 0%, #0E1B36 100%)", padding: "24px 26px" }}>
              <p className="text-base leading-[1.85]" style={{ color: "rgba(255,255,255,0.94)", wordBreak: "keep-all" }}>
                마감을 앞두고 구현 일정이 가장 크게 밀려 있었습니다. 발표에서 반드시 동작해야 할 핵심 기능 세 개를 먼저 추려 인원을 집중했고, 화면을 다듬는 작업은 뒤로 미뤘습니다. 보기 좋은 화면보다 실제로 작동하는 기능이 발표에서 더 설득력 있다고 판단했기 때문입니다. 결국 핵심 기능을 모두 동작시켜 발표를 마쳤습니다.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <span
              className="text-sm font-medium px-4 py-1.5 rounded-full"
              style={{ background: `${BLUE}22`, color: "rgba(255,255,255,0.6)", border: `1px solid ${BLUE}40`, animation: step >= 5 ? "demoPop 0.5s ease 0.3s both" : "none" }}
            >
              같은 경험 · 다른 설득력
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
