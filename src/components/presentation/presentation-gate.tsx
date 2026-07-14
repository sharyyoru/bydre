"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LockKeyhole } from "lucide-react"

export function PresentationGate() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    const response = await fetch("/api/presentation/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
    setLoading(false)
    if (!response.ok) {
      setError("Incorrect password. Please try again.")
      return
    }
    router.refresh()
  }

  return <main className="min-h-screen bg-[#07111f] grid place-items-center p-6 text-white"><form onSubmit={unlock} className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur"><div className="mb-6 inline-flex rounded-2xl bg-[#D4AF37]/15 p-3 text-[#D4AF37]"><LockKeyhole /></div><p className="text-xs uppercase tracking-[.24em] text-[#D4AF37]">DreHomes</p><h1 className="mt-2 text-3xl font-bold">Marketing Team Playbook</h1><p className="mt-3 text-sm text-white/70">Enter the presentation password to access the 2026 operating system, trend forecast, and growth roadmap.</p><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-6 h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 outline-none focus:border-[#D4AF37]" placeholder="Presentation password" /><button disabled={loading || !password} className="mt-4 h-11 w-full rounded-xl bg-[#D4AF37] font-semibold text-[#0A1628] disabled:opacity-50">{loading ? "Opening..." : "Open presentation"}</button>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}</form></main>
}
