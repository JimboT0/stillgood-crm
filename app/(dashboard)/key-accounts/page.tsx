"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { KeyAccountsTab } from "@/components/key-accounts-tab"
import { ClosedStoreEditModal } from "@/components/modals/closed-store-edit-modal"
import type { Store } from "@/lib/firebase/types"
import { StoreEditModal } from "@/components/modals/store-edit-modal"


function KeyAccountsPageContent() {
  const { currentUser, stores, users, handleSaveStore, handleStatusChange } = useDashboardData()
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  const handleEditStore = (store: Store) => {
    setEditingStore(store)
  }

  return (
    <>
      <KeyAccountsTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onEditStore={handleEditStore}
        onStatusChange={handleStatusChange}
      />

      <StoreEditModal
        store={editingStore}
        isOpen={!!editingStore}
        onClose={() => setEditingStore(null)}
        onSave={handleSaveStore}
        currentUserId={currentUser?.id} isMovingToClosed={false}      />
    </>
  )
}

export default function KeyAccountsPage() {
  return (
      <KeyAccountsPageContent />
  )
}
