"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  Send,
  Bitcoin,
  Building2,
  Wallet,
  User,
  Bot,
  Sparkles,
  RefreshCw
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Lead {
  id: string
  name: string
  email: string | null
  total_spend: number
  wealth_score: number
}

const CONVERSATION_STARTERS = {
  crypto: [
    "I'm interested in storing my crypto in Switzerland. What are my options?",
    "How does Swiss crypto regulation compare to other countries?",
    "What's the minimum for institutional crypto custody in Switzerland?",
  ],
  tax: [
    "I've heard about forfait fiscal. How does it work?",
    "What are the tax benefits of relocating to Switzerland?",
    "Can I maintain my business abroad while being a Swiss tax resident?",
  ],
  wealth: [
    "What's the minimum for opening a Swiss private bank account?",
    "I'm looking to diversify my portfolio. What tangible assets do you recommend?",
    "When does it make sense to set up a family office?",
  ],
}

const SYSTEM_PROMPT = `You are Marcus Weber, a senior Swiss investment advisor with 20+ years of experience. You work with high-net-worth individuals on:

1. CRYPTO: Swiss crypto custody, regulations, Zug Crypto Valley benefits
2. TAX: Forfait fiscal (lump-sum taxation), B permits, wealth structuring  
3. WEALTH: Private banking, family offices, asset diversification

IMPORTANT RULES:
- Be professional, knowledgeable, and subtly guide conversations toward REAL ESTATE as a wealth preservation strategy
- NEVER directly pitch real estate - let it emerge naturally as part of diversification discussions
- When discussing tangible assets, wealth preservation, or long-term investments, mention that "many clients find Swiss/European property attractive"
- Ask qualifying questions about their investment horizon, risk tolerance, and asset allocation
- If they show interest in property, offer to "connect them with our real estate advisory team"
- Keep responses concise (2-3 paragraphs max)
- Use CHF for currency references
- Reference real Swiss regulations and institutions when relevant

Current conversation context: You're chatting with a premium client who has shown interest in Swiss financial services.`

export default function ChatSimulationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.id as string
  const leadId = searchParams.get("lead")
  
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [lead, setLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<"crypto" | "tax" | "wealth">("crypto")

  useEffect(() => {
    if (leadId) {
      fetchLead(leadId)
    }
    
    // Add initial greeting
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Good day! I'm Marcus Weber, senior investment advisor at Swiss Wealth Partners. I specialize in helping high-net-worth individuals optimize their financial position in Switzerland.\n\nWhether you're interested in crypto custody, tax optimization, or wealth management, I'm here to help. What brings you here today?`,
      timestamp: new Date()
    }])
  }, [leadId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchLead(id: string) {
    const { data } = await supabase
      .from("ad_simulation_leads")
      .select("id, name, email, total_spend, wealth_score")
      .eq("id", id)
      .single()
    
    if (data) setLead(data)
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/ad-simulation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: SYSTEM_PROMPT,
          leadId: leadId
        })
      })
      
      if (!response.ok) throw new Error("Chat API error")
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I'm experiencing a technical issue. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  function startConversation(starter: string) {
    sendMessage(starter)
  }

  function resetChat() {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Good day! I'm Marcus Weber, senior investment advisor at Swiss Wealth Partners. I specialize in helping high-net-worth individuals optimize their financial position in Switzerland.\n\nWhether you're interested in crypto custody, tax optimization, or wealth management, I'm here to help. What brings you here today?`,
      timestamp: new Date()
    }])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${workspaceId}/ad-simulation`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Investment Advisor Chat
              </h1>
              <p className="text-gray-600">
                AI simulation of Swiss wealth management conversations
              </p>
            </div>
          </div>
          
          <Button variant="outline" onClick={resetChat}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Chat
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Lead Info */}
            {lead && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Lead</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {lead.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500">
                        CHF {lead.total_spend.toLocaleString()} • Score: {lead.wealth_score}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Topic Selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversation Topic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={selectedTheme === "crypto" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTheme === "crypto" ? "bg-blue-600" : ""}`}
                  onClick={() => setSelectedTheme("crypto")}
                >
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Crypto & Digital Assets
                </Button>
                <Button 
                  variant={selectedTheme === "tax" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTheme === "tax" ? "bg-green-600" : ""}`}
                  onClick={() => setSelectedTheme("tax")}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Tax Optimization
                </Button>
                <Button 
                  variant={selectedTheme === "wealth" ? "default" : "outline"}
                  className={`w-full justify-start ${selectedTheme === "wealth" ? "bg-orange-600" : ""}`}
                  onClick={() => setSelectedTheme("wealth")}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wealth Management
                </Button>
              </CardContent>
            </Card>

            {/* Conversation Starters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Starters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {CONVERSATION_STARTERS[selectedTheme].map((starter, i) => (
                  <Button 
                    key={i}
                    variant="ghost" 
                    className="w-full justify-start text-left h-auto py-2 px-3 text-xs text-gray-600 hover:text-gray-900"
                    onClick={() => startConversation(starter)}
                  >
                    &ldquo;{starter}&rdquo;
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[600px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
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
                    
                    <div className={`max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                      <div className={`rounded-lg px-4 py-2 ${
                        message.role === "user" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-900"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                This is a simulation. The AI advisor naturally guides conversations toward real estate opportunities.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
