"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Sparkles,
  ImageIcon,
  Video,
  History as HistoryIcon,
  Download,
  Loader2,
  Film,
  Trash2,
  RefreshCw,
} from "lucide-react"
import {
  IMAGE_ASPECT_RATIOS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_RESOLUTIONS,
  MediaGeneration,
  GeneratedImage,
} from "@/lib/veo/types"

const POLL_MS = 10_000

function fileToBase64(file: File): Promise<{ bytes: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ bytes: result.split(",")[1] || "", mimeType: file.type || "image/png" })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function VeoStudio({ workspaceId }: { workspaceId: string }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState("image")
  const [history, setHistory] = useState<MediaGeneration[]>([])

  // Image tab
  const [imgPrompt, setImgPrompt] = useState("")
  const [imgAspect, setImgAspect] = useState<string>("1:1")
  const [imgCount, setImgCount] = useState<string>("1")
  const [imgBusy, setImgBusy] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])

  // Video tab
  const [vidPrompt, setVidPrompt] = useState("")
  const [vidNegative, setVidNegative] = useState("")
  const [vidAspect, setVidAspect] = useState<string>("16:9")
  const [vidResolution, setVidResolution] = useState<string>("720p")
  const [firstFrame, setFirstFrame] = useState<{ bytes: string; mimeType: string } | null>(null)
  const [vidBusy, setVidBusy] = useState(false)
  const [activeVideo, setActiveVideo] = useState<MediaGeneration | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: auth }) => {
      if (!auth.user) return
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", auth.user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin((data as { role?: string } | null)?.role === "admin"))
    })
  }, [workspaceId])

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/veo/generations?workspace_id=${workspaceId}`)
    if (res.ok) setHistory((await res.json()).generations || [])
  }, [workspaceId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // --- Image generation ---
  const generateImages = async () => {
    if (!imgPrompt.trim()) return
    setImgBusy(true)
    setImages([])
    const res = await fetch("/api/veo/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        prompt: imgPrompt,
        aspect_ratio: imgAspect,
        number_of_images: Number(imgCount),
      }),
    })
    setImgBusy(false)
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      setImages(j.images || [])
      toast.success("Images generated")
      loadHistory()
    } else {
      toast.error(errorMessage(j, res.status))
    }
  }

  const applyAsFirstFrame = (img: GeneratedImage) => {
    setFirstFrame({ bytes: img.bytes, mimeType: img.mimeType })
    setTab("video")
    toast.success("Image set as video first frame")
  }

  // --- Video generation ---
  const pollStatus = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/veo/videos/status?workspace_id=${workspaceId}&id=${id}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setVidBusy(false)
        toast.error(errorMessage(j, res.status))
        return
      }
      const gen = j.generation as MediaGeneration
      setActiveVideo(gen)
      if (gen.status === "running") {
        pollTimer.current = setTimeout(() => pollStatus(id), POLL_MS)
      } else {
        setVidBusy(false)
        loadHistory()
        if (gen.status === "succeeded") toast.success("Video ready")
        else toast.error(gen.error || "Video generation failed")
      }
    },
    [workspaceId, loadHistory]
  )

  const generateVideo = async () => {
    if (!vidPrompt.trim()) return
    setVidBusy(true)
    setActiveVideo(null)
    const res = await fetch("/api/veo/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        prompt: vidPrompt,
        negative_prompt: vidNegative || undefined,
        aspect_ratio: vidAspect,
        resolution: vidResolution,
        image: firstFrame || undefined,
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      const gen = j.generation as MediaGeneration
      setActiveVideo(gen)
      toast.info("Generating video — this usually takes 1–3 minutes")
      pollStatus(gen.id)
    } else {
      setVidBusy(false)
      toast.error(errorMessage(j, res.status))
    }
  }

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current) }, [])

  const deleteGeneration = async (id: string) => {
    const res = await fetch("/api/veo/generations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, id }),
    })
    if (res.ok) {
      setHistory((h) => h.filter((g) => g.id !== id))
    } else {
      toast.error("Failed to delete")
    }
  }

  const videoUrl = (g: MediaGeneration, download = false) =>
    `/api/veo/videos/download?workspace_id=${workspaceId}&id=${g.id}&idx=0${download ? "&download=1" : ""}`

  const isExpired = (g: MediaGeneration) =>
    !!g.expires_at && new Date(g.expires_at).getTime() < Date.now()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-[#0A1628]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Veo Studio</h1>
          <p className="text-sm text-muted-foreground">
            Generate images with Imagen 4 and videos with Veo 3. Media is available to download for ~48 hours.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-800">
            Generation is limited to workspace admins to manage API costs. You can browse the history below.
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="image"><ImageIcon className="h-4 w-4 mr-1" />Image</TabsTrigger>
          <TabsTrigger value="video"><Video className="h-4 w-4 mr-1" />Video</TabsTrigger>
          <TabsTrigger value="history"><HistoryIcon className="h-4 w-4 mr-1" />History</TabsTrigger>
        </TabsList>

        {/* ---- Image ---- */}
        <TabsContent value="image" className="space-y-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Generate images (Imagen 4)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe the image you want to create…"
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                disabled={!isAdmin}
                rows={3}
              />
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs text-muted-foreground">Aspect ratio</label>
                  <Select value={imgAspect} onValueChange={setImgAspect}>
                    <SelectTrigger disabled={!isAdmin}><SelectValue /></SelectTrigger>
                    <SelectContent>{IMAGE_ASPECT_RATIOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Number of images</label>
                  <Select value={imgCount} onValueChange={setImgCount}>
                    <SelectTrigger disabled={!isAdmin}><SelectValue /></SelectTrigger>
                    <SelectContent>{["1", "2", "3", "4"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={generateImages} disabled={!isAdmin || imgBusy || !imgPrompt.trim()} className="w-full">
                    {imgBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, i) => {
                const src = `data:${img.mimeType};base64,${img.bytes}`
                return (
                  <Card key={i} className="rounded-2xl border-border/60 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
                    <CardContent className="flex gap-2 py-3">
                      <a href={src} download={`imagen-${Date.now()}-${i}.png`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full"><Download className="h-4 w-4 mr-1" />Download</Button>
                      </a>
                      <Button size="sm" onClick={() => applyAsFirstFrame(img)}><Film className="h-4 w-4 mr-1" />To video</Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ---- Video ---- */}
        <TabsContent value="video" className="space-y-4">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Generate video (Veo 3)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe the video (scene, action, camera, mood)…"
                value={vidPrompt}
                onChange={(e) => setVidPrompt(e.target.value)}
                disabled={!isAdmin}
                rows={3}
              />
              <Input
                placeholder="Negative prompt (optional) — what to avoid"
                value={vidNegative}
                onChange={(e) => setVidNegative(e.target.value)}
                disabled={!isAdmin}
              />
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs text-muted-foreground">Aspect ratio</label>
                  <Select value={vidAspect} onValueChange={setVidAspect}>
                    <SelectTrigger disabled={!isAdmin}><SelectValue /></SelectTrigger>
                    <SelectContent>{VIDEO_ASPECT_RATIOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Resolution</label>
                  <Select value={vidResolution} onValueChange={setVidResolution}>
                    <SelectTrigger disabled={!isAdmin}><SelectValue /></SelectTrigger>
                    <SelectContent>{VIDEO_RESOLUTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">First frame (image-to-video)</label>
                  <div className="flex gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) setFirstFrame(await fileToBase64(f))
                      }}
                    />
                    <Button variant="outline" className="flex-1" disabled={!isAdmin} onClick={() => fileRef.current?.click()}>
                      {firstFrame ? "Change image" : "Upload image"}
                    </Button>
                    {firstFrame && (
                      <Button variant="ghost" size="icon" onClick={() => setFirstFrame(null)} title="Remove first frame">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {firstFrame && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:${firstFrame.mimeType};base64,${firstFrame.bytes}`} alt="First frame" className="h-12 w-12 rounded object-cover" />
                  Image-to-video enabled
                </div>
              )}
              <Button onClick={generateVideo} disabled={!isAdmin || vidBusy || !vidPrompt.trim()}>
                {vidBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Video className="h-4 w-4 mr-1" />}
                Generate video
              </Button>
            </CardContent>
          </Card>

          {activeVideo && (
            <Card className="rounded-2xl border-border/60">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{activeVideo.status}</Badge>
                  <span className="text-sm text-muted-foreground truncate">{activeVideo.prompt}</span>
                </div>
                {activeVideo.status === "running" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Rendering… keep this tab open.
                  </div>
                )}
                {activeVideo.status === "succeeded" && !isExpired(activeVideo) && (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={videoUrl(activeVideo)} controls className="w-full rounded-xl bg-black max-h-[70vh]" />
                    <a href={videoUrl(activeVideo, true)}>
                      <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Download</Button>
                    </a>
                  </div>
                )}
                {activeVideo.status === "failed" && (
                  <p className="text-sm text-destructive">{activeVideo.error || "Generation failed"}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---- History ---- */}
        <TabsContent value="history" className="space-y-3">
          {history.length === 0 && <p className="text-sm text-muted-foreground">No generations yet.</p>}
          {history.map((g) => (
            <Card key={g.id} className="rounded-2xl border-border/60">
              <CardContent className="py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {g.kind === "video" ? <Film className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                    {g.kind}
                  </Badge>
                  <Badge
                    className={
                      g.status === "succeeded"
                        ? "bg-emerald-100 text-emerald-700 border-0"
                        : g.status === "failed"
                        ? "bg-red-100 text-red-700 border-0"
                        : "bg-amber-100 text-amber-700 border-0"
                    }
                  >
                    {g.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(g.created_at).toLocaleString()}</span>
                  {isExpired(g) && <span className="text-xs text-muted-foreground">· media expired</span>}
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (g.kind === "video") { setVidPrompt(g.prompt); setTab("video") }
                        else { setImgPrompt(g.prompt); setTab("image") }
                      }}
                      title="Re-run prompt"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => deleteGeneration(g.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#0A1628]">{g.prompt}</p>
                {g.kind === "video" && g.status === "succeeded" && !isExpired(g) && (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={videoUrl(g)} controls className="w-full rounded-xl bg-black max-h-[60vh]" />
                    <a href={videoUrl(g, true)}>
                      <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Download</Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function errorMessage(j: { error?: string; code?: string }, status: number): string {
  if (j.code === "not_configured") return "Add your Google (Gemini) API key in API Settings first."
  if (j.code === "billing" || status === 403) return "Veo/Imagen require a paid Google API tier with access enabled."
  if (status === 429) return "Rate limit or quota exceeded — try again shortly."
  return j.error || "Generation failed"
}
