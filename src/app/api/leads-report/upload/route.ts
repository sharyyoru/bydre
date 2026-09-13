import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createAdminClient } from "@/lib/supabase/admin"

export interface SheetData {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
  summary: {
    totalRows: number
    numericColumns: string[]
    totals: Record<string, number>
  }
}

function getNumericColumns(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(header => {
    const values = rows.map(row => row[header])
    return values.some(v => typeof v === "number" && !isNaN(v))
  })
}

function calculateTotals(rows: Record<string, unknown>[], numericColumns: string[]): Record<string, number> {
  const totals: Record<string, number> = {}
  numericColumns.forEach(col => {
    totals[col] = rows.reduce((sum, row) => {
      const val = row[col]
      return sum + (typeof val === "number" ? val : 0)
    }, 0)
  })
  return totals
}

function parseExcelBuffer(buffer: ArrayBuffer, fileName: string) {
  const workbook = XLSX.read(buffer, { type: "array" })
  
  const sheets: SheetData[] = workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const numericColumns = getNumericColumns(rows, headers)
    const totals = calculateTotals(rows, numericColumns)
    
    return {
      name: sheetName,
      headers,
      rows,
      summary: {
        totalRows: rows.length,
        numericColumns,
        totals
      }
    }
  })

  return {
    name: fileName,
    sheets,
    totalRows: sheets.reduce((sum, s) => sum + s.summary.totalRows, 0)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const workspaceId = formData.get("workspaceId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are supported" }, { status: 400 })
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()
    
    // Parse Excel
    const parsedData = parseExcelBuffer(buffer, file.name)

    // Store file in Supabase Storage
    const admin = createAdminClient()
    const filePath = `${workspaceId}/${Date.now()}_${file.name}`
    
    const { error: uploadError } = await admin.storage
      .from("lead-reports")
      .upload(filePath, buffer, {
        contentType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      // Continue even if storage fails - we have the parsed data
    }

    // Record in database
    const { data: record, error: dbError } = await admin
      .from("lead_report_files")
      .insert({
        workspace_id: workspaceId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        sheet_count: parsedData.sheets.length,
        row_count: parsedData.totalRows,
        metadata: {
          headers: parsedData.sheets.map(s => s.headers),
          uploadedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
    }

    return NextResponse.json({ 
      success: true,
      file: {
        id: record?.id,
        ...parsedData
      }
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Failed to process file" 
    }, { status: 500 })
  }
}

// GET: List uploaded files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("lead_report_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ files: data || [] })
  } catch (error) {
    console.error("List files error:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}

// DELETE: Remove a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 })
    }

    const admin = createAdminClient()
    
    // Get file record
    const { data: file } = await admin
      .from("lead_report_files")
      .select("file_path")
      .eq("id", fileId)
      .single()

    if (file?.file_path) {
      // Delete from storage
      await admin.storage
        .from("lead-reports")
        .remove([file.file_path])
    }

    // Delete database record
    const { error } = await admin
      .from("lead_report_files")
      .delete()
      .eq("id", fileId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
