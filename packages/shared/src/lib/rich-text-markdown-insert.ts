import type { Editor, JSONContent } from '@tiptap/core';

export function preprocessMarkdownForEditor(markdown: string): string {
  return markdown;
}

/** Removes conflicting mark combinations the schema rejects (e.g. link + code). */
export function sanitizeTipTapDocument(doc: JSONContent): JSONContent {
  return sanitizeTipTapNode({ type: 'doc', content: doc.content ?? [doc] });
}

function sanitizeTipTapNode(node: JSONContent): JSONContent {
  if (node.type === 'text') {
    const marks = node.marks ?? [];
    if (marks.length <= 1) {
      return node;
    }
    const types = marks.map((mark) => mark.type);
    if (types.includes('code')) {
      return { ...node, marks: marks.filter((mark) => mark.type === 'code') };
    }
    return node;
  }

  if (node.type === 'image') {
    const src = typeof node.attrs?.src === 'string' ? node.attrs.src.trim() : '';
    if (src === '' || /^\s*javascript:/i.test(src)) {
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt.trim() : '';
      if (alt === '') {
        return { type: 'paragraph' };
      }
      return { type: 'paragraph', content: [{ type: 'text', text: alt }] };
    }
    return node;
  }

  if (node.content) {
    return {
      ...node,
      content: node.content
        .map(sanitizeTipTapNode)
        .filter((child: JSONContent) => child.type !== 'paragraph' || child.content),
    };
  }

  return node;
}

function parseMarkdownDocument(editor: Editor, markdown: string): JSONContent | null {
  const manager = editor.markdown;
  if (!manager) {
    return null;
  }
  const processed = preprocessMarkdownForEditor(markdown);
  const parsed = manager.parse(processed) as JSONContent;
  if (parsed.type === 'doc') {
    return sanitizeTipTapDocument(parsed);
  }
  return sanitizeTipTapDocument({ type: 'doc', content: [parsed] });
}

/** Inserts Markdown at the cursor; returns false when the editor cannot parse Markdown. */
export function insertMarkdownIntoEditor(editor: Editor, markdown: string): boolean {
  try {
    const doc = parseMarkdownDocument(editor, markdown);
    if (!doc) {
      return false;
    }
    editor.commands.insertContent(doc);
    return true;
  } catch (error) {
    console.error('Failed to paste Markdown into rich text editor', error);
    return false;
  }
}

/** Replaces editor content from Markdown; falls back to plain paragraphs on parse failure. */
export function setMarkdownEditorContent(editor: Editor, markdown: string, emitUpdate = false): void {
  try {
    const doc = parseMarkdownDocument(editor, markdown);
    if (doc) {
      editor.commands.setContent(doc, { emitUpdate });
      return;
    }
  } catch (error) {
    console.error('Failed to set Markdown rich text editor content', error);
  }
  editor.commands.setContent(preprocessMarkdownForEditor(markdown), { contentType: 'markdown', emitUpdate });
}
