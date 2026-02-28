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

export interface StoreChangeMetric {
  storeId: string
  storeName: string
  salespersonId: string
  salespersonName: string
  province: string
  changeType: "status" | "setup" | "contract" | "training" | "launch" | "error" | "assignment"
  previousValue?: any
  newValue?: any
  changeDate: Date
  changeDescription: string
  successRate?: number
  impact?: "positive" | "negative" | "neutral"
}

export interface ReportMetrics {
  id: string
  period: "daily" | "weekly" | "monthly" | "quarterly"
  startDate: Date
  endDate: Date
  totalStores: number
  newStores: number
  closedStores: number
  storesByProvince: Record<string, number>
  storesByStatus: Record<string, number>
  salesperformance: Array<{
    salespersonId: string
    salespersonName: string
    totalStores: number
    newStores: number
    conversionRate: number
  }>
  averageSetupTime: number
  successfulLaunches: number
  errorRate: number
  topIssues: Array<{
    issue: string
    count: number
    impact: string
  }>
  revenueImpact: {
    total: number
    byProvince: Record<string, number>
    bySalesperson: Record<string, number>
  }
  createdAt: Date
  updatedAt: Date
}

export interface ActivityLog {
  id: string
  storeId: string
  storeName: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: Date
  category: "store_management" | "user_action" | "system_event" | "error"
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

export const reportsService = {
  // Store change metrics
  async logStoreChange(metric: Omit<StoreChangeMetric, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "storeChanges"), {
      ...metric,
      changeDate: new Date(),
    })
    return docRef.id
  },

  async getStoreChanges(
    startDate?: Date,
    endDate?: Date,
    storeId?: string,
    salespersonId?: string
  ): Promise<StoreChangeMetric[]> {
    let q = query(
      collection(db, "storeChanges"),
      orderBy("changeDate", "desc")
    )

    if (startDate && endDate) {
      q = query(q, where("changeDate", ">=", startDate), where("changeDate", "<=", endDate))
    }
    if (storeId) {
      q = query(q, where("storeId", "==", storeId))
    }
    if (salespersonId) {
      q = query(q, where("salespersonId", "==", salespersonId))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StoreChangeMetric)
  },

  // Aggregated metrics
  async saveReportMetrics(metrics: Omit<ReportMetrics, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "reportMetrics"), {
      ...metrics,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  },

  async getReportMetrics(period: "daily" | "weekly" | "monthly" | "quarterly"): Promise<ReportMetrics[]> {
    const q = query(
      collection(db, "reportMetrics"),
      where("period", "==", period),
      orderBy("startDate", "desc")
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ReportMetrics)
  },

  async getLatestMetrics(): Promise<ReportMetrics | null> {
    const q = query(
      collection(db, "reportMetrics"),
      orderBy("createdAt", "desc")
    )

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as ReportMetrics
    }
    return null
  },

  // Activity logs
  async logActivity(activity: Omit<ActivityLog, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "activityLogs"), {
      ...activity,
      timestamp: new Date(),
    })
    return docRef.id
  },

  async getActivityLogs(
    startDate?: Date,
    endDate?: Date,
    category?: string,
    limit: number = 100
  ): Promise<ActivityLog[]> {
    let q = query(
      collection(db, "activityLogs"),
      orderBy("timestamp", "desc")
    )

    if (startDate && endDate) {
      q = query(q, where("timestamp", ">=", startDate), where("timestamp", "<=", endDate))
    }
    if (category) {
      q = query(q, where("category", "==", category))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .slice(0, limit)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ActivityLog)
  },

  // Generate comprehensive report data
  async generateComprehensiveReport(startDate: Date, endDate: Date): Promise<{
    summary: any,
    storeChanges: StoreChangeMetric[],
    activities: ActivityLog[],
    trends: any
  }> {
    const [storeChanges, activities, allStores, allUsers] = await Promise.all([
      this.getStoreChanges(startDate, endDate),
      this.getActivityLogs(startDate, endDate),
      storeService.getAll(),
      userService.getAll()
    ])

    // Calculate summary metrics
    const summary = {
      totalChanges: storeChanges.length,
      uniqueStoresAffected: new Set(storeChanges.map(c => c.storeId)).size,
      totalStores: allStores.length,
      newStores: allStores.filter(s => s.createdAt >= startDate && s.createdAt <= endDate).length,
      closedStores: allStores.filter(s => s.status === 'closed').length,
      averageChangesPerStore: storeChanges.length / Math.max(1, new Set(storeChanges.map(c => c.storeId)).size),
      changesByType: storeChanges.reduce((acc, change) => {
        acc[change.changeType] = (acc[change.changeType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      storesByProvince: allStores.reduce((acc, store) => {
        acc[store.province] = (acc[store.province] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      salesperformance: allUsers
        .filter(u => u.role === 'salesperson')
        .map(user => {
          const userStores = allStores.filter(s => s.salespersonId === user.id)
          const userChanges = storeChanges.filter(c => c.salespersonId === user.id)
          return {
            salespersonId: user.id,
            salespersonName: user.name,
            totalStores: userStores.length,
            newStores: userStores.filter(s => s.createdAt >= startDate && s.createdAt <= endDate).length,
            totalChanges: userChanges.length,
            conversionRate: userStores.length > 0 ? (userStores.filter(s => s.status !== 'cold').length / userStores.length) * 100 : 0
          }
        })
    }

    // Calculate trends
    const trends = {
      dailyChanges: storeChanges.reduce((acc, change) => {
        const date = change.changeDate.toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      topIssues: storeChanges
        .filter(c => c.changeType === 'error')
        .reduce((acc, change) => {
          const issue = change.changeDescription
          acc[issue] = (acc[issue] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    }

    return { summary, storeChanges, activities, trends }
  }
}
