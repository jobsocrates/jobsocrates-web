"use client";

import { STEPS } from "./StepMocks";

const CARD = "rgba(255,255,255,0.04)";
const BORDER = "1px solid rgba(255,255,255,0.07)";

export function HowSection() {
  return (
    <section style={{ background: "rgba(255,255,255,0.012)" }}>
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-28">
        <div className="text-center mb-14 anim">
          <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "#6B8EFF" }}>HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">취업소크라테스는 이렇게 다릅니다</h2>
        </div>

        <div className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`anim anim-delay-${Math.min(i + 1, 4)} rounded-2xl p-5`}
              style={{ background: CARD, border: BORDER }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: s.color }}>{s.step}</p>
              <p className="text-lg font-semibold text-white mb-1">{s.title}</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
