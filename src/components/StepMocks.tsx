"use client";

import { useState } from "react";

const ACCENT = "#FF6B35";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "1px solid rgba(255,255,255,0.07)";
const DOTS = [{ c: "#FF6B35", d: 0 }, { c: "#6B8EFF", d: 150 }, { c: "#FFD166", d: 300 }];

export const STEPS = [
  { step: "STEP 1", title: "사례 디깅", color: "#6B8EFF", desc: "AI가 질문으로 경험을 파냅니다. 미처 몰랐던 경험의 핵심이 드러납니다." },
  { step: "STEP 2", title: "브릿지", color: "#FFD166", desc: "직무가 원하는 것과 내 경험을 냉철하게 비교합니다. 갭이 있으면 솔직하게 알려드립니다." },
  { step: "STEP 3", title: "자소서 완성", color: "#4ECDC4", desc: "디깅과 브릿지에서 나온 내 이야기로 자소서를 완성합니다. 대화에 없는 내용은 절대 추가하지 않습니다." },
  { step: "STEP 4", title: "면접 준비 노트", color: ACCENT, desc: "완성된 자소서에서 면접관이 파고들 포인트를 미리 뽑아드립니다." },
  { step: "STEP 5", title: "전체 정리", color: "#A8E6CF", desc: "브릿지부터 면접 노트까지 한눈에 정리해드립니다." },
];

export function ChatMock() {
  const msgs = [
    { r: "bot", t: "구체적으로 어떤 역할을 맡으셨나요?" },
    { r: "user", t: "API 설계부터 QA까지 혼자 담당했어요. 팀장님이랑 매일 공유하면서요." },
    { r: "bot", t: "가장 힘들었던 순간은 언제였나요?" },
    { r: "user", t: "배포 직전 성능 이슈가 터졌을 때요. 밤새 혼자 잡았어요." },
  ];
  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: "#0A0A18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}>
      <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "#6B8EFF", color: "#fff" }}>AI</div>
        <span className="text-sm font-semibold text-white">사례 디깅</span>
        <span className="text-xs ml-auto px-2 py-0.5 rounded-full"
          style={{ background: "rgba(107,142,255,0.15)", color: "#6B8EFF" }}>3 / 6턴</span>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {msgs.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.r === "user" ? "justify-end" : ""}`}>
            {m.r === "bot" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "#6B8EFF", color: "#fff" }}>AI</div>
            )}
            <div className="max-w-[78%] px-3 py-2 text-sm leading-relaxed"
              style={m.r === "bot"
                ? { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderRadius: "4px 14px 14px 14px" }
                : { background: ACCENT, color: "#fff", borderRadius: "14px 4px 14px 14px" }}>
              {m.t}
            </div>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "#6B8EFF", color: "#fff" }}>AI</div>
          <div className="px-3 py-2.5" style={{ background: "rgba(255,255,255,0.07)", borderRadius: "4px 14px 14px 14px" }}>
            <div className="flex gap-1 items-center h-3.5">
              {DOTS.map(({ c, d }) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: c, animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t flex gap-2 flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex-1 rounded-xl px-3 py-2 text-sm"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}>
          답변을 입력하세요...
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: ACCENT }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function BridgeMock() {
  const secs = [
    { label: "직무 이해", color: "#6B8EFF", text: "PM은 제품 방향을 정의하고 팀을 조율합니다. 기술 이해 없이는 개발팀과 소통이 어렵고, 데이터 기반 의사결정이 핵심입니다." },
    { label: "경험 비교", color: "#FFD166", text: "API 설계 경험은 개발팀 소통에서 강점입니다. 다만 사용자 리서치와 KPI 설정 경험은 아직 없어요. 솔직히 말할게요 — 갭이 있습니다." },
    { label: "포지셔닝 전략", color: "#4ECDC4", text: "기술 이해도를 가진 PM 지망생으로 포지셔닝하세요. 개발 경험으로 팀과의 소통 갭을 줄일 수 있다는 방향이 유효합니다." },
  ];
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-white">브릿지 분석</span>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,210,102,0.15)", color: "#FFD166" }}>PM 인턴</span>
      </div>
      {secs.map((s) => (
        <div key={s.label} className="flex-1 rounded-xl p-4"
          style={{ background: CARD, border: `1px solid ${s.color}22` }}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: s.color }}>{s.label}</p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export function CoverLetterMock() {
  const text = `저는 개발 과정에서 '스스로 설명할 수 없으면 모르는 것'이라는 기준으로 일해왔습니다.

