"use client"

import { useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Check, Copy } from "lucide-react"

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const pre = e.currentTarget.parentElement?.querySelector("pre")
    const text = pre?.innerText || ""
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="group/code relative my-3">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 rounded-md bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover/code:opacity-100"
        title="Copy code"
        type="button"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-[#0d1117] p-4 text-sm">{children}</pre>
    </div>
  )
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="dreagent-prose text-[15px] leading-relaxed text-[#0A1628]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children, ...props }) => (
            <code className={className ? className : "dreagent-inline-code"} {...props}>
              {children}
            </code>
          ),
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#0A1628] underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/60 bg-muted/50 px-3 py-1.5 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-border/60 px-3 py-1.5">{children}</td>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>,
          h1: ({ children }) => <h1 className="mb-2 mt-4 text-xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>,
          p: ({ children }) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-[#D4AF37] pl-4 italic text-muted-foreground">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
