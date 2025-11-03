"use client";

import { useState } from "react";
import { CorporateLeadsTab } from "@/components/corporate";
import { StoreEditModal } from "@/components/modals/store-edit-modal";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import type { Store } from "@/lib/firebase/types";
import { CorporateStoreEditModal } from "@/components/modals/corporate-edit-modal";

function CorporateLeadsPageContent() {
  const { currentUser, stores, users, handleSaveStore, handleDeleteStore } = useDashboardData();

  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const handleAddStore = () => {
    setEditingStore({} as Store);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
  };

  return (
    <>
      <CorporateLeadsTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onAddStore={handleAddStore}
        onEditStore={handleEditStore}
        onDeleteStore={handleDeleteStore}
      />

      <CorporateStoreEditModal
              store={editingStore}
              isOpen={!!editingStore}
              onClose={() => setEditingStore(null)}
              onSave={handleSaveStore}
              currentUserId={currentUser?.id}  />
    </>
  );
}

export default function CorporateLeadsPage() {
  return <CorporateLeadsPageContent />;
}
