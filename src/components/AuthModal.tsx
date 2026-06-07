"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ACCENT = "#C96442";

interface Props {
  tab: "login" | "signup";
  onClose: () => void;
}

function SocialBtn({ color, textColor = "#000", children, onClick, disabled }: {
  color: string; textColor?: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: color, color: textColor }}
    >
      {children}
    </button>
  );
}

function Input({ type = "text", placeholder, value, onChange, disabled, onEnter }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; disabled?: boolean; onEnter?: () => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors disabled:opacity-50"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.9)",
      }}
    />
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>또는</span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

function Checkbox({ checked, onChange, children }: {
  checked: boolean; onChange: () => void; children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div
        onClick={onChange}
        className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          border: checked ? "none" : "1.5px solid rgba(255,255,255,0.25)",
          background: checked ? ACCENT : "transparent",
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
        {children}
      </span>
    </label>
  );
}

export function AuthModal({ tab: initialTab, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const allAgree = agree1 && agree2 && agree3;
  const toggleAll = () => { const v = !allAgree; setAgree1(v); setAgree2(v); setAgree3(v); };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const ua = navigator.userAgent;
    setIsInApp(
      /KAKAOTALK|Instagram|FBAN|FBAV|Twitter|Line\/|NAVER|Daum|NaverSearch/i.test(ua)
      || (/Android/i.test(ua) && !/Chrome\//i.test(ua))
      || /wv\)/i.test(ua)
    );
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    setError("");
    setSuccessMsg("");
  }, [tab]);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function openInExternalBrowser() {
    const url = window.location.href;
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      // Android: Chrome intent URL로 강제 외부 브라우저 오픈
      const host = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // iOS: 클립보드에 복사 후 안내
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!email || !pw) { setError("이메일과 비밀번호를 입력해주세요."); return; }

    if (tab === "signup") {
      if (pw !== pw2) { setError("비밀번호가 일치하지 않습니다."); return; }
      if (pw.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
      if (!agree1 || !agree2) { setError("필수 약관에 동의해주세요."); return; }
    }

    setLoading(true);

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        const msg = error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error.message === "Email not confirmed"
          ? "이메일 인증이 필요합니다. 메일함을 확인해주세요."
          : error.message;
        setError(msg);
        setLoading(false);
      } else {
        onClose();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.session) {
        onClose();
      } else {
        setSuccessMsg("가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.");
        setLoading(false);
      }
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "#12121F", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* 탭 */}
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-4 text-sm font-medium transition-colors"
              style={{
                color: tab === t ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                borderBottom: tab === t ? `2px solid ${ACCENT}` : "2px solid transparent",
              }}
            >
              {t === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
          {/* 소셜 — 인앱 브라우저면 외부 브라우저 유도 UI */}
          {isInApp ? (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "keep-all" }}>
                  카카오톡·인스타그램 등 앱 내 브라우저에서는 구글 로그인이 차단돼요.
                  <br />Chrome 또는 Safari에서 열어주세요.
                </p>
              </div>
              <button
                onClick={openInExternalBrowser}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: "#fff" }}
              >
                외부 브라우저에서 열기
              </button>
              <button
                onClick={copyUrl}
                className="w-full py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.06)", color: copied ? "#6BFF9E" : "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {copied ? "✓ 주소 복사됨 — Safari·Chrome에 붙여넣기 해주세요" : "주소 복사하기"}
              </button>
            </div>
          ) : (
            <SocialBtn color="white" textColor="#111" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loading ? "처리 중..." : tab === "login" ? "구글로 로그인" : "구글로 회원가입"}
            </SocialBtn>
          )}

          <Divider />

          {/* 에러 / 성공 메시지 */}
          {error && (
            <p className="text-xs px-1" style={{ color: "#FF6B6B" }}>{error}</p>
          )}
          {successMsg && (
            <p className="text-xs px-1" style={{ color: "#6BFF9E" }}>{successMsg}</p>
          )}

          {/* 이메일/비밀번호 */}
          <Input type="email" placeholder="이메일" value={email} onChange={setEmail} disabled={loading} onEnter={handleSubmit} />
          <Input type="password" placeholder="비밀번호" value={pw} onChange={setPw} disabled={loading} onEnter={handleSubmit} />
          {tab === "signup" && (
            <Input type="password" placeholder="비밀번호 확인" value={pw2} onChange={setPw2} disabled={loading} onEnter={handleSubmit} />
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: ACCENT }}
          >
            {loading ? "처리 중..." : tab === "login" ? "로그인" : "회원가입"}
          </button>

          {/* 약관 (회원가입만) */}
          {tab === "signup" && (
            <>
              <Divider />
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={toggleAll}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: allAgree ? ACCENT : "rgba(255,255,255,0.1)", border: allAgree ? "none" : "1.5px solid rgba(255,255,255,0.2)" }}
                  >
                    {allAgree && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>전체 동의</span>
                </button>
                <Checkbox checked={agree1} onChange={() => setAgree1(p => !p)}>
                  (필수) 개인정보 수집 및 이용 동의
                </Checkbox>
                <Checkbox checked={agree2} onChange={() => setAgree2(p => !p)}>
                  (필수) 서비스 이용약관 동의
                </Checkbox>
                <Checkbox checked={agree3} onChange={() => setAgree3(p => !p)}>
                  (선택) 마케팅 정보 수신 동의
                </Checkbox>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
