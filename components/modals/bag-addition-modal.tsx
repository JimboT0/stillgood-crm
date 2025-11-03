"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertTriangle } from "lucide-react"
import type { province } from "@/lib/firebase/types"
import { PROVINCES } from "@/lib/firebase/types"

interface BagAdditionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (province: province, bags: number, source: string, notes?: string) => Promise<void>
}

const SOURCE_OPTIONS = [
  "Warehouse Delivery",
  "Production Run",
  "Transfer from Another Province",
  "Return from Store",
  "Other",
]

export function BagAdditionModal({ isOpen, onClose, onAdd }: BagAdditionModalProps) {
  const [province, setProvince] = useState<province | "">("")
  const [bags, setBags] = useState("")
  const [source, setSource] = useState("")
  const [customSource, setCustomSource] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!province || !bags || !source) return

    const bagsNumber = Number.parseInt(bags)
    if (isNaN(bagsNumber) || bagsNumber <= 0) {
      setError("Please enter a valid number of bags")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const finalSource = source === "Other" ? customSource : source
      await onAdd(province as province, bagsNumber, finalSource, notes)
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to add bags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setProvince("")
    setBags("")
    setSource("")
    setCustomSource("")
    setNotes("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add Bags to Inventory
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Select value={province} onValueChange={(value) => setProvince(value as province)}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((prov) => (
                  <SelectItem key={prov} value={prov}>
                    {prov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bags">Number of Bags</Label>
            <Input
              id="bags"
              type="number"
              min="1"
              value={bags}
              onChange={(e) => setBags(e.target.value)}
              placeholder="Enter number of bags"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {source === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customSource">Custom Source</Label>
              <Input
                id="customSource"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Enter custom source"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this addition"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!province || !bags || !source || (source === "Other" && !customSource) || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Adding..." : "Add Bags"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
