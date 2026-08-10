"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  dict: {
    faq: {
      title: string
      subtitle: string
      questions: FAQItem[]
    }
  }
}

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group min-h-[56px]"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-white group-hover:text-amber-400 transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-slate-400 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180 text-amber-500"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-slate-400 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

export function FAQSection({ dict }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 mb-6">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-slate-300">FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            {dict.faq.title}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {dict.faq.subtitle}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
          {dict.faq.questions.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
