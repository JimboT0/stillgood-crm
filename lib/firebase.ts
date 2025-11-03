// @/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Firebase configuration with proper client-side environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase configuration is incomplete. Please check environment variables (NEXT_PUBLIC_FIREBASE_*)."
  )
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db, storage }

// Types
export interface ContactPerson {
  name: string
  phone: string
  email: string
  designation: string
  isPrimary?: boolean
}

export interface CollectionTimeSlot {
  from: string
  to: string
}

export interface CollectionTimes {
  mondayFriday: CollectionTimeSlot
  saturday: CollectionTimeSlot
  sunday: CollectionTimeSlot
  publicHoliday: CollectionTimeSlot
}

interface Product {
  name: string
  description: string
  retailPrice: number
  estimatedValue: number
}

export interface CommissionTerms {
  months: number
  notes: string
}

export interface ContractTerms {
  months: number
  notes: string
}

export interface DocumentInfo {
  name: string
  url: string
  uploadedAt: Date
  uploadedBy: string
  popEmail?: string
}

export interface Store {
  id: string
  tradingName: string
  streetAddress: string
  province: string
  status: "cold" | "warm" | "closed"
  salespersonId: string
  contactPersons?: ContactPerson[]
  contractTerms?: ContractTerms
  notes?: string
  signedSla?: boolean
  bankConfirmation?: boolean
  slaDocument?: DocumentInfo
  bankDocument?: DocumentInfo
  collectionTimes?: CollectionTimes
  products?: Product[]
  commissionTerms?: CommissionTerms
  trainingDate?: string
  launchDate?: string
  isSetup?: boolean
  setupConfirmed?: boolean
  setupConfirmedBy?: string
  setupConfirmedAt?: Date
  assignedUsers?: string[]
  hasErrors?: boolean
  errorDescription?: string
  errorSetBy?: string
  errorSetAt?: Date
  pushedToRollout?: boolean
  pushedToRolloutAt?: Date
  pushedToRolloutBy?: string
  whatsappGroupLink?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  name: string
  email: string
  role: "salesperson" | "superadmin" | "mediateam"
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  name: string
  type: "sla" | "sop" | "training"
  url: string
  isVideo?: boolean
  uploadedBy: string
  createdAt: Date
}

// Helper function to clean data before saving
const cleanStoreData = (store: Partial<Store>): Partial<Store> => {
  const cleaned: Partial<Store> = {}

  Object.entries(store).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        // Clean nested objects
        const cleanedNested = Object.fromEntries(
          Object.entries(value).filter(([_, v]) => v !== undefined && v !== null && v !== "")
        )
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key as keyof Store] = cleanedNested
        }
      } else if (Array.isArray(value)) {
        // Clean arrays
        const cleanedArray = value.filter((item) => item !== undefined && item !== null)
        if (cleanedArray.length > 0) {
          cleaned[key as keyof Store] = cleanedArray
        }
      } else if (value !== "") {
        cleaned[key as keyof Store] = value
      }
    }
  })

  return cleaned
}

// Services
export const storeService = {
  async create(store: Omit<Store, "id">): Promise<string> {
    const cleanedStore = cleanStoreData({
      ...store,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const docRef = await addDoc(collection(db, "stores"), cleanedStore)
    return docRef.id
  },

  async update(id: string, updates: Partial<Store>): Promise<void> {
    const docRef = doc(db, "stores", id)
    const cleanedUpdates = cleanStoreData({
      ...updates,
      updatedAt: new Date(),
    })

    await updateDoc(docRef, cleanedUpdates)
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, "stores", id)
    await deleteDoc(docRef)
  },

  async getById(id: string): Promise<Store | null> {
    const docRef = doc(db, "stores", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Store
    }
    return null
  },

async getAll(): Promise<Store[]> {
  const q = query(collection(db, "stores"), orderBy("createdAt", "desc"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Store)
},

//   async getAll(): Promise<User[]> {
//   const querySnapshot = await getDocs(collection(db, "users"))
//   const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
//   console.log("Raw users data:", users)
//   return users
// },

  async getBySalesperson(salespersonId: string): Promise<Store[]> {
    const q = query(
      collection(db, "stores"),
      where("salespersonId", "==", salespersonId),
      orderBy("createdAt", "desc")
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Store)
  },

  async assignUsers(storeId: string, userIds: string[], assignedBy: string, message: string): Promise<void> {
    const docRef = doc(db, "stores", storeId)
    await updateDoc(docRef, {
      assignedUsers: userIds,
      assignedBy,
      assignedAt: new Date(),
      assignmentMessage: message,
      updatedAt: new Date(),
    })
  },
}

export const userService = {
  async create(userId: string, user: Omit<User, "id">): Promise<string> {
    const docRef = doc(db, "users", userId)
    await setDoc(docRef, {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return userId
  },


  async update(id: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, "users", id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    })
  },

  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, "users"))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, "users", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User
    }
    return null
  },
}

export const documentService = {
  async create(document: Omit<Document, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "documents"), {
      ...document,
      createdAt: new Date(),
    })
    return docRef.id
  },

  async getAll(): Promise<Document[]> {
    const querySnapshot = await getDocs(collection(db, "documents"))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Document)
  },
}

export const fileService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  },
}
