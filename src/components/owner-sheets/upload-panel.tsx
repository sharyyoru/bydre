"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, FileArchive, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadPanelProps {
  workspaceId: string
  onClose: () => void
  onComplete: () => void
}

type UploadState = "idle" | "uploading" | "processing" | "complete" | "error"

export function UploadPanel({ workspaceId, onClose, onComplete }: UploadPanelProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState<{ files: number; contacts: number; duplicates: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error("Please upload a .zip file")
      return
    }

    setState("uploading")
    setProgress(10)
    setMessage("Uploading file...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspaceId", workspaceId)

      const res = await fetch("/api/owner-sheets/upload", {
        method: "POST",
        body: formData,
      })

      setProgress(50)
      setState("processing")
      setMessage("Processing Excel files...")

      const data = await res.json()

      if (res.ok) {
        setProgress(100)
        setState("complete")
        setMessage("Upload complete!")
        setStats({
          files: data.file_count || 0,
          contacts: data.contact_count || 0,
          duplicates: data.duplicate_count || 0,
        })
        toast.success(`Imported ${data.contact_count} contacts`)
      } else {
        setState("error")
        setMessage(data.error || "Upload failed")
        toast.error(data.error || "Upload failed")
      }
    } catch {
      setState("error")
      setMessage("Network error. Please try again.")
      toast.error("Upload failed")
    }
  }, [workspaceId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Owner Sheets</DialogTitle>
          <DialogDescription>
            Upload a zip file containing folders with Excel sheets (.xlsx, .xls)
          </DialogDescription>
        </DialogHeader>

        {state === "idle" && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileArchive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your .zip file here, or click to browse
            </p>
            <label>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </span>
              </Button>
            </label>
          </div>
        )}

        {(state === "uploading" || state === "processing") && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-sm font-medium mb-2">{message}</p>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {state === "complete" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-sm font-medium mb-4">{message}</p>
            {stats && (
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold">{stats.files}</p>
                  <p className="text-xs text-muted-foreground">Files</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contacts}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </div>
            )}
            <Button onClick={onComplete}>View Contacts</Button>
          </div>
        )}

        {state === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-sm font-medium text-destructive mb-4">{message}</p>
            <Button variant="outline" onClick={() => setState("idle")}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
