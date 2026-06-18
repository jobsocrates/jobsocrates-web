export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}일 전`;
  if (hours >= 1) return `${hours}시간 전`;
  const mins = Math.floor(diff / (1000 * 60));
  return mins > 0 ? `${mins}분 전` : "방금 전";
}

export function stripMd(t: string) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[수정본\][\s\S]*$/, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[지원동기\][\s\S]*$/, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[완성준비\]/g, "")
    .replace(/---+/g, "")
    .trim();
}

export function parseRevisionMsg(text: string) {
  const subMatch = text.match(/\[소제목\]([\s\S]*?)\[\/소제목\]/);
  const revMatch = text.match(/\[수정본\]([\s\S]*?)\[\/수정본\]/) || text.match(/\[지원동기\]([\s\S]*?)\[\/지원동기\]/);
  const partialRevMatch = !revMatch ? (text.match(/\[수정본\]([\s\S]*)$/) || text.match(/\[지원동기\]([\s\S]*)$/)) : null;
  const chgMatch = text.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const partialChgMatch = !chgMatch ? text.match(/\[변경사항\]([\s\S]*)$/) : null;

  const subtitle = subMatch ? subMatch[1].trim() : "";
  const rawRevision = (revMatch ?? partialRevMatch)
    ? (revMatch ?? partialRevMatch)![1]
        .replace(/\[소제목\][\s\S]*?\[\/소제목\]\s*/g, "")
        .replace(/\[소제목\]|\[\/소제목\]/g, "")
        .trim()
    : "";
  const revision = rawRevision;
  const changes = chgMatch ? chgMatch[1].trim() : "";
  const partialChanges = partialChgMatch ? partialChgMatch[1].trim() : "";

  const rest = text
    .replace(/\[소제목\][\s\S]*?\[\/소제목\]/g, "")
    .replace(/\[수정본\][\s\S]*?\[\/수정본\]/g, "")
    .replace(/\[수정본\][\s\S]*$/, "")
    .replace(/\[지원동기\][\s\S]*?\[\/지원동기\]/g, "")
    .replace(/\[지원동기\][\s\S]*$/, "")
    .replace(/\[변경사항\][\s\S]*?\[\/변경사항\]/g, "")
    .replace(/\[변경사항\][\s\S]*$/, "")
    .replace(/\[완성준비\]/g, "")
    .replace(/---+/g, "")
    .trim();

  return { subtitle, revision, changes, partialChanges, rest };
}
