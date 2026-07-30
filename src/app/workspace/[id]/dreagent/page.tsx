"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { DreAgent } from "@/components/dreagent/dreagent"

export default function DreAgentPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell fullWidth>
      <DreAgent workspaceId={workspaceId} />
    </AppShell>
  )
}
