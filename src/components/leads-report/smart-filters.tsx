"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar as CalendarIcon,
  X,
  Filter,
  ChevronDown,
  Check,
  Search
} from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"

export interface ColumnFilter {
  column: string
  values: string[]
}

export interface DateFilter {
  preset: string
  startDate?: Date
  endDate?: Date
}

interface SmartFiltersProps {
  headers: string[]
  rows: Record<string, unknown>[]
  dateColumn?: string
  onFiltersChange: (filters: {
    columnFilters: ColumnFilter[]
    dateFilter: DateFilter | null
    searchQuery: string
  }) => void
}

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 90 Days", value: "last_90_days" },
  { label: "Custom Range", value: "custom" }
]

function getDateRange(preset: string): { start: Date; end: Date } {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  switch (preset) {
    case "today":
      return { start: todayStart, end: today }
    case "yesterday":
      const yesterday = subDays(todayStart, 1)
      return { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) }
    case "this_week":
      return { start: startOfWeek(today, { weekStartsOn: 0 }), end: endOfWeek(today, { weekStartsOn: 0 }) }
    case "last_week":
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 })
      return { start: lastWeekStart, end: endOfWeek(lastWeekStart, { weekStartsOn: 0 }) }
    case "last_7_days":
      return { start: subDays(todayStart, 6), end: today }
    case "last_30_days":
      return { start: subDays(todayStart, 29), end: today }
    case "this_month":
      return { start: startOfMonth(today), end: endOfMonth(today) }
    case "last_month":
      const lastMonth = subMonths(today, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    case "last_90_days":
      return { start: subDays(todayStart, 89), end: today }
    default:
      return { start: subDays(todayStart, 29), end: today }
  }
}

