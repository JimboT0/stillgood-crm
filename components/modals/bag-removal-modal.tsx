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
import { Minus, AlertTriangle } from "lucide-react"
import type { province } from "@/lib/firebase/types"

interface BagRemovalModalProps {
  isOpen: boolean
  onClose: () => void
  onRemove: (province: province, bags: number, destination: string, notes?: string) => Promise<void>
  availableStock: { [province: string]: number }
}

const DESTINATION_OPTIONS = [
  "Store Delivery",
  "Transfer to Another Province",
  "Damaged/Disposed",
  "Return to Warehouse",
  "Other",
]

export function BagRemovalModal({ isOpen, onClose, onRemove, availableStock }: BagRemovalModalProps) {
  const [province, setProvince] = useState<province | "">("")
  const [bags, setBags] = useState("")
  const [destination, setDestination] = useState("")
  const [customDestination, setCustomDestination] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableProvinces = Object.keys(availableStock).filter((prov) => availableStock[prov] > 0)
  const maxBags = province ? availableStock[province] || 0 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!province || !bags || !destination) return

    const bagsNumber = Number.parseInt(bags)
    if (isNaN(bagsNumber) || bagsNumber <= 0) {
      setError("Please enter a valid number of bags")
      return
    }

    if (bagsNumber > maxBags) {
      setError(`Cannot remove ${bagsNumber} bags. Only ${maxBags} available in ${province}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const finalDestination = destination === "Other" ? customDestination : destination
      await onRemove(province as province, bagsNumber, finalDestination, notes)
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to remove bags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setProvince("")
    setBags("")
    setDestination("")
    setCustomDestination("")
    setNotes("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="w-5 h-5 text-red-600" />
            Remove Bags from Inventory
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
                {availableProvinces.map((prov) => (
                  <SelectItem key={prov} value={prov}>
                    {prov} ({availableStock[prov]} available)
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
              max={maxBags}
              value={bags}
              onChange={(e) => setBags(e.target.value)}
              placeholder={`Enter number of bags (max: ${maxBags})`}
              required
            />
            {province && (
              <p className="text-sm text-gray-500">
                Available in {province}: {maxBags.toLocaleString()} bags
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {destination === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customDestination">Custom Destination</Label>
              <Input
                id="customDestination"
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                placeholder="Enter custom destination"
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
              placeholder="Additional notes about this removal"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !province || !bags || !destination || (destination === "Other" && !customDestination) || isLoading
              }
              variant="destructive"
            >
              {isLoading ? "Removing..." : "Remove Bags"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
