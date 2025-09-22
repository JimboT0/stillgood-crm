import { auth, db } from "@/lib/firebase/config"
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import type { Event } from "@/lib/firebase/types"

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

// Create a new event
export async function createEvent(eventData: {
  title: string
  description?: string
  date: string
  type: "training" | "launch" | "other"
  province?: string
}): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    // Fetch user role (client-side check)
    const userDoc = await getDocs(
      query(collection(db, "users"), where("uid", "==", user.uid))
    )
    if (userDoc.empty || userDoc.docs[0].data().role !== "superadmin") {
      throw new Error("Only superadmins can create events")
    }

    await addDoc(collection(db, "events"), {
      ...eventData,
      date: Timestamp.fromDate(new Date(eventData.date)),
      createdAt: Timestamp.now(),
      createdBy: user.uid,
    })
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}