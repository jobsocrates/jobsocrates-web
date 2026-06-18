export interface ChatMsg {
  id: number;
  role: "bot" | "user";
  text: string;
}

export interface InterviewQItem {
  id: number;
  dbId: string | null;
  question: string;
  isExpanded: boolean;
  msgs: ChatMsg[];
  isLoadingFeedback: boolean;
  inputText: string;
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
  }[];
}
