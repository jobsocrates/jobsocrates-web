"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { SummaryPage } from "@/components/SummaryPage";
import { Step1Digging } from "@/components/steps/Step1Digging";
import { Step2Bridge } from "@/components/steps/Step2Bridge";
import { Step3CoverLetter } from "@/components/steps/Step3CoverLetter";
import { Step4Risk } from "@/components/steps/Step4Risk";
import type { ApiMessage, AppStep, BridgeData, DiggingContext, InterviewRisk } from "@/types";
import Link from "next/link";

function StepFade({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [stepKey]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function ChatPage() {
  const [step, setStep] = useState<AppStep>(1);
  const [chatHistory, setChatHistory] = useState<ApiMessage[]>([]);
  const [digContext, setDigContext] = useState<DiggingContext | null>(null);
  const [bridge, setBridge] = useState<BridgeData | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [risks, setRisks] = useState<InterviewRisk[]>([]);

  return (
    <div className="h-dvh flex flex-col" style={{ background: "#0D0D18" }}>
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
          ← 홈
        </Link>
        <span className="text-sm text-white/50" style={{ fontWeight: 500 }}>
          취업소크라테스
        </span>
        <div className="w-10" />
      </header>

      <ProgressBar step={step} />

      {/* step 5 = summary overlay — ProgressBar stays at step 4 */}
      {step === 5 && bridge && coverLetter && (
        <StepFade stepKey={5}>
          <SummaryPage
            bridge={bridge}
            coverLetter={coverLetter}
            risks={risks}
          />
        </StepFade>
      )}

      {step !== 5 && (
        <StepFade stepKey={step}>
          {step === 1 && (
            <Step1Digging
              onComplete={(history, ctx) => {
                setChatHistory(history);
                setDigContext(ctx);
                setStep(2);
              }}
            />
          )}

          {step === 2 && digContext && (
            <Step2Bridge
              history={chatHistory}
              context={digContext}
              onComplete={(b) => {
                setBridge(b);
                setStep(3);
              }}
            />
          )}

          {step === 3 && digContext && bridge && (
            <Step3CoverLetter
              history={chatHistory}
              context={digContext}
              bridge={bridge}
              onComplete={(cl) => {
                setCoverLetter(cl);
                setStep(4);
              }}
            />
          )}

          {step === 4 && digContext && coverLetter && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <Step4Risk
                history={chatHistory}
                context={digContext}
                coverLetter={coverLetter}
                onComplete={(r) => setRisks(r)}
              />
              {/* 전체 정리 버튼 */}
              {risks.length > 0 && (
                <div className="px-4 py-4 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="max-w-xl mx-auto">
                    <button
                      onClick={() => setStep(5)}
                      className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #6B8EFF22, #FF6B3522)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      전체 정리 보기 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </StepFade>
      )}
    </div>
  );
}
