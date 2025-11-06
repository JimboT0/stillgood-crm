"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import type { Store, User, Document } from "@/lib/firebase/types"
import { auth, db } from "@/lib/firebase/config"
import { documentService } from "@/lib/firebase/services/document"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"
import { doc, Timestamp, updateDoc } from "firebase/firestore"
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
  handleUpdateCredentials: (storeId: string, credentials: Store["credentials"]) => Promise<void>
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

  const isSuperadmin = currentUser?.role === "superadmin"

  useEffect(() => {
    if (stores.length > 0) {
      const filteredStores = stores.filter((store) => store.status === "closed" || store.status === "rollout")
      const emails = filteredStores
        .flatMap((store) => store.contactPersons?.map((person) => person.email))
        .filter(Boolean)
    }
  }, [stores])

  useEffect(() => {
    console.log(`[DashboardProvider] Auth effect running, auth exists: ${!!auth}`)
    
    if (!auth) {
      console.log(`[DashboardProvider] No auth, setting offline user`)
      setCurrentUser({
        id: "offline-user",
        uid: "offline-user",
        name: "Offline User",
        email: "offline@example.com",
        role: "superadmin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setLoading(false)
      return
    }

    console.log(`[DashboardProvider] Setting up onAuthStateChanged listener`)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(`[DashboardProvider] onAuthStateChanged fired - firebaseUser: ${firebaseUser?.uid || "null"}`)
      
      try {
        if (firebaseUser) {
          console.log(`[DashboardProvider] Firebase user found, loading user data for: ${firebaseUser.uid}`)
          const userData = await userService.getById(firebaseUser.uid)
          
          if (userData) {
            console.log(`[DashboardProvider] User data loaded from Firestore:`, {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              name: userData.name
            })
            setCurrentUser(userData)
          } else {
            console.log(`[DashboardProvider] No user data found in Firestore, creating new user`)
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              role: firebaseUser.email?.includes("admin") ? "superadmin" : "salesperson",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            console.log(`[DashboardProvider] Created new user:`, newUser)
            setCurrentUser(newUser)
          }
        } else {
          console.log(`[DashboardProvider] No Firebase user, setting currentUser to null`)
          setCurrentUser(null)
        }
      } catch (error) {
        console.error("DashboardProvider - Error loading user:", error, { userId: firebaseUser?.uid })
        const fallbackUser: User = {
          id: firebaseUser?.uid || "unknown",
          uid: firebaseUser?.uid || "unknown",
          name: firebaseUser?.displayName || "User",
          email: firebaseUser?.email || "",
          role: firebaseUser?.email?.includes("admin") ? "superadmin" : "salesperson",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        console.log(`[DashboardProvider] Setting fallback user due to error:`, fallbackUser)
        setCurrentUser(fallbackUser)
      }
      setLoading(false)
      console.log(`[DashboardProvider] Auth callback completed, loading set to false`)
    })

    return () => {
      console.log(`[DashboardProvider] Cleaning up auth listener`)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    console.log(`[DashboardProvider] useEffect for subscriptions - currentUser: ${currentUser?.id}, role: ${currentUser?.role}`)
    
    if (!currentUser) {
      console.log(`[DashboardProvider] No currentUser in subscription effect, clearing stores`)
      setStores([])
      setUsers([])
      setDocuments([])
      return
    }

    setLoading(true)
    const unsubscribers: (() => void)[] = []

    try {
      switch (currentUser.role) {
        case "superadmin":
          console.log(`[DashboardProvider] Setting up subscriptions for superadmin`)
          unsubscribers.push(storeService.subscribeToAll(setStores))
          unsubscribers.push(userService.subscribeToAll(setUsers))
          break
        case "salesperson":
          // Salespersons need to see all stores to switch between "All Leads" and "My Leads" tabs
          // They also need users to see creator names in the "All Leads" tab
          // Component-level permission checks will prevent unauthorized modifications
          console.log(`[DashboardProvider] Setting up subscriptions for salesperson: ${currentUser.id}`)
          unsubscribers.push(storeService.subscribeToAll(setStores))
          unsubscribers.push(userService.subscribeToAll(setUsers))
          break
        case "operations":
          unsubscribers.push(storeService.subscribeToByOpsUser(currentUser.id, setStores))
          break
        case "media":
          unsubscribers.push(storeService.subscribeToAll(setStores))
          break
        default:
          console.log(`[DashboardProvider] Unknown role in subscriptions: ${currentUser.role}`)
          break
      }

      unsubscribers.push(documentService.subscribeToAll(setDocuments))
      console.log(`[DashboardProvider] Subscriptions set up successfully`)

      setLoading(false)
    } catch (error) {
      console.error("DashboardProvider - Error setting up subscriptions:", error, { userId: currentUser?.id, role: currentUser?.role })
      setStores([])
      setUsers([])
      setDocuments([])
      setLoading(false)
    }

    return () => {
      console.log(`[DashboardProvider] Cleaning up subscriptions`)
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [currentUser])

  const loadData = useCallback(async () => {
    console.log(`[DashboardProvider] loadData called - currentUser: ${currentUser?.id}, role: ${currentUser?.role}`)
    
    if (!currentUser) {
      console.log(`[DashboardProvider] No currentUser, clearing stores`)
      setStores([])
      setUsers([])
      setDocuments([])
      return
    }

    try {
      setLoading(true)
      console.log(`[DashboardProvider] Starting to load data for role: ${currentUser.role}`)

      let storesData: Store[] = []
      let usersData: User[] = []
      const documentsData = await documentService.getAll()

      switch (currentUser.role) {
        case "superadmin":
          console.log(`[DashboardProvider] Loading stores for superadmin`)
          storesData = await storeService.getAll()
          usersData = await userService.getAll()
          console.log(`[DashboardProvider] Superadmin loaded ${storesData.length} stores`)
          break
        case "salesperson":
          // Salespersons need to see all stores to switch between "All Leads" and "My Leads" tabs
          // Component-level permission checks will prevent unauthorized modifications
          console.log(`[DashboardProvider] Loading ALL stores for salesperson: ${currentUser.id}`)
          try {
            storesData = await storeService.getAll()
            console.log(`[DashboardProvider] Successfully loaded ${storesData.length} stores for salesperson`)
            if (storesData.length > 0) {
              console.log(`[DashboardProvider] Sample stores:`, storesData.slice(0, 3).map(s => ({
                id: s.id,
                tradingName: s.tradingName,
                status: s.status,
                salespersonId: s.salespersonId
              })))
            } else {
              console.warn(`[DashboardProvider] WARNING: No stores loaded for salesperson!`)
            }
          } catch (storeError) {
            console.error(`[DashboardProvider] Error loading stores for salesperson:`, storeError)
            throw storeError
          }
          break
        case "operations":
          storesData = await storeService.getByOpsUser(currentUser.id)
          break
        case "media":
          storesData = await storeService.getAll()
          break
        default:
          console.log(`[DashboardProvider] Unknown role: ${currentUser.role}`)
          break
      }

      console.log(`[DashboardProvider] Setting stores: ${storesData.length} stores for role: ${currentUser.role}`)
      setStores(storesData)
      setUsers(usersData)
      setDocuments(documentsData)
      console.log(`[DashboardProvider] Data loaded successfully - stores: ${storesData.length}, users: ${usersData.length}, documents: ${documentsData.length}`)
    } catch (error) {
      console.error("DashboardProvider - Error loading dashboard data:", error, { userId: currentUser?.id, role: currentUser?.role })
      setStores([])
      setUsers([])
      setDocuments([])
    } finally {
      setLoading(false)
      console.log(`[DashboardProvider] loadData completed, loading set to false`)
    }
  }, [currentUser])

  const handleSaveStore = useCallback(
    async (updatedStore: Store) => {
      try {
        if (updatedStore.id && !updatedStore.id.startsWith("store-")) {
          setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)))
          await storeService.update(updatedStore.id, updatedStore)
        } else {
          const { id, ...storeData } = updatedStore
          const newStore = { ...storeData, salespersonId: currentUser?.id || "" }
          const newId = await storeService.create(newStore)
        }
      } catch (error) {
        console.error("DashboardProvider - Error saving store:", error, { storeId: updatedStore.id })
      }
    },
    [currentUser?.id],
  )

  const handleDeleteStore = useCallback(async (storeId: string) => {
    try {
      setStores((prev) => prev.filter((s) => s.id !== storeId))
      await storeService.delete(storeId)
    } catch (error) {
      console.error("DashboardProvider - Error deleting store:", error, { storeId })
    }
  }, [])

  const handleStatusChange = useCallback(async (storeId: string, newStatus: Store["status"]) => {
    try {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s)))
      await storeService.update(storeId, { status: newStatus })
    } catch (error) {
      console.error("DashboardProvider - Error updating store status:", error, { storeId, newStatus })
    }
  }, [])

  const handleToggleSetup = useCallback(
    async (storeId: string) => {
      const store = stores.find((s) => s.id === storeId)
      if (store) {
        try {
          const newSetupStatus = !store.isSetup
          setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, isSetup: newSetupStatus } : s)))
          await storeService.update(storeId, { isSetup: newSetupStatus })
        } catch (error) {
          console.error("DashboardProvider - Error toggling setup:", error, { storeId })
        }
      }
    },
    [stores],
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
        console.error("DashboardProvider - Error confirming setup:", error, { storeId })
      }
    },
    [currentUser?.id],
  )

  const handlePushToRollout = useCallback(
    async (storeId: string, trainingDate: Date, launchDate: Date) => {
      try {
        const updates = {
          trainingDate: Timestamp.fromDate(trainingDate),
          launchDate: Timestamp.fromDate(launchDate),
          pushedToRollout: true,
          pushedToRolloutAt: Timestamp.now(),
          pushedToRolloutBy: currentUser?.id || null,
        }
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)

        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL as string
        const store = stores.find((s) => s.id === storeId)
        if (store) {
          const hasCollectionTimes = (() => {
            const ct = store.collectionTimes
            if (!ct) return false
            const mf = ct.mondayFriday
            if (!mf) return false
            const from = (mf.from ?? "").toString()
            const to = (mf.to ?? "").toString()
            const hasNumber = (s: string) => /\d/.test(s)
            if (from === "" && to === "") return false
            return hasNumber(from) || hasNumber(to)
          })()

          const payload = {
            storeName: store.tradingName || "Unknown",
            province: store.province || "Unknown",
            trainingDate: trainingDate.toISOString(),
            launchDate: launchDate.toISOString(),
            pushedToRolloutBy: currentUser?.name || "Unknown",
            pushedToRolloutAt: Timestamp.now(),

            bankConfirmation: store.bankConfirmation || false,
            hasBankConfirmation: !!store.bankConfirmation,
            signedSla: store.signedSla || false,
            hasSignedSla: !!store.signedSla,
            hasCollectionTimes,
            hasProducts: store.products?.[0]?.name != null,
            salesPerson: users.find((u) => u.id === store.salespersonId)?.name || "Unassigned",


          }

          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          if (!response.ok) {
            const errorText = await response.text().catch(() => "No response body")
            console.error("DashboardProvider - Webhook failed:", {
              status: response.status,
              statusText: response.statusText,
              errorText,
            })
            throw new Error(`Webhook failed with status ${response.status}: ${errorText}`)
          } else {
            const salesperson = users.find(u => u.id === store.salespersonId)
            console.info("Dash Prov. Successfully pushed to rollout and notified webhook:", {
              storeId,
              storeName: store.tradingName,
              trainingDate: trainingDate.toISOString(),
              launchDate: launchDate.toISOString(),
              webhookStatus: response.status,
            })
            toast.success(`Pushed "${store.tradingName}" to rollout and notified webhook`, {
              style: {
                background: "#fff",
                color: "#111827",
                border: "1px solid #10b981",
              },
            })
          }
        } else {
          console.error("DashboardProvider - Store not found for webhook:", { storeId })
          throw new Error(`Store with ID ${storeId} not found for webhook`)
        }
      } catch (error) {
        console.error("DashboardProvider - Error pushing to rollout or sending webhook:", error, {
          storeId,
          trainingDate,
          launchDate,
        })
        toast.error(
          `Failed to push to rollout or notify via webhook: ${error instanceof Error ? error.message : String(error)}`,
          {
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #f97316",
            },
          },
        )
        await loadData()
      }
    },
    [currentUser?.id, loadData, stores],
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
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))
        setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...cleanUpdates } : s)))
        await storeService.update(storeId, cleanUpdates)
      } catch (error) {
        console.error("DashboardProvider - Error marking store as error:", error, { storeId, errorDescription })
      }
    },
    [currentUser?.id],
  )

  const handleClearError = useCallback(async (storeId: string) => {
    try {
      const updates = {
        hasErrors: false,
        errorDescription: undefined,
        errorSetBy: undefined,
        errorSetAt: undefined,
      }
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...updates } : s)))
      await storeService.update(storeId, updates)
    } catch (error) {
      console.error("DashboardProvider - Error clearing store error:", error, { storeId })
    }
  }, [])

  const handleCreateUser = useCallback(
    async (userData: { name: string; email: string; password: string; role: User["role"] }) => {
      try {
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

        await userService.create(userData, credentials)
      } catch (error) {
        console.error("DashboardProvider - Error creating user:", error, { userData })
        throw error
      }
    },
    [currentUser],
  )

  const handleUpdateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    try {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)))
      await userService.update(userId, updates)
    } catch (error) {
      console.error("DashboardProvider - Error updating user:", error, { userId, updates })
    }
  }, [])

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      await userService.delete(userId)
    } catch (error) {
      console.error("DashboardProvider - Error deleting user:", error, { userId })
    }
  }, [])

  const handleUpdateCredentials = (storeId: string, credentials: Store["credentials"]) => {
    try {
      if (!credentials || !credentials.length) {
        throw new Error("No credentials provided")
      }
      const latestCredentials = credentials[credentials.length - 1]
      if (
        !latestCredentials.bagusername ||
        !latestCredentials.bagpassword ||
        !latestCredentials.orderusername ||
        !latestCredentials.orderpassword
      ) {
        throw new Error("All credential fields are required")
      }

      const storeRef = doc(db, "stores", storeId)
      updateDoc(storeRef, { credentials: credentials })
      setStores((prevStores) =>
        prevStores.map((store) => (store.id === storeId ? { ...store, credentials: credentials } : store)),
      )
      toast.success("Credentials updated successfully", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      })
    } catch (error) {
      toast.error("Failed to update credentials", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      })
      throw error
    }
  }

  const handleToggleSocialSetup = (storeId: string) => {
    try {
      const storeRef = doc(db, "stores", storeId)
      const store = stores.find((s) => s.id === storeId)
      if (store) {
        const newSocialSetupStatus = !store.isSocialSetup
        updateDoc(storeRef, { isSocialSetup: newSocialSetupStatus })
        setStores(stores.map((s) => (s.id === storeId ? { ...s, isSocialSetup: newSocialSetupStatus } : s)))
        toast.success(
          newSocialSetupStatus
            ? `Social setup enabled for "${store.tradingName}"`
            : `Social setup disabled for "${store.tradingName}"`,
          {
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #f97316",
            },
          },
        )
      }
    } catch (error) {
      console.error("Error toggling social setup:", error)
      toast.error(error instanceof Error ? error.message : String(error), {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      })
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
