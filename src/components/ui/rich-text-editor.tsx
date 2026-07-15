"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, Undo2, Redo2 } from "lucide-react"

export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true })],
    content: value || "",
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose prose-sm max-w-none min-h-[120px] px-3 py-2 focus:outline-none text-[#0A1628]", "data-placeholder": placeholder || "" } },
    onUpdate: ({ editor: instance }) => onChange(instance.isEmpty ? "" : instance.getHTML()),
  })

  useEffect(() => {
    if (editor && !editor.isFocused && (value || "") !== editor.getHTML() && !(editor.isEmpty && !value)) editor.commands.setContent(value || "", { emitUpdate: false })
  }, [editor, value])

  if (!editor) return <div className="min-h-[160px] rounded-md border bg-muted/10" />

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previous || "https://")
    if (url === null) return
    if (!url) { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const controls: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; disabled?: boolean }[] = [
    { icon: <Bold className="h-4 w-4" />, label: "Bold", active: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run() },
    { icon: <Italic className="h-4 w-4" />, label: "Italic", active: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run() },
    { icon: <Strikethrough className="h-4 w-4" />, label: "Strikethrough", active: editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run() },
    { icon: <List className="h-4 w-4" />, label: "Bullet list", active: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered className="h-4 w-4" />, label: "Numbered list", active: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <LinkIcon className="h-4 w-4" />, label: "Link", active: editor.isActive("link"), onClick: setLink },
    { icon: <Undo2 className="h-4 w-4" />, label: "Undo", onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
    { icon: <Redo2 className="h-4 w-4" />, label: "Redo", onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
  ]

  return (
    <div className="rounded-md border bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 px-2 py-1">
        {controls.map((control) => (
          <Button
            key={control.label}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={control.label}
            title={control.label}
            disabled={control.disabled}
            onClick={control.onClick}
            className={`h-7 w-7 ${control.active ? "bg-[#0A1628]/10 text-[#0A1628]" : "text-muted-foreground"}`}
          >
            {control.icon}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