PM 인턴 당시 API 설계부터 QA까지 혼자 담당하며, 배포 직전 성능 이슈가 터졌을 때 팀장님께 먼저 보고하고 원인을 분석해 해결책을 제시했습니다.

단순히 빠른 배포보다 정확한 판단이 먼저라는 것을 그때 배웠습니다. 개발 경험이 있는 PM이 갖는 강점은 기술 부채를 이해하고, 개발팀과 같은 언어로 대화할 수 있다는 점입니다.`;
  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: "#0A0A18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}>
      <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <span className="text-sm font-semibold text-white">자소서 초안</span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>587자</span>
          <span className="text-xs px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>복사하기</span>
        </div>
      </div>
      <div className="flex-1 p-5 overflow-hidden relative">
        <p className="text-sm leading-[1.9] whitespace-pre-wrap"
          style={{ color: "rgba(255,255,255,0.82)" }}>{text}</p>
        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: "linear-gradient(to bottom, transparent, #0A0A18)" }} />
      </div>
      <div className="px-5 py-3 flex gap-2 flex-shrink-0">
        <div className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>복사하기</div>
        <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center"
          style={{ background: ACCENT }}>면접 준비 노트 →</div>
      </div>
    </div>
  );
}

export function RiskMock() {
  const risks = [
    { title: "혼자 개발한 경험의 규모", desc: "팀 협업 능력을 증명하기 어려울 수 있어요.", resp: "팀장님께 매일 진행 상황을 보고하며 협업한 경험, 코드 리뷰를 요청한 사례를 구체적으로 준비하세요." },
    { title: "PM 기획 경험 없음", desc: "면접관이 실제 기획 역량을 검증하려 할 가능성이 높아요.", resp: "API 설계 과정에서 사용자 요구사항을 기술로 풀어낸 경험을 PM 관점으로 재프레이밍하세요." },
    { title: "성능 이슈 해결 수치 부재", desc: "임팩트를 증명하기 어려워요.", resp: "응답속도 개선 수치, 오류율 변화 등 측정 가능한 결과를 준비해두세요." },
  ];
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-white">면접 준비 노트</span>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,107,53,0.15)", color: ACCENT }}>리스크 3개</span>
      </div>
      {risks.map((r, i) => (
        <div key={i} className="flex-1 rounded-xl p-3.5 flex flex-col gap-2" style={{ background: CARD, border: BORDER }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.15)", color: ACCENT }}>리스크 {i + 1}</span>
            <span className="text-sm font-medium text-white truncate">{r.title}</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{r.desc}</p>
          <div className="rounded-lg p-2.5 mt-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="text-xs block mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>대응 방향</span>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>{r.resp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummaryMock() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { label: "브릿지 분석", color: "#FFD166", preview: "직무 이해 · 경험 비교 · 포지셔닝 전략" },
    { label: "자소서 초안", color: "#4ECDC4", preview: "587자 완성본 · 복사하기" },
    { label: "면접 준비 노트", color: ACCENT, preview: "리스크 3개 · 대응 방향 포함" },
  ];
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="mb-1">
        <span className="text-sm font-semibold text-white">전체 정리</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-xl overflow-hidden flex-shrink-0" style={{ border: BORDER }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5"
            style={{ background: open === i ? "rgba(255,255,255,0.06)" : CARD }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-sm font-medium" style={{ color: item.color }}>{item.label}</span>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)", display: "inline-block", transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
          </button>
          {open === i && (
            <div className="px-4 py-2.5 border-t text-xs"
              style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.02)" }}>
              {item.preview}
            </div>
          )}
        </div>
      ))}
      <div className="mt-auto pt-2">
        <button className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.82)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          PDF로 저장하기
        </button>
      </div>
    </div>
  );
}

export const MOCKS = [ChatMock, BridgeMock, CoverLetterMock, RiskMock, SummaryMock];
