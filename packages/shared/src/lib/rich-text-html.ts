import { richTextToPlainText } from './rich-text-utils';

const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'THEAD', 'TBODY', 'TR']);
const NEST_BLOCK_CHILDREN_TAGS = new Set(['BLOCKQUOTE', 'PRE', 'LI', 'TD', 'TH']);
const TABLE_CELL_TAGS = new Set(['TH', 'TD']);
const INLINE_TAGS = new Set(['STRONG', 'B', 'EM', 'I', 'S', 'STRIKE', 'CODE', 'BR', 'U', 'MARK', 'SUB', 'SUP']);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const VOID_TAGS = new Set(['BR', 'HR']);
const UNWRAP_TAGS = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
  'NAV',
  'SPAN',
  'HTML',
  'BODY',
  'HEAD',
]);
const STRIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'META',
  'LINK',
  'TITLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'INPUT',
  'BUTTON',
  'SELECT',
  'TEXTAREA',
  'FORM',
]);

function isUnsafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html');
}

export function looksLikeHtmlDocument(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<!DOCTYPE') || /^<html[\s>]/i.test(trimmed);
}

function parseDocumentBody(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.innerHTML;
}

function flattenToParagraph(text: string, doc: Document): HTMLElement[] {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  const paragraph = doc.createElement('p');
  paragraph.textContent = trimmed;
  return [paragraph];
}

function copySafeLinkAttributes(source: HTMLElement, target: HTMLAnchorElement): void {
  const href = source.getAttribute('href')?.trim() ?? '';
  if (href === '' || isUnsafeUrl(href)) {
    return;
  }
  target.setAttribute('href', href);
  if (source.getAttribute('target') === '_blank') {
    target.setAttribute('target', '_blank');
    target.setAttribute('rel', 'noopener noreferrer');
  }
}

function sanitizeImage(element: HTMLElement, doc: Document): HTMLElement[] {
  const src = element.getAttribute('src')?.trim() ?? '';
  if (src === '' || isUnsafeUrl(src)) {
    return flattenToParagraph(element.getAttribute('alt') ?? '', doc);
  }
  const img = doc.createElement('img');
  img.setAttribute('src', src);
  const alt = element.getAttribute('alt')?.trim();
  if (alt) {
    img.setAttribute('alt', alt);
  }
  return [img];
}

function appendInlineChildren(clone: HTMLElement, element: HTMLElement, doc: Document, sanitizeNode: (node: Node) => HTMLElement[]): void {
  for (const child of Array.from(element.childNodes)) {
    for (const sanitized of sanitizeNode(child)) {
      if (INLINE_TAGS.has(sanitized.tagName) || sanitized.tagName === 'A' || sanitized.tagName === 'IMG') {
        clone.appendChild(sanitized);
        continue;
      }
      if (sanitized.textContent?.trim()) {
        clone.appendChild(doc.createTextNode(sanitized.textContent));
      }
    }
  }
}

