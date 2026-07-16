"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { getEstimatedFileSize } from "@/lib/collage"
import { CheckCircle2, Download } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  exportProgress: number
  exportStage: string
  exportComplete: boolean
}

export function ExportDialog({
  open,
  onClose,
  exportProgress,
  exportStage,
  exportComplete,
}: ExportDialogProps) {
  const exportWidth = Math.round(78.74 * 200)
  const exportHeight = exportWidth
  const estimatedSize = getEstimatedFileSize(exportWidth, exportHeight, 'png')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {exportComplete ? 'Export Complete' : 'Exporting Collage'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!exportComplete ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{exportStage}</span>
                  <span className="font-medium">{Math.round(exportProgress * 100)}%</span>
                </div>
                <Progress value={exportProgress * 100} />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p>
                  <span className="font-medium">Resolution:</span> {exportWidth} × {exportHeight}px
                </p>
                <p>
                  <span className="font-medium">DPI:</span> 200 (print quality)
                </p>
                <p>
                  <span className="font-medium">Estimated size:</span> {estimatedSize}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                This may take 20-40 seconds depending on the number of images...
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Export Successful!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your high-resolution collage has been downloaded.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p>
                  <span className="font-medium">Resolution:</span> {exportWidth} × {exportHeight}px
                </p>
                <p>
                  <span className="font-medium">DPI:</span> 200 DPI
                </p>
                <p>
                  <span className="font-medium">Format:</span> PNG (lossless)
                </p>
              </div>

              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
