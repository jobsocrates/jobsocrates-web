import type { AppStep } from "@/types";

const STEPS = ["사례 디깅", "브릿지", "자소서", "면접 준비 노트"] as const;
const COLORS = ["#6B8EFF", "#FFD166", "#4ECDC4", "#FF6B35"];

export function ProgressBar({ step }: { step: AppStep }) {
  const activeStep = Math.min(step, 4) as 1 | 2 | 3 | 4;

  return (
    <div
      className="flex-shrink-0 border-b px-6 py-3"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="relative flex items-start">
        {/* background connector line */}
        <div
          className="absolute"
          style={{
            left: "12.5%",
            right: "12.5%",
            top: "11px",
            height: "1px",
            background: "rgba(255,255,255,0.08)",
          }}
        />

        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const color = COLORS[i];
          const active = n === activeStep;
          const done = n < activeStep;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1.5 relative"
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  background: active || done ? color : "rgba(255,255,255,0.08)",
                  color: active || done ? "#0D0D18" : "rgba(255,255,255,0.3)",
                  boxShadow: active ? `0 0 14px ${color}70` : "none",
                  transform: active ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {done ? "✓" : n}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? 600 : 400,
                  color: active ? color : done ? `${color}99` : "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
