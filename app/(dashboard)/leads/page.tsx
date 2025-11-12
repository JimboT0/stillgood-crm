"use client";

import { useState, useMemo } from "react";
import { LeadsTab } from "@/components/leads-tab";
import { StoreEditModal } from "@/components/modals/store-edit-modal";
import { DocumentViewerModal } from "@/components/modals/document-viewer-modal";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  // Filter stores for "My Leads" tab
  const myLeads = useMemo(() => {
    if (!currentUser?.id) return [];
    return stores.filter((store) => store.salespersonId === currentUser.id);
  }, [stores, currentUser?.id]);

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
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="my">My Leads</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
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
        </TabsContent>
        <TabsContent value="my">
          <LeadsTab
            stores={myLeads}
            users={users}
            currentUser={currentUser}
            onAddStore={handleAddStore}
            onEditStore={handleEditStore}
            onDeleteStore={handleDeleteStore}
            onStatusChange={handleStatusChange}
            onViewDocument={handleViewDocument}
          />
        </TabsContent>
      </Tabs>

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
