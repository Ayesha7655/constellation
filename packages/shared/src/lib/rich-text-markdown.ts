import { looksLikeHtmlDocument } from './rich-text-html';

/** Heuristic: clipboard/plain text looks like Markdown (not HTML). */
export function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') {
    return false;
  }
  if (looksLikeHtmlDocument(trimmed)) {
    return false;
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return false;
  }

  return (
    /^#{1,6}\s/m.test(trimmed) ||
    /\*\*[^*\n]+\*\*/.test(trimmed) ||
    /(?:^|[^*])\*[^*\n]+\*(?:[^*]|$)/.test(trimmed) ||
    /^\s*[-*+]\s/m.test(trimmed) ||
    /^\s*\d+\.\s/m.test(trimmed) ||
    /\[.+?\]\(.+?\)/.test(trimmed) ||
    /^>\s/m.test(trimmed) ||
    /^\|.+\|/m.test(trimmed)
  );
}
