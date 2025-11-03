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
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { getStorage, ref, getDownloadURL, deleteObject } from "firebase/storage"
import { getAuth } from "firebase/auth"
import { db } from "../config"
import app from "@/lib/firebase/config"
import type { Document, Subcategory } from "../types"
import { uploadBytesResumable } from "firebase/storage"

const storage = getStorage(app)

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

// Convert Firestore data to Document object
const convertFirestoreToDocument = (doc: any): Document => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
  }
}

// Convert Document object to Firestore data
const convertDocumentToFirestore = (document: Partial<Document>) => {
  const data = { ...document }
  delete data.id
  if (data.uploadedAt instanceof Date && !isNaN(data.uploadedAt.getTime())) {
    // Only convert to Timestamp if uploading to Firestore
    ;(data as any).uploadedAt = Timestamp.fromDate(data.uploadedAt)
  } else {
    delete data.uploadedAt
  }
  return removeUndefined(data)
}

export const documentService = {
  subscribeToAll(callback: (documents: Document[]) => void): Unsubscribe {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        console.error("documentService - subscribeToAll: No authenticated user")
        return () => {}
      }
      const q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"))
      return onSnapshot(
        q,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map(convertFirestoreToDocument)
          callback(documents)
        },
        (error) => {
          console.error("documentService - subscribeToAll error:", error)
          callback([])
        },
      )
    } catch (error: any) {
      console.error("documentService - subscribeToAll setup error:", error)
      return () => {}
    }
  },

  async getAll(): Promise<Document[]> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        console.error("documentService - getAll: No authenticated user")
        return []
      }
      const q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"))
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(convertFirestoreToDocument)
      return documents
    } catch (error: any) {
      console.error("documentService - getAll error:", error)
      return []
    }
  },

  async getByType(type: Document["type"]): Promise<Document[]> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        console.error("documentService - getByType: No authenticated user")
        return []
      }
      const q = query(collection(db, "documents"), where("type", "==", type), orderBy("uploadedAt", "desc"))
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(convertFirestoreToDocument)
      console.log("documentService - Fetched documents by type:", type, documents.length)
      return documents
    } catch (error: any) {
      console.error("documentService - getByType error:", error)
      return []
    }
  },

  async getById(id: string): Promise<Document | null> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        console.error("documentService - getById: No authenticated user")
        return null
      }
      const docRef = doc(db, "documents", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return convertFirestoreToDocument(docSnap)
      }
      return null
    } catch (error: any) {
      console.error("documentService - getById error:", error)
      return null
    }
  },

  async create(document: Omit<Document, "id">): Promise<string> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error("documentService - create: No authenticated user")
      }
      const documentData = {
        ...document,
        uploadedAt: new Date(),
      }
      const docRef = await addDoc(collection(db, "documents"), convertDocumentToFirestore(documentData))
      console.log("documentService - Created document:", docRef.id)
      return docRef.id
    } catch (error: any) {
      console.error("documentService - create error:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error("documentService - update: No authenticated user")
      }
      const docRef = doc(db, "documents", id)
      await updateDoc(docRef, convertDocumentToFirestore(updates))
      console.log("documentService - Updated document:", id)
    } catch (error: any) {
      console.error("documentService - update error:", error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error("documentService - delete: No authenticated user")
      }
      const docRef = doc(db, "documents", id)
      await deleteDoc(docRef)
      console.log("documentService - Deleted document:", id)
    } catch (error: any) {
      console.error("documentService - delete error:", error)
      throw error
    }
  },

  async getSubcategories(packageType: Document["type"]): Promise<Subcategory[]> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        console.error("documentService - getSubcategories: No authenticated user")
        return []
      }
      const q = query(collection(db, "subcategories"), where("packageType", "==", packageType))
      const querySnapshot = await getDocs(q)
      const subcategories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      })) as Subcategory[]
      console.log("documentService - Fetched subcategories for", packageType, ":", subcategories.length)
      return subcategories
    } catch (error: any) {
      console.error("documentService - getSubcategories error:", error)
      return []
    }
  },

  async createSubcategory(subcategory: Omit<Subcategory, "id">): Promise<string> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error("documentService - createSubcategory: No authenticated user")
      }
      const subcategoryData = {
        ...subcategory,
        createdAt: new Date(),
      }
      const docRef = await addDoc(collection(db, "subcategories"), removeUndefined(subcategoryData))
      console.log("documentService - Created subcategory:", docRef.id)
      return docRef.id
    } catch (error: any) {
      console.error("documentService - createSubcategory error:", error)
      throw new Error(`Upload failed: ${error.message}`)
    }
  },

  async deleteSubcategory(id: string): Promise<void> {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error("documentService - deleteSubcategory: No authenticated user")
      }
      const docRef = doc(db, "subcategories", id)
      await deleteDoc(docRef)
      console.log("documentService - Deleted subcategory:", id)
    } catch (error: any) {
      console.error("documentService - deleteSubcategory error:", error)
      throw new Error(`Get URL failed: ${error.message}`)
    }
  },

  async uploadFile(file: File, path: string): Promise<string> {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      throw new Error("uploadFile - No authenticated user")
    }

    await user.getIdToken(true)

    const storageRef = ref(storage, path)
    try {
      const metadata = { contentType: file.type }
      await uploadBytesResumable(storageRef, file, metadata)

      const signedUrl = await getDownloadURL(storageRef)
      return signedUrl
    } catch (error: any) {
      console.error("uploadFile - Error:", error.code, error.message)
      throw new Error(`Upload failed: ${error.message}`)
    }
  },

  async getSignedUrl(path: string): Promise<string> {
    const auth = getAuth()
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true)
      console.log("getSignedUrl - Token refreshed for user:", auth.currentUser.email)
    } else {
      console.error("getSignedUrl - No authenticated user")
    }
    console.log("getSignedUrl - Path:", path)
    const storageRef = ref(storage, path)
    try {
      const signedUrl = await getDownloadURL(storageRef)
      console.log("getSignedUrl - Signed URL:", signedUrl)
      return signedUrl
    } catch (error: any) {
      console.error("getSignedUrl - Error:", error.code, error.message)
      throw new Error(`Get URL failed: ${error.message}`)
    }
  },

  async deleteFile(path: string): Promise<void> {
    const auth = getAuth()
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true)
      console.log("deleteFile - Token refreshed for user:", auth.currentUser.email)
    } else {
      console.error("deleteFile - No authenticated user")
    }
    console.log("deleteFile - Path:", path)
    const storageRef = ref(storage, path)
    try {
      await deleteObject(storageRef)
      console.log("deleteFile - Deleted:", path)
    } catch (error: any) {
      console.error("deleteFile - Error:", error.code, error.message)
      throw new Error(`Delete failed: ${error.message}`)
    }
  },
}

export type { Document, Subcategory }
