"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { VeoStudio } from "@/components/veo/veo-studio"

export default function VeoStudioPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <VeoStudio workspaceId={workspaceId} />
    </AppShell>
  )
}
