import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/core';

type CreateRichTextEditorExtensionsOptions = Readonly<{
  placeholder?: string;
}>;

export function createRichTextEditorExtensions({ placeholder }: CreateRichTextEditorExtensionsOptions): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      blockquote: {},
      codeBlock: {},
      horizontalRule: {},
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-2',
        rel: 'noopener noreferrer',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
    }),
    Highlight.configure({
      HTMLAttributes: {
        class: 'rounded bg-accent px-0.5',
      },
    }),
    Subscript,
    Superscript,
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'my-2 max-w-full rounded-md',
      },
    }),
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: 'my-2 w-full border-collapse text-start',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Markdown.configure({
      markedOptions: {
        gfm: true,
        breaks: true,
      },
    }),
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}
