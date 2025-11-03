"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Save, Bookmark, Trash2, Plus } from "lucide-react"
import { useFilterContext } from "@/contexts/filter-context"
import type { FilterState } from "@/hooks/use-filters"

interface FilterPresetsProps {
  currentFilters: FilterState
  onLoadPreset: (filters: FilterState) => void
  className?: string
}

export function FilterPresets({ currentFilters, onLoadPreset, className = "" }: FilterPresetsProps) {
  const { saveFilterPreset, loadFilterPreset, deleteFilterPreset, getFilterPresets } = useFilterContext()

  const [isOpen, setIsOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [selectedPreset, setSelectedPreset] = useState("")

  const presets = getFilterPresets()
  const presetNames = Object.keys(presets)

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName.trim(), currentFilters)
      setPresetName("")
      setIsOpen(false)
    }
  }

  const handleLoadPreset = (name: string) => {
    const preset = loadFilterPreset(name)
    if (preset) {
      onLoadPreset(preset)
      setSelectedPreset(name)
    }
  }

  const handleDeletePreset = (name: string) => {
    if (window.confirm(`Delete preset "${name}"?`)) {
      deleteFilterPreset(name)
      if (selectedPreset === name) {
        setSelectedPreset("")
      }
    }
  }

  const hasActiveFilters = Object.entries(currentFilters).some(([key, value]) => {
    if (key === "dateRange") {
      return value.from || value.to
    }
    return value !== "" && value !== "all" && value !== undefined
  })

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Load Preset */}
      {presetNames.length > 0 && (
        <Select value={selectedPreset} onValueChange={handleLoadPreset}>
          <SelectTrigger className="w-40">
            <Bookmark className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Load preset" />
          </SelectTrigger>
          <SelectContent>
            {presetNames.map((name) => (
              <SelectItem key={name} value={name}>
                <div className="flex items-center justify-between w-full">
                  <span>{name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(name)
                    }}
                    className="h-4 w-4 p-0 ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}


      {/* Active Filters Count */}
      {hasActiveFilters && (
        <Badge variant="secondary" className="text-xs">
          {
            Object.entries(currentFilters).filter(([key, value]) => {
              if (key === "dateRange") {
                return value.from || value.to
              }
              return value !== "" && value !== "all" && value !== undefined
            }).length
          }{" "}
          active
        </Badge>
      )}
    </div>
  )
}
