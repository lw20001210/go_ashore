const DEFAULT_TOMORROW =
  '明天优先处理今天未完成或耗时最长的科目。';

/** 从 AI 复盘 Markdown 中提取「明日建议」段落 */
export function extractTomorrowSuggestion(markdown: string) {
  const match = markdown.match(
    /(?:#{1,3}\s*)?明日建议[：:\s]*\n?([\s\S]+?)(?:\n#{1,3}\s|\n*$)/,
  );
  const text = match?.[1]?.trim();
  return text || DEFAULT_TOMORROW;
}

export { DEFAULT_TOMORROW };
