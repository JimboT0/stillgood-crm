"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { KeyAccountsTab } from "@/components/key-accounts-tab"
import { StoreEditModal } from "@/components/store-edit-modal"
import type { Store } from "@/lib/firebase/types"

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
        currentUserId={currentUser?.id}
      />
    </>
  )
}

export default function KeyAccountsPage() {
  return (
      <KeyAccountsPageContent />
  )
}
