export interface ChatMsg {
  id: number;
  role: "bot" | "user";
  text: string;
  dbId?: string;
}

export interface InterviewQItem {
  id: number;
  dbId: string | null;
  question: string;
  isExpanded: boolean;
  msgs: ChatMsg[];
  isLoadingFeedback: boolean;
  inputText: string;
  phase: "initial" | "feedback" | "retrying" | "polished" | "done";
}

export interface SetupMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

export interface CoverItem {
  id: number;
  dbId: string | null;
  question: string;
  draft: string;
  charLimit: string;
  status: "idle" | "chatting";
  msgs: ChatMsg[];
  apiHistory: { role: string; content: string }[];
  interviewQs: InterviewQItem[];
  isLoadingQs: boolean;
  setupStep: "question" | "charLimit" | "draft" | "ready";
  setupMsgs: SetupMsg[];
  revCount?: number; // 완성본 생성 횟수 (재생성 3회 제한용)
  versions?: string[]; // 생성된 완성본들(마커 포함 전체 텍스트). 토글로 선택
  activeVersion?: number; // 현재 선택된 완성본 인덱스
  finalized?: boolean; // 면접 마무리(총정리) 완료 → 면접 재답변 잠금
}

export interface ResumeSession {
  session: { id: string; job_title: string; created_at: string };
  items: {
    id: string;
    question: string;
    draft: string;
    char_limit: number | null;
    status: string;
    order_index: number;
    finalized?: boolean | null;
  }[];
}
