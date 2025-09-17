"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import type { Store, User, Document } from "@/lib/firebase/types"
import { auth, db } from "@/lib/firebase/config"
import { documentService } from "@/lib/firebase/services/document"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"
import { doc, updateDoc } from "firebase/firestore"
import toast from "react-hot-toast"

interface DashboardContextType {
  currentUser: User | null
  stores: Store[]
  users: User[]
  documents: Document[]
  loading: boolean
  handleSaveStore: (store: Store) => Promise<void>
  handleDeleteStore: (storeId: string) => Promise<void>
  handleStatusChange: (storeId: string, newStatus: Store["status"]) => Promise<void>
  handleToggleSetup: (storeId: string) => Promise<void>
  handleSetupConfirmation: (storeId: string) => Promise<void>
  handlePushToRollout: (storeId: string, trainingDate: Date, launchDate: Date) => Promise<void>
  handleMarkAsError: (storeId: string, errorDescription: string) => Promise<void>
  handleClearError: (storeId: string) => Promise<void>
  handleCreateUser: (userData: { name: string; email: string; password: string; role: User["role"] }) => Promise<void>
  handleUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>
  handleDeleteUser: (userId: string) => Promise<void>
  handleToggleSocialSetup: (storeId: string) => Promise<void>
  handleUpdateCredentials: (storeId: string, credentials: Store['credentials']) => Promise<void>
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | null>(null)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
  if (stores.length > 0) {
    const filteredStores = stores.filter(
      (store) => store.status === "closed" || store.status === "rollout"
    );
    const emails = filteredStores
      .flatMap((store) => store.contactPersons?.map((person) => person.email))
      .filter(Boolean);
    console.log("Contact person emails for closed/rollout stores:", emails);
  }
}, [stores]);

  

  useEffect(() => {
    if (!auth) {
      console.log("DashboardProvider - Offline mode: Setting default user")
      setCurrentUser({
        id: "offline-user",
        name: "Offline User",
        email: "offline@example.com",
        role: "superadmin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("DashboardProvider - Fetching user data for:", firebaseUser.uid)
          const userData = await userService.getById(firebaseUser.uid)
          if (userData) {
            console.log("DashboardProvider - User data fetched:", userData)
            setCurrentUser(userData)
          } else {
            const isAdmin = firebaseUser.email?.includes("admin")
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              role: isAdmin ? "superadmin" : "salesperson",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            console.log("DashboardProvider - Creating new user:", newUser)
            setCurrentUser(newUser)
          }
        } else {
          console.log("DashboardProvider - No authenticated user")
          setCurrentUser(null)
        }
      } catch (error) {
        console.error("DashboardProvider - Error loading user:", error, { userId: firebaseUser?.uid })
        setCurrentUser({
          id: firebaseUser?.uid || "unknown",
          name: firebaseUser?.displayName || "User",
          email: firebaseUser?.email || "",
          role: firebaseUser?.email?.includes("admin") ? "superadmin" : "salesperson",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      setLoading(false)
    })

    return () => {
      console.log("DashboardProvider - Unsubscribing from auth state changes")
      unsubscribe()
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!currentUser) {
      console.log("DashboardProvider - No current user, clearing data")
      setStores([])
      setUsers([])
      setDocuments([])
      return
    }

    try {
      setLoading(true)
      console.log("DashboardProvider - Loading data for user:", currentUser.id, { role: currentUser.role })

      let storesData: Store[] = []
      let usersData: User[] = []
      const documentsData = await documentService.getAll()
      console.log("DashboardProvider - Documents fetched:", documentsData)

      switch (currentUser.role) {
        case "superadmin":
          storesData = await storeService.getAll()
          usersData = await userService.getAll()
          console.log("DashboardProvider - Superadmin: Fetched stores:", storesData)
          console.log("DashboardProvider - Superadmin: Fetched users:", usersData)
          break
        case "salesperson":
          storesData = await storeService.getBySalesperson(currentUser.id)
          console.log("DashboardProvider - Salesperson: Fetched stores:", storesData)
          break
        case "operations":
          storesData = await storeService.getByOpsUser(currentUser.id)
          console.log("DashboardProvider - Operations: Fetched stores:", storesData)
          break
        case "media":
          storesData = await storeService.getAll()
          console.log("DashboardProvider - Media: Fetched stores:", storesData)
          break
        default:
          console.log("DashboardProvider - Unknown role:", currentUser.role)
          break
      }

      setStores(storesData)
      setUsers(usersData)
      setDocuments(documentsData)
    } catch (error) {
      console.error("DashboardProvider - Error loading dashboard data:", error, { userId: currentUser?.id })
      setStores([])
      setUsers([])
      setDocuments([])
    } finally {
      setLoading(false)
      console.log("DashboardProvider - Data loading complete")
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      console.log("DashboardProvider - Triggering data load for user:", currentUser.id)
      loadData()
    }
  }, [currentUser, loadData])

  const handleSaveStore = useCallback(
    async (updatedStore: Store) => {
      try {
        console.log("DashboardProvider - Saving store:", updatedStore)
        if (updatedStore.id && !updatedStore.id.startsWith("store-")) {
          setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)))
          await storeService.update(updatedStore.id, updatedStore)
          console.log("DashboardProvider - Store updated:", updatedStore.id)
        } else {
          const newStore = { ...updatedStore, salespersonId: currentUser?.id || "" }
          delete newStore.id
          const newId = await storeService.create(newStore)
          const createdStore = { ...newStore, id: newId, createdAt: new Date(), updatedAt: new Date() }
          setStores((prev) => [createdStore, ...prev])
          console.log("DashboardProvider - Store created:", createdStore)
        }
      } catch (error) {
        console.error("DashboardProvider - Error saving store:", error, { storeId: updatedStore.id })
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleDeleteStore = useCallback(
    async (storeId: string) => {
      try {
        console.log("DashboardProvider - Deleting store:", storeId)
        setStores((prev) => prev.filter((s) => s.id !== storeId))
        await storeService.delete(storeId)
        console.log("DashboardProvider - Store deleted:", storeId)
      } catch (error) {
        console.error("DashboardProvider - Error deleting store:", error, { storeId })
        await loadData()
      }
    },
    [loadData],
  )

  const handleStatusChange = useCallback(
    async (storeId: string, newStatus: Store["status"]) => {
      try {
        console.log("DashboardProvider - Updating store status:", { storeId, newStatus })
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s)))
        await storeService.update(storeId, { status: newStatus })
        console.log("DashboardProvider - Store status updated:", { storeId, newStatus })
      } catch (error) {
        console.error("DashboardProvider - Error updating store status:", error, { storeId, newStatus })
        await loadData()
      }
    },
    [loadData],
  )

  const handleToggleSetup = useCallback(
    async (storeId: string) => {
      const store = stores.find((s) => s.id === storeId)
      if (store) {
        try {
          console.log("DashboardProvider - Toggling setup for store:", storeId)
          const newSetupStatus = !store.isSetup
          setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, isSetup: newSetupStatus } : s)))
          await storeService.update(storeId, { isSetup: newSetupStatus })
          console.log("DashboardProvider - Setup toggled:", { storeId, newSetupStatus })
        } catch (error) {
          console.error("DashboardProvider - Error toggling setup:", error, { storeId })
          await loadData()
        }
      }
    },
    [stores, loadData],
  )

  const handleSetupConfirmation = useCallback(
    async (storeId: string) => {
      try {
        console.log("DashboardProvider - Confirming setup for store:", storeId)
        const updates = {
          setupConfirmed: true,
          setupConfirmedBy: currentUser?.id,
          setupConfirmedAt: new Date(),
        }
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
        await storeService.update(storeId, updates)
        console.log("DashboardProvider - Setup confirmed:", { storeId })
      } catch (error) {
        console.error("DashboardProvider - Error confirming setup:", error, { storeId })
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handlePushToRollout = useCallback(
    async (storeId: string, trainingDate: Date, launchDate: Date) => {
      try {
        console.log("DashboardProvider - Pushing store to rollout:", { storeId, trainingDate, launchDate })
        const updates = {
          trainingDate,
          launchDate,
          pushedToRollout: true,
          pushedToRolloutAt: new Date(),
          pushedToRolloutBy: currentUser?.id || null,
        }
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)
        console.log("DashboardProvider - Store pushed to rollout:", { storeId })
      } catch (error) {
        console.error("DashboardProvider - Error pushing to rollout:", error, { storeId, trainingDate, launchDate })
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleMarkAsError = useCallback(
    async (storeId: string, errorDescription: string) => {
      try {
        console.log("DashboardProvider - Marking store as error:", { storeId, errorDescription })
        const updates = {
          hasErrors: true,
          errorDescription,
          errorSetBy: currentUser?.id || null,
          errorSetAt: new Date(),
        }
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)
        console.log("DashboardProvider - Store marked as error:", { storeId })
      } catch (error) {
        console.error("DashboardProvider - Error marking store as error:", error, { storeId, errorDescription })
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleClearError = useCallback(
    async (storeId: string) => {
      try {
        console.log("DashboardProvider - Clearing error for store:", storeId)
        const updates = {
          hasErrors: false,
          errorDescription: null,
          errorSetBy: null,
          errorSetAt: null,
        }
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
        await storeService.update(storeId, updates)
        console.log("DashboardProvider - Error cleared for store:", { storeId })
      } catch (error) {
        console.error("DashboardProvider - Error clearing store error:", error, { storeId })
        await loadData()
      }
    },
    [loadData],
  )

  const handleCreateUser = useCallback(
    async (userData: { name: string; email: string; password: string; role: User["role"] }) => {
      try {
        console.log("DashboardProvider - Creating user:", userData)
        if (currentUser?.role !== "superadmin") {
          throw new Error("Only superadmins can create users")
        }

        const adminPassword = prompt("Please enter your admin password to create the user:")
        if (!adminPassword) {
          throw new Error("Admin password required")
        }

        const credentials = {
          email: currentUser.email,
          password: adminPassword,
        }

        const newUserId = await userService.create(userData, credentials)
        console.log("DashboardProvider - User created with ID:", newUserId)

        const newUser = await userService.getById(newUserId)
        if (newUser) {
          setUsers((prev) => [newUser, ...prev])
          console.log("DashboardProvider - New user added to state:", newUser)
        } else {
          const localUser: User = {
            id: newUserId,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setUsers((prev) => [localUser, ...prev])
          console.log("DashboardProvider - Local user added to state:", localUser)
        }
      } catch (error) {
        console.error("DashboardProvider - Error creating user:", error, { userData })
        throw error
      }
    },
    [currentUser],
  )

  const handleUpdateUser = useCallback(
    async (userId: string, updates: Partial<User>) => {
      try {
        console.log("DashboardProvider - Updating user:", { userId, updates })
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)))
        await userService.update(userId, updates)
        console.log("DashboardProvider - User updated:", { userId })
      } catch (error) {
        console.error("DashboardProvider - Error updating user:", error, { userId, updates })
        await loadData()
      }
    },
    [loadData],
  )

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        console.log("DashboardProvider - Deleting user:", userId)
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        await userService.delete(userId)
        console.log("DashboardProvider - User deleted:", userId)
      } catch (error) {
        console.error("DashboardProvider - Error deleting user:", error, { userId })
        await loadData()
      }
    },
    [loadData],
  )

  const handleUpdateCredentials = async (storeId: string, credentials: Store['credentials']) => {
    try {
      // Validate credentials
      if (!credentials || !credentials.length) {
        throw new Error("No credentials provided");
      }
      const latestCredentials = credentials[credentials.length - 1];
      if (
        !latestCredentials.bagusername ||
        !latestCredentials.bagpassword ||
        !latestCredentials.orderusername ||
        !latestCredentials.orderpassword
      ) {
        throw new Error("All credential fields are required");
      }

      const storeRef = doc(db, "stores", storeId);
      await updateDoc(storeRef, { credentials: credentials });
      setStores((prevStores) =>
        prevStores.map((store) =>
          store.id === storeId ? { ...store, credentials: credentials } : store
        )
      );
      toast.success("Credentials updated successfully", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    } catch (error) {
      console.log("Updating credentials for store:", { storeId, credentials });
      toast.error("Failed to update credentials", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      throw error;
    }
  };

  const handleToggleSocialSetup = async (storeId: string) => {
    try {
      const storeRef = doc(db, "stores", storeId)
      const store = stores.find((s) => s.id === storeId)
      if (store) {
        const newSocialSetupStatus = !store.isSocialSetup
        await updateDoc(storeRef, { isSocialSetup: newSocialSetupStatus })
        setStores(stores.map((s) => (s.id === storeId ? { ...s, isSocialSetup: newSocialSetupStatus } : s)))
        toast.success(
          newSocialSetupStatus ? `Social setup enabled for "${store.tradingName}"` : `Social setup disabled for "${store.tradingName}"`,
          {
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #f97316",
            },
          }
        )
      }
    } catch (error) {
      console.error("Error toggling social setup:", error)
      toast.error(
        error instanceof Error ? error.message : String(error),
        {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        }
      )
    }
  }

  const contextValue = useMemo(
    () => ({
      currentUser,
      stores,
      users,
      documents,
      loading,
      handleSaveStore,
      handleDeleteStore,
      handleStatusChange,
      handleToggleSetup,
      handleSetupConfirmation,
      handlePushToRollout,
      handleMarkAsError,
      handleClearError,
      handleCreateUser,
      handleUpdateUser,
      handleDeleteUser,
      handleToggleSocialSetup,
      handleUpdateCredentials,
      refreshData: loadData,
    }),
    [
      currentUser,
      stores,
      users,
      documents,
      loading,
      handleSaveStore,
      handleDeleteStore,
      handleStatusChange,
      handleToggleSetup,
      handleSetupConfirmation,
      handlePushToRollout,
      handleMarkAsError,
      handleClearError,
      handleCreateUser,
      handleUpdateUser,
      handleDeleteUser,
      handleToggleSocialSetup,
      handleUpdateCredentials,
      loadData,
    ],
  )

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardContext)
  if (!context) {
    console.error("DashboardProvider - useDashboardData called outside DashboardProvider")
    throw new Error("useDashboardData must be used within DashboardProvider")
  }
  return context
}