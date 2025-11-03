"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket } from "lucide-react"
import type { Store } from "@/lib/firebase/types"

interface RolloutModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (trainingDate: Date, launchDate: Date) => Promise<void>
}

export function RolloutModal({ store, isOpen, onClose, onSubmit }: RolloutModalProps) {
  const [trainingDate, setTrainingDate] = useState("")
  const [launchDate, setLaunchDate] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainingDate || !launchDate) return

    setLoading(true)
    try {
      //fookidy
      await onSubmit(new Date(trainingDate), new Date(launchDate))
      setTrainingDate("")
      setLaunchDate("")
    } catch (error) {
      console.error("Error pushing to rollout:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-600" />
            Push to Rollout
          </DialogTitle>
          <DialogDescription>
            Set training and launch dates for <strong>{store?.tradingName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="trainingDate">Training Date *</Label>
            <Input
              id="trainingDate"
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="launchDate">Launch Date *</Label>
            <Input
              id="launchDate"
              type="date"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !trainingDate || !launchDate}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {loading ? "Processing..." : "Push to Rollout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
