import { prepareRichTextHtmlForDisplay } from '../lib/rich-text-html';
import { richTextProseClassName } from '../lib/rich-text-prose-styles';
import { isRichTextEmpty } from '../lib/rich-text-utils';
import { cn } from '../lib/utils';

type RichTextContentProps = Readonly<{
  html: string;
  className?: string;
  testId?: string;
}>;

/** Renders sanitized rich text produced by {@link RichTextEditor}. */
export function RichTextContent({ html, className, testId }: RichTextContentProps) {
  if (isRichTextEmpty(html)) {
    return null;
  }

  const displayHtml = prepareRichTextHtmlForDisplay(html);
  if (isRichTextEmpty(displayHtml)) {
    return null;
  }

  return (
    <div
      data-testid={testId}
      className={cn('rich-text-content', richTextProseClassName, className)}
      // Content is authored through our editor — pasted HTML is normalized first.
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}
