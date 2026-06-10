"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";
const GREEN = "rgb(74,222,128)";
const VIOLET = "#A78BFA";

const STEP_COLORS = [
  { bg: "rgba(201,100,66,0.1)", border: "rgba(201,100,66,0.25)", num: ACCENT },
  { bg: "rgba(107,142,255,0.1)", border: "rgba(107,142,255,0.25)", num: BLUE },
  { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", num: GREEN },
  { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", num: VIOLET },
  { bg: "rgba(255,209,102,0.1)", border: "rgba(255,209,102,0.25)", num: GOLD },
];

export const TUTORIAL_CONTENT = {
  header: "이용 전 꼭 확인해주세요",

  pages: [
    {
      id: "badge" as const,
      chapter: "1장",
      icon: "🏅",
      title: "뱃지가 뭔가요?",
      items: [
        { icon: "🏅", text: "화면 상단의 뱃지 숫자로 남은 분석 횟수를 확인할 수 있어요." },
        { icon: "✍️", text: "뱃지 1개 = 자소서 문항 1개 분석이에요." },
        { icon: "📂", text: "이전 기록, 비밀번호 변경 등 자세한 내용은 마이페이지에서 확인하세요." },
      ],
      warning: '"자소서 분석하기"를 누르면 뱃지 1개가 사용돼요. 시작하면 끝까지 함께 가요!',
    },
    {
      id: "flow" as const,
      chapter: "2장",
      icon: "📋",
      title: "어떻게 진행되나요?",
      steps: [
        { num: "01", label: "진단", desc: "초안을 넣으면 먼저 부족한 점을 짚어드려요" },
        { num: "02", label: "질문", desc: "빈틈을 채우는 질문을 하나씩 드려요. 답하다 보면 자소서가 단단해져요" },
        { num: "03", label: "완성", desc: "대화를 녹여 자소서를 처음부터 다시 써드려요" },
        { num: "04", label: "면접 대비", desc: "완성된 자소서로 예상 질문 4개를 뽑고, 답을 달면 방향 코멘트까지" },
        { num: "05", label: "정리", desc: "전체를 한눈에 모아보고 PDF로 받을 수 있어요" },
      ],
    },
    {
      id: "draft" as const,
      chapter: "3장",
      icon: "📄",
      title: "내 초안, 실시간으로 봐요",
      intro: "채팅 중 상단 '내 초안 보기'를 누르면 내 자소서가 하이라이트와 함께 표시돼요.",
      highlights: [
        {
          color: ACCENT,
          bg: "rgba(201,100,66,0.12)",
          border: "rgba(201,100,66,0.28)",
          label: "밝은 주황색",
          desc: "지금 이 질문이 가리키는 구절이에요. 대화가 진행될수록 자동으로 이동해요.",
        },
      ],
      tip: "대화하면서 '아, 지금 이 부분 얘기하는구나' 확인하면 집중이 훨씬 잘 돼요. 질문이 어렵게 느껴질 때 꼭 열어보세요!",
    },
    {
      id: "answer" as const,
      chapter: "4장",
      icon: "💬",
      title: "답변은 이렇게 해주세요",
      intro: "질문에 얼마나 구체적으로 답하느냐가 자소서 품질을 좌우해요.",
      good: {
        label: "이렇게 답하면 좋아요",
        text: '"팀 발표를 앞두고 자료가 계속 늦어졌어요. 그래서 제가 공유 문서에 마감 시간을 적어두고 매일 아침 진행 상황을 확인했더니, 발표 전날엔 다 모였어요."',
        reason: "상황 + 내가 한 행동 + 결과가 다 있어요",
      },
      bad: {
        label: "이렇게 답하면 아쉬워요",
        text: '"팀플 때 열심히 했어요. 그래서 잘 끝났어요."',
        reason: "뭘 했는지가 없어서 자소서에 쓸 게 안 나와요.",
      },
      tip: "질문들은 실제 면접장에서 나오는 꼬리질문 수준이에요. 면접 답변한다 생각하고 입으로 먼저 중얼거리면서 말해보고 답변해보세요. 그럼 훨씬 도움이 돼요!",
    },
  ],
} as const;

type Page = (typeof TUTORIAL_CONTENT.pages)[number];

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function TutorialModal({ userId, onClose }: Props) {
  const [pageIdx, setPageIdx] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const pages = TUTORIAL_CONTENT.pages;
  const current = pages[pageIdx] as Page;
  const isFirst = pageIdx === 0;
  const isLast = pageIdx === pages.length - 1;

  async function close() {
    if (dontShow) {
      localStorage.setItem("tutorialSeen", "true");
      if (userId) {
        supabase
          .from("profiles")
          .update({ tutorial_seen: true } as Record<string, unknown>)
          .eq("id", userId);
      }
    }
    onClose();
  }

  function goNext() {
    if (isLast) { close(); return; }
    setPageIdx(p => p + 1);
    setAnimKey(k => k + 1);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      style={{ animation: "backdropIn 0.7s ease forwards" }}
    >
      <style>{`
        @keyframes backdropIn {
          from { opacity: 0; background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
          to   { opacity: 1; background: rgba(0,0,0,0.78); backdrop-filter: blur(10px); }
        }
        @keyframes tutIn {
          from { opacity: 0; transform: translateY(40px) scale(0.91); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-full flex flex-col rounded-3xl overflow-hidden"
        style={{
          maxWidth: "min(96vw, 820px)",
          maxHeight: "96vh",
          background: "#0D0D18",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 60px 120px rgba(0,0,0,0.8)",
          animation: "tutIn 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-7 pt-5 pb-0 flex-shrink-0">
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {TUTORIAL_CONTENT.header}
          </span>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === pageIdx ? "28px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === pageIdx ? ACCENT : i < pageIdx ? `${ACCENT}50` : "rgba(255,255,255,0.1)",
                  transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 챕터 + 제목 ── */}
        <div className="px-7 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
            >
              {current.chapter}
            </span>
            <span className="text-xl leading-none">{current.icon}</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold leading-snug"
            style={{ color: "rgba(255,255,255,0.96)", letterSpacing: "-0.03em" }}
          >
            {current.title}
          </h2>
        </div>

        {/* ── 본문 ── */}
        <div
          key={animKey}
          className="hide-scrollbar px-7 pb-2 pt-4 flex flex-col gap-3 overflow-y-auto flex-1"
          style={{ animation: "pageIn 0.32s ease forwards" }}
        >

          {/* 1장 — 뱃지 */}
          {current.id === "badge" && (
            <>
              <div className="flex flex-col gap-4">
                {current.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-xl flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
                    <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.78)", wordBreak: "keep-all" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.28)" }}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-base leading-relaxed font-medium" style={{ color: "rgba(255,209,102,0.92)", wordBreak: "keep-all" }}>
                  {current.warning}
                </p>
              </div>
            </>
          )}

          {/* 2장 — 진행 흐름 */}
          {current.id === "flow" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {current.steps.map((step, i) => {
                const c = STEP_COLORS[i];
                const isLast = i === current.steps.length - 1;
                return (
                  <div
                    key={i}
                    className={isLast ? "sm:col-span-2" : ""}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: c.num,
                        lineHeight: 1,
                        flexShrink: 0,
                        letterSpacing: "-0.04em",
                        opacity: 0.85,
                      }}
                    >
                      {step.num}
                    </span>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 5 }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, wordBreak: "keep-all" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3장 — 내 초안 보기 */}
          {current.id === "draft" && (
            <>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all" }}>
                {current.intro}
              </p>

              {/* 하이라이트 설명 카드 */}
              <div className="flex flex-col gap-3">
                {current.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-2xl px-5 py-4"
                    style={{ background: h.bg, border: `1px solid ${h.border}` }}
                  >
                    {/* 색상 견본 */}
                    <div
                      className="flex-shrink-0 mt-0.5 rounded"
                      style={{ width: 28, height: 28, background: h.bg, border: `2px solid ${h.color}`, boxShadow: `0 0 10px ${h.color}40`, borderRadius: 6 }}
                    />
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: h.color }}>{h.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", wordBreak: "keep-all" }}>{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 미니 초안 미리보기 */}
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-xs font-semibold mb-3 tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>미리보기</p>
                <p className="text-sm leading-[1.9]" style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all" }}>
                  저는 팀 프로젝트에서 팀원들과 소통하며 문제를 해결했습니다. 당시{" "}
                  <mark style={{ background: "rgba(201,100,66,0.3)", color: "rgba(255,255,255,0.95)", borderRadius: "3px", padding: "2px 4px", border: "1px solid rgba(201,100,66,0.5)", boxShadow: "0 0 10px rgba(201,100,66,0.25)" }}>
                    일정이 촉박한 상황에서
                  </mark>
                  {" "}저는 매일 진행상황을 공유하는 방식으로...
                </p>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(201,100,66,0.3)", border: "1px solid rgba(201,100,66,0.5)" }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>현재 질문 구절</span>
                  </div>
                </div>
              </div>

              {/* 팁 */}
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(255,209,102,0.07)", border: "1px solid rgba(255,209,102,0.22)" }}
              >
                <span className="text-lg leading-none flex-shrink-0 mt-0.5">💡</span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,209,102,0.88)", wordBreak: "keep-all" }}>
                  {current.tip}
                </p>
              </div>
            </>
          )}

          {/* 4장 — 답변 방법 */}
          {current.id === "answer" && (
            <>
              <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", wordBreak: "keep-all" }}>
                {current.intro}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(74,222,128,0.28)", background: "rgba(74,222,128,0.07)" }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(74,222,128,0.15)" }}>
                    <span className="text-base leading-none">⭕</span>
                    <span className="text-sm font-bold" style={{ color: GREEN }}>
                      {current.good.label}
                    </span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all", fontStyle: "italic" }}>
                      {current.good.text}
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "rgba(74,222,128,0.9)" }}>
                      → {current.good.reason}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.06)" }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(248,113,113,0.15)" }}>
                    <span className="text-base leading-none">❌</span>
                    <span className="text-sm font-bold" style={{ color: "rgb(248,113,113)" }}>
                      {current.bad.label}
                    </span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all", fontStyle: "italic" }}>
                      {current.bad.text}
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "rgba(248,113,113,0.85)" }}>
                      → {current.bad.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* 면접 팁 */}
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(107,142,255,0.08)", border: "1px solid rgba(107,142,255,0.25)" }}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">🎙️</span>
                <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(107,142,255,0.95)", wordBreak: "keep-all" }}>
                  {current.tip}
                </p>
              </div>
            </>
          )}

          {/* 마지막 장: 다시 안보기 */}
          {isLast && (
            <label className="flex items-center gap-3 cursor-pointer select-none pt-1 pb-2">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                style={{ accentColor: ACCENT, width: 17, height: 17, cursor: "pointer" }}
              />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>
                다시 안 보기
              </span>
            </label>
          )}
        </div>

        {/* ── 버튼 ── */}
        <div
          className="px-7 pt-3 pb-6 flex flex-col gap-2.5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: ACCENT, boxShadow: `0 6px 24px ${ACCENT}35`, letterSpacing: "-0.01em", fontSize: 16 }}
          >
            {isLast ? "시작하기" : "다음"}
          </button>

          {!isFirst && !isLast && (
            <button
              onClick={close}
              className="w-full py-2 text-sm transition-all hover:opacity-60"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
