"use client";

import { useEffect, useRef, useState } from "react";

const ACCENT = "#FF6B35";

interface Props {
  tab: "login" | "signup";
  onClose: () => void;
}

function SocialBtn({ color, textColor = "#000", children, onClick }: {
  color: string; textColor?: string; children: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ background: color, color: textColor }}
    >
      {children}
    </button>
  );
}

function Input({ type = "text", placeholder, value, onChange }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
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
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const allAgree = agree1 && agree2 && agree3;
  const toggleAll = () => { const v = !allAgree; setAgree1(v); setAgree2(v); setAgree3(v); };

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  const todo = () => alert("준비 중입니다.");

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
          {/* 소셜 */}
          <SocialBtn color="#FEE500" onClick={todo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.92 3 2.86 6.26 2.86 10.3c0 2.55 1.63 4.8 4.1 6.15l-1.06 3.9 4.53-2.97c.5.07 1.02.11 1.57.11 5.08 0 9.14-3.26 9.14-7.28S17.08 3 12 3z" fill="#3A1D1D"/>
            </svg>
            {tab === "login" ? "카카오로 로그인" : "카카오로 회원가입"}
          </SocialBtn>
          <SocialBtn color="white" textColor="#111" onClick={todo}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {tab === "login" ? "구글로 로그인" : "구글로 회원가입"}
          </SocialBtn>

          <Divider />

          {/* 이메일/비밀번호 */}
          <Input type="email" placeholder="이메일" value={email} onChange={setEmail} />
          <Input type="password" placeholder="비밀번호" value={pw} onChange={setPw} />
          {tab === "signup" && (
            <Input type="password" placeholder="비밀번호 확인" value={pw2} onChange={setPw2} />
          )}

          <button
            onClick={todo}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: ACCENT }}
          >
            {tab === "login" ? "로그인" : "회원가입"}
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
