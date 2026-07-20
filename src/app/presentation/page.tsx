import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PresentationDeck } from "@/components/presentation/presentation-deck"
import { PresentationGate } from "@/components/presentation/presentation-gate"
import { cookieName, hasPresentationAccess } from "@/lib/presentation-access"

export const metadata: Metadata = { title: "DreHomes Marketing Team Playbook", robots: { index: false, follow: false } }

export default async function PresentationPage() {
  const cookieStore = await cookies()
  const allowed = hasPresentationAccess(cookieStore.get(cookieName)?.value)
  return allowed ? <PresentationDeck /> : <PresentationGate />
}
