"use client";

import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import DocumentsList from "@/components/documents-list";
import { useEffect } from "react";

export default function DocumentsPage() {
  const { documents, stores, currentUser, loading, refreshData } = useDashboardData();

  useEffect(() => {
    console.log("DocumentsPage - Documents:", documents);
    console.log("DocumentsPage - Stores:", stores);
    console.log("DocumentsPage - CurrentUser:", currentUser);
    console.log("DocumentsPage - Loading:", loading);
  }, [documents, stores, currentUser, loading]);

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  // if (!documents || documents.length === 0) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       No documents found. {currentUser?.role === "superadmin" ? "Try uploading one." : "Contact an admin to upload documents."}
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 w-full">
      <DocumentsList
        documents={documents}
        stores={stores}
        currentUser={currentUser}
        refreshData={refreshData}
      />
    </div>
  );
}
