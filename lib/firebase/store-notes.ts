import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from "firebase/firestore";
import { db } from "./config";

// Interfaces
export interface StoreFeedback {
  id: string;
  author: string;
  role?: string;
  email?: string;
  message: string;
  timestamp: string;
}

export interface StoreNote {
  id?: string;
  storeId: string;
  storeName: string;
  province: string;
  message: string;
  rating: number; // 1-5 stars
  author: string;
  timestamp: string;
  feedback: StoreFeedback[];
}

// Collection reference
const STORE_NOTES_COLLECTION = "store_notes";

// Add a new store note
export async function addStoreNote(noteData: Omit<StoreNote, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, STORE_NOTES_COLLECTION), {
      ...noteData,
      timestamp: Timestamp.now(),
      feedback: []
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding store note:", error);
    throw error;
  }
}

// Get all notes for a specific store
export async function getStoreNotes(storeId: string): Promise<StoreNote[]> {
  try {
    const q = query(
      collection(db, STORE_NOTES_COLLECTION),
      where("storeId", "==", storeId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    })) as StoreNote[];
  } catch (error) {
    console.error("Error fetching store notes:", error);
    throw error;
  }
}

// Get all notes (for the filter page)
export async function getAllStoreNotes(): Promise<StoreNote[]> {
  try {
    const q = query(
      collection(db, STORE_NOTES_COLLECTION),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    })) as StoreNote[];
  } catch (error) {
    console.error("Error fetching all store notes:", error);
    throw error;
  }
}

// Filter notes by various criteria
export async function getFilteredStoreNotes(filters: {
  province?: string;
  storeName?: string;
  author?: string;
  minRating?: number;
  maxRating?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<StoreNote[]> {
  try {
    let q = query(collection(db, STORE_NOTES_COLLECTION), orderBy("timestamp", "desc"));
    
    if (filters.province) {
      q = query(q, where("province", "==", filters.province));
    }
    
    if (filters.minRating !== undefined) {
      q = query(q, where("rating", ">=", filters.minRating));
    }
    
    if (filters.maxRating !== undefined) {
      q = query(q, where("rating", "<=", filters.maxRating));
    }
    
    const querySnapshot = await getDocs(q);
    let notes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    })) as StoreNote[];
    
    // Apply client-side filters for fields that Firestore can't query efficiently
    if (filters.storeName) {
      notes = notes.filter(note => 
        note.storeName.toLowerCase().includes(filters.storeName!.toLowerCase())
      );
    }
    
    if (filters.author) {
      notes = notes.filter(note => 
        note.author.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }
    
    if (filters.dateFrom || filters.dateTo) {
      notes = notes.filter(note => {
        const noteDate = new Date(note.timestamp);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && noteDate < fromDate) return false;
        if (toDate && noteDate > toDate) return false;
        return true;
      });
    }
    
    return notes;
  } catch (error) {
    console.error("Error fetching filtered store notes:", error);
    throw error;
  }
}

// Update note rating
export async function updateStoreNoteRating(noteId: string, rating: number): Promise<void> {
  try {
    const noteRef = doc(db, STORE_NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, { rating });
  } catch (error) {
    console.error("Error updating note rating:", error);
    throw error;
  }
}

// Add feedback to a note
export async function addFeedbackToNote(
  noteId: string, 
  feedback: Omit<StoreFeedback, 'id'>
): Promise<void> {
  try {
    const noteRef = doc(db, STORE_NOTES_COLLECTION, noteId);
    const noteSnapshot = await getDoc(noteRef);
    
    if (noteSnapshot.exists()) {
      const currentData = noteSnapshot.data() as StoreNote;
      const newFeedback: StoreFeedback = {
        ...feedback,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      const updatedFeedback = [newFeedback, ...(currentData.feedback || [])];
      await updateDoc(noteRef, { feedback: updatedFeedback });
    }
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
}

// Real-time listener for store notes
export function subscribeToStoreNotes(
  storeId: string, 
  callback: (notes: StoreNote[]) => void
): () => void {
  const q = query(
    collection(db, STORE_NOTES_COLLECTION),
    where("storeId", "==", storeId),
    orderBy("timestamp", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    })) as StoreNote[];
    callback(notes);
  });
}