"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    // 방법 1: 이미 세션이 있으면 바로 이동
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/";
        return;
      }
    });

    // 방법 2: URL에 code 있으면 직접 교환
    const code = new URLSearchParams(window.location.search).get("code");
    const token_hash = new URLSearchParams(window.location.search).get("token_hash");
    const type = new URLSearchParams(window.location.search).get("type");

    console.log("[Callback] href:", window.location.href);

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message);
        else window.location.href = "/";
      });
      return;
    }

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as "signup" | "recovery" | "email" }).then(({ error }) => {
        if (error) setError(error.message);
        else window.location.href = "/";
      });
      return;
    }

    // 방법 3: onAuthStateChange로 대기 (Supabase가 hash 자동 처리하는 경우)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Callback] auth event:", event, !!session);
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/";
      }
    });

    // 5초 후에도 로그인 안 되면 홈으로
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) window.location.href = "/";
        else window.location.href = "/";
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: "#0D0D18" }}
      >
        <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "rgba(255,107,53,0.7)" }}>
          로그인 오류
        </p>
        <p className="text-sm text-center max-w-sm" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all" }}>
          {error}
        </p>
        <button
          onClick={() => window.location.href = "/"}
          className="mt-2 text-sm underline"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ background: "#0D0D18" }}
    >
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(255,107,53,0.4)", borderTopColor: "rgba(255,107,53,0.9)" }}
      />
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
        로그인 처리 중...
      </p>
    </div>
  );
}
