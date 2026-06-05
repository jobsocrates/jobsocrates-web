export interface Experience {
  type: string;
  text: string;
}

export interface DiggingContext {
  jobTitle: string;
  question: string;
  jdKeywords: string[];
  experiences: Experience[];
}

export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BridgeData {
  section1: string; // 직무 이해
  section2: string; // 경험 비교
  section3: string; // 포지셔닝 전략
}

export interface InterviewRisk {
  title: string;
  description: string;
  response: string;
}

export type AppStep = 1 | 2 | 3 | 4 | 5;
