'use client';

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
    List, ListOrdered, Quote, Code, Link2, Image as ImageIcon,
    Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
    Undo2, Redo2,
} from 'lucide-react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

/**
 * TipTap-based WYSIWYG editor.
 * Mobile-friendly: toolbar scrolls horizontally, buttons have ≥36px touch area.
 * Output: sanitized HTML (rendered on detail page via DOMPurify on the consumer side).
 */
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
    const editor = useEditor({
        // Avoid SSR hydration mismatch by deferring DOM rendering until mount
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                // Disable defaults we replace with extensions
                link: false,
            }),
            Underline,
            Image.configure({ inline: false, allowBase64: false }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: placeholder ?? '' }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Empty editor returns "<p></p>" — normalize to empty string for cleaner storage
            onChange(html === '<p></p>' ? '' : html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
                style: `min-height: ${minHeight}px;`,
            },
        },
    });

    // Sync external `value` changes back into editor (e.g. when switching language tabs)
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        const incoming = value || '';
        // Only update when meaningfully different to avoid cursor jumps while typing
        if (current !== incoming && incoming !== '<p></p>') {
            editor.commands.setContent(incoming, { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div
                className="border border-gray-200 rounded-xl bg-gray-50 animate-pulse"
                style={{ minHeight: minHeight + 50 }}
            />
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: Editor }) {
    const addLink = useCallback(() => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL · 링크 주소', prev ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        // Basic URL sanity: reject javascript: and data: schemes
        if (/^(javascript|data):/i.test(url.trim())) {
            alert('Unsafe URL blocked.');
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('Image URL · 이미지 주소');
        if (!url) return;
        if (!/^https?:\/\//i.test(url.trim())) {
            alert('Image URL must start with http:// or https://');
            return;
        }
        editor.chain().focus().setImage({ src: url.trim() }).run();
    }, [editor]);

    const insertTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    const Btn = ({
        onClick, active, disabled, title, children,
    }: {
        onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            aria-pressed={active}
            className={`min-w-[36px] h-9 inline-flex items-center justify-center rounded-lg transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed ${
                active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-6 bg-gray-200 mx-0.5 flex-shrink-0" />;

    return (
        <div className="flex items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-thin">
            <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="w-4 h-4" />
            </Btn>
            <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="w-4 h-4" />
            </Btn>
            <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon className="w-4 h-4" />
            </Btn>

            <Divider />

            <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="w-4 h-4" />
            </Btn>
            <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="w-4 h-4" />
            </Btn>

            <Divider />

            <Btn title="Bullet List" active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="w-4 h-4" />
            </Btn>
            <Btn title="Numbered List" active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="w-4 h-4" />
            </Btn>
            <Btn title="Quote" active={editor.isActive('blockquote')}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="w-4 h-4" />
            </Btn>
            <Btn title="Inline Code" active={editor.isActive('code')}
                onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code className="w-4 h-4" />
            </Btn>

            <Divider />

            <Btn title="Align Left" active={editor.isActive({ textAlign: 'left' })}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="w-4 h-4" />
            </Btn>
            <Btn title="Align Center" active={editor.isActive({ textAlign: 'center' })}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="w-4 h-4" />
            </Btn>
            <Btn title="Align Right" active={editor.isActive({ textAlign: 'right' })}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="w-4 h-4" />
            </Btn>

            <Divider />

            <Btn title="Insert Link" active={editor.isActive('link')} onClick={addLink}>
                <Link2 className="w-4 h-4" />
            </Btn>
            <Btn title="Insert Image from URL" onClick={addImage}>
                <ImageIcon className="w-4 h-4" />
            </Btn>
            <Btn title="Insert Table" onClick={insertTable}>
                <TableIcon className="w-4 h-4" />
            </Btn>

            <Divider />

            <Btn title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 className="w-4 h-4" />
            </Btn>
            <Btn title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 className="w-4 h-4" />
            </Btn>
        </div>
    );
}
