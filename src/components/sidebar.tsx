"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Camera,
  FileText,
  CheckSquare,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

type Board = {
  id: string
  name: string
  type: "shoots" | "content" | "tasks"
}

const boardIcon = (type: string) => {
  switch (type) {
    case "shoots":
      return <Camera className="h-4 w-4" />
    case "content":
      return <FileText className="h-4 w-4" />
    case "tasks":
      return <CheckSquare className="h-4 w-4" />
    default:
      return <CheckSquare className="h-4 w-4" />
  }
}

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname()
  const params = useParams()
  const workspaceId = params.id as string | undefined
  const boardId = params.boardId as string | undefined
  const [boards, setBoards] = useState<Board[]>([])
  const [workspaceName, setWorkspaceName] = useState("DreHomes")

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, name")
        .limit(1)
        .single()

      if (workspace) {
        setWorkspaceName((workspace as { name: string }).name)
      }

      const { data, error } = await supabase
        .from("boards")
        .select("id, name, type")
        .order("position", { ascending: true })

      if (error) {
        toast.error("Failed to load boards")
        return
      }

      setBoards((data as Board[]) || [])
    }

    fetchData()
  }, [])

  return (
    <aside className={`flex-col w-64 h-screen bg-[#0A1628] text-white border-r border-white/10 z-40 ${
      mobile ? "flex" : "hidden lg:flex fixed left-0 top-0"
    }`}>
      <div className="p-5 flex flex-col items-center text-center">
        <Image
          src="/dre-logo.png"
          alt="DreHomes"
          width={120}
          height={120}
          className="rounded-xl bg-white mb-3"
          priority
        />
        <p className="text-xs text-white/60">{workspaceName}</p>
      </div>

      <Separator className="bg-white/10" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white ${
                pathname === "/dashboard" ? "bg-white/10 text-white" : ""
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mt-6 mb-2">
            Boards
          </p>

          {boards.map((board) => {
            const isActive = workspaceId && boardId === board.id
            return (
              <Link
                key={board.id}
                href={`/workspace/${workspaceId || "drehomes"}/board/${board.id}`}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white ${
                    isActive ? "bg-white/10 text-white" : ""
                  }`}
                >
                  {boardIcon(board.type)}
                  {board.name}
                </Button>
              </Link>
            )
          })}

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/60 hover:bg-white/10 hover:text-white mt-2"
            disabled
          >
            <Plus className="h-4 w-4" />
            Add board
          </Button>
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40">
          ByDre v0.1 — DreHomes
        </p>
      </div>
    </aside>
  )
}
