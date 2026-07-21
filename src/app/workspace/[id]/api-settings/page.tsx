"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ApiSettings } from "@/components/api-settings/api-settings"

export default function ApiSettingsPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <ApiSettings workspaceId={workspaceId} />
    </AppShell>
  )
}
