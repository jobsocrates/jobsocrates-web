// 이메일 마스킹: ijhan6403@gmail.com -> i***@gmail.com
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return email || "익명";
  const [local, domain] = email.split("@");
  const first = local.slice(0, 1) || "";
  return `${first}***@${domain}`;
}

// 관리자 이메일 (이 계정만 어드민 페이지·시딩·승인 가능)
export const ADMIN_EMAIL = "ijhan6403@gmail.com";

export function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
