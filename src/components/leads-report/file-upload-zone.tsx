"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2, X, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface FileUploadZoneProps {
  workspaceId: string
  onFileUploaded: (fileData: unknown) => void
}

export function FileUploadZone({ workspaceId, onFileUploaded }: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Only Excel files (.xlsx, .xls) are supported")
      return
    }

    setUploading(true)
    setUploadedFile(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspaceId", workspaceId)

      const res = await fetch("/api/leads-report/upload", {
        method: "POST",
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setUploadedFile(file.name)
      onFileUploaded(data.file)
      toast.success(`${file.name} uploaded successfully`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }, [workspaceId, onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
    disabled: uploading
  })

  const clearUpload = () => {
    setUploadedFile(null)
  }

  return (
    <Card>
      <CardContent className="p-4">
        {uploadedFile ? (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{uploadedFile}</p>
                <p className="text-sm text-green-600">File processed successfully</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearUpload}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }
              ${uploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="text-gray-600">Processing file...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-blue-500" />
                <p className="text-blue-600 font-medium">Drop the Excel file here</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="text-gray-700 font-medium">
                    Drag & drop an Excel file here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse (.xlsx, .xls)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