export function SmartFilters({ headers, rows, dateColumn, onFiltersChange }: SmartFiltersProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  // Get unique values for each filterable column
  const columnValues = useMemo(() => {
    const values: Record<string, string[]> = {}
    headers.forEach(header => {
      const uniqueSet = new Set(
        rows
          .map(row => String(row[header] || ""))
          .filter(v => v && v !== "undefined" && v !== "null")
      )
      const uniqueValues = Array.from(uniqueSet).sort()
      if (uniqueValues.length > 0 && uniqueValues.length <= 100) {
        values[header] = uniqueValues
      }
    })
    return values
  }, [headers, rows])

  // Detect date column if not specified
  const effectiveDateColumn = dateColumn || headers.find(h =>
    h.toLowerCase().includes("date") ||
    h.toLowerCase().includes("created") ||
    h.toLowerCase().includes("time")
  )

  // Filterable columns (exclude numeric-only columns)
  const filterableColumns = useMemo(() => {
    return headers.filter(h => columnValues[h] && columnValues[h].length > 1)
  }, [headers, columnValues])

  function updateFilters(
    newColumnFilters: ColumnFilter[],
    newDateFilter: DateFilter | null,
    newSearch: string
  ) {
    setColumnFilters(newColumnFilters)
    setDateFilter(newDateFilter)
    setSearchQuery(newSearch)
    onFiltersChange({
      columnFilters: newColumnFilters,
      dateFilter: newDateFilter,
      searchQuery: newSearch
    })
  }

  function handleColumnFilterChange(column: string, value: string, checked: boolean) {
    const existing = columnFilters.find(f => f.column === column)
    let newFilters: ColumnFilter[]

    if (existing) {
      const newValues = checked
        ? [...existing.values, value]
        : existing.values.filter(v => v !== value)

      if (newValues.length === 0) {
        newFilters = columnFilters.filter(f => f.column !== column)
      } else {
        newFilters = columnFilters.map(f =>
          f.column === column ? { ...f, values: newValues } : f
        )
      }
    } else {
      newFilters = [...columnFilters, { column, values: [value] }]
    }

    updateFilters(newFilters, dateFilter, searchQuery)
  }

  function handleDatePresetChange(preset: string) {
    if (preset === "custom") {
      setDateFilter({ preset: "custom" })
    } else {
      const range = getDateRange(preset)
      const newDateFilter = { preset, startDate: range.start, endDate: range.end }
      updateFilters(columnFilters, newDateFilter, searchQuery)
    }
  }

  function handleCustomDateChange(range: DateRange | undefined) {
    setCustomDateRange(range)
    if (range?.from && range?.to) {
      const newDateFilter = {
        preset: "custom",
        startDate: range.from,
        endDate: range.to
      }
      updateFilters(columnFilters, newDateFilter, searchQuery)
    }
  }

  function clearColumnFilter(column: string) {
    const newFilters = columnFilters.filter(f => f.column !== column)
    updateFilters(newFilters, dateFilter, searchQuery)
  }

  function clearDateFilter() {
    setCustomDateRange(undefined)
    updateFilters(columnFilters, null, searchQuery)
  }

  function clearAllFilters() {
    setCustomDateRange(undefined)
    updateFilters([], null, "")
  }

  function handleSearchChange(value: string) {
    updateFilters(columnFilters, dateFilter, value)
  }

  const activeFilterCount = columnFilters.length + (dateFilter ? 1 : 0) + (searchQuery ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search all columns..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-48 h-9"
          />
        </div>

        {/* Date Filter */}
        {effectiveDateColumn && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <CalendarIcon className="h-4 w-4" />
                {dateFilter ? (
                  <span className="max-w-32 truncate">
                    {dateFilter.preset === "custom" && dateFilter.startDate && dateFilter.endDate
                      ? `${format(dateFilter.startDate, "MMM d")} - ${format(dateFilter.endDate, "MMM d")}`
                      : DATE_PRESETS.find(p => p.value === dateFilter.preset)?.label}
                  </span>
                ) : (
                  "Date"
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="border-r p-2 space-y-1">
                  {DATE_PRESETS.map(preset => (
                    <Button
                      key={preset.value}
                      variant={dateFilter?.preset === preset.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDatePresetChange(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {dateFilter?.preset === "custom" && (
                  <div className="p-2">
                    <Calendar
                      mode="range"
                      selected={customDateRange}
                      onSelect={handleCustomDateChange}
                      numberOfMonths={2}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Column Filters */}
        {filterableColumns.slice(0, 4).map(column => {
          const currentFilter = columnFilters.find(f => f.column === column)
          const selectedCount = currentFilter?.values.length || 0

          return (
            <Popover key={column} open={openFilter === column} onOpenChange={(open) => setOpenFilter(open ? column : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  {selectedCount > 0 && (
                    <Badge className="h-5 w-5 p-0 justify-center bg-blue-600 text-white">
                      {selectedCount}
                    </Badge>
                  )}
                  <span className="max-w-24 truncate">{column}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Search ${column}...`} className="h-9" />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {columnValues[column]?.map(value => {
                          const isSelected = currentFilter?.values.includes(value)
                          return (
                            <CommandItem
                              key={value}
                              onSelect={() => handleColumnFilterChange(column, value, !isSelected)}
                              className="cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                className="mr-2"
                              />
                              <span className="truncate flex-1">{value}</span>
                              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                            </CommandItem>
                          )
                        })}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )
        })}

        {/* More Filters Button */}
        {filterableColumns.length > 4 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Filter className="h-4 w-4" />
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {filterableColumns.slice(4).map(column => (
                    <Button
                      key={column}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setOpenFilter(column)}
                    >
                      {column}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-red-600 hover:text-red-700" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(columnFilters.length > 0 || dateFilter) && (
        <div className="flex flex-wrap gap-2">
          {dateFilter && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              <CalendarIcon className="h-3 w-3" />
              {dateFilter.preset === "custom" && dateFilter.startDate && dateFilter.endDate
                ? `${format(dateFilter.startDate, "MMM d, yyyy")} - ${format(dateFilter.endDate, "MMM d, yyyy")}`
                : DATE_PRESETS.find(p => p.value === dateFilter.preset)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 rounded-full"
                onClick={clearDateFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {columnFilters.map(filter => (
            <Badge key={filter.column} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              <span className="font-medium">{filter.column}:</span>
              <span className="max-w-32 truncate">
                {filter.values.length === 1
                  ? filter.values[0]
                  : `${filter.values.length} selected`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-300 rounded-full"
                onClick={() => clearColumnFilter(filter.column)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Hook to apply filters to data
export function useFilteredData(
  rows: Record<string, unknown>[],
  filters: {
    columnFilters: ColumnFilter[]
    dateFilter: DateFilter | null
    searchQuery: string
  },
  dateColumn?: string
) {
  return useMemo(() => {
    let filtered = [...rows]

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(query)
        )
      )
    }

    // Apply column filters
    filters.columnFilters.forEach(filter => {
      filtered = filtered.filter(row => {
        const value = String(row[filter.column] || "")
        return filter.values.includes(value)
      })
    })

    // Apply date filter
    if (filters.dateFilter && dateColumn && filters.dateFilter.startDate && filters.dateFilter.endDate) {
      filtered = filtered.filter(row => {
        const dateValue = row[dateColumn]
        if (!dateValue) return false

        const rowDate = new Date(dateValue as string)
        if (isNaN(rowDate.getTime())) return false

        return rowDate >= filters.dateFilter!.startDate! && rowDate <= filters.dateFilter!.endDate!
      })
    }

    return filtered
  }, [rows, filters, dateColumn])
}
