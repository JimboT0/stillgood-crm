import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { BagInventory, BagLog, Province } from "@/lib/firebase/types";

const INVENTORY_COLLECTION = "bagInventory";
const LOGS_COLLECTION = "bagLogs";

const convertTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) {
    console.warn("Timestamp is null or undefined, returning current date");
    return new Date();
  }
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  if (typeof timestamp === "object" && "seconds" in timestamp && "nanoseconds" in timestamp) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  console.warn("Invalid timestamp format:", timestamp);
  return new Date();
};

const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter((item) => item !== undefined);
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
};

export const bagService = {
  async getAllInventory(): Promise<BagInventory[]> {
    try {
      const q = query(collection(db, INVENTORY_COLLECTION), orderBy("province"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          province: data.province,
          totalBags: data.totalBags || 0,
          lastUpdated: convertTimestampToDate(data.lastUpdated),
          updatedBy: data.updatedBy || "",
          updatedByName: data.updatedByName || "",
        } as BagInventory;
      });
    } catch (error) {
      console.error("Error getting inventory:", error);
      throw error;
    }
  },

  async getInventoryByProvince(province: Province): Promise<BagInventory | null> {
    try {
      const q = query(collection(db, INVENTORY_COLLECTION), where("province", "==", province));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        province: data.province,
        totalBags: data.totalBags || 0,
        lastUpdated: convertTimestampToDate(data.lastUpdated),
        updatedBy: data.updatedBy || "",
        updatedByName: data.updatedByName || "",
      } as BagInventory;
    } catch (error) {
      console.error("Error getting inventory by province:", error);
      throw error;
    }
  },

  async initializeInventory(province: Province, totalBags: number, userId: string, userName: string): Promise<void> {
    try {
      await addDoc(
        collection(db, INVENTORY_COLLECTION),
        cleanForFirestore({
          province,
          totalBags,
          lastUpdated: serverTimestamp(),
          updatedBy: userId,
          updatedByName: userName,
        }),
      );

      await addDoc(
        collection(db, LOGS_COLLECTION),
        cleanForFirestore({
          province,
          changeType: "addition",
          bagsChanged: totalBags,
          source: "Initial Inventory",
          notes: `Initial inventory setup for ${province}`,
          createdAt: serverTimestamp(),
          removedBy: userId,
          removedByName: userName,
        }),
      );
    } catch (error) {
      console.error("Error initializing inventory:", error);
      throw error;
    }
  },

  async updateInventory(province: Province, totalBags: number, userId: string, userName: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const inventoryQuery = query(collection(db, INVENTORY_COLLECTION), where("province", "==", province));
        const inventorySnapshot = await getDocs(inventoryQuery);

        let inventoryRef;
        let currentBags = 0;

        if (inventorySnapshot.empty) {
          inventoryRef = doc(collection(db, INVENTORY_COLLECTION));
        } else {
          const inventoryDoc = inventorySnapshot.docs[0];
          inventoryRef = inventoryDoc.ref;
          currentBags = inventoryDoc.data().totalBags || 0;
        }

        const difference = totalBags - currentBags;

        transaction.set(
          inventoryRef,
          cleanForFirestore({
            province,
            totalBags,
            lastUpdated: serverTimestamp(),
            updatedBy: userId,
            updatedByName: userName,
          }),
        );

        if (difference !== 0) {
          const logRef = doc(collection(db, LOGS_COLLECTION));
          const logData: any = {
            province,
            changeType: difference > 0 ? "addition" : "removal",
            bagsChanged: difference,
            notes: `Inventory corrected from ${currentBags} to ${totalBags}`,
            createdAt: serverTimestamp(),
            removedBy: userId,
            removedByName: userName,
          };

          if (difference > 0) {
            logData.source = "Inventory Correction";
          } else {
            logData.destination = "Inventory Correction";
          }

          transaction.set(logRef, cleanForFirestore(logData));
        }
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
      throw error;
    }
  },

  async addBags(
    province: Province,
    bagsToAdd: number,
    source: string,
    notes = "",
    userId: string,
    userName: string,
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const inventoryQuery = query(collection(db, INVENTORY_COLLECTION), where("province", "==", province));
        const inventorySnapshot = await getDocs(inventoryQuery);

        let inventoryRef;
        let currentBags = 0;

        if (inventorySnapshot.empty) {
          inventoryRef = doc(collection(db, INVENTORY_COLLECTION));
        } else {
          const inventoryDoc = inventorySnapshot.docs[0];
          inventoryRef = inventoryDoc.ref;
          currentBags = inventoryDoc.data().totalBags || 0;
        }

        const newTotal = currentBags + bagsToAdd;

        transaction.set(
          inventoryRef,
          cleanForFirestore({
            province,
            totalBags: newTotal,
            lastUpdated: serverTimestamp(),
            updatedBy: userId,
            updatedByName: userName,
          }),
        );

        const logRef = doc(collection(db, LOGS_COLLECTION));
        transaction.set(
          logRef,
          cleanForFirestore({
            province,
            changeType: "addition",
            bagsChanged: bagsToAdd,
            source,
            notes,
            createdAt: serverTimestamp(),
            removedBy: userId,
            removedByName: userName,
          }),
        );
      });
    } catch (error) {
      console.error("Error adding bags:", error);
      throw error;
    }
  },

  async removeBags(
    province: Province,
    bagsToRemove: number,
    destination: string,
    notes = "",
    userId: string,
    userName: string,
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const inventoryQuery = query(collection(db, INVENTORY_COLLECTION), where("province", "==", province));
        const inventorySnapshot = await getDocs(inventoryQuery);

        if (inventorySnapshot.empty) {
          throw new Error(`No inventory found for ${province}`);
        }

        const inventoryDoc = inventorySnapshot.docs[0];
        const currentBags = inventoryDoc.data().totalBags || 0;

        if (currentBags < bagsToRemove) {
          throw new Error(`Insufficient inventory. Only ${currentBags} bags available in ${province}`);
        }

        const newTotal = currentBags - bagsToRemove;

        transaction.update(
          inventoryDoc.ref,
          cleanForFirestore({
            totalBags: newTotal,
            lastUpdated: serverTimestamp(),
            updatedBy: userId,
            updatedByName: userName,
          }),
        );

        const logRef = doc(collection(db, LOGS_COLLECTION));
        const logData = cleanForFirestore({
          province,
          changeType: "removal",
          bagsChanged: -bagsToRemove,
          destination,
          notes,
          createdAt: serverTimestamp(),
          removedBy: userId,
          removedByName: userName,
        });
        console.log("Writing removal log:", logData); // Debug
        transaction.set(logRef, logData);
      });
    } catch (error) {
      console.error("Error removing bags:", error);
      throw error;
    }
  },

  async getAllLogs(): Promise<BagLog[]> {
    try {
      const q = query(collection(db, LOGS_COLLECTION), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Raw log data:", { id: doc.id, createdAt: data.createdAt }); // Debug
        return {
          id: doc.id,
          province: data.province,
          changeType: data.changeType,
          bagsChanged: data.bagsChanged || 0,
          source: data.source,
          destination: data.destination,
          notes: data.notes,
          createdAt: convertTimestampToDate(data.createdAt),
          removedBy: data.removedBy || "",
          removedByName: data.removedByName || "",
        } as BagLog;
      });
      return logs;
    } catch (error) {
      console.error("Error getting logs:", error);
      throw error;
    }
  },

  async getLogsByProvince(province: Province): Promise<BagLog[]> {
    try {
      const q = query(collection(db, LOGS_COLLECTION), where("province", "==", province), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          province: data.province,
          changeType: data.changeType,
          bagsChanged: data.bagsChanged || 0,
          source: data.source,
          destination: data.destination,
          notes: data.notes,
          createdAt: convertTimestampToDate(data.createdAt),
          removedBy: data.removedBy || "",
          removedByName: data.removedByName || "",
        } as BagLog;
      });
    } catch (error) {
      console.error("Error getting logs by province:", error);
      throw error;
    }
  },

  async getRecentLogs(): Promise<BagLog[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const q = query(
        collection(db, LOGS_COLLECTION),
        where("createdAt", ">=", yesterday),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          province: data.province,
          changeType: data.changeType,
          bagsChanged: data.bagsChanged || 0,
          source: data.source,
          destination: data.destination,
          notes: data.notes,
          createdAt: convertTimestampToDate(data.createdAt),
          removedBy: data.removedBy || "",
          removedByName: data.removedByName || "",
        } as BagLog;
      });
    } catch (error) {
      console.error("Error getting recent logs:", error);
      throw error;
    }
  },
};
