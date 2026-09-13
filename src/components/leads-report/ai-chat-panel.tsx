"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { AIChartRenderer, ChartSpec } from "./ai-chart-renderer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  chartSpec?: ChartSpec
}

interface AIChatPanelProps {
  workspaceId: string
  data: unknown
  context?: string
}

const QUICK_QUERIES = [
  "Who are the top 3 performing vendors?",
  "What's the conversion rate from Fresh Lead to Meeting?",
  "Show me status distribution as a pie chart",
  "Compare performance across all agents",
  "Which campaigns have the most invalid numbers?",
  "Show leads funnel visualization",
  "What percentage of leads are qualified?",
  "Show trends by lead owner"
]

export function AIChatPanel({ workspaceId, data, context }: AIChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendQuery(query: string) {
    if (!query.trim() || isQuerying) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsQuerying(true)

    try {
      const res = await fetch("/api/leads-report/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          data,
          workspaceId,
          context
        })
      })

      const responseData = await res.json()

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseData.answer || responseData.error || "Unable to process query",
        timestamp: new Date(),
        chartSpec: responseData.chartSpec
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsQuerying(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendQuery(inputValue)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Quick Queries Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Quick Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {QUICK_QUERIES.map((q, i) => (
            <Button
              key={i}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-2 px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => sendQuery(q)}
              disabled={isQuerying}
            >
              {q}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col h-[600px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Leads Analyst
          </CardTitle>
          <CardDescription>
            Ask questions about your leads data in natural language. I can also generate charts!
          </CardDescription>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">Ask me anything about your leads data!</p>
                <p className="text-sm mt-2">I can analyze trends, compare performance, and generate charts.</p>
                <p className="text-xs mt-4 text-gray-400">Try: &quot;Show vendor performance as a bar chart&quot;</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={
                    message.role === "user"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }>
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[85%] space-y-3 ${message.role === "user" ? "text-right" : ""}`}>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}>
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>

                  {/* Render chart if present */}
                  {message.chartSpec && (
                    <AIChartRenderer chartSpec={message.chartSpec} />
                  )}

                  <p className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your leads data... (e.g., 'Show top performers')"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isQuerying}
              className="flex-1"
            />
            <Button
              onClick={() => sendQuery(inputValue)}
              disabled={!inputValue.trim() || isQuerying}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
