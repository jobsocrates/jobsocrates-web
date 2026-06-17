"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#4338CA";
const ACCENT_MID = "#6366F1";
const VIOLET = "#A78BFA";

const STEP_COLORS = [
  { bg: "#EDE9FE", border: "#C4B5FD", num: ACCENT },
  { bg: "#EFF6FF", border: "#BFDBFE", num: "#3B82F6" },
  { bg: "#F0FDF4", border: "#BBF7D0", num: "#16A34A" },
  { bg: "#F5F3FF", border: "#DDD6FE", num: "#7C3AED" },
  { bg: "#FFFBEB", border: "#FDE68A", num: "#D97706" },
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
        { icon: "✍️", text: "뱃지 1개 = 완성 자소서 문항 1개 완성이에요." },
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
      id: "answer" as const,
      chapter: "3장",
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
      style={{ background: "rgba(17,24,39,0.5)", backdropFilter: "blur(10px)", animation: "backdropIn 0.4s ease forwards" }}
    >
      <style>{`
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tutIn {
          from { opacity: 0; transform: translateY(32px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-full flex flex-col rounded-3xl overflow-hidden"
        style={{
          maxWidth: "min(96vw, 820px)",
          maxHeight: "92dvh",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 20px 60px rgba(17,24,39,0.18), 0 4px 20px rgba(17,24,39,0.08)",
          animation: "tutIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-5 pb-0 flex-shrink-0">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "#EDE9FE", color: ACCENT, border: "1px solid #C4B5FD" }}
          >
            {TUTORIAL_CONTENT.header}
          </span>
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === pageIdx ? "24px" : "7px",
                  height: "7px",
                  borderRadius: "4px",
                  background: i === pageIdx ? ACCENT : i < pageIdx ? "#C4B5FD" : "#E5E7EB",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* 챕터 + 제목 */}
        <div className="px-5 sm:px-7 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: "#EDE9FE", color: ACCENT, border: "1px solid #C4B5FD" }}
            >
              {current.chapter}
            </span>
            <span className="text-lg leading-none">{current.icon}</span>
          </div>
          <h2
            className="text-xl sm:text-3xl font-bold leading-snug"
            style={{ color: "#111827", letterSpacing: "-0.03em" }}
          >
            {current.title}
          </h2>
        </div>

        {/* 본문 */}
        <div
          key={animKey}
          className="hide-scrollbar px-5 sm:px-7 pb-2 pt-4 flex flex-col gap-2.5 sm:gap-3 overflow-y-auto"
          style={{ animation: "pageIn 0.28s ease forwards" }}
        >
          {/* 1장 — 뱃지 */}
          {current.id === "badge" && (
            <>
              <div className="flex flex-col gap-4">
                {current.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-xl flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
                    <p className="text-base leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-base leading-relaxed font-medium" style={{ color: "#92400E", wordBreak: "keep-all" }}>
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
                const isLastStep = i === current.steps.length - 1;
                return (
                  <div
                    key={i}
                    className={isLastStep ? "sm:col-span-2" : ""}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 800, color: c.num, lineHeight: 1, flexShrink: 0, letterSpacing: "-0.04em" }}>
                      {step.num}
                    </span>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, wordBreak: "keep-all" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3장 — 답변 방법 */}
          {current.id === "answer" && (
            <>
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <span className="text-2xl leading-none flex-shrink-0 mt-0.5">🎙️</span>
                <p className="text-base leading-relaxed font-semibold" style={{ color: "#1D4ED8", wordBreak: "keep-all" }}>
                  {current.tip}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #BBF7D0", background: "#F0FDF4" }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#BBF7D0" }}>
                    <span className="text-base leading-none">⭕</span>
                    <span className="text-sm font-bold" style={{ color: "#16A34A" }}>{current.good.label}</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all", fontStyle: "italic" }}>
                      {current.good.text}
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "#16A34A" }}>
                      → {current.good.reason}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #FECACA", background: "#FEF2F2" }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#FECACA" }}>
                    <span className="text-base leading-none">❌</span>
                    <span className="text-sm font-bold" style={{ color: "#DC2626" }}>{current.bad.label}</span>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "#6B7280", wordBreak: "keep-all", fontStyle: "italic" }}>
                      {current.bad.text}
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "#DC2626" }}>
                      → {current.bad.reason}
                    </p>
                  </div>
                </div>
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
              <span className="text-sm" style={{ color: "#9CA3AF" }}>다시 안 보기</span>
            </label>
          )}
        </div>

        {/* 버튼 */}
        <div
          className="px-5 sm:px-7 pt-3 pb-5 sm:pb-6 flex flex-col gap-2 flex-shrink-0"
          style={{ borderTop: "1px solid #F3F4F6" }}
        >
          <button
            onClick={goNext}
            className="w-full py-3.5 rounded-2xl text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_MID} 100%)`,
              boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
              letterSpacing: "-0.01em",
              fontSize: 16,
            }}
          >
            {isLast ? "시작하기" : "다음"}
          </button>

          {!isFirst && !isLast && (
            <button
              onClick={close}
              className="w-full py-2 text-sm transition-all hover:opacity-60"
              style={{ color: "#9CA3AF" }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
