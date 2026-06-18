"use client";

import { useEffect, useState } from "react";
import { LOADING_MSGS, DS_MUTED } from "@/lib/chatConstants";

export function StreamingLoadingMsg() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= LOADING_MSGS.length - 1) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 3500);
    return () => clearTimeout(t);
  }, [idx]);
  return (
    <span className="text-sm" style={{ color: DS_MUTED }}>
      {LOADING_MSGS[idx]}
    </span>
  );
}
