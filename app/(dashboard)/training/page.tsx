"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { storeService } from "@/lib/firebase/services/store";
import type { User, StoreOpsView } from "@/lib/firebase/types";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import VideoMessagesPage from "@/components/trainingmessages";

export default function TrainingPage() {
  const { currentUser } = useDashboardData();
  const [stores, setStores] = useState<StoreOpsView[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOpsView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("=== TrainingPage Initial State ===");
    console.log("Current User:", currentUser ? { id: currentUser.id, email: currentUser.email, role: currentUser.role, assignedStores: currentUser.assignedStores } : null);

    async function fetchStores() {
      setLoading(true);
      console.log("Fetching stores using storeService.getAll()...");
      try {
        const storesData = await storeService.getAll();
        console.log(
          "[TrainingPage] Loaded stores:",
          storesData.map((s) => ({
            id: s.id,
            tradingName: s.tradingName,
            products: s.products,
            collectionTimes: s.collectionTimes,
            credentials: s.credentials,
          }))
        );
        setStores(storesData);

        if (storesData.length === 0) {
          console.warn("No stores returned from storeService.getAll().");
          toast.error("No stores found in Firestore. Please ensure the StoreOpsView collection is populated.", {
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #f97316",
            },
          });
        }
      } catch (err: any) {
        console.error("[TrainingPage] Error fetching stores:", err, { code: err.code, message: err.message });
        toast.error(`Failed to load store data: ${err.message}`, {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      console.log("User authenticated. Fetching stores...");
      fetchStores();
    } else {
      console.error("No authenticated user. Skipping store fetch.");
      toast.error("Please log in to view store data.", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <p className="text-gray-600">Please log in to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <p className="text-gray-600">Loading stores...</p>
      </div>
    );
  }

  return (
    <VideoMessagesPage
      stores={stores}
      currentUser={currentUser}
      selectedStore={selectedStore}
      setSelectedStore={setSelectedStore}
    />
  );
}
