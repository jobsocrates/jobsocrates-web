"use client";

import { type ReactNode } from "react";

const BLUE   = "#3B62CC";
const GOLD   = "#D4920A";
const CORAL  = "#E05A3A";
const VIOLET = "#A78BFA";
const NAVY   = "#1A3461";

/* ── 미니 UI 프리뷰 ── */
function DiagnosisMini() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}0E`, border: `1px solid ${BLUE}28` }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}18` }}>
        <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
        <span className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</span>
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        {[
          ["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.80)"],
          ["②", "핵심 경험이 너무 추상적이에요", "rgba(255,255,255,0.42)"],
          ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.42)"],
        ].map(([n, t, c]) => (
          <div key={n as string} className="flex items-start gap-2">
            <span className="text-xs flex-shrink-0 font-semibold" style={{ color: BLUE }}>{n}</span>
            <p className="text-xs leading-relaxed" style={{ color: c as string }}>{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoostMini() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.80)", borderRadius: "4px 10px 10px 10px" }}>
          「팀 성과」— 당신이 직접 한 게 뭔가요?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="px-3 py-2 text-xs" style={{ background: NAVY, color: "#fff", borderRadius: "10px 4px 10px 10px" }}>
          API 설계랑 QA를 혼자 담당했어요
        </div>
      </div>
      <div className="flex items-end gap-2">
        <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.80)", borderRadius: "4px 10px 10px 10px" }}>
          배포 직전 성능 이슈, 어떻게 해결했어요?
        </div>
      </div>
    </div>
  );
}

function RevisionMini() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}0E`, border: `1px solid ${BLUE}28` }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}18` }}>
          <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
          <span className="text-xs font-semibold" style={{ color: BLUE }}>자소서 완성본</span>
        </div>
        <div className="px-3 py-2.5 relative overflow-hidden" style={{ maxHeight: "54px" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.72)", wordBreak: "keep-all" }}>
            'API 설계부터 QA까지 직접 담당하며, 배포 직전 성능 이슈를 단독으로 해결했습니다...'
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: "linear-gradient(transparent, rgba(8,18,46,0.9))" }} />
        </div>
      </div>
      <div className="rounded-xl px-3 py-2" style={{ background: `${GOLD}0C`, border: `1px solid ${GOLD}28` }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: GOLD }}>바뀐 점</p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>팀 성과 → 직접 담당한 내용으로 구체화</p>
      </div>
    </div>
  );
}

