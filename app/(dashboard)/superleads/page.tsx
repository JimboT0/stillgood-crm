"use client";

import { useState } from "react";
import { SuperLeadsTab } from "@/components/super-leads-tab";
import { DocumentViewerModal } from "@/components/modals/document-viewer-modal";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import type { Store } from "@/lib/firebase/types";
import { SuperStoreEditModal } from "@/components/modals/super-store-edit-modal";
import { StoreEditModal } from "@/components/modals/store-edit-modal";

function SuperLeadsPageContent() {
  const { currentUser, stores, users, handleSaveStore, handleDeleteStore, handleStatusChange, handleToggleSetup, handleSetupConfirmation, handleUpdateCredentials } = useDashboardData();

  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isMovingToClosed, setIsMovingToClosed] = useState(false);
  const [documentViewModal, setDocumentViewModal] = useState<{
    isOpen: boolean;
    store: Store | null;
    documentType: "sla" | "bank" | null;
  }>({ isOpen: false, store: null, documentType: null });

  // Only allow access if currentUser is superadmin
  if (!currentUser || currentUser.role !== "superadmin") {
    return (
      <div className="p-8 text-center text-lg text-gray-500">
        Access denied. Superadmin only.
      </div>
    );
  }

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
      <SuperLeadsTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onAddStore={handleAddStore}
        onEditStore={handleEditStore}
        onDeleteStore={handleDeleteStore}
        onStatusChange={handleStatusChange}
        onViewDocument={handleViewDocument}
        onToggleSetup={handleToggleSetup}
        onSetupConfirmation={handleSetupConfirmation}
        updateCredentials={handleUpdateCredentials}
      />

      <DocumentViewerModal
        isOpen={documentViewModal.isOpen}
        onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
        store={documentViewModal.store}
        documentType={documentViewModal.documentType}
        currentUser={currentUser}
      />

      <SuperStoreEditModal
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

export default function SuperLeadsPage() {
  return <SuperLeadsPageContent />;
}
