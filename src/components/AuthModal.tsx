"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ACCENT = "#4338CA";
const ACCENT_MID = "#6366F1";

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
      style={{ background: color, color: textColor, border: "1px solid #E5E7EB" }}
    >
      {children}
    </button>
  );
}

function Input({ type = "text", placeholder, value, onChange, disabled, onEnter }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; disabled?: boolean; onEnter?: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
        input::-webkit-credentials-auto-fill-button { display: none; }
        .auth-input::placeholder { color: #9CA3AF; }
        .auth-input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      `}</style>
      <input
        type={isPw ? (showPw ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
        disabled={disabled}
        className="auth-input w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all disabled:opacity-50"
        style={{
          background: "#F9FAFB",
          border: "1.5px solid #E5E7EB",
          color: "#111827",
          paddingRight: isPw ? "44px" : undefined,
        }}
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShowPw(v => !v)}
          tabIndex={-1}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF", display: "flex", alignItems: "center" }}
        >
          {showPw ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
      <span className="text-xs" style={{ color: "#9CA3AF" }}>또는</span>
      <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

const TERMS = {
  privacy: {
    label: "(필수) 개인정보 수집 및 이용 동의",
    content: `■ 수집 항목\n이메일 주소, 자소서 초안, 대화 내용\n\n■ 수집 목적\nAI 자소서 첨삭 서비스 제공, 대화 기록 저장 및 품질 개선\n\n■ 보유 및 이용 기간\n회원 탈퇴 시까지. 단, 관계 법령에 따라 일정 기간 보존될 수 있습니다.\n\n■ 동의 거부 권리\n동의를 거부할 수 있으나, 이 경우 서비스 이용이 제한됩니다.`,
  },
  terms: {
    label: "(필수) 서비스 이용약관 동의",
    content: `■ 서비스 개요\n취업소크라테스는 AI 기반 자소서 첨삭 서비스입니다.\n\n■ 이용 조건\n- 만 14세 이상 이용 가능\n- 타인의 정보를 도용하거나 허위 정보를 입력할 수 없습니다\n- 서비스를 통해 생성된 컨텐츠의 저작권은 이용자에게 귀속됩니다\n\n■ 금지 사항\n- 서비스의 상업적 재판매 금지\n- 시스템 무결성을 해치는 행위 금지\n\n■ 서비스 변경 및 중단\n운영 정책에 따라 서비스 내용이 변경되거나 중단될 수 있으며, 사전 공지합니다.`,
  },
  marketing: {
    label: "(선택) 마케팅 정보 수신 동의",
    content: `■ 수신 내용\n서비스 업데이트, 신규 기능 안내, 이벤트 및 프로모션 정보\n\n■ 수신 방법\n이메일\n\n■ 철회 방법\n언제든지 수신 거부를 요청할 수 있으며, 동의하지 않아도 서비스 이용에 지장이 없습니다.`,
  },
};

function TermRow({ checked, onChange, termKey }: {
  checked: boolean; onChange: () => void; termKey: keyof typeof TERMS;
}) {
  const [open, setOpen] = useState(false);
  const { label, content } = TERMS[termKey];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <div
          onClick={onChange}
          className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
          style={{
            border: checked ? "none" : "1.5px solid #D1D5DB",
            background: checked ? ACCENT : "transparent",
          }}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="flex items-start justify-between flex-1 gap-1.5">
          <span className="text-xs leading-relaxed cursor-pointer" style={{ color: "#6B7280" }} onClick={onChange}>
            {label}
          </span>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs transition-all hover:opacity-80"
            style={{
              background: open ? "#EDE9FE" : "#F3F4F6",
              color: open ? ACCENT : "#9CA3AF",
              border: `1px solid ${open ? "#C4B5FD" : "#E5E7EB"}`,
              whiteSpace: "nowrap",
            }}
          >
            {open ? "닫기" : "보기"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="ml-6 rounded-xl px-3 py-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <p className="text-xs leading-[1.85] whitespace-pre-wrap" style={{ color: "#6B7280" }}>
            {content}
          </p>
        </div>
      )}
    </div>
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
  const [canScrollMore, setCanScrollMore] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const el = scrollRef.current;
    if (!el) return;
    const check = () => { setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8); };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, [tab]);

  useEffect(() => { setError(""); setSuccessMsg(""); }, [tab]);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function openInExternalBrowser() {
    const url = window.location.href;
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      const host = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) { setError(error.message); setLoading(false); }
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
      } else { onClose(); }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password: pw,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(false); }
      else if (data.session) { onClose(); }
      else { setSuccessMsg("가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요."); setLoading(false); }
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(17,24,39,0.55)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden relative"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 20px 60px rgba(17,24,39,0.15), 0 4px 16px rgba(17,24,39,0.08)",
        }}
      >
        {/* 탭 */}
        <div className="flex border-b" style={{ borderColor: "#F3F4F6", background: "#FAFAFA" }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-4 text-sm font-semibold transition-colors"
              style={{
                color: tab === t ? ACCENT : "#9CA3AF",
                borderBottom: tab === t ? `2px solid ${ACCENT}` : "2px solid transparent",
                background: "transparent",
              }}
            >
              {t === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {/* 스크롤 영역 */}
        <div ref={scrollRef} className="p-6 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "78vh" }}>

          {isInApp ? (
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#FFF9F0", border: "1px solid #FDE68A" }}>
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-xs leading-relaxed" style={{ color: "#92400E", wordBreak: "keep-all" }}>
                  카카오톡·인스타그램 등 앱 내 브라우저에서는 구글 로그인이 차단돼요.
                  <br />Chrome 또는 Safari에서 열어주세요.
                </p>
              </div>
              <button
                onClick={openInExternalBrowser}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_MID} 100%)`, color: "#fff" }}
              >
                외부 브라우저에서 열기
              </button>
              <button
                onClick={copyUrl}
                className="w-full py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{ background: "#F3F4F6", color: copied ? "#059669" : "#6B7280", border: "1px solid #E5E7EB" }}
              >
                {copied ? "✓ 주소 복사됨 — Safari·Chrome에 붙여넣기 해주세요" : "주소 복사하기"}
              </button>
            </div>
          ) : (
            <SocialBtn color="#FFFFFF" textColor="#374151" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loading ? "처리 중..." : tab === "login" ? "구글로 로그인" : "구글로 회원가입"}
            </SocialBtn>
          )}

          <Divider />

          {error && <p className="text-xs px-1" style={{ color: "#EF4444" }}>{error}</p>}
          {successMsg && <p className="text-xs px-1" style={{ color: "#059669" }}>{successMsg}</p>}

          <Input type="email" placeholder="이메일" value={email} onChange={setEmail} disabled={loading} onEnter={handleSubmit} />
          <Input type="password" placeholder="비밀번호" value={pw} onChange={setPw} disabled={loading} onEnter={handleSubmit} />
          {tab === "signup" && (
            <Input type="password" placeholder="비밀번호 확인" value={pw2} onChange={setPw2} disabled={loading} onEnter={handleSubmit} />
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_MID} 100%)`, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
          >
            {loading ? "처리 중..." : tab === "login" ? "로그인" : "회원가입"}
          </button>

          {tab === "signup" && (
            <>
              <Divider />
              <div className="flex flex-col gap-3">
                <button
                  onClick={toggleAll}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-colors"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: allAgree ? ACCENT : "transparent", border: allAgree ? "none" : "1.5px solid #D1D5DB" }}
                  >
                    {allAgree && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#374151" }}>전체 동의</span>
                </button>

                <TermRow checked={agree1} onChange={() => setAgree1(p => !p)} termKey="privacy" />
                <TermRow checked={agree2} onChange={() => setAgree2(p => !p)} termKey="terms" />
                <TermRow checked={agree3} onChange={() => setAgree3(p => !p)} termKey="marketing" />
              </div>
              <div className="h-1" />
            </>
          )}
        </div>

        {canScrollMore && (
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-3 pt-8 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #FFFFFF 60%)" }}
          >
            <span className="text-xs animate-bounce" style={{ color: "#9CA3AF" }}>아래로 스크롤</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
