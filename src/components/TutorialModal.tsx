"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";

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
        { num: "①", label: "진단", desc: "초안을 넣으면 먼저 부족한 점을 짚어드려요" },
        { num: "②", label: "질문", desc: "빈틈을 채우는 질문을 하나씩 드려요. 답하다 보면 자소서가 단단해져요" },
        { num: "③", label: "완성", desc: "대화를 녹여 자소서를 다시 써드려요" },
        { num: "④", label: "면접 대비", desc: "완성된 자소서로 예상 질문 4개를 뽑고, 답을 달면 방향 코멘트까지" },
        { num: "⑤", label: "정리", desc: "전체를 한눈에 모아보고 PDF로 받을 수 있어요" },
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
      style={{ animation: "backdropIn 0.4s ease forwards" }}
    >
      <style>{`
        @keyframes backdropIn {
          from { opacity: 0; background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
          to   { opacity: 1; background: rgba(0,0,0,0.78); backdrop-filter: blur(10px); }
        }
        @keyframes tutIn {
          from { opacity: 0; transform: translateY(14px) scale(0.975); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: "min(92vw, 680px)",
          maxHeight: "90vh",
          background: "#0D0D18",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          animation: "tutIn 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) forwards",
        }}
      >
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-7 pt-6 pb-0 flex-shrink-0">
          <span
            className="text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.38)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {TUTORIAL_CONTENT.header}
          </span>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === pageIdx ? "22px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === pageIdx ? ACCENT : i < pageIdx ? `${ACCENT}40` : "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 챕터 + 제목 ── */}
        <div className="px-7 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {current.chapter}
            </span>
            <span className="text-xl leading-none">{current.icon}</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold leading-snug"
            style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}
          >
            {current.title}
          </h2>
        </div>

        {/* ── 본문 ── */}
        <div
          key={animKey}
          className="px-7 pb-2 pt-5 flex flex-col gap-4 overflow-y-auto flex-1"
          style={{ animation: "pageIn 0.28s ease forwards" }}
        >

          {/* 1장 — 뱃지 */}
          {current.id === "badge" && (
            <>
              <div className="flex flex-col gap-4">
                {current.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-xl flex-shrink-0 mt-0.5 leading-none">{item.icon}</span>
                    <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", wordBreak: "keep-all" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="flex items-start gap-3 px-5 py-4 rounded-xl"
                style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.28)" }}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-base leading-relaxed font-medium" style={{ color: "rgba(255,209,102,0.9)", wordBreak: "keep-all" }}>
                  {current.warning}
                </p>
              </div>
            </>
          )}

          {/* 2장 — 진행 흐름 */}
          {current.id === "flow" && (
            <div className="flex flex-col gap-1.5">
              {current.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-4 py-3.5 rounded-xl"
                  style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}
                >
                  <span
                    className="text-base font-bold flex-shrink-0 w-6 text-center mt-px"
                    style={{ color: BLUE }}
                  >
                    {step.num}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                      {step.label}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", wordBreak: "keep-all" }}>
                      — {step.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3장 — 답변 방법 */}
          {current.id === "answer" && (
            <>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.58)", wordBreak: "keep-all" }}>
                {current.intro}
              </p>

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(74,222,128,0.28)", background: "rgba(74,222,128,0.07)" }}
              >
                <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(74,222,128,0.15)" }}>
                  <span className="text-base leading-none">⭕</span>
                  <span className="text-sm font-semibold" style={{ color: "rgb(74,222,128)" }}>
                    {current.good.label}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", wordBreak: "keep-all", fontStyle: "italic" }}>
                    {current.good.text}
                  </p>
                  <p className="text-sm mt-2.5 font-semibold" style={{ color: "rgba(74,222,128,0.85)" }}>
                    → {current.good.reason}
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.06)" }}
              >
                <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(248,113,113,0.15)" }}>
                  <span className="text-base leading-none">❌</span>
                  <span className="text-sm font-semibold" style={{ color: "rgb(248,113,113)" }}>
                    {current.bad.label}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all", fontStyle: "italic" }}>
                    {current.bad.text}
                  </p>
                  <p className="text-sm mt-2.5 font-semibold" style={{ color: "rgba(248,113,113,0.85)" }}>
                    → {current.bad.reason}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* 마지막 장: 다시 안보기 */}
          {isLast && (
            <label className="flex items-center gap-3 cursor-pointer select-none pt-2 pb-1">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                style={{ accentColor: ACCENT, width: 16, height: 16, cursor: "pointer" }}
              />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.32)" }}>
                다시 안 보기
              </span>
            </label>
          )}
        </div>

        {/* ── 버튼 ── */}
        <div
          className="px-7 pt-4 pb-7 flex flex-col gap-2.5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={goNext}
            className="w-full py-4 rounded-xl text-base font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}30`, letterSpacing: "-0.01em" }}
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
