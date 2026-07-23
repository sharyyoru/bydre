"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ReelsHub } from "@/components/reels/reels-hub"

export default function ReelsPage() {
  const params = useParams()
  const workspaceId = params.id as string
  return (
    <AppShell>
      <ReelsHub workspaceId={workspaceId} />
    </AppShell>
  )
}
