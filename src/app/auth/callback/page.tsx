"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

async function ensureProfile(session: Session) {
  const { user } = session;
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email ?? "", credits: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

export default function AuthCallbackPage() {
  useEffect(() => {
    const redirectHome = () => { window.location.href = "/"; };

    // 이미 세션 있으면 바로 이동
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await ensureProfile(data.session);
        redirectHome();
      }
    });

    // code 파라미터로 세션 교환 (PKCE)
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (!error && data.session) {
          await ensureProfile(data.session);
          redirectHome();
        }
      });
    }

    // token_hash (이메일 인증)
    const token_hash = new URLSearchParams(window.location.search).get("token_hash");
    const type = new URLSearchParams(window.location.search).get("type");
    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as "signup" | "recovery" | "email" }).then(async ({ data, error }) => {
        if (!error && data.session) {
          await ensureProfile(data.session);
          redirectHome();
        }
      });
    }

    // onAuthStateChange 대기 (fallback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await ensureProfile(session);
        redirectHome();
      }
    });

    // 5초 후 무조건 홈으로
    const timeout = setTimeout(redirectHome, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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
