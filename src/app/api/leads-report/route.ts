import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import * as fs from "fs"
import * as path from "path"

const LEADS_FOLDER = "C:\\Users\\user\\Desktop\\dre\\Leads"

export interface ExcelFile {
  name: string
  sheets: SheetData[]
}

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

export async function GET() {
  try {
    const files = fs.readdirSync(LEADS_FOLDER).filter(f => f.endsWith(".xlsx"))
    
    const excelFiles: ExcelFile[] = files.map(fileName => {
      const filePath = path.join(LEADS_FOLDER, fileName)
      const workbook = XLSX.readFile(filePath)
      
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
        sheets
      }
    })
    
    return NextResponse.json({ files: excelFiles })
  } catch (error) {
    console.error("Error reading Excel files:", error)
    return NextResponse.json({ error: "Failed to read Excel files" }, { status: 500 })
  }
}
