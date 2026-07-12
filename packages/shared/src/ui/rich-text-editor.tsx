'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { looksLikeHtmlDocument, normalizePastedHtml } from '../lib/rich-text-html';
import { looksLikeMarkdown } from '../lib/rich-text-markdown';
import { insertMarkdownIntoEditor, setMarkdownEditorContent } from '../lib/rich-text-markdown-insert';
import { richTextEditorProseClassName } from '../lib/rich-text-prose-styles';
import { isRichTextEmpty, richTextHtmlEquivalent, richTextToPlainText } from '../lib/rich-text-utils';
import { cn } from '../lib/utils';
import { createRichTextEditorExtensions } from './rich-text-editor-extensions';
import { RichTextEditorToolbar } from './rich-text-editor-toolbar';

export type RichTextEditorInsertHandle = Readonly<{
  insertAtCursor: (text: string) => void;
  focus: () => void;
}>;

export type RichTextEditorProps = Readonly<{
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  onEditorReady?: (handle: RichTextEditorInsertHandle) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Max stored HTML length — matches backend `@MaxLength` on the same field. */
  maxLength?: number;
  /** Shown below the editor when content exceeds `maxLength`. */
  maxLengthMessage?: string;
  testId: string;
  minHeightClassName?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}>;

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  onEditorReady,
  placeholder,
  disabled = false,
  maxLength,
  maxLengthMessage,
  testId,
  minHeightClassName = 'min-h-40',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: RichTextEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  /** Last HTML emitted via `onChange` — avoids wiping the editor when the parent prop lags behind. */
  const lastEmittedHtmlRef = useRef(value);

  const extensions = useMemo(() => createRichTextEditorExtensions({ placeholder }), [placeholder]);

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      editorRef.current = createdEditor;
      lastEmittedHtmlRef.current = createdEditor.getHTML();
      onEditorReady?.({
        insertAtCursor: (text: string) => {
          createdEditor.chain().focus().insertContent(text).run();
        },
        focus: () => {
          createdEditor.commands.focus();
        },
      });
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    editorProps: {
      transformPastedHTML(html) {
        return normalizePastedHtml(html);
      },
      handlePaste(_view, event) {
        const plain = event.clipboardData?.getData('text/plain') ?? '';
        if (plain === '') {
          return false;
        }
        if (looksLikeHtmlDocument(plain)) {
          event.preventDefault();
          editorRef.current?.commands.insertContent(normalizePastedHtml(plain));
          return true;
        }
        if (looksLikeMarkdown(plain)) {
          event.preventDefault();
          const editorInstance = editorRef.current;
          if (editorInstance && insertMarkdownIntoEditor(editorInstance, plain)) {
            return true;
          }
          editorInstance?.commands.insertContent(plain);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange(html);
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();

    if (value === lastEmittedHtmlRef.current) {
      return;
    }

    // Parent prop has not caught up after paste/type — push editor state up instead of clearing.
    if (!isRichTextEmpty(currentHtml) && isRichTextEmpty(value)) {
      lastEmittedHtmlRef.current = currentHtml;
      onChange(currentHtml);
      return;
    }

    if (richTextHtmlEquivalent(value, currentHtml)) {
      lastEmittedHtmlRef.current = currentHtml;
      return;
    }

    const plain = richTextToPlainText(value);
    let nextContent = value;
    if (looksLikeHtmlDocument(plain)) {
      nextContent = normalizePastedHtml(plain);
    } else if (looksLikeMarkdown(value)) {
      setMarkdownEditorContent(editor, value, false);
      lastEmittedHtmlRef.current = editor.getHTML();
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
    lastEmittedHtmlRef.current = nextContent;
    if (nextContent !== value) {
      onChange(nextContent);
    }
  }, [editor, onChange, value]);

  if (!editor) {
    return null;
  }

  const htmlLength = value.length;
  const showCounter = maxLength !== undefined;
  const overLimit = maxLength !== undefined && htmlLength > maxLength;
  const showLimitError = ariaInvalid || overLimit;
  const limitMessage = overLimit ? maxLengthMessage : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'overflow-hidden rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-ring',
          disabled && 'opacity-60',
          showLimitError && 'border-destructive focus-within:ring-destructive/40',
        )}
      >
        <RichTextEditorToolbar editor={editor} disabled={disabled} testId={testId} />
        <EditorContent
          editor={editor}
          data-testid={testId}
          aria-invalid={showLimitError}
          aria-describedby={ariaDescribedBy}
          className={cn('rich-text-editor px-3 py-2', minHeightClassName, richTextEditorProseClassName)}
        />
        {showCounter ? (
          <p
            className={cn(
              'border-t border-border px-3 py-1 text-end text-xs text-muted-foreground',
              overLimit && 'text-destructive',
            )}
            aria-live="polite"
          >
            {htmlLength}/{maxLength}
          </p>
        ) : null}
      </div>
      {limitMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {limitMessage}
        </p>
      ) : null}
    </div>
  );
}
