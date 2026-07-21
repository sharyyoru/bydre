"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { SocialMonitor } from "@/components/social-monitor/social-monitor"

export default function SocialMonitorPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <SocialMonitor workspaceId={workspaceId} />
    </AppShell>
  )
}
