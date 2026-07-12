/** Mirrors backend `@MaxLength(2000)` on inspection notes / standalone request notes. */
export const INSPECTION_NOTE_MAX_LENGTH = 2000;

/** Mirrors backend `INSPECTION_REPORT_BODY_MAX_LENGTH`. */
export const INSPECTION_REPORT_BODY_MAX_LENGTH = 5000;

/** True when the value is empty or only blank rich-text markup (e.g. `<p></p>`). */
export function isRichTextEmpty(html: string): boolean {
  const trimmed = html.trim();
  if (trimmed === '') {
    return true;
  }
  return trimmed.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
}

/** True when stored HTML length exceeds a backend `@MaxLength` cap. */
export function isRichTextOverMaxLength(html: string, maxLength: number): boolean {
  return html.length > maxLength;
}

/** Heuristic: content was authored/stored as HTML from {@link RichTextEditor}. */
export function looksLikeRichTextHtml(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }
  return /<(p|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td|pre|hr|img|strong|em|b|i|u|mark|sub|sup|s|a|code|br)\b/i.test(
    trimmed,
  );
}

/** True when two stored HTML values represent the same editor document (including empty variants). */
export function richTextHtmlEquivalent(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  return isRichTextEmpty(a) && isRichTextEmpty(b);
}

/** Plain-text preview for summaries and form step previews. */
export function richTextToPlainText(html: string): string {
  if (isRichTextEmpty(html)) {
    return '';
  }
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
