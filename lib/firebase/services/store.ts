import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "../config"
import type { Store } from "../types"
import { safeDateToTimestamp } from "../../utils"
import { parseFirestoreDate } from "@/lib/date-validation"

// Helper function to remove undefined values but preserve false
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) return obj.map(removeUndefined)
  if (typeof obj === "object") {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Keep false values but remove undefined
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

// Convert Firestore data to Store object
const convertFirestoreToStore = (doc: any): Store => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    assignedOpsIds: data.assignedOpsIds || [], // Ensure assignedOpsIds is always an array
    createdAt: parseFirestoreDate(data.createdAt),
    updatedAt: parseFirestoreDate(data.updatedAt),
    setupConfirmedAt: parseFirestoreDate(data.setupConfirmedAt),
    pushedToRolloutAt: parseFirestoreDate(data.pushedToRolloutAt),
    errorSetAt: parseFirestoreDate(data.errorSetAt),
  }
}

// Convert Store object to Firestore data
const convertStoreToFirestore = (store: Partial<Store>): any => {
  const data = removeUndefined({
    ...store,
    assignedOpsIds: store.assignedOpsIds || [], // Ensure assignedOpsIds is always an array
    createdAt: safeDateToTimestamp(store.createdAt),
    updatedAt: safeDateToTimestamp(store.updatedAt),
    setupConfirmedAt: safeDateToTimestamp(store.setupConfirmedAt),
    pushedToRolloutAt: safeDateToTimestamp(store.pushedToRolloutAt),
    errorSetAt: safeDateToTimestamp(store.errorSetAt),
  })
  
  console.log("[convertStoreToFirestore] Final data to save:", data)
  return data
}

export const storeService = {
  async getAll(): Promise<Store[]> {
    try {
      const q = query(collection(db, "stores"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToStore)
    } catch (error) {
      console.error("Error getting stores:", error)
      return []
    }
  },

  async getBySalesperson(salespersonId: string): Promise<Store[]> {
    try {
      const q = query(
        collection(db, "stores"),
        where("salespersonId", "==", salespersonId),
        orderBy("createdAt", "desc"),
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToStore)
    } catch (error) {
      console.error("Error getting stores by salesperson:", error)
      return []
    }
  },

  async getByOpsUser(userId: string): Promise<Store[]> {
    try {
      const q = query(
        collection(db, "stores"),
        where("assignedOpsIds", "array-contains", userId),
        orderBy("createdAt", "desc"),
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToStore)
    } catch (error) {
      console.error("Error getting stores by operations user:", error)
      return []
    }
  },

  async getById(id: string): Promise<Store | null> {
    try {
      const docRef = doc(db, "stores", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return convertFirestoreToStore(docSnap)
      }
      return null
    } catch (error) {
      console.error("Error getting store:", error)
      return null
    }
  },

  async create(store: Omit<Store, "id">): Promise<string> {
    try {
      const storeData = {
        ...store,
        assignedOpsIds: store.assignedOpsIds || [], // Ensure assignedOpsIds is an array
        createdAt: store.createdAt || new Date(), // Preserve createdAt if provided, otherwise set to now
        updatedAt: new Date(),
      }
      const docRef = await addDoc(collection(db, "stores"), convertStoreToFirestore(storeData))
      return docRef.id
    } catch (error) {
      console.error("Error creating store:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Store>): Promise<void> {
    try {
      if (typeof id !== "string" || !id) {
        throw new Error(`Invalid store ID: ${id}`)
      }
      const docRef = doc(db, "stores", id)
      const updateData = {
        ...updates,
        assignedOpsIds: updates.assignedOpsIds || [], // Ensure assignedOpsIds is an array
        updatedAt: new Date(),
      }
      await updateDoc(docRef, convertStoreToFirestore(updateData))
    } catch (error) {
      console.error("Error updating store:", error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, "stores", id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting store:", error)
      throw error
    }
  },

  subscribeToAll(callback: (stores: Store[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, "stores"), orderBy("createdAt", "desc"))
      return onSnapshot(
        q,
        (querySnapshot) => {
          const stores = querySnapshot.docs.map(convertFirestoreToStore)
          console.log(`[storeService.subscribeToAll] Received ${stores.length} stores from Firestore`)
          if (stores.length > 0) {
            console.log(`[storeService.subscribeToAll] Sample stores:`, stores.slice(0, 3).map(s => ({
              id: s.id,
              tradingName: s.tradingName,
              status: s.status,
              salespersonId: s.salespersonId
            })))
          }
          callback(stores)
        },
        (error) => {
          console.error("[storeService.subscribeToAll] Error subscribing to stores:", error)
          callback([])
        },
      )
    } catch (error) {
      console.error("[storeService.subscribeToAll] Error setting up stores subscription:", error)
      return () => {}
    }
  },

  subscribeToBySalesperson(salespersonId: string, callback: (stores: Store[]) => void): Unsubscribe {
    try {
      const q = query(
        collection(db, "stores"),
        where("salespersonId", "==", salespersonId),
        orderBy("createdAt", "desc"),
      )
      return onSnapshot(
        q,
        (querySnapshot) => {
          const stores = querySnapshot.docs.map(convertFirestoreToStore)
          callback(stores)
        },
        (error) => {
          console.error("Error subscribing to salesperson stores:", error)
          callback([])
        },
      )
    } catch (error) {
      console.error("Error setting up salesperson stores subscription:", error)
      return () => {}
    }
  },

  subscribeToByOpsUser(userId: string, callback: (stores: Store[]) => void): Unsubscribe {
    try {
      const q = query(
        collection(db, "stores"),
        where("assignedOpsIds", "array-contains", userId),
        orderBy("createdAt", "desc"),
      )
      return onSnapshot(
        q,
        (querySnapshot) => {
          const stores = querySnapshot.docs.map(convertFirestoreToStore)
          callback(stores)
        },
        (error) => {
          console.error("Error subscribing to ops user stores:", error)
          callback([])
        },
      )
    } catch (error) {
      console.error("Error setting up ops user stores subscription:", error)
      return () => {}
    }
  },
}
