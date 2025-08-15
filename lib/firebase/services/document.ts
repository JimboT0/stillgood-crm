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
  Timestamp 
} from "firebase/firestore";
import { db } from "../config";
import type { Document } from "../types";

// Helper function to remove undefined values
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

// Convert Firestore data to Document object
const convertFirestoreToDocument = (doc: any): Document => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),

  };
};

// Convert Document object to Firestore data
// const convertDocumentToFirestore = (document: Partial<Document>) => {
//   const data = { ...document };
//   delete data.id;
  
//   // Convert dates to Firestore timestamps
//   if (data.createdAt) data.createdAt = Timestamp.fromDate(data.createdAt);
  
//   return removeUndefined(data);
// };
const convertDocumentToFirestore = (document: Partial<Document>) => {
  const data = { ...document };
  delete data.id;

  // ✅ Validate createdAt safely
  if (
    data.createdAt instanceof Date &&
    !isNaN(data.createdAt.getTime())
  ) {
    data.createdAt = Timestamp.fromDate(data.createdAt);
  } else {
    delete data.createdAt; // 💥 This prevents undefined from reaching Firestore
  }

  return removeUndefined(data);
};



export const documentService = {
  async getAll(): Promise<Document[]> {
    try {
      const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreToDocument);
    } catch (error) {
      console.error("Error getting documents:", error);
      return [];
    }
  },

  async getByType(type: Document["type"]): Promise<Document[]> {
    try {
      const q = query(
        collection(db, "documents"),
        where("type", "==", type),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreToDocument);
    } catch (error) {
      console.error("Error getting documents by type:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Document | null> {
    try {
      const docRef = doc(db, "documents", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return convertFirestoreToDocument(docSnap);
      }
      return null;
    } catch (error) {
      console.error("Error getting document:", error);
      return null;
    }
  },

  async create(document: Omit<Document, "id">): Promise<string> {
    try {
      const documentData = {
        ...document,
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "documents"), convertDocumentToFirestore(documentData));
      return docRef.id;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    try {
      const docRef = doc(db, "documents", id);
      await updateDoc(docRef, convertDocumentToFirestore(updates));
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, "documents", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },
};

export type { Document };
