import { supabase } from "@/lib/supabase";

// 브라우저마다 고유 ID를 부여해 '처음 방문' 1회만 기록 (고유 방문자 집계용)
export function trackVisitor() {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem("vid");
    if (existing) return; // 이미 집계된 방문자
    const vid = crypto.randomUUID();
    localStorage.setItem("vid", vid);
    supabase.from("visitors").insert({ visitor_id: vid });
  } catch { /* 무시 */ }
}
