"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, AlertTriangle, Info } from "lucide-react"
import type { BagInventory, province } from "@/lib/firebase/types"

interface InventoryEditModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (province: province, totalBags: number) => Promise<void>
  inventory: BagInventory | null
}

export function InventoryEditModal({ isOpen, onClose, onUpdate, inventory }: InventoryEditModalProps) {
  const [totalBags, setTotalBags] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inventory) {
      setTotalBags(inventory.totalBags.toString())
    }
  }, [inventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventory || !totalBags) return

    const bagsNumber = Number.parseInt(totalBags)
    if (isNaN(bagsNumber) || bagsNumber < 0) {
      setError("Please enter a valid number of bags (0 or greater)")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onUpdate(inventory.province as province, bagsNumber)
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to update inventory")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTotalBags("")
    setError(null)
    onClose()
  }

  if (!inventory) return null

  const currentBags = inventory.totalBags
  const newBags = Number.parseInt(totalBags) || 0
  const difference = newBags - currentBags

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Inventory - {inventory.province}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will directly set the inventory total and create a log entry for the change.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="currentBags">Current Inventory</Label>
            <Input id="currentBags" value={currentBags.toLocaleString()} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalBags">New Total Bags</Label>
            <Input
              id="totalBags"
              type="number"
              min="0"
              value={totalBags}
              onChange={(e) => setTotalBags(e.target.value)}
              placeholder="Enter new total"
              required
            />
          </div>

          {difference !== 0 && !isNaN(difference) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">
                Change: {difference > 0 ? "+" : ""}
                {difference.toLocaleString()} bags
              </p>
              <p className="text-xs text-gray-600 mt-1">This will be logged as an inventory correction</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!totalBags || isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Updating..." : "Update Inventory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
