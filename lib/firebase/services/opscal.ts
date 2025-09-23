import { collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore"
import { db } from "../config"
import type { Store, StoreOpsView } from "../types"
import { parseFirestoreDate } from "@/lib/date-validation"

// Helper function to remove undefined values
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) return obj.map(removeUndefined)
  if (typeof obj === "object") {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

const convertFirestoreToStore = (doc: any): StoreOpsView => {
  const data = doc.data()
  return {
    id: doc.id,
    storeId: data.storeId,
    name: data.name,
    tradingName: data.tradingName,
    address: data.address,
    suburb: data.suburb,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    contactPerson: data.contactPerson,
    contactNumber: data.contactNumber,
    email: data.email,
    status: data.status,
    isSetup: data.isSetup,
    setupConfirmed: data.setupConfirmed,
    trainingDate: parseFirestoreDate(data.trainingDate),
    launchDate: parseFirestoreDate(data.launchDate),
    hasErrors: data.hasErrors,
    errorDescription: data.errorDescription,
    errorSetAt: parseFirestoreDate(data.errorSetAt),
  }
}

export const storeService = {
  // Fetch all stores from opsCalendar collection
  async getAll(): Promise<Store[]> {
    try {
      const q = query(collection(db, "opsCalendar"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToStore)
    } catch (error) {
      console.error("Error getting opsCalendar stores:", error)
      return []
    }
  },

  // Fetch a single store by ID from opsCalendar
  async getById(id: string): Promise<StoreOpsView | null> {
    try {
      const docRef = doc(db, "opsCalendar", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return convertFirestoreToStore(docSnap)
      }
      return null
    } catch (error) {
      console.error("Error getting opsCalendar store:", error)
      return null
    }
  },
}