function sanitizeRichTextNodes(container: ParentNode, doc: Document): HTMLElement[] {
  const output: HTMLElement[] = [];

  function appendNodes(nodes: HTMLElement[]) {
    for (const node of nodes) {
      output.push(node);
    }
  }

  function sanitizeNode(node: Node): HTMLElement[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return text.trim() === '' ? [] : flattenToParagraph(text, doc);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    const element = node as HTMLElement;
    const tag = element.tagName;

    if (STRIP_TAGS.has(tag)) {
      return [];
    }

    if (tag === 'IMG') {
      return sanitizeImage(element, doc);
    }

    if (tag === 'A') {
      const href = element.getAttribute('href')?.trim() ?? '';
      if (href === '' || isUnsafeUrl(href)) {
        const children: HTMLElement[] = [];
        for (const child of Array.from(element.childNodes)) {
          children.push(...sanitizeNode(child));
        }
        return children;
      }
      const anchor = doc.createElement('a');
      copySafeLinkAttributes(element, anchor);
      appendInlineChildren(anchor, element, doc, sanitizeNode);
      return anchor.textContent?.trim() ? [anchor] : [];
    }

    if (VOID_TAGS.has(tag)) {
      return [doc.createElement(tag.toLowerCase())];
    }

    if (HEADING_TAGS.has(tag)) {
      const clone = doc.createElement(tag.toLowerCase());
      appendInlineChildren(clone, element, doc, sanitizeNode);
      return clone.textContent?.trim() ? [clone] : [];
    }

    if (UNWRAP_TAGS.has(tag)) {
      const children: HTMLElement[] = [];
      for (const child of Array.from(element.childNodes)) {
        children.push(...sanitizeNode(child));
      }
      return children;
    }

    if (TABLE_CELL_TAGS.has(tag)) {
      const clone = doc.createElement(tag.toLowerCase());
      appendInlineChildren(clone, element, doc, sanitizeNode);
      return [clone];
    }

    if (tag === 'TR') {
      const clone = doc.createElement('tr');
      for (const child of Array.from(element.childNodes)) {
        for (const sanitized of sanitizeNode(child)) {
          if (TABLE_CELL_TAGS.has(sanitized.tagName)) {
            clone.appendChild(sanitized);
          }
        }
      }
      return clone.childNodes.length > 0 ? [clone] : [];
    }

    if (tag === 'THEAD' || tag === 'TBODY') {
      const clone = doc.createElement(tag.toLowerCase());
      for (const child of Array.from(element.childNodes)) {
        for (const sanitized of sanitizeNode(child)) {
          if (sanitized.tagName === 'TR') {
            clone.appendChild(sanitized);
          }
        }
      }
      return clone.childNodes.length > 0 ? [clone] : [];
    }

    if (tag === 'TABLE') {
      const clone = doc.createElement('table');
      for (const child of Array.from(element.childNodes)) {
        for (const sanitized of sanitizeNode(child)) {
          if (sanitized.tagName === 'THEAD' || sanitized.tagName === 'TBODY' || sanitized.tagName === 'TR') {
            clone.appendChild(sanitized);
          }
        }
      }
      return clone.childNodes.length > 0 ? [clone] : flattenToParagraph(element.textContent ?? '', doc);
    }

    if (BLOCK_TAGS.has(tag) || INLINE_TAGS.has(tag)) {
      const clone = doc.createElement(tag.toLowerCase());
      if (INLINE_TAGS.has(tag)) {
        appendInlineChildren(clone, element, doc, sanitizeNode);
      } else {
        for (const child of Array.from(element.childNodes)) {
          for (const sanitized of sanitizeNode(child)) {
            if (INLINE_TAGS.has(sanitized.tagName) || sanitized.tagName === 'A' || sanitized.tagName === 'IMG') {
              clone.appendChild(sanitized);
              continue;
            }
            if (NEST_BLOCK_CHILDREN_TAGS.has(tag)) {
              clone.appendChild(sanitized);
              continue;
            }
            appendNodes([sanitized]);
          }
        }
      }
      if (
        clone.tagName === 'BR' ||
        clone.tagName === 'HR' ||
        clone.textContent?.trim() ||
        clone.tagName === 'UL' ||
        clone.tagName === 'OL' ||
        clone.tagName === 'BLOCKQUOTE' ||
        clone.tagName === 'TABLE' ||
        clone.tagName === 'PRE'
      ) {
        return [clone];
      }
      return [];
    }

    const children: HTMLElement[] = [];
    for (const child of Array.from(element.childNodes)) {
      children.push(...sanitizeNode(child));
    }
    return children;
  }

  for (const child of Array.from(container.childNodes)) {
    appendNodes(sanitizeNode(child));
  }

  return output;
}

/** Converts pasted HTML (including full documents) into editor-safe markup. */
export function normalizePastedHtml(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') {
    return trimmed;
  }

  if (typeof document === 'undefined') {
    return trimmed;
  }

  let source = trimmed;
  if (looksLikeHtmlDocument(trimmed) || /<body[\s>]/i.test(trimmed)) {
    source = parseDocumentBody(trimmed);
  }

  const doc = new DOMParser().parseFromString(source, 'text/html');
  const nodes = sanitizeRichTextNodes(doc.body, doc);
  if (nodes.length === 0) {
    return '<p></p>';
  }

  const wrapper = doc.createElement('div');
  for (const node of nodes) {
    wrapper.appendChild(node);
  }
  return wrapper.innerHTML;
}

/** Prepare stored HTML for read-only display (handles legacy raw HTML document pastes). */
export function prepareRichTextHtmlForDisplay(html: string): string {
  const trimmed = html.trim();
  if (trimmed === '') {
    return trimmed;
  }

  if (typeof document === 'undefined') {
    return trimmed;
  }

  const plain = richTextToPlainText(trimmed);
  if (looksLikeHtmlDocument(plain) || looksLikeHtmlDocument(trimmed)) {
    return normalizePastedHtml(looksLikeHtmlDocument(trimmed) ? trimmed : plain);
  }

  return trimmed;
}
