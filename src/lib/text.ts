export function decodeEntities(s: string): string {
  return s
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function firstSentence(s: string, max = 120): string {
  const decoded = decodeEntities(s).trim();
  const m = decoded.split(/(?<=[.!?])\s+/)[0];
  return m.length > max ? m.slice(0, max - 1).trimEnd() + "…" : m;
}
