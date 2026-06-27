"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const NAVY = "#312E81";

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function TutorialModal({ userId, onClose }: Props) {
  const [dontShow, setDontShow] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(17,24,39,0.5)", backdropFilter: "blur(10px)" }}
    >
      <style>{`@keyframes tutIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:none; } }`}</style>

      <div
        className="w-full flex flex-col rounded-3xl overflow-hidden"
        style={{
          maxWidth: "440px",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 24px 64px -12px rgba(17,24,39,0.28)",
          animation: "tutIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* 헤더 */}
        <div className="px-7 pt-7 pb-1">
          <p className="text-xs font-bold tracking-[0.14em] uppercase mb-2" style={{ color: "#A78BFA" }}>GUIDE</p>
          <h2 className="text-2xl font-bold" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
            시작하기 전에, 뱃지 안내
          </h2>
        </div>

        {/* 본문 */}
        <div className="px-7 py-5 flex flex-col gap-3.5">
          {[
            "뱃지 1개로 자소서 문항 하나를 완성할 수 있어요.",
            "한번 시작한 문항은 추가 차감 없이 끝까지 이어서 할 수 있어요.",
            "남은 뱃지는 화면 상단에서 확인할 수 있어요.",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ background: NAVY }} />
              <p className="text-sm leading-relaxed" style={{ color: "#374151", wordBreak: "keep-all" }}>{t}</p>
            </div>
          ))}

          {/* 핵심 — 연한 박스 대신 좌측 액센트 바 */}
          <div className="mt-1.5 pl-4 py-0.5" style={{ borderLeft: `3px solid ${NAVY}` }}>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "#111827", wordBreak: "keep-all" }}>
초안까지 입력하면 나타나는 ‘자소서 분석하기’ 버튼을 누르는 순간 뱃지 1개가 사용돼요. 시작하면 끝까지 함께 가요.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-7 pt-2 pb-6 flex flex-col gap-3">
          <button
            onClick={close}
            className="w-full py-4 rounded-xl text-base font-bold text-white transition-all hover:opacity-92 active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #1A3461 0%, #312E81 100%)", boxShadow: "0 10px 28px -10px rgba(49,46,129,0.55)", letterSpacing: "-0.01em" }}
          >
            시작하기
          </button>
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              style={{ accentColor: NAVY, width: 15, height: 15, cursor: "pointer" }}
            />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>다시 안 보기</span>
          </label>
        </div>
      </div>
    </div>
  );
}
