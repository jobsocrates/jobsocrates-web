"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";
const BLUE = "#6B8EFF";
const GOLD = "#FFD166";

/* ═══════════════════════════════════════════════════════════════
   튜토리얼 내용 — 이 객체만 수정하면 됩니다
═══════════════════════════════════════════════════════════════ */
export const TUTORIAL_CONTENT = {
  header: "이용 전 꼭 확인해주세요",

  pages: [
    {
      id: "badge" as const,
      chapter: "1장",
      icon: "🏅",
      title: "뱃지가 뭔가요?",
      items: [
        { icon: "👆", text: "화면 우측 상단의 뱃지 모양에서 보유 수량을 확인할 수 있어요." },
        { icon: "✍️", text: "뱃지 1개 = 자소서 문항 1개 완성이에요." },
        { icon: "📂", text: "뱃지를 누르면 지금까지 완성한 자소서를 다시 볼 수 있어요." },
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

/* ═══════════════════════════════════════════════════════════════
   컴포넌트
═══════════════════════════════════════════════════════════════ */
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
      // localStorage: 즉시 저장 (다음 방문부터 적용)
      localStorage.setItem("tutorialSeen", "true");
      // DB: 크로스 디바이스 동기화 (컬럼 없으면 조용히 실패)
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <style>{`
        @keyframes tutIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 400,
          background: "#0D0D18",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
          animation: "tutIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* ── 상단 헤더 ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {TUTORIAL_CONTENT.header}
          </span>
          {/* 진행 도트 */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === pageIdx ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === pageIdx ? ACCENT : i < pageIdx ? `${ACCENT}40` : "rgba(255,255,255,0.1)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 챕터 + 제목 ── */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              {current.chapter}
            </span>
            <span className="text-base leading-none">{current.icon}</span>
          </div>
          <h2
            className="text-lg font-bold leading-snug"
            style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}
          >
            {current.title}
          </h2>
        </div>

        {/* ── 본문 (페이지별, 전환 애니메이션) ── */}
        <div
          key={animKey}
          className="px-6 pb-2 pt-4 flex flex-col gap-3"
          style={{ animation: "pageIn 0.28s ease both" }}
        >
          {/* 1장 — 뱃지 */}
          {current.id === "badge" && (
            <>
              <div className="flex flex-col gap-3">
                {current.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5 leading-none">{item.icon}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", wordBreak: "keep-all" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.28)" }}
              >
                <span className="text-base leading-none flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255,209,102,0.9)", wordBreak: "keep-all" }}>
                  {current.warning}
                </p>
              </div>
            </>
          )}

          {/* 2장 — 진행 흐름 */}
          {current.id === "flow" && (
            <div className="flex flex-col gap-1">
              {current.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}
                >
                  <span
                    className="text-sm font-bold flex-shrink-0 w-5 text-center mt-px"
                    style={{ color: BLUE }}
                  >
                    {step.num}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {step.label}
                    </span>
                    <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)", wordBreak: "keep-all" }}>
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
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.58)", wordBreak: "keep-all" }}>
                {current.intro}
              </p>

              {/* ⭕ 좋은 예 */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(74,222,128,0.28)", background: "rgba(74,222,128,0.07)" }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b"
                  style={{ borderColor: "rgba(74,222,128,0.15)" }}
                >
                  <span className="text-sm leading-none">⭕</span>
                  <span className="text-xs font-semibold" style={{ color: "rgb(74,222,128)" }}>
                    {current.good.label}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.78)", wordBreak: "keep-all", fontStyle: "italic" }}
                  >
                    {current.good.text}
                  </p>
                  <p
                    className="text-xs mt-2 font-semibold"
                    style={{ color: "rgba(74,222,128,0.8)" }}
                  >
                    → {current.good.reason}
                  </p>
                </div>
              </div>

              {/* ❌ 아쉬운 예 */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.06)" }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b"
                  style={{ borderColor: "rgba(248,113,113,0.15)" }}
                >
                  <span className="text-sm leading-none">❌</span>
                  <span className="text-xs font-semibold" style={{ color: "rgb(248,113,113)" }}>
                    {current.bad.label}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.52)", wordBreak: "keep-all", fontStyle: "italic" }}
                  >
                    {current.bad.text}
                  </p>
                  <p
                    className="text-xs mt-2 font-semibold"
                    style={{ color: "rgba(248,113,113,0.8)" }}
                  >
                    → {current.bad.reason}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* 마지막 장: 다시 안 보기 */}
          {isLast && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1 pb-1">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                style={{ accentColor: ACCENT, width: 14, height: 14, cursor: "pointer" }}
              />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                다시 안 보기
              </span>
            </label>
          )}
        </div>

        {/* ── 하단 버튼 ── */}
        <div
          className="px-6 pt-4 pb-6 flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={goNext}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}28` }}
          >
            {isLast ? "시작하기" : "다음"}
          </button>

          {/* 1장엔 건너뛰기 없음, 마지막 장엔 건너뛰기 없음 */}
          {!isFirst && !isLast && (
            <button
              onClick={close}
              className="w-full py-1.5 text-xs transition-all hover:opacity-60"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
