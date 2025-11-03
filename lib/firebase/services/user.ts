import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "../config"
import { auth } from "../config" // Import Firebase Auth
import { createUserWithEmailAndPassword, updateProfile, signOut, signInWithEmailAndPassword } from "firebase/auth" // Add auth methods
import type { User } from "../types"
import { safeDateToTimestamp } from "@/lib/utils"

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

// Convert Firestore data to User object
const convertFirestoreToUser = (doc: any): User => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  }
}

// Convert User object to Firestore data
const convertUserToFirestore = (user: Partial<User>): any => {
  const data = {
    ...user,
    createdAt: safeDateToTimestamp(user.createdAt),
    updatedAt: safeDateToTimestamp(user.updatedAt),
  }

  delete data.id

  return removeUndefined(data)
}

export const userService = {
  subscribeToAll(callback: (users: User[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, "users"), orderBy("name", "asc"))
      return onSnapshot(
        q,
        (querySnapshot) => {
          const users = querySnapshot.docs.map(convertFirestoreToUser)
          callback(users)
        },
        (error) => {
          console.error("Error subscribing to users:", error)
          callback([])
        },
      )
    } catch (error) {
      console.error("Error setting up users subscription:", error)
      return () => {}
    }
  },

  async getAll(): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(convertFirestoreToUser)
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, "users", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return convertFirestoreToUser(docSnap)
      }
      return null
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, "users"), where("email", "==", email))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        return convertFirestoreToUser(querySnapshot.docs[0])
      }
      return null
    } catch (error) {
      console.error("Error getting user by email:", error)
      return null
    }
  },

  async create(
    user: Omit<User, "id"> & { password: string },
    credentials?: { email: string; password: string },
  ): Promise<string> {
    try {
      const currentUser = auth.currentUser
      const currentUserEmail = currentUser?.email

      if (!currentUser || !currentUserEmail) {
        throw new Error("No authenticated user found")
      }

      // If admin credentials not provided, we'll need them for re-authentication
      if (!credentials) {
        throw new Error("Admin credentials required for user creation")
      }

      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password)
      const authUser = userCredential.user
      const authUserId = authUser.uid

      try {
        // Step 2: Update auth user profile with name
        await updateProfile(authUser, { displayName: user.name })

        // Step 3: Sign out the newly created user
        await signOut(auth)

        // Step 4: Re-authenticate the superadmin
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password)

        // Step 5: Create user in Firestore using the Auth UID as document ID
        const userData = {
          ...user,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(user.role === "operations" && { assignedStores: [] }),
        }
        delete userData.password // Remove password from Firestore data

        await setDoc(doc(db, "users", authUserId), convertUserToFirestore(userData))

        return authUserId // Return Firebase Auth UID
      } catch (firestoreError) {
        // Step 6: Rollback - Delete the Firebase Auth user if Firestore fails
        try {
          // Re-authenticate as the new user to delete them
          await signInWithEmailAndPassword(auth, user.email, user.password)
          const userToDelete = auth.currentUser
          if (userToDelete) {
            await userToDelete.delete()
          }
          // Re-authenticate the admin
          await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        } catch (deleteError) {
          console.error("Failed to delete auth user during rollback:", deleteError)
        }
        console.error("Firestore error, attempted to delete auth user:", firestoreError)
        throw new Error("Failed to create user in Firestore: " + (firestoreError as Error).message)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, "users", id)
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      }
      await updateDoc(docRef, convertUserToFirestore(updateData))

      // Optionally update Firebase Auth profile if name or email changes
      const authUser = auth.currentUser
      if (authUser && updates.name) {
        await updateProfile(authUser, { displayName: updates.name })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Delete from Firestore
      const docRef = doc(db, "users", id)
      await deleteDoc(docRef)

      // Note: Deleting Firebase Auth user requires the user to be signed in or an admin SDK.
      // If admin SDK is available, you can delete the auth user here.
      // For client-side, you may need to handle this separately or restrict deletion.
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  },
}
