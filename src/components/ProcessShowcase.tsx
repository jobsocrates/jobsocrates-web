"use client";

import { useState, type ReactNode } from "react";

const BLUE = "#3B62CC";
const VIOLET = "#A78BFA";
const TEAL = "#5EEAD4";
const NAVY = "#1A3461";

/* ─────────── 우측: 각 스텝의 실제 화면 목업 ─────────── */

function Bubble({ role, children, accent }: { role: "ai" | "me"; children: ReactNode; accent?: boolean }) {
  if (role === "ai") {
    return (
      <div className="flex items-start gap-2.5">
        <img src="/ai-avatar.webp" alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
        <div
          className="px-4 py-3 text-[13.5px] leading-relaxed"
          style={{
            background: accent ? `${VIOLET}22` : "rgba(255,255,255,0.07)",
            border: `1px solid ${accent ? `${VIOLET}55` : "rgba(255,255,255,0.12)"}`,
            color: accent ? "#fff" : "rgba(255,255,255,0.82)",
            borderRadius: "4px 16px 16px 16px",
            maxWidth: "86%",
            wordBreak: "keep-all",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div
        className="px-4 py-3 text-[13.5px] leading-relaxed"
        style={{ background: NAVY, color: "rgba(255,255,255,0.92)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: "16px 4px 16px 16px", maxWidth: "82%", wordBreak: "keep-all" }}
      >
        {children}
      </div>
    </div>
  );
}

function MockShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: "linear-gradient(165deg, #11203F, #0C1A33)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1.5">
          {["#3B4252", "#3B4252", "#3B4252"].map((c, i) => <span key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
        </div>
        <span className="text-[11px] font-semibold ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <div className="p-4 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function DiggingMock() {
  return (
    <MockShell label="디깅 · 실무 면접 모드">
      <Bubble role="ai">그때 왜 그 방법을 택했어요? 다른 선택지도 있었을 텐데요.</Bubble>
      <Bubble role="me">출력이 계속 흔들려서, 파라미터가 아니라 노이즈가 원인이라 보고 필터를 새로 달았어요.</Bubble>
      <Bubble role="ai" accent>방금 그게 원인을 &lsquo;신호 품질&rsquo; 문제로 구분한 판단이에요. 실무에서도 그대로 통하는 접근이고요.</Bubble>
    </MockShell>
  );
}

function RevisionMock() {
  return (
    <MockShell label="완성본">
      <p className="text-[15px] font-extrabold" style={{ color: "#fff", letterSpacing: "-0.01em" }}>반복으로 좁혀낸 ±30cm</p>
      <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-[13px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all" }}>
          서지도 못하던 세그웨이를 자세 오차 ±30cm 이내로 좁혔습니다. 노이즈와 응답 속도가 동시에 잡히지 않는 구간에서, 파라미터가 아니라 신호 품질이 원인이라 판단해 저역통과 필터를 더했고…
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>막연한 초안</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${TEAL}1A`, color: TEAL }}>내 판단이 보이는 글</span>
      </div>
    </MockShell>
  );
}

function InterviewMock() {
  const qs = [
    "경쟁사도 비슷한 걸 하는데, 왜 하필 우리예요?",
    "그 경험과 실제 직무 사이엔 간극이 있는데, 어떻게 메울 거예요?",
    "그때 그 판단의 근거가 뭐였어요? 다른 선택지는 왜 아니었죠?",
  ];
  return (
    <MockShell label="면접 예상 질문">
      {qs.map((q, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: `${VIOLET}0E`, border: `1px solid ${VIOLET}22` }}>
          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-px" style={{ background: VIOLET, color: "#fff" }}>{i + 1}</span>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", wordBreak: "keep-all" }}>{q}</p>
        </div>
      ))}
    </MockShell>
  );
}

function PracticeMock() {
  return (
    <MockShell label="답변 연습">
      <Bubble role="me">현업 제어 방식을 익혀서 잘 적응하고 싶습니다.</Bubble>
      <Bubble role="ai">방향은 좋아요. 다만 &lsquo;무엇을&rsquo; 익혀 &lsquo;어디에&rsquo; 쓸지가 빠졌어요. 한 번 더 다듬어볼까요?</Bubble>
      <div className="flex gap-2">
        <span className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${VIOLET}22`, color: "#fff", border: `1px solid ${VIOLET}55` }}>피드백대로 다시 써보기</span>
        <span className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}>마무리</span>
      </div>
      <Bubble role="ai" accent>FOC 제어를 먼저 익혀, 반복 검증으로 파라미터를 좁혀온 제 방식을 실외 로봇에 적용하겠습니다.</Bubble>
    </MockShell>
  );
}

interface Step {
  num: string;
  tag: string;
  title: string;
  why: string;
  gain: string;
  color: string;
  visual: ReactNode;
}

const STEPS: Step[] = [
  {
    num: "01", tag: "실무 면접 디깅", color: BLUE,
    title: "고치기 전에, 실무 면접처럼 파고들어요",
    why: "자소서는 잘 쓴 글보다 면접에서 끝까지 설명되는 글이 중요하거든요. 그래서 글을 다듬기 전에 먼저 물어봐요. 그때 왜 그렇게 했는지요.",
    gain: "면접에서 실제로 나올 법한 질문을 미리 겪어보고, 막연했던 경험이 대답하는 사이에 또렷해져요.",
    visual: <DiggingMock />,
  },
  {
    num: "02", tag: "완성본", color: TEAL,
    title: "나눈 대화가 그대로 자소서가 돼요",
    why: "표현만 손보는 첨삭은 어디서 베낀 듯한 글이 되기 쉬워요. 그래서 우리는 디깅에서 끌어낸 진짜 내용으로 씁니다.",
    gain: "내 경험이 이 직무에 왜 맞는지가 글에서 보여요. 누가 읽어도 ‘이 사람’이 그려집니다.",
    visual: <RevisionMock />,
  },
  {
    num: "03", tag: "면접 예상 질문", color: VIOLET,
    title: "내 자소서에서 나올 질문을 미리 만나요",
    why: "자소서를 냈다고 끝이 아니잖아요. 결국 면접에서 그 내용 그대로 다시 질문받으니까요.",
    gain: "면접관이 내 글을 보고 던질 법한 질문을, 곤란한 압박 질문까지 미리 받아봐요.",
    visual: <InterviewMock />,
  },
  {
    num: "04", tag: "답변 연습", color: "#F0A35E",
    title: "답해보고, 피드백받고, 다듬어요",
    why: "질문만 알아선 부족하고, 직접 말해보고 고쳐봐야 실전이 되니까요.",
    gain: "자소서 한 장으로 끝나는 게 아니라, 면접까지 준비된 채로 마무리됩니다.",
    visual: <PracticeMock />,
  },
];

export function ProcessShowcase() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const go = (d: number) => setActive((p) => (p + d + STEPS.length) % STEPS.length);

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(165deg, #0D1B3E 0%, #16294F 55%, #1C3A78 100%)" }}>
      <style>{`
        @keyframes psFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ps-anim { animation: psFade 0.5s cubic-bezier(0.22,1,0.36,1); }
      `}</style>

      {/* aurora */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "-25%", right: "-8%", width: 560, height: 560, borderRadius: "50%", background: BLUE, filter: "blur(160px)", opacity: 0.16 }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-6%", width: 460, height: 460, borderRadius: "50%", background: VIOLET, filter: "blur(150px)", opacity: 0.1 }} />
      </div>

      <div className="relative max-w-[1080px] mx-auto px-6 sm:px-8 py-28">
        {/* 헤더 */}
        <div className="text-center mb-14 anim">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-[42px] font-bold leading-[1.2]" style={{ color: "#fff", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
            다른 툴은 <span style={{ color: "rgba(255,255,255,0.35)" }}>문장</span>에서 끝나지만,
            <br />
            우리는 <span style={{ color: TEAL }}>면접장</span>까지 데려다 줍니다.
          </h2>
        </div>

        {/* 스텝 탭 */}
        <div className="anim flex flex-wrap items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.num}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                style={{
                  background: on ? `${s.color}1F` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${on ? s.color : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: on ? s.color : "rgba(255,255,255,0.4)" }}>{s.num}</span>
                <span className="text-[13px] font-semibold" style={{ color: on ? "#fff" : "rgba(255,255,255,0.5)" }}>{s.tag}</span>
              </button>
            );
          })}
        </div>

        {/* 본문: 좌 카피 / 우 화면 */}
        <div key={active} className="ps-anim grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 좌 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl font-black" style={{ color: step.color, lineHeight: 1, letterSpacing: "-0.03em" }}>{step.num}</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: `${step.color}1A`, color: step.color, border: `1px solid ${step.color}33` }}>{step.tag}</span>
            </div>
            <h3 className="text-2xl sm:text-[26px] font-bold leading-snug mb-6" style={{ color: "#fff", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
              {step.title}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>왜 이렇게 하냐면</p>
                <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)", wordBreak: "keep-all" }}>{step.why}</p>
              </div>
              <div className="rounded-2xl px-5 py-4" style={{ background: `${step.color}12`, border: `1px solid ${step.color}30`, marginLeft: -20, marginRight: -20 }}>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: step.color }}>그래서 이렇게 됩니다</p>
                <p className="text-[15px] font-medium leading-relaxed" style={{ color: "#fff", wordBreak: "keep-all" }}>{step.gain}</p>
              </div>
            </div>
          </div>

          {/* 우 */}
          <div className="w-full">{step.visual}</div>
        </div>

        {/* 화살표 + 진행 */}
        <div className="anim flex items-center justify-center gap-5 mt-12">
          <button onClick={() => go(-1)} aria-label="이전" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <button key={s.num} onClick={() => setActive(i)} aria-label={`${i + 1}단계`} className="rounded-full transition-all" style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? s.color : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <button onClick={() => go(1)} aria-label="다음" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
