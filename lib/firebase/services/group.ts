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
} from "firebase/firestore"
import { db, auth } from "../config"
import type { StoreGroup } from "../types"

export const groupService = {
  async getAll(): Promise<StoreGroup[]> {
    const querySnapshot = await getDocs(query(collection(db, "storeGroups"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      storeIds: doc.data().storeIds || [], // Ensure storeIds is always an array
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as StoreGroup[]
  },

  async getById(id: string): Promise<StoreGroup | null> {
    const docRef = doc(db, "storeGroups", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        storeIds: docSnap.data().storeIds || [], // Ensure storeIds is always an array
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as StoreGroup
    }
    return null
  },

  async getByManager(managerId: string): Promise<StoreGroup[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "storeGroups"), where("keyAccountManager", "==", managerId), orderBy("createdAt", "desc")),
    )
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      storeIds: doc.data().storeIds || [], // Ensure storeIds is always an array
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as StoreGroup[]
  },

  async create(groupData: Omit<StoreGroup, "id">): Promise<string> {
    const userId = auth.currentUser?.uid
    if (!userId) {
      throw new Error("User must be authenticated to create a group")
    }
    const docRef = await addDoc(collection(db, "storeGroups"), {
      ...groupData,
      storeIds: groupData.storeIds || [], // Ensure storeIds is initialized
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  },

  async update(id: string, groupData: Partial<StoreGroup>): Promise<void> {
    const docRef = doc(db, "storeGroups", id)
    await updateDoc(docRef, {
      ...groupData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, "storeGroups", id)
    await deleteDoc(docRef)
  },

  async deleteWithUngroup(id: string): Promise<void> {
    const group = await this.getById(id)
    if (!group) {
      throw new Error(`Group ${id} not found`)
    }
    console.log("Deleting group with data:", group)

    // Clear storeIds in the group
    await this.update(id, { storeIds: [] })

    // Update stores to remove groupId
    const storesCollection = collection(db, "stores")
    const storesSnapshot = await getDocs(query(storesCollection, where("groupId", "==", id)))
    for (const storeDoc of storesSnapshot.docs) {
      console.log(`Ungrouping store ${storeDoc.id} from group ${id}`)
      await updateDoc(doc(db, "stores", storeDoc.id), { groupId: null })
    }

    // Delete the group
    await this.delete(id)
  },

  async addStoreToGroup(groupId: string, storeId: string): Promise<void> {
    const group = await this.getById(groupId)
    if (group) {
      const updatedStoreIds = [...(group.storeIds || []), storeId]
      await this.update(groupId, { storeIds: updatedStoreIds })
      // Update store's groupId
      await updateDoc(doc(db, "stores", storeId), { groupId: groupId })
    }
  },

  async removeStoreFromGroup(groupId: string, storeId: string): Promise<void> {
    const group = await this.getById(groupId)
    if (group) {
      const updatedStoreIds = (group.storeIds || []).filter((id: string) => id !== storeId)
      await this.update(groupId, { storeIds: updatedStoreIds })
      // Update store's groupId
      await updateDoc(doc(db, "stores", storeId), { groupId: null })
    }
  },
}
