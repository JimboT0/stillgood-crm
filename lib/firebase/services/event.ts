import { auth, db } from "@/lib/firebase/config"
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
  Timestamp,
  DocumentSnapshot, } from "firebase/firestore"
import type { Event, province } from "@/lib/firebase/types"
import { safeDateToTimestamp } from "@/lib/utils"
import { convertTimestampToDate } from "@/lib/utils/date-utils"


// Fetch all events
export async function getEvents(): Promise<Event[]> {
  try {
    const snapshot = await getDocs(collection(db, "events"))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event))
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

const convertEventToFirestore = (event: Partial<Event>): any => {
  return removeUndefined({
    ...event,
    createdAt: safeDateToTimestamp(event.createdAt),
    updatedAt: safeDateToTimestamp(event.updatedAt),
  })
}

const convertFirestoreToEvent = (doc: DocumentSnapshot): Event => {
  const data = doc.data()
  if (!data) {
    throw new Error("Document data is undefined")
  }
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    date: data.date,
    province: data.province,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Event
}


export const eventService = {
  async getAll(): Promise<Event[]> {
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToEvent)
    } catch (error) {
      console.error("Error getting events:", error)
      return []
    }
  },

  async create(event: Omit<Event, "id">): Promise<string> {
    try {
      const eventData = {
        ...event,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const docRef = await addDoc(collection(db, "events"), convertEventToFirestore(eventData))
      return docRef.id
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Event>): Promise<void> {
    try {
      if (typeof id !== "string" || !id) {
        throw new Error(`Invalid event ID: ${id}`)
      }
      const docRef = doc(db, "events", id)
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      }
      await updateDoc(docRef, convertEventToFirestore(updateData))
    } catch (error) {
      console.error("Error updating event:", error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, "events", id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting event:", error)
      throw error
    }
  },
}

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
