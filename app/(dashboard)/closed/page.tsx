"use client"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { ClosedTab } from "@/components/closed-tab"
import { useState } from "react"
import type { Store } from "@/lib/firebase/types"
import { DocumentViewerModal } from "@/components/modals/document-viewer-modal"
import { formatDateTime } from "@/lib/utils/date-utils"
import { parseCustomDate } from "@/lib/date-validation"

export default function ClosedPage() {
  const { currentUser, stores, users, handleSetupConfirmation, handlePushToRollout, handleMarkAsError } =
    useDashboardData()

  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [rolloutStore, setRolloutStore] = useState<Store | null>(null)
  const [documentViewModal, setDocumentViewModal] = useState<{
    isOpen: boolean
    store: Store | null
    documentType: "sla" | "bank" | null
  }>({
    isOpen: false,
    store: null,
    documentType: null,
  })

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store)
  }

async function handlePushStoreToRollout(store: Store, trainingDate?: Date, launchDate?: Date) {
  try {
    // Check store.id
    if (!store?.id || typeof store.id !== "string" || !store.id.trim()) {
      console.error("Invalid store ID:", store?.id)
      alert("Failed to push to rollout: Invalid store ID.")
      return
      }

      let finalTrainingDate: Date | null = null
      console.log("store.trainingDate:", store.trainingDate)
      if (!store.trainingDate) {
        console.error("Missing pre-defined training date")
        alert("Failed to push to rollout: Training date is required.")
        return
      }

      // Handle Firebase Timestamp objects properly
      if (store.trainingDate && typeof store.trainingDate === "object" && "seconds" in store.trainingDate) {
        // It's a Firebase Timestamp object
        finalTrainingDate = new Date(
          store.trainingDate.seconds * 1000 + (store.trainingDate.nanoseconds || 0) / 1000000,
        )
      } else if ((store.trainingDate as any) instanceof Date) {
        // It's already a Date object
        finalTrainingDate = store.trainingDate
      } else if (typeof store.trainingDate === "string") {
        // It's a string, try to parse it
        finalTrainingDate = parseCustomDate(store.trainingDate)
      }

      if (!finalTrainingDate) {
        console.error("Invalid pre-defined training date:", JSON.stringify(store.trainingDate))
        alert(
          "Failed to push to rollout: Invalid training date format. Expected YYYY-MM-DDTHH:mm (e.g., 2025-10-11T11:11).",
        )
        return
      }

      let finalLaunchDate: Date | null = null
      console.log("store.launchDate:", store.launchDate, "provided launchDate:", launchDate)
      if (store.launchDate) {
        // Handle Firebase Timestamp objects properly
        if (typeof store.launchDate === "object" && "seconds" in store.launchDate) {
          // It's a Firebase Timestamp object
          finalLaunchDate = new Date(store.launchDate.seconds * 1000 + (store.launchDate.nanoseconds || 0) / 1000000)
        } else if ((store.launchDate as any) instanceof Date) {
          // It's already a Date object
          finalLaunchDate = store.launchDate
        } else if (typeof store.launchDate === "string") {
          // It's a string, try to parse it
          finalLaunchDate = parseCustomDate(store.launchDate)
        }

        if (!finalLaunchDate) {
          console.error("Invalid pre-defined launch date:", JSON.stringify(store.launchDate))
          alert(
            "Failed to push to rollout: Invalid launch date format. Expected YYYY-MM-DDTHH:mm (e.g., 2025-10-11T11:11).",
          )
          return
        }
      } else if (launchDate) {
        console.log("Using provided launchDate:", launchDate)
        finalLaunchDate = launchDate
      } else {
        console.warn("No pre-defined or provided launch date, prompting user")
        const input = prompt("Enter launch date and time (DDMMYY HH:mm, e.g., 111025 11:11):") || ""
        if (!input.trim()) {
          console.warn("Launch date prompt canceled or empty")
          alert("Launch date is required.")
          return
        }
        finalLaunchDate = parseCustomDate(input)
        if (!finalLaunchDate) {
          console.error("Invalid launch date input:", JSON.stringify(input))
          alert("Failed to push to rollout: Invalid launch date format. Use DDMMYY HH:mm (e.g., 111025 11:11).")
          return
        }
      }

      // Debug: Check store.createdAt
      console.log("store.createdAt:", store.createdAt)

      // Log formatted dates for debugging
      console.log(
        "Pushing store with ID:",
        store.id,
        "Training Date:",
        formatDateTime(finalTrainingDate),
        "Launch Date:",
        formatDateTime(finalLaunchDate),
      )

      // Pass Date objects to handlePushToRollout
      await handlePushToRollout(store.id, finalTrainingDate, finalLaunchDate)
    } catch (error) {
      console.error("Error pushing to rollout:", error)
      alert("Failed to push to rollout: " + error)
    }
  }

  const handleViewDocument = (store: Store, documentType: "sla" | "bank") => {
    setDocumentViewModal({
      isOpen: true,
      store,
      documentType,
    })
  }

  return (
    <>
      <ClosedTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onStoreClick={handleStoreClick}
        onViewDocument={handleViewDocument}
        onSetupConfirmation={handleSetupConfirmation}
        onPushToRollout={handlePushStoreToRollout} // This is correct
        onMarkAsError={handleMarkAsError}
        getSalespersonName={(salespersonId: string): string => {
          const user = users.find((user) => user.id === salespersonId);
          return user ? user.name : "Unknown User";
        }}
      />
      <DocumentViewerModal
        isOpen={documentViewModal.isOpen}
        onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
        store={documentViewModal.store}
        documentType={documentViewModal.documentType}
        currentUser={currentUser}
      />
    </>
  )
}
