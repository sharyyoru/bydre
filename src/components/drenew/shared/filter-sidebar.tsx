"use client"

import { useState } from "react"
import { ChevronDown, X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface FilterSidebarProps {
  filters: FilterGroup[]
  selectedFilters: Record<string, string[]>
  onFilterChange: (filterId: string, values: string[]) => void
  onClearAll: () => void
  resultCount: number
}

export function FilterSidebar({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
  resultCount,
}: FilterSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    filters.map((f) => f.id)
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleOptionClick = (filterId: string, value: string, multiple?: boolean) => {
    const currentValues = selectedFilters[filterId] || []
    let newValues: string[]

    if (multiple) {
      newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
    } else {
      newValues = currentValues.includes(value) ? [] : [value]
    }

    onFilterChange(filterId, newValues)
  }

  const hasActiveFilters = Object.values(selectedFilters).some(
    (values) => values.length > 0
  )

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <h3 className="text-white font-medium">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-[#C9A962] text-sm hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Groups */}
      {filters.map((group) => (
        <div key={group.id} className="border-b border-white/10 pb-4">
          <button
            onClick={() => toggleGroup(group.id)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
              {group.label}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-white/50 transition-transform ${
                expandedGroups.includes(group.id) ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedGroups.includes(group.id) && (
            <div className="mt-3 space-y-2">
              {group.options.map((option) => {
                const isSelected = (selectedFilters[group.id] || []).includes(
                  option.value
                )
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleOptionClick(group.id, option.value, group.multiple)
                    }
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-all ${
                      isSelected
                        ? "bg-[#C9A962]/20 text-[#C9A962] border border-[#C9A962]/50"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-white/40">{option.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Result Count */}
      <div className="pt-4">
        <p className="text-white/50 text-sm">
          Showing <span className="text-[#C9A962]">{resultCount}</span> results
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        className="lg:hidden fixed bottom-6 right-6 z-50 border-[#C9A962] text-[#C9A962] bg-[#0a0a0a] rounded-none shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filters
      </Button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-white/10 p-6 overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white/5 border border-white/10 p-6">
          <FilterContent />
        </div>
      </aside>
    </>
  )
}
