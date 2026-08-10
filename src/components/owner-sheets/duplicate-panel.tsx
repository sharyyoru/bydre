"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, AlertTriangle, FileSpreadsheet } from "lucide-react"
import type { OwnerContact } from "./owner-sheets"

interface DuplicatePanelProps {
  contactId: string
  workspaceId: string
  onClose: () => void
  onMerge: () => void
}

export function DuplicatePanel({ contactId, workspaceId, onClose, onMerge }: DuplicatePanelProps) {
  const [loading, setLoading] = useState(true)
  const [duplicates, setDuplicates] = useState<OwnerContact[]>([])
  const [primaryId, setPrimaryId] = useState<string | null>(null)
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    const fetchDuplicates = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/owner-sheets/duplicates?contactId=${contactId}&workspaceId=${workspaceId}`
        )
        const data = await res.json()
        if (res.ok) {
          setDuplicates(data.duplicates || [])
          // Default to the first non-duplicate or the contact itself
          const primary = data.duplicates.find((d: OwnerContact) => !d.is_duplicate) || data.duplicates[0]
          setPrimaryId(primary?.id || null)
        } else {
          toast.error(data.error || "Failed to load duplicates")
        }
      } catch {
        toast.error("Failed to load duplicates")
      } finally {
        setLoading(false)
      }
    }
    fetchDuplicates()
  }, [contactId, workspaceId])

  const handleMerge = async () => {
    if (!primaryId) {
      toast.error("Please select a primary record")
      return
    }

    setMerging(true)
    try {
      const res = await fetch("/api/owner-sheets/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryId,
          duplicateIds: duplicates.filter((d) => d.id !== primaryId).map((d) => d.id),
          workspaceId,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Duplicates merged successfully")
        onMerge()
      } else {
        toast.error(data.error || "Merge failed")
      }
    } catch {
      toast.error("Merge failed")
    } finally {
      setMerging(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Duplicate Records Found
          </DialogTitle>
          <DialogDescription>
            These contacts appear to be duplicates based on matching phone or email.
            Select the primary record to keep.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No duplicate records found
          </div>
        ) : (
          <RadioGroup value={primaryId || ""} onValueChange={setPrimaryId}>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {duplicates.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    primaryId === contact.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <RadioGroupItem value={contact.id} id={contact.id} className="mt-1" />
                  <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{contact.name || "Unknown"}</span>
                      {contact.is_duplicate && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Duplicate
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {contact.phone && <p>📞 {contact.phone}</p>}
                      {contact.email && <p>📧 {contact.email}</p>}
                      {contact.property && <p>🏠 {contact.property}</p>}
                      {contact.area && <p>📍 {contact.area}</p>}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {contact.source_file} (row {contact.source_row})
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={merging || !primaryId}>
            {merging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              "Keep Primary & Remove Duplicates"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
