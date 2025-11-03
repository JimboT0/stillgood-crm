"use client";

import { useState } from "react";
import { LeadsTab } from "@/components/leads-tab";
import { StoreEditModal } from "@/components/modals/store-edit-modal";
import { DocumentViewerModal } from "@/components/modals/document-viewer-modal";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import type { Store } from "@/lib/firebase/types";

function LeadsPageContent() {
  const { currentUser, stores, users, handleSaveStore, handleDeleteStore, handleStatusChange } = useDashboardData();

  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isMovingToClosed, setIsMovingToClosed] = useState(false);
  const [documentViewModal, setDocumentViewModal] = useState<{
    isOpen: boolean;
    store: Store | null;
    documentType: "sla" | "bank" | null;
  }>({ isOpen: false, store: null, documentType: null });

  const handleAddStore = () => {
    setEditingStore({} as Store);
    setIsMovingToClosed(false);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setIsMovingToClosed(false);
  };

  const handleViewDocument = (store: Store, documentType: "sla" | "bank") => {
    console.log(`Viewing ${documentType} document for store ${store.id}`);
    setDocumentViewModal({ isOpen: true, store, documentType });
  };

  return (
    <>
      <LeadsTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onAddStore={handleAddStore}
        onEditStore={handleEditStore}
        onDeleteStore={handleDeleteStore}
        onStatusChange={handleStatusChange}
        onViewDocument={handleViewDocument}
      />

      <DocumentViewerModal
        isOpen={documentViewModal.isOpen}
        onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
        store={documentViewModal.store}
        documentType={documentViewModal.documentType}
        currentUser={currentUser}
      />

      <StoreEditModal
        store={editingStore}
        isOpen={!!editingStore}
        onClose={() => {
          setEditingStore(null);
          setIsMovingToClosed(false);
        }}
        onSave={handleSaveStore}
        isMovingToClosed={isMovingToClosed}
        currentUserId={currentUser?.id}
      />
    </>
  );
}

export default function LeadsPage() {
  return <LeadsPageContent />;
}
