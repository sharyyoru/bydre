"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Settings2 } from "lucide-react"

const columnTypes = [
  { id: "text", name: "Text" },
  { id: "number", name: "Number" },
  { id: "date", name: "Date" },
  { id: "dropdown", name: "Dropdown" },
  { id: "label", name: "Label" },
  { id: "checkbox", name: "Checkbox" },
  { id: "rating", name: "Rating" },
  { id: "email", name: "Email" },
  { id: "phone", name: "Phone" },
  { id: "url", name: "URL" },
  { id: "currency", name: "Currency" },
  { id: "people", name: "People" },
  { id: "status", name: "Status" },
  { id: "priority", name: "Priority" },
  { id: "progress", name: "Progress" },
  { id: "file", name: "File" },
]

export function ColumnDefinitionDialog({
  boardId,
  existingColumnCount,
  onSuccess,
}: {
  boardId: string
  existingColumnCount: number
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [loading, setLoading] = useState(false)

  const addColumn = async () => {
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()

    let settings: Record<string, any> = {}
    if (type === "status") {
      settings = {
        options: [
          { id: "status-todo", name: "To Do", color: "#6B7280", position: 0 },
          { id: "status-progress", name: "In Progress", color: "#3B82F6", position: 1 },
          { id: "status-done", name: "Done", color: "#10B981", position: 2 },
        ],
      }
    }
    if (type === "priority") {
      settings = {}
    }
    if (type === "dropdown" || type === "label") {
      settings = { options: [] }
    }
    if (type === "currency") {
      settings = { currency: "USD", precision: 2 }
    }
    if (type === "progress") {
      settings = { source: "subitems" }
    }

    const { error } = await supabase.from("columns").insert({
      board_id: boardId,
      name: name.trim(),
      type,
      position: existingColumnCount,
      settings,
    })

    setLoading(false)
    if (error) {
      toast.error("Failed to add column")
      return
    }

    toast.success("Column added")
    setName("")
    setType("text")
    setOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Add column
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
          <DialogDescription>
            Define a new column for this board.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="col-name">Column name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Budget, Location, Platform"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-type">Column type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="col-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={addColumn}
            disabled={loading || !name.trim()}
            className="bg-[#0A1628]"
          >
            {loading ? "Adding..." : "Add column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
