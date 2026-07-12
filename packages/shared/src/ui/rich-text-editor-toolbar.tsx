'use client';

import { useCallback, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react';
import { cn } from '../lib/utils';

type ToolbarButtonProps = Readonly<{
  label: string;
  active?: boolean;
  disabled: boolean;
  testId: string;
  onClick: () => void;
  children: ReactNode;
}>;

function ToolbarButton({ label, active = false, disabled, testId, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden />;
}

type RichTextEditorToolbarProps = Readonly<{
  editor: Editor;
  disabled: boolean;
  testId: string;
}>;

export function RichTextEditorToolbar({ editor, disabled, testId }: RichTextEditorToolbarProps) {
  const onUndoClick = useCallback(() => editor.chain().focus().undo().run(), [editor]);
  const onRedoClick = useCallback(() => editor.chain().focus().redo().run(), [editor]);
  const onBoldClick = useCallback(() => editor.chain().focus().toggleBold().run(), [editor]);
  const onItalicClick = useCallback(() => editor.chain().focus().toggleItalic().run(), [editor]);
  const onUnderlineClick = useCallback(() => editor.chain().focus().toggleUnderline().run(), [editor]);
  const onStrikeClick = useCallback(() => editor.chain().focus().toggleStrike().run(), [editor]);
  const onCodeClick = useCallback(() => editor.chain().focus().toggleCode().run(), [editor]);
  const onHighlightClick = useCallback(() => editor.chain().focus().toggleHighlight().run(), [editor]);
  const onSubscriptClick = useCallback(() => editor.chain().focus().toggleSubscript().run(), [editor]);
  const onSuperscriptClick = useCallback(() => editor.chain().focus().toggleSuperscript().run(), [editor]);
  const onH1Click = useCallback(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
  const onH2Click = useCallback(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const onH3Click = useCallback(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
  const onParagraphClick = useCallback(() => editor.chain().focus().setParagraph().run(), [editor]);
  const onBulletListClick = useCallback(() => editor.chain().focus().toggleBulletList().run(), [editor]);
  const onOrderedListClick = useCallback(() => editor.chain().focus().toggleOrderedList().run(), [editor]);
  const onBlockquoteClick = useCallback(() => editor.chain().focus().toggleBlockquote().run(), [editor]);
  const onCodeBlockClick = useCallback(() => editor.chain().focus().toggleCodeBlock().run(), [editor]);
  const onHorizontalRuleClick = useCallback(() => editor.chain().focus().setHorizontalRule().run(), [editor]);
  const onAlignLeftClick = useCallback(() => editor.chain().focus().setTextAlign('left').run(), [editor]);
  const onAlignCenterClick = useCallback(() => editor.chain().focus().setTextAlign('center').run(), [editor]);
  const onAlignRightClick = useCallback(() => editor.chain().focus().setTextAlign('right').run(), [editor]);
  const onAlignJustifyClick = useCallback(() => editor.chain().focus().setTextAlign('justify').run(), [editor]);
  const onLinkClick = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) {
      return;
    }
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);
  const onImageClick = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url === null || url.trim() === '') {
      return;
    }
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }, [editor]);
  const onInsertTableClick = useCallback(
    () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    [editor],
  );
  const onAddColumnClick = useCallback(() => editor.chain().focus().addColumnAfter().run(), [editor]);
  const onAddRowClick = useCallback(() => editor.chain().focus().addRowAfter().run(), [editor]);
  const onDeleteTableClick = useCallback(() => editor.chain().focus().deleteTable().run(), [editor]);

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
      data-testid={`${testId}-toolbar`}
    >
        <ToolbarButton label="Undo" disabled={disabled || !editor.can().undo()} testId={`${testId}-undo`} onClick={onUndoClick}>
          <Undo2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={disabled || !editor.can().redo()} testId={`${testId}-redo`} onClick={onRedoClick}>
          <Redo2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          disabled={disabled}
          testId={`${testId}-h1`}
          onClick={onH1Click}
        >
          <Heading1 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          testId={`${testId}-h2`}
          onClick={onH2Click}
        >
          <Heading2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          testId={`${testId}-h3`}
          onClick={onH3Click}
        >
          <Heading3 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Paragraph"
          active={editor.isActive('paragraph')}
          disabled={disabled}
          testId={`${testId}-paragraph`}
          onClick={onParagraphClick}
        >
          <span className="px-0.5 text-xs font-medium">P</span>
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Bold" active={editor.isActive('bold')} disabled={disabled} testId={`${testId}-bold`} onClick={onBoldClick}>
          <Bold className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          disabled={disabled}
          testId={`${testId}-italic`}
          onClick={onItalicClick}
        >
          <Italic className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive('underline')}
          disabled={disabled}
          testId={`${testId}-underline`}
          onClick={onUnderlineClick}
        >
          <Underline className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          disabled={disabled}
          testId={`${testId}-strike`}
          onClick={onStrikeClick}
        >
          <Strikethrough className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editor.isActive('code')}
          disabled={disabled}
          testId={`${testId}-code`}
          onClick={onCodeClick}
        >
          <Code className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          active={editor.isActive('highlight')}
          disabled={disabled}
          testId={`${testId}-highlight`}
          onClick={onHighlightClick}
        >
          <Highlighter className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          active={editor.isActive('subscript')}
          disabled={disabled}
          testId={`${testId}-subscript`}
          onClick={onSubscriptClick}
        >
          <Subscript className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          active={editor.isActive('superscript')}
          disabled={disabled}
          testId={`${testId}-superscript`}
          onClick={onSuperscriptClick}
        >
          <Superscript className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive('link')} disabled={disabled} testId={`${testId}-link`} onClick={onLinkClick}>
          <Link2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          disabled={disabled}
          testId={`${testId}-bullet-list`}
          onClick={onBulletListClick}
        >
          <List className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          disabled={disabled}
          testId={`${testId}-ordered-list`}
          onClick={onOrderedListClick}
        >
          <ListOrdered className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          active={editor.isActive('blockquote')}
          disabled={disabled}
          testId={`${testId}-blockquote`}
          onClick={onBlockquoteClick}
        >
          <Quote className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive('codeBlock')}
          disabled={disabled}
          testId={`${testId}-code-block`}
          onClick={onCodeBlockClick}
        >
          <Code2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Horizontal rule" disabled={disabled} testId={`${testId}-hr`} onClick={onHorizontalRuleClick}>
          <Minus className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="Align left"
          active={editor.isActive({ textAlign: 'left' })}
          disabled={disabled}
          testId={`${testId}-align-left`}
          onClick={onAlignLeftClick}
        >
          <AlignLeft className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editor.isActive({ textAlign: 'center' })}
          disabled={disabled}
          testId={`${testId}-align-center`}
          onClick={onAlignCenterClick}
        >
          <AlignCenter className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editor.isActive({ textAlign: 'right' })}
          disabled={disabled}
          testId={`${testId}-align-right`}
          onClick={onAlignRightClick}
        >
          <AlignRight className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          active={editor.isActive({ textAlign: 'justify' })}
          disabled={disabled}
          testId={`${testId}-align-justify`}
          onClick={onAlignJustifyClick}
        >
          <AlignJustify className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Insert image" disabled={disabled} testId={`${testId}-image`} onClick={onImageClick}>
          <ImageIcon className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Insert table" disabled={disabled} testId={`${testId}-insert-table`} onClick={onInsertTableClick}>
          <Table2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Add table column" disabled={disabled || !editor.can().addColumnAfter()} testId={`${testId}-add-column`} onClick={onAddColumnClick}>
          <span className="px-0.5 text-xs font-medium">+Col</span>
        </ToolbarButton>
        <ToolbarButton label="Add table row" disabled={disabled || !editor.can().addRowAfter()} testId={`${testId}-add-row`} onClick={onAddRowClick}>
          <span className="px-0.5 text-xs font-medium">+Row</span>
        </ToolbarButton>
        <ToolbarButton label="Delete table" disabled={disabled || !editor.can().deleteTable()} testId={`${testId}-delete-table`} onClick={onDeleteTableClick}>
          <span className="px-0.5 text-xs font-medium">×Tbl</span>
        </ToolbarButton>
    </div>
  );
}