function InterviewMini() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${VIOLET}0C`, border: `1px solid ${VIOLET}28` }}>
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-px font-bold text-white" style={{ background: VIOLET, fontSize: "8px" }}>1</div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.80)", wordBreak: "keep-all" }}>
          "혼자 해결했다고 하셨는데, 팀 협업은 어떻게 하셨나요?"
        </p>
      </div>
      <div className="px-3 pb-2.5 border-t" style={{ borderColor: `${VIOLET}18` }}>
        <div className="mt-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: VIOLET, fontSize: "10px" }}>AI 피드백</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.46)", wordBreak: "keep-all" }}>
            진행 상황을 공유했다는 점부터 언급하고, 협업 관점으로 재구성하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

interface Step {
  num: string;
  color: string;
  tag: string;
  title: string;
  desc: string;
  visual: ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01", color: BLUE, tag: "초안 분석",
    title: "부족한 점이 뭔지 먼저 알려드립니다",
    desc: "고치기 전에, 지금 초안에서 무엇이 부족한지 짚어드립니다. 논리 흐름, 문맥 연결, 직무 이해도를 한눈에.",
    visual: <DiagnosisMini />,
  },
  {
    num: "02", color: GOLD, tag: "이야기 발굴",
    title: "질문 하나로 추상적인 표현이 사라집니다",
    desc: "물어보지 않으면 절대 꺼내지 못했을 당신의 이야기를 대화로 끌어냅니다.",
    visual: <BoostMini />,
  },
  {
    num: "03", color: CORAL, tag: "문장 완성",
    title: "나눈 대화가 그대로 자소서가 됩니다",
    desc: "우리가 나눈 모든 대화를 기반으로 자소서가 완성됩니다. PDF 다운로드도 가능해요.",
    visual: <RevisionMini />,
  },
  {
    num: "04", color: VIOLET, tag: "실전 대비",
    title: "그 대화가 곧 면접 준비가 됩니다",
    desc: "자소서를 쓰며 나눈 대화가 면접 질문이 됩니다. 내 답변에 피드백까지 바로 받으세요.",
    visual: <InterviewMini />,
  },
];

export function HowSection() {
  return (
    <section style={{ background: "linear-gradient(180deg, #0A1628 0%, #0C1A36 100%)" }}>
      <div className="max-w-[860px] mx-auto px-6 sm:px-8 pt-28 pb-28">

        {/* 헤더 */}
        <div className="text-center mb-16 anim">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: "#fff", wordBreak: "keep-all", letterSpacing: "-0.02em" }}>
            <span style={{ color: "rgba(255,255,255,0.26)", textDecoration: "line-through", fontWeight: 400, fontSize: "0.85em" }}>딸깍, 문장 교체.</span>
            <br />
            우리는 대화로 완성합니다.
          </h2>
        </div>

        {/* ── 여정 타임라인 ── */}
        <div className="relative">

          {/* 출발 */}
          <div className="flex items-center gap-5 mb-6 anim">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: "44px" }}>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "rgba(255,255,255,0.55)", boxShadow: "0 0 8px rgba(255,255,255,0.3)" }}
              />
              <div style={{ width: "2px", height: "20px", background: `linear-gradient(to bottom, rgba(255,255,255,0.35), ${BLUE})` }} />
            </div>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
              자소서 초안 · 여기서 시작합니다
            </span>
          </div>

          {/* 스텝들 */}
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            const nextColor = !isLast ? STEPS[i + 1].color : null;
            return (
              <div key={step.num}>

                {/* 스텝 행 */}
                <div className={`flex gap-5 anim anim-delay-${i + 1}`}>

                  {/* 타임라인 열 */}
                  <div className="flex flex-col items-center flex-shrink-0" style={{ width: "44px" }}>
                    {/* 번호 도트 */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 z-10"
                      style={{
                        background: step.color,
                        boxShadow: `0 0 0 4px rgba(${step.color === BLUE ? "59,98,204" : step.color === GOLD ? "212,146,10" : step.color === CORAL ? "224,90,58" : "167,139,250"},0.18), 0 0 20px ${step.color}50`,
                      }}
                    >
                      {step.num}
                    </div>
                    {/* 연결선 */}
                    {!isLast && (
                      <div style={{ width: "2px", flex: 1, minHeight: "48px", background: `linear-gradient(to bottom, ${step.color}, ${nextColor})`, opacity: 0.6 }} />
                    )}
                  </div>

                  {/* 콘텐츠 */}
                  <div className={`flex-1 ${isLast ? "pb-0" : "pb-12"} min-w-0`}>
                    {/* 태그 */}
                    <div className="flex items-center gap-2 mb-3 mt-2.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${step.color}16`, color: step.color, border: `1px solid ${step.color}28` }}
                      >
                        {step.tag}
                      </span>
                    </div>

                    {/* 제목 + 비주얼 (데스크탑: 가로, 모바일: 세로) */}
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* 텍스트 */}
                      <div className="flex-1 flex flex-col gap-3">
                        <h3
                          className="text-lg lg:text-xl font-bold text-white leading-snug"
                          style={{ wordBreak: "keep-all", letterSpacing: "-0.02em" }}
                        >
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)", wordBreak: "keep-all" }}>
                          {step.desc}
                        </p>
                      </div>

                      {/* 미니 UI 프리뷰 */}
                      <div
                        className="sm:w-56 lg:w-64 flex-shrink-0 rounded-xl p-3"
                        style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {step.visual}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 스텝 사이 연결 레이블 */}
                {!isLast && (
                  <div className="flex items-center gap-5 my-2">
                    <div className="flex-shrink-0" style={{ width: "44px" }} />
                    <div className="flex items-center gap-2">
                      <div style={{ width: "16px", height: "1.5px", background: `linear-gradient(to right, ${step.color}, transparent)`, opacity: 0.7 }} />
                      <span
                        className="text-xs font-semibold tracking-wide"
                        style={{
                          color: step.color,
                          opacity: 0.85,
                          background: `${step.color}12`,
                          border: `1px solid ${step.color}28`,
                          borderRadius: "20px",
                          padding: "3px 10px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {i === 0 ? "부족한 부분을 파악했으면" : i === 1 ? "이야기가 구체화되면" : "완성된 자소서를 토대로"}
                      </span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={step.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {/* 도착 */}
          <div className="flex items-center gap-5 mt-6 anim">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: "44px" }}>
              <div style={{ width: "2px", height: "20px", background: `linear-gradient(to bottom, ${VIOLET}, ${VIOLET}80)` }} />
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: VIOLET, boxShadow: `0 0 0 4px ${VIOLET}20, 0 0 20px ${VIOLET}60` }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: `${VIOLET}12`, border: `1px solid ${VIOLET}28` }}
            >
              <p className="text-sm font-semibold text-white">자소서 완성 · 면접 준비까지</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>여기까지 오면 이미 절반은 합격입니다.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
