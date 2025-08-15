"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { LeadsTab } from "@/components/leads-tab"
import { StoreEditModal } from "@/components/store-edit-modal"
import type { Store } from "@/lib/firebase/types"

function LeadsPageContent() {
  const { currentUser, stores, users, handleSaveStore, handleDeleteStore, handleStatusChange } = useDashboardData()

  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [isMovingToClosed, setIsMovingToClosed] = useState(false)

  const handleAddStore = () => {
    setEditingStore({} as Store)
    setIsMovingToClosed(false)
  }

  const handleEditStore = (store: Store) => {
    setEditingStore(store)
    setIsMovingToClosed(false)
  }

  const handleStatusChangeWithModal = async (storeId: string, newStatus: Store["status"]) => {
    if (newStatus === "closed") {
      const store = stores.find((s) => s.id === storeId)
      if (store) {
        setEditingStore(store)
        setIsMovingToClosed(true)
      }
    } else {
      await handleStatusChange(storeId, newStatus)
    }
  }

  return (
    <>
      <LeadsTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onAddStore={handleAddStore}
        onEditStore={handleEditStore}
        onDeleteStore={handleDeleteStore}
        onStatusChange={handleStatusChangeWithModal}
      />

      <StoreEditModal
        store={editingStore}
        isOpen={!!editingStore}
        onClose={() => {
          setEditingStore(null)
          setIsMovingToClosed(false)
        }}
        onSave={handleSaveStore}
        isMovingToClosed={isMovingToClosed}
        currentUserId={currentUser?.id}
      />
    </>
  )
}

export default function LeadsPage() {
  return (
      <LeadsPageContent />
  )
}
