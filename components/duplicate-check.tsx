import { useState } from "react";
import * as fuzzball from "fuzzball";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Store } from "@/lib/firebase/types";

interface DuplicateCheckProps {
  tradingName: string;
  province: string;
  currentStoreId?: string;
  onDuplicatesFound: (duplicates: Store[]) => void;
}

export function DuplicateCheck({
  tradingName,
  province,
  currentStoreId,
  onDuplicatesFound,
}: DuplicateCheckProps) {
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = async () => {
    if (!tradingName || !province) {
      onDuplicatesFound([]);
      return false;
    }
    setIsChecking(true);
    try {
      const q = query(collection(db, "storeopsview"), where("province", "==", province));
      const snapshot = await getDocs(q);
      const stores = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Store));
      const similarStores = stores.filter((store) => {
        if (store.id === currentStoreId) return false;
        const similarity = fuzzball.ratio(tradingName.toLowerCase(), store.tradingName.toLowerCase());
        return similarity > 80;
      });
      onDuplicatesFound(similarStores);
      return similarStores.length > 0;
    } catch (error) {
      console.error("[DuplicateCheck] Error fetching stores:", error);
      onDuplicatesFound([]);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return { checkDuplicates, isChecking };
}
