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
          ["②", "판단 과정이 보이지 않아요", "rgba(255,255,255,0.42)"],
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
          「역할 재분배」— 무슨 기준으로 나눴어요?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="px-3 py-2 text-xs" style={{ background: NAVY, color: "#fff", borderRadius: "10px 4px 10px 10px" }}>
          작동할 기능 3개만 남기고 UI는 후순위로 뒀어요
        </div>
      </div>
      <div className="flex items-end gap-2">
        <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.80)", borderRadius: "4px 10px 10px 10px" }}>
          UI를 미룬 그 판단, 기준이 뭐였어요?
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
            '시연 D-2일, 작동해야 할 기능 3개를 먼저 선별하고 UI 보완은 후순위로 조정했습니다...'
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: "linear-gradient(transparent, rgba(8,18,46,0.9))" }} />
        </div>
      </div>
      <div className="rounded-xl px-3 py-2" style={{ background: `${GOLD}0C`, border: `1px solid ${GOLD}28` }}>
        <p className="text-xs font-semibold mb-0.5" style={{ color: GOLD }}>바뀐 점</p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>막연한 '역할 재분배' → 판단 기준이 드러나는 문장</p>
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
          "UI를 후순위로 둔 결정, 팀원 설득은 어떻게 했나요?"
        </p>
      </div>
      <div className="px-3 pb-2.5 border-t" style={{ borderColor: `${VIOLET}18` }}>
        <div className="mt-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: VIOLET, fontSize: "10px" }}>AI 피드백</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.46)", wordBreak: "keep-all" }}>
            '작동이 먼저'라는 판단 근거를 앞세우고, 합의 과정을 덧붙여 답하세요.
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
    desc: "고치기 전에, 지금 무엇이 부족한지부터 짚어드립니다.",
    visual: <DiagnosisMini />,
  },
  {
    num: "02", color: GOLD, tag: "이야기 발굴",
    title: "질문 하나로 추상적인 표현이 사라집니다",
    desc: "물어보지 않으면 못 꺼냈을 이야기를, 질문으로 끌어냅니다.",
    visual: <BoostMini />,
  },
  {
    num: "03", color: CORAL, tag: "문장 완성",
    title: "나눈 대화가 그대로 자소서가 됩니다",
    desc: "나눈 대화가 그대로 한 편의 자소서가 됩니다.",
    visual: <RevisionMini />,
  },
  {
    num: "04", color: VIOLET, tag: "실전 대비",
    title: "그 대화가 곧 면접 준비가 됩니다",
    desc: "그 대화가 면접 질문이 되고, 답변 피드백까지 이어집니다.",
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

        {/* 출발 라벨 */}
        <div className="anim flex items-center gap-2 mb-4 px-1">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.5)" }} />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>자소서 초안 · 여기서 시작합니다</span>
        </div>

        {/* ── 스텝 카드 ── */}
        <div className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`anim anim-delay-${i + 1} rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7`}
              style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* 왼쪽: 번호 + 태그 + 제목 + 설명 */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center rounded-xl font-bold text-sm text-white flex-shrink-0"
                    style={{ width: "34px", height: "34px", background: step.color, boxShadow: `0 0 20px ${step.color}55` }}
                  >
                    {step.num}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${step.color}16`, color: step.color, border: `1px solid ${step.color}30` }}
                  >
                    {step.tag}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-white leading-snug" style={{ wordBreak: "keep-all", letterSpacing: "-0.02em" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all" }}>
                  {step.desc}
                </p>
              </div>

              {/* 오른쪽: 미니 UI 프리뷰 */}
              <div
                className="w-full sm:w-[270px] flex-shrink-0 rounded-2xl p-3"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {step.visual}
              </div>
            </div>
          ))}
        </div>

        {/* 도착 — 완성 */}
        <div
          className="anim mt-4 rounded-3xl px-6 py-5 flex items-center gap-4"
          style={{ background: `linear-gradient(120deg, ${VIOLET}1F, ${VIOLET}08)`, border: `1px solid ${VIOLET}3A` }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: VIOLET, boxShadow: `0 0 26px ${VIOLET}66` }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div>
            <p className="text-base font-bold text-white">자소서 완성 · 면접 준비까지</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>여기까지 오면 이미 절반은 합격입니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
