"use client";

import { type ReactNode } from "react";

const ACCENT = "#FF6B35";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const VIOLET = "#A78BFA";

function DiagnosisMini() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}16` }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
        <span className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</span>
      </div>
      <div className="px-3 py-3 flex flex-col gap-2">
        {[
          ["①", "논리 흐름은 잡혀있어요", "rgba(255,255,255,0.82)"],
          ["②", "핵심 경험이 너무 추상적이에요", "rgba(255,255,255,0.58)"],
          ["③", "직무 연결고리가 약해요", "rgba(255,255,255,0.58)"],
        ].map(([num, text, clr]) => (
          <div key={num as string} className="flex items-start gap-2">
            <span className="text-xs flex-shrink-0 font-semibold" style={{ color: BLUE }}>{num}</span>
            <p className="text-xs leading-relaxed" style={{ color: clr as string }}>{text}</p>
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
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.82)", borderRadius: "4px 12px 12px 12px" }}>
          「팀 성과」— 당신이 직접 한 게 뭔가요?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: ACCENT, color: "#fff", borderRadius: "12px 4px 12px 12px" }}>
          API 설계랑 QA를 혼자 담당했어요
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
        <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.82)", borderRadius: "4px 12px 12px 12px" }}>
          배포 직전 성능 이슈, 어떻게 해결했어요?
        </div>
      </div>
    </div>
  );
}

function RevisionMini() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}09`, border: `1px solid ${BLUE}22` }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: `${BLUE}14` }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE, color: "#fff", fontSize: "7px", fontWeight: 700 }}>AI</div>
          <span className="text-xs font-semibold" style={{ color: BLUE }}>자소서 완성본</span>
        </div>
        <div className="px-3 py-2.5 relative overflow-hidden" style={{ maxHeight: "46px" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.78)", wordBreak: "keep-all" }}>'스스로 설명할 수 없으면 모르는 것'이라는 기준으로 일해왔습니다. API 설계부터 QA까지...</p>
          <div className="absolute bottom-0 left-0 right-0 h-5" style={{ background: `linear-gradient(to bottom, transparent, ${BLUE}06)` }} />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}22` }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <span style={{ fontSize: "11px" }}>✏️</span>
          <span className="text-xs font-semibold" style={{ color: GOLD }}>바뀐 점</span>
        </div>
        <div className="px-3 pb-2.5 flex flex-col gap-1.5">
          {[
            "팀 성과 → API 설계·QA\n직접 담당으로 구체화",
            "배포 직전 이슈 해결\n경험 추가",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-xs flex-shrink-0 font-bold" style={{ color: GOLD }}>·</span>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.68)" }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InterviewMini() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${VIOLET}08`, border: `1px solid ${VIOLET}22` }}>
      <div className="flex items-start gap-3 px-3 py-3">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-px" style={{ background: VIOLET, color: "#fff", fontSize: "8px", fontWeight: 700 }}>1</div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
          "혼자 해결했다고 하셨는데, 팀 협업 측면은 어떻게 하셨나요?"
        </p>
      </div>
      <div className="px-3 pb-3 border-t" style={{ borderColor: `${VIOLET}18` }}>
        <div className="mt-2.5 px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: VIOLET, fontSize: "10px" }}>AI 피드백</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all" }}>
            매일 팀장님께 진행 상황을 공유했다는 점을 먼저 언급하고, 협업 관점으로 재구성하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

interface MomentProps {
  num: string;
  color: string;
  tag: string;
  title: string;
  desc: string;
  visual: ReactNode;
  delay: number;
}

function MomentCard({ num, color, tag, title, desc, visual, delay }: MomentProps) {
  return (
    <div
      className={`anim anim-delay-${delay} rounded-2xl overflow-hidden`}
      style={{
        background: "rgba(255,255,255,0.025)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        borderLeft: `2px solid ${color}50`,
        borderRadius: "16px",
      }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* 텍스트 */}
        <div className="flex-1 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold tabular-nums tracking-wider" style={{ color: `${color}60` }}>{num}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color, letterSpacing: "0.02em" }}>{tag}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-snug" style={{ wordBreak: "keep-all", letterSpacing: "-0.01em" }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", wordBreak: "keep-all" }}>{desc}</p>
        </div>
        {/* 비주얼 */}
        <div
          className="sm:w-[240px] flex-shrink-0 p-4 border-t sm:border-t-0 sm:border-l flex flex-col justify-center"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.12)" }}
        >
          {visual}
        </div>
      </div>
    </div>
  );
}

export function HowSection() {
  const moments: Omit<MomentProps, "delay">[] = [
    {
      num: "01",
      color: BLUE,
      tag: "진단",
      title: "부족한 점이 뭔지 먼저 알려드립니다",
      desc: "고치기 전에, 지금 초안에서 무엇이 부족한지 짚어드립니다. 논리 흐름, 문맥 연결, 직무 이해도를 한눈에.",
      visual: <DiagnosisMini />,
    },
    {
      num: "02",
      color: GOLD,
      tag: "논리 보강",
      title: "질문 하나로 추상적인 표현이 사라집니다",
      desc: "물어보지 않으면 절대 꺼내지 못했을 당신의 이야기를 대화로 끌어냅니다.",
      visual: <BoostMini />,
    },
    {
      num: "03",
      color: ACCENT,
      tag: "자소서 완성",
      title: "어떤 점이 바뀌었는지 완성본과 함께 알려드립니다",
      desc: "내 이야기로만 다시 쓴 자소서. 어디가 왜 바뀌었는지도 바로 보입니다.",
      visual: <RevisionMini />,
    },
    {
      num: "04",
      color: VIOLET,
      tag: "예상 질문",
      title: "우리가 함께 나눈 대화가 곧 면접 준비가 됩니다",
      desc: "자소서를 쓰며 나눈 대화가 면접 질문이 됩니다. 내 답변에 피드백까지 바로 받으세요.",
      visual: <InterviewMini />,
    },
  ];

  return (
    <section style={{ background: "#0F1023" }}>
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-28">
        <div className="text-center mb-12 anim">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: BLUE }}>HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ wordBreak: "keep-all", letterSpacing: "-0.01em" }}>
            <span style={{ color: "rgba(255,255,255,0.32)", textDecoration: "line-through", fontWeight: 500 }}>딸깍, 문장 교체.</span>
            <br />
            <span className="text-white">우리는 대화로 완성합니다.</span>
          </h2>
          <p className="mt-3 text-base" style={{ color: "rgba(255,255,255,0.38)", wordBreak: "keep-all" }}>
            초안을 붙여넣으면, 여기서부터 달라집니다
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {moments.map((m, i) => (
            <MomentCard key={i} {...m} delay={Math.min(i + 1, 4)} />
          ))}
        </div>
      </div>
    </section>
  );
}
