"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  Users,
  Palette,
  ChevronDown,
  FileText,
  Camera,
  Clapperboard,
  Youtube,
  Languages,
} from "lucide-react"
import { PLAYBOOKS, PagePlaybook, GLOBAL_LANGUAGES, PRIORITY_LANGUAGES, LANGUAGE_MODEL } from "./data"

const MAX_WEEKLY = 12 // scale for progress bars

function DeliverableBar({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: number
  accent: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" style={{ color: accent }} />
          {label}
        </span>
        <span className="font-bold text-[#0A1628]">{value}/wk</span>
      </div>
      <Progress value={Math.min((value / MAX_WEEKLY) * 100, 100)} className="h-2" />
    </div>
  )
}

function PillarCard({ pillar }: { pillar: PagePlaybook["pillars"][number] }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="w-full rounded-xl border border-border/60 bg-white p-4 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#0A1628]">{pillar.title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
      <div className={`grid transition-all ${open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-1.5">
            {pillar.examples.map((ex) => (
              <Badge key={ex} variant="secondary" className="font-normal">
                {ex}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

function Playbook({ p }: { p: PagePlaybook }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: p.accent }}>
              <Target className="h-4 w-4" />
              Objective
            </div>
            <p className="mt-2 text-sm text-[#0A1628]">{p.objective}</p>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#0A1628]">Content pillars</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {p.pillars.map((pillar) => (
              <PillarCard key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>

        {p.key === "global" && (
          <Card className="rounded-2xl border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: p.accent }}>
                <Languages className="h-4 w-4" />
                Multilingual model
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {GLOBAL_LANGUAGES.map((lang) => (
                  <Badge
                    key={lang}
                    variant={PRIORITY_LANGUAGES.includes(lang) ? "default" : "outline"}
                    title={PRIORITY_LANGUAGES.includes(lang) ? "Priority market — every week" : undefined}
                  >
                    {lang}
                    {PRIORITY_LANGUAGES.includes(lang) ? " ★" : ""}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{LANGUAGE_MODEL.approach}</p>
              <p className="mt-1 text-sm text-muted-foreground">{LANGUAGE_MODEL.rotation}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm font-semibold text-[#0A1628]">Weekly deliverables</p>
            <DeliverableBar icon={FileText} label="Feed posts" value={p.deliverables.feed} accent={p.accent} />
            <DeliverableBar icon={Camera} label="Stories" value={p.deliverables.stories} accent={p.accent} />
            <DeliverableBar icon={Clapperboard} label="Reels" value={p.deliverables.reels} accent={p.accent} />
            <DeliverableBar icon={Youtube} label="YT Shorts" value={p.deliverables.shorts} accent={p.accent} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628]">
              <Users className="h-4 w-4" style={{ color: p.accent }} />
              Target audience
            </div>
            <ul className="mt-2 space-y-1">
              {p.audience.map((a) => (
                <li key={a} className="text-sm text-muted-foreground">• {a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0A1628]">
              <Palette className="h-4 w-4" style={{ color: p.accent }} />
              Tone
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.tone.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div
          className="rounded-2xl p-4 text-sm font-medium"
          style={{ backgroundColor: `${p.accent}12`, color: p.accent }}
        >
          Golden rule: {p.goldenRule}
        </div>
      </div>
    </div>
  )
}

export function PagePlaybooks() {
  const [tab, setTab] = useState<string>(PLAYBOOKS[0].key)
  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {PLAYBOOKS.map((p) => (
            <TabsTrigger key={p.key} value={p.key}>
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {PLAYBOOKS.map((p) => (
          <TabsContent key={p.key} value={p.key}>
            <Playbook p={p} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
