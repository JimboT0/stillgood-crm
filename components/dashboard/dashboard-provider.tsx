"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import type { Store, User, Document } from "@/lib/firebase/types"
import { auth } from "@/lib/firebase/config"
import { documentService } from "@/lib/firebase/services/document"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"

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
    if (!auth) {
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
      if (firebaseUser) {
        try {
          const userData = await userService.getById(firebaseUser.uid)
          if (userData) {
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
            setCurrentUser(newUser)
          }
        } catch (error) {
          console.error("Error loading user:", error)
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            role: firebaseUser.email?.includes("admin") ? "superadmin" : "salesperson",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadData = useCallback(async () => {
    if (!currentUser) {
      setStores([])
      setUsers([])
      setDocuments([])
      return
    }

    try {
      setLoading(true)

      let storesData: Store[] = []
      let usersData: User[] = []
      const documentsData = await documentService.getAll()

      switch (currentUser.role) {
        case "superadmin":
          storesData = await storeService.getAll()
          usersData = await userService.getAll()
          break
        case "salesperson":
          storesData = await storeService.getBySalesperson(currentUser.id)
          break
        case "operations":
          storesData = await storeService.getAll()
          break
        case "media":
          storesData = await storeService.getAll()
          break
        default:
          break
      }

      setStores(storesData)
      setUsers(usersData)
      setDocuments(documentsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser, loadData])

  const handleSaveStore = useCallback(
    async (updatedStore: Store) => {
      try {
        if (updatedStore.id && !updatedStore.id.startsWith("store-")) {
          setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)))
          await storeService.update(updatedStore.id, updatedStore)
        } else {
          const newStore = { ...updatedStore, salespersonId: currentUser?.id || "" }
          delete newStore.id
          const newId = await storeService.create(newStore)
          const createdStore = { ...newStore, id: newId, createdAt: new Date(), updatedAt: new Date() }
          setStores((prev) => [createdStore, ...prev])
        }
      } catch (error) {
        console.error("Error saving store:", error)
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleDeleteStore = useCallback(
    async (storeId: string) => {
      try {
        setStores((prev) => prev.filter((s) => s.id !== storeId))
        await storeService.delete(storeId)
      } catch (error) {
        console.error("Error deleting store:", error)
        await loadData()
      }
    },
    [loadData],
  )

  const handleStatusChange = useCallback(
    async (storeId: string, newStatus: Store["status"]) => {
      try {
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s)))
        await storeService.update(storeId, { status: newStatus })
      } catch (error) {
        console.error("Error updating store status:", error)
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
          const newSetupStatus = !store.isSetup
          setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, isSetup: newSetupStatus } : s)))
          await storeService.update(storeId, { isSetup: newSetupStatus })
        } catch (error) {
          console.error("Error toggling setup:", error)
          await loadData()
        }
      }
    },
    [stores, loadData],
  )

  const handleSetupConfirmation = useCallback(
    async (storeId: string) => {
      try {
        const updates = {
          setupConfirmed: true,
          setupConfirmedBy: currentUser?.id,
          setupConfirmedAt: new Date(),
        }
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
        await storeService.update(storeId, updates)
      } catch (error) {
        console.error("Error confirming setup:", error)
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handlePushToRollout = useCallback(
    async (storeId: string, trainingDate: Date, launchDate: Date) => {
      try {
        const updates = {
          trainingDate,
          launchDate,
          pushedToRollout: true,
          pushedToRolloutAt: new Date(),
          pushedToRolloutBy: currentUser?.id || null, // Use null instead of undefined
        }
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)
      } catch (error) {
        console.error("Error pushing to rollout:", error)
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleMarkAsError = useCallback(
    async (storeId: string, errorDescription: string) => {
      try {
        const updates = {
          hasErrors: true,
          errorDescription,
          errorSetBy: currentUser?.id || null,
          errorSetAt: new Date(),
        }
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)
      } catch (error) {
        console.error("Error marking store as error:", error)
        await loadData()
      }
    },
    [currentUser?.id, loadData],
  )

  const handleClearError = useCallback(
    async (storeId: string) => {
      try {
        const updates = {
          hasErrors: false,
          errorDescription: null, // Use null instead of undefined
          errorSetBy: null,
          errorSetAt: null,
        }
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
        await storeService.update(storeId, updates)
      } catch (error) {
        console.error("Error clearing store error:", error)
        await loadData()
      }
    },
    [loadData],
  )

  const handleCreateUser = useCallback(
    async (userData: { name: string; email: string; password: string; role: User["role"] }) => {
      try {
        // Check if current user has permission to create users
        if (currentUser?.role !== "superadmin") {
          throw new Error("Only superadmins can create users")
        }

        // For now, we'll need to prompt for admin password or store it securely
        // This is a temporary solution - in production, use Firebase Admin SDK
        const adminPassword = prompt("Please enter your admin password to create the user:")
        if (!adminPassword) {
          throw new Error("Admin password required")
        }

        const adminCredentials = {
          email: currentUser.email,
          password: adminPassword,
        }

        const newUserId = await userService.create(userData, adminCredentials)

        const newUser = await userService.getById(newUserId)
        if (newUser) {
          setUsers((prev) => [newUser, ...prev])
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
        }
      } catch (error) {
        console.error("Error creating user:", error)
        throw error
      }
    },
    [currentUser],
  )

  const handleUpdateUser = useCallback(
    async (userId: string, updates: Partial<User>) => {
      try {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)))
        await userService.update(userId, updates)
      } catch (error) {
        console.error("Error updating user:", error)
        await loadData()
      }
    },
    [loadData],
  )

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        await userService.delete(userId)
      } catch (error) {
        console.error("Error deleting user:", error)
        await loadData()
      }
    },
    [loadData],
  )

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
      loadData,
    ],
  )

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboardData must be used within DashboardProvider")
  }
  return context
}
