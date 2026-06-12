"use client";

import { type ReactNode } from "react";

const ACCENT = "#F06428";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const VIOLET = "#A78BFA";

function DiagnosisMini() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}18` }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{ borderColor: `${BLUE}14` }}>
        <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
        <span className="text-xs font-semibold" style={{ color: BLUE }}>초안 진단</span>
      </div>
      <div className="px-3.5 py-3 flex flex-col gap-2.5">
        {[
          ["①","논리 흐름은 잡혀있어요", true],
          ["②","핵심 경험이 너무 추상적이에요", false],
          ["③","직무 연결고리가 약해요", false],
        ].map(([n, t, b]) => (
          <div key={n as string} className="flex items-start gap-2">
            <span className="text-xs font-bold flex-shrink-0" style={{ color: BLUE }}>{n}</span>
            <p className="text-xs leading-relaxed" style={{ color: b ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.42)" }}>{t as string}</p>
          </div>
        ))}
      </div>
      <div className="px-3.5 pb-3">
        <div className="flex items-end gap-2 mt-1">
          <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
          <div className="px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.82)", borderRadius: "3px 10px 10px 10px", maxWidth: "90%" }}>
            「팀 성과」라고 하셨는데, 직접 하신 게 뭔가요?
          </div>
        </div>
      </div>
    </div>
  );
}

function DiggingMini() {
  const msgs = [
    { role: "ai",   text: "초안에 '팀 프로젝트'라고 하셨는데, 직접 맡은 부분이 뭔가요?" },
    { role: "user", text: "API 설계랑 QA를 혼자 담당했어요" },
    { role: "ai",   text: "배포 직전에 성능 이슈가 생겼다고 하셨는데, 그 순간 제일 먼저 뭘 했어요?" },
    { role: "user", text: "로그 먼저 봤어요. 어디서 병목인지 확인하려고요" },
    { role: "ai",   text: "그 판단이 맞았다는 걸 언제 알게 됐어요?" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em", textTransform: "uppercase" }}>예시 대화</span>
      </div>
      {msgs.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "items-end gap-1.5"}`}>
          {m.role === "ai" && <img src="/ai-avatar.webp" alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />}
          <div className="px-3 py-2 text-xs leading-relaxed"
            style={{
              background: m.role === "ai" ? "rgba(255,255,255,0.07)" : ACCENT,
              color: "rgba(255,255,255,0.88)",
              borderRadius: m.role === "ai" ? "3px 10px 10px 10px" : "10px 3px 10px 10px",
              maxWidth: "88%",
            }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletionMini() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="px-3.5 py-2 rounded-lg" style={{ background: `${BLUE}0C`, border: `1px solid ${BLUE}1A` }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: BLUE, letterSpacing: "0.04em", marginBottom: "3px" }}>소제목</p>
        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>병목을 직접 찾아 해결하는 개발자</p>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: `${BLUE}06`, border: `1px solid ${BLUE}14` }}>
        <div className="flex items-center gap-2 px-3.5 py-2 border-b" style={{ borderColor: `${BLUE}10` }}>
          <img src="/ai-avatar.webp" alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
          <span className="text-xs font-semibold" style={{ color: BLUE }}>자소서 완성본</span>
        </div>
        <div className="px-3.5 py-2.5 relative overflow-hidden" style={{ maxHeight: "60px" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", wordBreak: "keep-all" }}>
            로그를 먼저 확인하는 것이 제 기본 원칙입니다. PBL 과제로 AWS 기반 서비스를 구축하던 중 배포 직전 응답 지연이 발생했고...
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-5" style={{ background: "linear-gradient(to bottom, transparent, rgba(10,10,20,0.95))" }} />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: `${VIOLET}07`, border: `1px solid ${VIOLET}18` }}>
        <div className="flex items-center gap-2 px-3.5 py-2">
          <span style={{ fontSize: "11px" }}>💬</span>
          <span className="text-xs font-semibold" style={{ color: VIOLET }}>면접 예상 질문</span>
        </div>
        <div className="px-3.5 pb-2.5">
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all" }}>
            "혼자 담당하셨다고 했는데, 팀원과의 협업은 어떻게 하셨나요?"
          </p>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  num: string; color: string; tag: string;
  title: string; desc: ReactNode; visual: ReactNode;
  delay: number; wide?: boolean;
}

function StepCard({ num, color, tag, title, desc, visual, delay, wide }: CardProps) {
  return (
    <div className={`anim anim-delay-${delay} rounded-2xl overflow-hidden`}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `2px solid ${color}45`,
      }}>
      <div className={`flex flex-col ${wide ? "lg:flex-row" : "sm:flex-row"}`}>
        <div className="flex-1 p-6 lg:p-8 flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold tabular-nums tracking-wider" style={{ color: `${color}55` }}>{num}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${color}12`, color, letterSpacing: "0.02em" }}>{tag}</span>
          </div>
          <h3 className="text-lg lg:text-xl font-bold leading-snug" style={{ color: "rgba(255,255,255,0.92)", wordBreak: "keep-all", letterSpacing: "-0.01em" }}>{title}</h3>
          <p className="text-sm lg:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", wordBreak: "keep-all" }}>{desc}</p>
        </div>
        <div className={`${wide ? "lg:w-[360px]" : "sm:w-[260px] lg:w-[300px]"} flex-shrink-0 p-4 lg:p-5 border-t sm:border-t-0 sm:border-l flex flex-col justify-center`}
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.18)" }}>
          {visual}
        </div>
      </div>
    </div>
  );
}

export function HowSection() {
  const steps: Omit<CardProps, "delay">[] = [
    {
      num: "01", color: BLUE, tag: "진단",
      title: "초안을 넣으면, 뭐가 부족한지 바로 짚어드려요",
      desc: <>고치기 전에 지금 초안의 어디가 약한지 먼저 파악합니다.<br />논리 흐름, 문맥 연결, 직무 이해도까지.</>,
      visual: <DiagnosisMini />,
    },
    {
      num: "02", color: GOLD, tag: "디깅", wide: true,
      title: "꼬리질문이 멈춰있던 경험을 꺼냅니다",
      desc: <>혼자서는 절대 꺼내지 못했을 이야기가 대화로 나옵니다.<br /><span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>무엇을 했는지</span>가 아니라 <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>왜 그렇게 판단했는지</span>까지.</>,
      visual: <DiggingMini />,
    },
    {
      num: "03", color: VIOLET, tag: "완성 · 면접",
      title: "대화가 자소서가 되고, 면접 준비로 이어집니다",
      desc: <>나눈 대화가 그대로 자소서에 살아있습니다.<br />그 자소서가 면접 예상 질문으로도 이어집니다.</>,
      visual: <CompletionMini />,
    },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:"30%", right:"-5%", width:"500px", height:"500px", borderRadius:"50%", background:"#6B8EFF", filter:"blur(160px)", opacity:0.04 }} />
        <div style={{ position:"absolute", bottom:"15%", left:"-5%", width:"400px", height:"400px", borderRadius:"50%", background:"#A78BFA", filter:"blur(150px)", opacity:0.04 }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 py-28 relative">
        <div className="mb-14 anim">
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: "1rem" }}>How it works</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)", wordBreak: "keep-all" }}>
            이렇게 진행됩니다
          </h2>
        </div>
        <div className="flex flex-col gap-3.5">
          {steps.map((s, i) => <StepCard key={i} {...s} delay={Math.min(i + 1, 3)} />)}
        </div>
      </div>
    </section>
  );
}
