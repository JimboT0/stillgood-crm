"use client"

import { TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import type { OnboardingChecklist } from "@/lib/firebase/types"

interface ChecklistCellProps {
  checklist?: OnboardingChecklist
}

export function ChecklistCell({ checklist }: ChecklistCellProps) {
  if (!checklist) {
    return (
      <TableCell>
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          Not Started
        </Badge>
      </TableCell>
    )
  }

  // Calculate completion percentage
  const getCompletionStats = () => {
    const fields = [
      'crmListingConfirmed', 'storeWhatsappGroupSetup',
      'allStaffAvailableForTraining', 'bagLoadingTrainingMaterial', 'collectionProcessVideo', 'websiteSystemWalkthrough',
      'introducedToStoreManager', 'allRelevantStaffPresent', 'wasteRemovalProcessTrained', 'wasteRecordingTrained',
      'correctBagPackingTrained', 'staffUnderstandingConfirmed', 'collectionTimesDiscussed', 'customerCollectionProceduresExplained',
      'retailerTrainedOnWebsite', 'storeLoginCreated', 'loadBagsLinkConfirmed',
      'flexMessagingSetup', 'bagsTapeStickersOrdered', 'trainingFullyCompleted'
    ]
    
    const categoriesCompleted = (checklist.categoriesActive?.produce ? 1 : 0) +
                               (checklist.categoriesActive?.bakery ? 1 : 0) +
                               (checklist.categoriesActive?.grocery ? 1 : 0)
    
    const completed = fields.filter(field => checklist[field as keyof OnboardingChecklist]).length + categoriesCompleted
    const total = fields.length + 3 // +3 for the categories
    
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const stats = getCompletionStats()

  const getStatusBadge = () => {
    if (stats.percentage === 100) {
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="w-3 h-3" />
          Complete
        </Badge>
      )
    } else if (stats.percentage === 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          Not Started
        </Badge>
      )
    } else if (stats.percentage >= 75) {
      return (
        <Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Clock className="w-3 h-3" />
          {stats.percentage}% - Almost Complete
        </Badge>
      )
    } else if (stats.percentage >= 50) {
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Clock className="w-3 h-3" />
          {stats.percentage}% - In Progress
        </Badge>
      )
    } else {
      return (
        <Badge className="gap-1 bg-orange-100 text-orange-800 hover:bg-orange-200">
          <Clock className="w-3 h-3" />
          {stats.percentage}% - Started
        </Badge>
      )
    }
  }

  return (
    <TableCell>
      {getStatusBadge()}
    </TableCell>
  )
}