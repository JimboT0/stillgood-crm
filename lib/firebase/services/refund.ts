import { db } from "@/lib/firebase/config"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy } from "firebase/firestore"
import type { Refunds } from "@/lib/firebase/types"

const requestsCollection = collection(db, "refunds")

export async function addRequest(requestData: Omit<Refunds, "id" | "submittedAt" | "status">): Promise<string> {
  try {
    const docRef = await addDoc(requestsCollection, {
      ...requestData,
      submittedAt: new Date(),
      status: "pending",
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding request:", error)
    throw new Error("Failed to submit request")
  }
}

export async function getAllRequests(): Promise<Refunds[]> {
  try {
    const q = query(requestsCollection, orderBy("submittedAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt.toDate(),
    })) as Refunds[]
  } catch (error) {
    console.error("Error fetching all requests:", error)
    throw new Error("Failed to fetch requests")
  }
}

export async function getUserRequests(userId: string): Promise<Refunds[]> {
  try {
    const q = query(requestsCollection, where("userId", "==", userId))
    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt.toDate(),
    })) as Refunds[]

    return requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  } catch (error) {
    console.error("Error fetching user requests:", error)
    throw new Error("Failed to fetch user requests")
  }
}

export async function updateRequestStatus(id: string, status: Refunds["status"]): Promise<void> {
  try {
    const requestRef = doc(db, "refunds", id)
    await updateDoc(requestRef, {
      status,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating request status:", error)
    throw new Error("Failed to update request status")
  }
}

export async function uploadInvoiceAsBase64(file: File, userId: string): Promise<string> {
  try {
    console.log("[v0] Starting base64 upload - userId:", userId)
    console.log("[v0] File details:", { name: file.name, size: file.size, type: file.type })

    // Validate file size (5MB limit for base64 to avoid Firestore document size limits)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit for base64 storage")
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only PDF, JPG, and PNG files are allowed")
    }

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

    console.log("[v0] File converted to base64 successfully")

    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`

    // Create file metadata with user organization
    const fileData = {
      fileName: file.name,
      originalFileName: file.name,
      storedFileName: fileName,
      fileType: file.type,
      fileSize: file.size,
      base64Data,
      uploadedBy: userId,
      uploadedAt: new Date(),
      path: `invoices/${userId}/${fileName}`, // Add path field to track organization
    }

    const userFilesCollection = collection(db, "invoiceFiles", userId, "files")
    const fileRef = await addDoc(userFilesCollection, fileData)
    console.log("[v0] File stored in user-specific collection:", `invoiceFiles/${userId}/files/${fileRef.id}`)

    // Return the document ID with user path
    return `firestore:${userId}/${fileRef.id}`
  } catch (error) {
    console.error("[v0] Base64 upload error:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getInvoiceFile(fileId: string): Promise<{
  fileName: string
  fileType: string
  base64Data: string
} | null> {
  try {
    if (!fileId.startsWith("firestore:")) {
      return null
    }

    const filePath = fileId.replace("firestore:", "")
    const [userId, docId] = filePath.split("/")

    if (!userId || !docId) {
      console.error("[v0] Invalid file path format:", filePath)
      return null
    }

    const fileDocRef = doc(db, "invoiceFiles", userId, "files", docId)
    const fileDoc = await getDocs(
      query(collection(db, "invoiceFiles", userId, "files"), where("__name__", "==", docId)),
    )

    if (fileDoc.empty) {
      console.log("[v0] File not found in user collection:", `invoiceFiles/${userId}/files/${docId}`)
      return null
    }

    const fileData = fileDoc.docs[0].data()
    console.log("[v0] Retrieved file from user collection:", fileData.originalFileName)

    return {
      fileName: fileData.originalFileName || fileData.fileName,
      fileType: fileData.fileType,
      base64Data: fileData.base64Data,
    }
  } catch (error) {
    console.error("[v0] Error retrieving file:", error)
    return null
  }
}

export async function uploadInvoiceToStorage(file: File, userId: string): Promise<string> {
  return uploadInvoiceAsBase64(file, userId)
}

export async function getRequestsByStatus(status: Refunds["status"]): Promise<Refunds[]> {
  try {
    const q = query(requestsCollection, where("status", "==", status))
    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt.toDate(),
    })) as Refunds[]

    return requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  } catch (error) {
    console.error("Error fetching requests by status:", error)
    throw new Error("Failed to fetch requests by status")
  }
}

export async function getRequestsByUrgency(urgency: "low" | "medium" | "high"): Promise<Refunds[]> {
  try {
    const q = query(requestsCollection, where("urgency", "==", urgency))
    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt.toDate(),
    })) as Refunds[]

    return requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  } catch (error) {
    console.error("Error fetching requests by urgency:", error)
    throw new Error("Failed to fetch requests by urgency")
  }
}
