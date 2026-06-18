"use client";

import { ACCENT } from "@/lib/chatConstants";
import { parseRevisionMsg } from "@/lib/chatUtils";
import { exportCoverLetterPDF } from "@/lib/pdfExport";
import { BotBubbleAvatar } from "./BotBubbleAvatar";
import { ChangesCard } from "./ChangesCard";

interface Props {
  text: string;
  companyName: string;
  jobTitle: string;
  question: string;
  charLimit: string;
}

export function RevisionMessage({ text, companyName, jobTitle, question, charLimit }: Props) {
  const { revision, changes, partialChanges, rest } = parseRevisionMsg(text);
  const displayChanges = changes || partialChanges;
  const isComplete = !!revision && !!changes;

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
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#C4B5FD" }}>
            <div className="flex items-center gap-2">
              <img src="/ai-avatar.webp" alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              <span className="text-sm font-semibold" style={{ color: "#4C3F99" }}>완성본</span>
              <span className="text-xs" style={{ color: "#A78BFA" }}>{revision.replace(/\s/g, "").length}자</span>
            </div>
            {isComplete && (
              <button
                onClick={() => exportCoverLetterPDF(companyName, jobTitle, question, charLimit, revision, changes)}
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
          <div className="px-4 py-4">
            <p className="text-sm leading-[1.9] whitespace-pre-wrap" style={{ color: "#111827", wordBreak: "keep-all" }}>
              {revision}
            </p>
          </div>
        </div>
      )}
      {displayChanges && <ChangesCard text={displayChanges} />}
    </div>
  );
}
