"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { FilterBar } from "./filter-bar"
import { FilterPresets } from "./filter-presets"
import type { FilterState } from "@/hooks/use-filters"
import type { ReactNode } from "react"

interface AdvancedFilterBarProps {
  children: ReactNode
  filters: FilterState
  onLoadPreset: (filters: FilterState) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  showPresets?: boolean
  className?: string
}

export function AdvancedFilterBar({
  children,
  filters,
  onLoadPreset,
  onClearFilters,
  hasActiveFilters,
  showPresets = true,
  className = "",
}: AdvancedFilterBarProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <FilterBar>{children}</FilterBar>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showPresets && <FilterPresets currentFilters={filters} onLoadPreset={onLoadPreset} />}
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} size="sm">
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  )
}
