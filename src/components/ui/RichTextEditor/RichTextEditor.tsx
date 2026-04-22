'use client';

import { useEffect, type CSSProperties } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';
import styles from './RichTextEditor.module.scss';

export interface RichTextEditorProps {
	/** HTML string (same shape as a controlled textarea value you might persist). */
	value: string;
	onChange: (html: string) => void;
	/** Associates the editor surface with a `<label htmlFor>`. */
	id?: string;
	className?: string;
	disabled?: boolean;
	showToolbar?: boolean;
	/** Minimum height of the editable area in px. */
	minHeight?: number;
}

function normalizeIncomingContent(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '';
	// Keep existing rich HTML values as-is.
	if (/<[a-z][\s\S]*>/i.test(trimmed)) return value;

	// Convert legacy/plain text to minimal rich HTML for TipTap rendering.
	return trimmed
		.split(/\n{2,}/)
		.map((block) =>
			`<p>${block
				.split('\n')
				.map((line) =>
					line
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
				)
				.join('<br>')}</p>`
		)
		.join('');
}

function Toolbar({ editor }: { editor: Editor }) {
	return (
		<div className={styles.toolbar}>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleBold().run()}
				data-active={editor.isActive('bold')}
				title="Bold"
			>
				B
			</button>
			<button
				type="button"
				className={cn(styles.toolbarBtn, styles.toolbarBtnItalic)}
				onClick={() => editor.chain().focus().toggleItalic().run()}
				data-active={editor.isActive('italic')}
				title="Italic"
			>
				i
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				data-active={editor.isActive('underline')}
				title="Underline"
			>
				<u>U</u>
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleCode().run()}
				data-active={editor.isActive('code')}
				title="Inline code"
			>
				&lt;/&gt;
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				data-active={editor.isActive('codeBlock')}
				title="Code block"
			>
				{'{ }'}
			</button>
			<span className={styles.toolbarDivider} />
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				data-active={editor.isActive('heading', { level: 2 })}
				title="Heading"
			>
				H2
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				data-active={editor.isActive('bulletList')}
				title="Bullet list"
			>
				<svg
					className={styles.toolbarIcon}
					width="18"
					height="14"
					viewBox="0 0 18 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden
				>
					<circle cx="2" cy="2" r="1.25" fill="currentColor" />
					<circle cx="2" cy="7" r="1.25" fill="currentColor" />
					<circle cx="2" cy="12" r="1.25" fill="currentColor" />
					<path
						d="M6 2h10M6 7h10M6 12h10"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				data-active={editor.isActive('orderedList')}
				title="Ordered list"
			>
				<svg
					className={styles.toolbarIcon}
					width="20"
					height="14"
					viewBox="0 0 20 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden
				>
					<text
						x="0"
						y="3.5"
						fill="currentColor"
						fontSize="4.5"
						fontFamily="system-ui, sans-serif"
						fontWeight="600"
					>
						1.
					</text>
					<text
						x="0"
						y="8.5"
						fill="currentColor"
						fontSize="4.5"
						fontFamily="system-ui, sans-serif"
						fontWeight="600"
					>
						2.
					</text>
					<text
						x="0"
						y="13.5"
						fill="currentColor"
						fontSize="4.5"
						fontFamily="system-ui, sans-serif"
						fontWeight="600"
					>
						3.
					</text>
					<path
						d="M8 2h10M8 7h10M8 12h10"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			</button>
			<span className={styles.toolbarDivider} />
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().undo().run()}
				title="Undo"
			>
				Undo
			</button>
			<button
				type="button"
				className={styles.toolbarBtn}
				onClick={() => editor.chain().focus().redo().run()}
				title="Redo"
			>
				Redo
			</button>
		</div>
	);
}

/**
 * Controlled rich-text field (HTML). Drop-in replacement for a plain `<textarea>`
 * when you store HTML: pass the same `value` / `onChange` you would use for text.
 *
 * With react-hook-form: `watch` + `setValue`, or `Controller` with `field.value` / `field.onChange`.
 */
export function RichTextEditor({
	value,
	onChange,
	id,
	className,
	disabled = false,
	showToolbar = true,
	minHeight = 140,
}: RichTextEditorProps) {
	const normalizedValue = normalizeIncomingContent(value || '');

	const editor = useEditor({
		extensions: [StarterKit],
		content: normalizedValue,
		immediatelyRender: false,
		editable: !disabled,
		editorProps: {
			attributes: {
				class: styles.editorContent,
				...(id ? { id } : {}),
			},
		},
		onUpdate: ({ editor: tiptapEditor }) => {
			onChange(tiptapEditor.getHTML());
		},
	});

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(!disabled);
	}, [editor, disabled]);

	useEffect(() => {
		if (!editor) return;
		const currentHtml = editor.getHTML();
		// '<p></p>' is TipTap's empty-state representation of '' — treat them as equivalent
		const isEmpty = (h: string) => h === '' || h === '<p></p>';
		if (isEmpty(currentHtml) && isEmpty(normalizedValue)) return;
		if (currentHtml !== normalizedValue) {
			editor.commands.setContent(normalizedValue, { emitUpdate: false });
		}
	}, [editor, normalizedValue]);

	const rootStyle: CSSProperties = {
		'--rte-min-height': `${minHeight}px`,
	} as CSSProperties;

	return (
		<div className={cn(styles.root, className)} style={rootStyle}>
			{showToolbar && editor ? <Toolbar editor={editor} /> : null}
			<EditorContent editor={editor} />
		</div>
	);
}
