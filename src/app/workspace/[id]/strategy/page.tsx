"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Strategy } from "@/components/strategy/strategy"

export default function StrategyPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <Strategy workspaceId={workspaceId} />
    </AppShell>
  )
}
