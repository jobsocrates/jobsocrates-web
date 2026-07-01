"use client";

import { useState } from "react";
import { parseRevisionMsg } from "@/lib/chatUtils";
import { exportCoverLetterPDF } from "@/lib/pdfExport";
import { BotBubbleAvatar } from "./BotBubbleAvatar";

interface Props {
  text: string;
  companyName: string;
  jobTitle: string;
  question: string;
  charLimit: string;
  draft?: string;
  interviewQs?: { question: string; msgs: { role: string; text: string }[] }[];
  onSelectSubtitle?: (s: string) => void;
}

export function RevisionMessage({ text, companyName, jobTitle, question, charLimit, draft = "", interviewQs = [], onSelectSubtitle }: Props) {
  const { revision, rest, subtitle } = parseRevisionMsg(text);
  // 완성본은 완성됐을 때만 이 컴포넌트가 렌더되므로(로딩→통으로), revision 존재 = 완성.
  const isComplete = !!revision;
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"after" | "before">("after");
  const [subtitles, setSubtitles] = useState<string[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [selectedSub, setSelectedSub] = useState("");
  const activeSub = selectedSub || subtitle;
  const hasDraft = !!draft.trim() && isComplete;
  const showingBefore = view === "before" && hasDraft;

  async function fetchSubtitles() {
    if (loadingSub || !revision) return;
    setLoadingSub(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subtitle", jobTitle, question, coverLetter: revision }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setSubtitles(data.filter((s) => typeof s === "string").slice(0, 3));
    } catch { /* 무시 */ }
    finally { setLoadingSub(false); }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {rest && (
        <div className="flex items-end gap-2.5 justify-start">
          <BotBubbleAvatar />
          <div
            className="max-w-[80%] px-4 py-3.5 text-sm leading-[1.85] whitespace-pre-wrap"
            style={{ background: "#FFFFFF", color: "#111827", borderRadius: "4px 16px 16px 16px", wordBreak: "keep-all", boxShadow: "none", border: "1px solid #E5E7EB" }}
          >
            {rest}
          </div>
        </div>
      )}
      {revision && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE9FE", border: "1px solid #C4B5FD" }}>
          <div className="flex items-center justify-between gap-2 gap-y-1.5 flex-wrap px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
            <div className="flex items-center gap-2">
              <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>완성본</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { navigator.clipboard.writeText(revision).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-70"
                style={{ background: copied ? "#DCFCE7" : "#DDD6FE", color: copied ? "#16A34A" : "#4C3F99", border: "none" }}
              >
                {copied ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
                {copied ? "복사됨" : "복사"}
              </button>
              {isComplete && (
                <button
                  onClick={fetchSubtitles}
                  disabled={loadingSub}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-85 disabled:opacity-50"
                  style={{ background: "#6366F1", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                  {loadingSub ? "추천 중" : "✨ 소제목"}
                </button>
              )}
              {isComplete && (
                <button
                  onClick={() => exportCoverLetterPDF(companyName, jobTitle, question, charLimit, revision, "", draft, interviewQs, activeSub)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-70"
                  style={{ background: "#DDD6FE", color: "#4C3F99", border: "none" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  PDF
                </button>
              )}
            </div>
          </div>
          {hasDraft && (
            <div className="px-4 pt-3">
              <div className="inline-flex p-0.5 rounded-lg" style={{ background: "rgba(124,92,191,0.10)" }}>
                {([["after", "완성본"], ["before", "초안"]] as const).map(([key, label]) => {
                  const on = view === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setView(key)}
                      className="text-xs font-semibold px-3 py-1 rounded-md transition-all"
                      style={on
                        ? { background: "#FFFFFF", color: "#4C3F99", boxShadow: "0 1px 3px rgba(17,12,46,0.12)" }
                        : { background: "transparent", color: "#8B7FB0" }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="px-4 py-4">
            {showingBefore && (
              <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>처음 작성한 초안이에요</p>
            )}
            {!showingBefore && activeSub && (
              <p className="text-base font-bold mb-2.5" style={{ color: "#4C3F99", wordBreak: "keep-all" }}>{activeSub}</p>
            )}
            <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: showingBefore ? "#9CA3AF" : "#111827", wordBreak: "keep-all" }}>
              {showingBefore ? draft : revision}
            </p>
          </div>
          {subtitles.length > 0 && !showingBefore && (
            <div className="px-4 pb-4 -mt-1">
              <p className="text-xs font-semibold mb-2" style={{ color: "#4C3F99" }}>추천 소제목 · 눌러서 적용 (완성본·PDF에 반영돼요)</p>
              <div className="flex flex-col gap-1.5">
                {subtitles.map((s, i) => {
                  const on = activeSub === s;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedSub(s); onSelectSubtitle?.(s); }}
                      className="flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: on ? "#EDE9FE" : "#FFFFFF", color: "#111827", border: `1px solid ${on ? "#A78BFA" : "#DDD6FE"}` }}
                    >
                      <span style={{ wordBreak: "keep-all" }}>{s}</span>
                      <span className="text-xs flex-shrink-0 font-semibold" style={{ color: on ? "#6D28D9" : "#A78BFA" }}>{on ? "✓ 적용됨" : "적용"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
