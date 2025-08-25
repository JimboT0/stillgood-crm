"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Upload, FileText, Users, X, AlertCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { storeService } from "@/lib/firebase/services/store"
import { fileService } from "@/lib/firebase/services/file"
import { groupService } from "@/lib/firebase/services/group"
import { isValidTimestamp } from "@/lib/date-validation"
import { type Store, type ContactPerson, type Product, type CollectionTimes, type StoreGroup, type Document, PROVINCES, storeTypes } from "@/lib/firebase/types"
import { formatDateTime, formatDateTimeForInput, parseDateTime } from "@/lib/utils/date-formatter"

interface StoreEditModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onSave: (store: Store) => void
  isMovingToClosed: boolean
  currentUserId?: string
  isSuperadmin?: boolean
}

export function ClosedStoreEditModal({
  store,
  isOpen,
  onClose,
  onSave,
  isMovingToClosed,
  currentUserId,
  isSuperadmin = false,
}: StoreEditModalProps) {
  const [formData, setFormData] = useState<Partial<Store>>({})
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [collectionTimes, setCollectionTimes] = useState<CollectionTimes>({
    mondayFriday: { from: "", to: "" },
    saturday: { from: "", to: "" },
    sunday: { from: "", to: "" },
    publicHoliday: { from: "", to: "" },
  })
  const [slaFile, setSlaFile] = useState<File | null>(null)
  const [bankFile, setBankFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [autoAssignStoreId, setAutoAssignStoreId] = useState(true)
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [errorDescription, setErrorDescription] = useState<string>("")


  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupsData = await groupService.getAll()
        setGroups(groupsData)
      } catch (error) {
        console.error("[StoreEditModal] Error loading groups:", error)
      }
    }

    if (isOpen) {
      loadGroups()
    }
  }, [isOpen])

  // Initialize formData with store data
  useEffect(() => {
    if (store && isOpen) {
      console.log("[StoreEditModal] Loading store data:", store)
      console.log("[StoreEditModal] Raw trainingDate:", store.trainingDate, "Raw launchDate:", store.launchDate)
      const trainingDate = parseDateTime(store.trainingDate)
      const launchDate = parseDateTime(store.launchDate)
      console.log("[StoreEditModal] Parsed trainingDate:", trainingDate, "Parsed launchDate:", launchDate)
      setFormData({
        ...store,
        trainingDate,
        launchDate,
      })
      setContactPersons(store.contactPersons || [])
      setProducts(
        (store.products || []).map((p) => ({
          name: p.name || "",
          description: p.description || "",
          retailPrice: p.retailPrice || 0,
          estimatedValue: p.estimatedValue || p.retailPrice || 0,
        })),
      )
      setCollectionTimes(
        store.collectionTimes || {
          mondayFriday: { from: "", to: "" },
          saturday: { from: "", to: "" },
          sunday: { from: "", to: "" },
          publicHoliday: { from: "", to: "" },
        },
      )
      setSlaFile(null)
      setBankFile(null)
      setErrors({})
      setUploadError(null)
      setAutoAssignStoreId(false)
      setErrorDescription(store.errorDescription || "")
    } else if (isOpen) {
      console.log("[StoreEditModal] Initializing new store form")
      setFormData({
        tradingName: "",
        streetAddress: "",
        province: undefined,
        status: "cold", // Default to "cold" for new stores
        salespersonId: currentUserId || "",
        isKeyStore: false,
        storeType: "",
        storeId: "",
        notes: "",
        isKeyAccount: false,
        keyAccountManager: "",
        assignedOpsUsers: [],
        groupId: "",
        trainingDate: null,
        launchDate: null,
      })
      setContactPersons([])
      setProducts([])
      setCollectionTimes({
        mondayFriday: { from: "", to: "" },
        saturday: { from: "", to: "" },
        sunday: { from: "", to: "" },
        publicHoliday: { from: "", to: "" },
      })
      setSlaFile(null)
      setBankFile(null)
      setErrors({})
      setUploadError(null)
      setAutoAssignStoreId(true)
      setErrorDescription("")
    }
  }, [store, isOpen, currentUserId])

  const generateStoreId = (storeType: string) => {
    if (!storeType || !autoAssignStoreId) return formData.storeId || ""
    const type = storeTypes.find((t) => t.value === storeType)
    if (!type) return ""
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${type.prefix}${randomNum}`
  }

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!formData.tradingName) newErrors.tradingName = "Store name is required"
    if (!formData.streetAddress) newErrors.streetAddress = "Street address is required"
    if (!formData.province) newErrors.province = "Province is required"
    if (!formData.storeType) newErrors.storeType = "Store type is required"

    // Validate dates
    if (formData.trainingDate && !isValidTimestamp(formData.trainingDate)) {
      newErrors.trainingDate = "Invalid training date"
      console.log("[validateForm] Invalid trainingDate:", formData.trainingDate)
    }
    if (formData.launchDate && !isValidTimestamp(formData.launchDate)) {
      newErrors.launchDate = "Invalid launch date"
      console.log("[validateForm] Invalid launchDate:", formData.launchDate)
    }

    console.log("[validateForm] Errors:", newErrors)
    return newErrors
  }

  const handleInputChange = (field: string, value: any) => {
    console.log("[handleInputChange] Field:", field, "Value:", value)
    if (field === "trainingDate" || field === "launchDate") {
      const parsedDate = parseDateTime(value)
      console.log("[handleInputChange] Parsed date for", field, ":", parsedDate)
      setFormData((prev) => ({
        ...prev,
        [field]: parsedDate,
      }))
      setErrors((prev) => ({ ...prev, [field]: parsedDate ? "" : "Invalid date" }))
    } else if (field === "contractTerms") {
      setFormData((prev) => ({
        ...prev,
        contractTerms: {
          ...(prev.contractTerms || {}),
          ...value,
        },
      }))
    } else if (field === "storeType") {
      setFormData((prev) => ({
        ...prev,
        storeType: value,
        storeId: generateStoreId(value),
      }))
    } else if (field === "storeId") {
      setFormData((prev) => ({
        ...prev,
        storeId: value,
      }))
      setAutoAssignStoreId(false)
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleContactPersonChange = (index: number, field: keyof ContactPerson, value: any) => {
    const updated = [...contactPersons]
    updated[index] = { ...updated[index], [field]: value }
    setContactPersons(updated)
  }

  const addContactPerson = () => {
    setContactPersons((prev) => [...prev, { name: "", phone: "", email: "", designation: "", isPrimary: false }])
  }

  const removeContactPerson = (index: number) => {
    setContactPersons((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, field: keyof Product, value: any) => {
    const updated = [...products]
    updated[index] = { ...updated[index], [field]: value }
    setProducts(updated)
  }

  const addProduct = () => {
    setProducts((prev) => [...prev, { name: "", description: "", retailPrice: 0, estimatedValue: 0 }])
  }

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCollectionTimeChange = (period: keyof CollectionTimes, field: "from" | "to", value: string) => {
    setCollectionTimes((prev) => ({
      ...prev,
      [period]: { ...prev[period], [field]: value },
    }))
  }

  const handleFileChange = (type: "sla" | "bank", file: File | null) => {
    if (!file) return
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [`${type}Document`]: "Only PDF, PNG, JPEG, TXT, or Word files are allowed",
      }))
      return
    }

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        [`${type}Document`]: "File size must be less than 5MB",
      }))
      return
    }

    setErrors((prev) => {
      const updatedErrors = { ...prev }
      delete updatedErrors[`${type}Document`]
      return updatedErrors
    })

    if (type === "sla") setSlaFile(file)
    else setBankFile(file)
  }

  const removeFile = (type: "sla" | "bank") => {
    if (type === "sla") {
      setSlaFile(null)
      setFormData((prev) => ({
        ...prev,
        signedSla: false,
        slaDocument: undefined,
      }))
      setErrors((prev) => {
        const updatedErrors = { ...prev }
        delete updatedErrors.slaDocument
        return updatedErrors
      })
    } else {
      setBankFile(null)
      setFormData((prev) => ({
        ...prev,
        bankConfirmation: false,
        bankDocument: undefined,
      }))
      setErrors((prev) => {
        const updatedErrors = { ...prev }
        delete updatedErrors.bankDocument
        return updatedErrors
      })
    }
  }

  const handleMarkAsError = async () => {
    if (!currentUserId) {
      setUploadError("User authentication required to mark store as error")
      console.log("[handleMarkAsError] No currentUserId")
      return
    }

    if (!errorDescription.trim()) {
      setErrors((prev) => ({
        ...prev,
        errorDescription: "Error description is required to mark as error",
      }))
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const errorStoreData: Partial<Store> = {
        id: store?.id || "",
        hasErrors: true,
        errorDescription: errorDescription,
        errorSetBy: currentUserId,
        errorSetAt: new Date(),
        updatedAt: new Date(),
      }

      if (store?.id) {
        await storeService.update(store.id, errorStoreData)
        const updatedStore: Store = {
          ...store,
          ...errorStoreData,
        }
        onSave(updatedStore)
        onClose()
      } else {
        setUploadError("Cannot mark a new store as error before saving")
      }
    } catch (error: any) {
      console.error("[handleMarkAsError] Error marking store as error:", error)
      setUploadError(error.message || "Failed to mark store as error. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    console.log("[handleSave] Form data:", formData)
    const newErrors = validateForm()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      console.log("[handleSave] Validation errors:", newErrors)
      return
    }
    if (!currentUserId) {
      setUploadError("User authentication required to save store")
      console.log("[handleSave] No currentUserId")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      let slaDocument: Document | undefined = formData.slaDocument
      let bankDocument: Document | undefined = formData.bankDocument

      if (slaFile) {
        const extension = slaFile.name.split(".").pop()?.toLowerCase() || "file"
        const path = `stores/${store?.id || `new-${Date.now()}`}/sla.${extension}`
        const url = await fileService.uploadFile(slaFile, path)
        slaDocument = {
          id: `sla-${Date.now()}`,
          name: slaFile.name,
          type: "sla",
          url,
          storeId: store?.id || `new-${Date.now()}`,
          uploadedBy: currentUserId,
          uploadedAt: new Date(),
        }
      }
      if (bankFile) {
        const extension = bankFile.name.split(".").pop()?.toLowerCase() || "file"
        const path = `stores/${store?.id || `new-${Date.now()}`}/bank.${extension}`
        const url = await fileService.uploadFile(bankFile, path)
        bankDocument = {
          id: `bank-${Date.now()}`,
          name: bankFile.name,
          type: "bank",
          url,
          storeId: store?.id || `new-${Date.now()}`,
          uploadedBy: currentUserId,
          uploadedAt: new Date(),
        }
      }

      const storeData: Store = {
        id: store?.id || "",
        tradingName: formData.tradingName || "",
        streetAddress: formData.streetAddress || "",
        province: formData.province || "",
        status: isMovingToClosed ? "closed" : formData.status || "lead",
        salespersonId: formData.salespersonId || currentUserId,
        isSetup: formData.isSetup || false,
        setupConfirmed: formData.setupConfirmed || false,
        setupConfirmedBy: formData.setupConfirmedBy || "",
        setupConfirmedAt: formData.setupConfirmedAt || undefined,
        trainingDate: formData.trainingDate || null,
        launchDate: formData.launchDate || null,
        pushedToRollout: formData.pushedToRollout || false,
        pushedToRolloutAt: formData.pushedToRolloutAt || undefined,
        pushedToRolloutBy: formData.pushedToRolloutBy || "",
        hasErrors: formData.hasErrors || false,
        errorDescription: formData.errorDescription || "",
        errorSetBy: formData.errorSetBy || "",
        errorSetAt: formData.errorSetAt || undefined,
        slaDocument,
        bankDocument,
        signedSla: !!slaDocument,
        bankConfirmation: !!bankDocument,
        isKeyStore: formData.isKeyStore || false,
        storeType: formData.storeType || "",
        storeId: formData.storeId || "",
        contactPersons: contactPersons.length > 0 ? contactPersons : [],
        products: products.length > 0 ? products : [],
        collectionTimes: Object.values(collectionTimes).some(
          (time) => (time as { from: string; to: string }).from || (time as { from: string; to: string }).to,
        )
          ? collectionTimes
          : {
            mondayFriday: { from: "", to: "" },
            saturday: { from: "", to: "" },
            sunday: { from: "", to: "" },
            publicHoliday: { from: "", to: "" },
          },
        contractTerms: formData.contractTerms || { months: undefined, notes: "" },
        notes: formData.notes || "",
        isKeyAccount: formData.isKeyAccount || false,
        keyAccountManager: formData.keyAccountManager || "",
        assignedOpsUsers: formData.assignedOpsUsers || [],
        groupId: formData.groupId || undefined,
        createdAt: store?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      console.log("[handleSave] Saving store data:", storeData)
      let savedStoreId: string
      if (store?.id) {
        await storeService.update(store.id, storeData)
        savedStoreId = store.id
      } else {
        savedStoreId = await storeService.create(storeData)
        storeData.id = savedStoreId
        if (formData.groupId) {
          try {
            await groupService.addStoreToGroup(formData.groupId, savedStoreId)
          } catch (groupError) {
            console.error("[handleSave] Error adding store to group:", groupError)
          }
        }
        onSave(storeData)
        onClose()
        window.location.reload() // Force reload after creating a new store
        return
      }

      if (formData.groupId && savedStoreId) {
        try {
          await groupService.addStoreToGroup(formData.groupId, savedStoreId)
        } catch (groupError) {
          console.error("[handleSave] Error adding store to group:", groupError)
        }
      }

      onSave(storeData)
      onClose()
    } catch (error: any) {
      console.error("[handleSave] Error saving store:", error)
      const errorMessage = error.message || "Failed to save store or upload documents. Please try again."
      setUploadError(errorMessage)

      try {
        const errorStoreData: Partial<Store> = {
          id: store?.id || "",
          hasErrors: true,
          errorDescription: errorMessage,
          errorSetBy: currentUserId,
          errorSetAt: new Date(),
          updatedAt: new Date(),
        }
        if (store?.id) {
          await storeService.update(store.id, errorStoreData)
        }
      } catch (updateError) {
        console.error("[handleSave] Error updating store with error information:", updateError)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleApplyToAll = (from: string, to: string) => {
    const updatedTimes: CollectionTimes = {
      mondayFriday: { from, to },
      saturday: { from, to },
      sunday: { from, to },
      publicHoliday: { from, to },
    }
    setCollectionTimes(updatedTimes)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-2" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl pt-2">
            {store?.id ? "Edit Store" : "Add New Store"}
            {isMovingToClosed && <Badge className="bg-green-100 text-green-800">Moving to Closed</Badge>}
          </DialogTitle>
        </DialogHeader>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        <style jsx>{`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>

        <Tabs defaultValue="basic" className="">
          <div className="flex justify-center">
            <TabsList
              className="
              grid w-full
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-4
              lg:grid-cols-4
              gap-2
              md:h-10
              h-20
              text-center
              shadow-sm
              "
            >
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {isSuperadmin && (
                <TabsTrigger value="superadmin">Superadmin</TabsTrigger>
              )}

            </TabsList>
          </div>

          <TabsContent value="basic" className="space-y-2">
            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Store Details</CardTitle>
              </CardHeader>
              <CardContent className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tradingName">Store Name *</Label>
                    <Input
                      id="tradingName"
                      value={formData.tradingName || ""}
                      onChange={(e) => handleInputChange("tradingName", e.target.value)}
                      placeholder="Enter store name"
                      className={errors.tradingName ? "border-red-500" : ""}
                    />
                    {errors.tradingName && <p className="text-red-500 text-sm mt-1">{errors.tradingName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province || ""}
                      onValueChange={(value) => handleInputChange("province", value)}
                    >
                      <SelectTrigger className={errors.province ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                  </div>
                  <div>
                    <Label htmlFor="storeType">Store Type *</Label>
                    <Select
                      value={formData.storeType || ""}
                      onValueChange={(value) => handleInputChange("storeType", value)}
                    >
                      <SelectTrigger className={errors.storeType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select store type" />
                      </SelectTrigger>
                      <SelectContent>
                        {storeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.storeType && <p className="text-red-500 text-sm mt-1">{errors.storeType}</p>}
                  </div>
                  <div>
                    <Label htmlFor="storeId">Store ID</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="storeId"
                        value={formData.storeId || ""}
                        onChange={(e) => handleInputChange("storeId", e.target.value)}
                        placeholder="Enter store ID (e.g., PF0001)"
                        className={errors.storeId ? "border-red-500" : ""}
                      />
                    </div>
                    {errors.storeId && <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>}
                  </div>
                </div>
                <div className="py-2">
                  <Label htmlFor="streetAddress">Street Address *</Label>
                  <Input
                    id="streetAddress"
                    value={formData.streetAddress || ""}
                    onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                    placeholder="Enter street address"
                    className={errors.streetAddress ? "border-red-500" : ""}
                  />
                  {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
                </div>

                <div>
                  <Label htmlFor="groupId" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Store Group (Optional)
                  </Label>
                  <Select
                    value={formData.groupId || "none"}
                    onValueChange={(value) => handleInputChange("groupId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Group</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} - {group.ownerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">Assign this store to a group for multi-store owners</p>
                </div>
                <div className="py-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isKeyAccount"
                      checked={formData.isKeyAccount || false}
                      onChange={(e) => handleInputChange("isKeyAccount", e.target.checked)}
                      className="h-4 w-4 text-orange-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="isKeyAccount">Key Account</Label>
                  </div>
                </div>
              </CardContent>
            </EditCard>

            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trainingDate">Training Date & Time</Label>
                    <Input
                      id="trainingDate"
                      type="datetime-local"
                      value={formatDateTimeForInput(formData.trainingDate)}
                      onChange={(e) => handleInputChange("trainingDate", e.target.value)}
                      className={errors.trainingDate ? "border-red-500" : ""}
                    />
                    {errors.trainingDate && <p className="text-red-500 text-sm mt-1">{errors.trainingDate}</p>}
                  </div>
                  <div>
                    <Label htmlFor="launchDate">Launch Date & Time</Label>
                    <Input
                      id="launchDate"
                      type="datetime-local"
                      value={formatDateTimeForInput(formData.launchDate)}
                      onChange={(e) => handleInputChange("launchDate", e.target.value)}
                      className={errors.launchDate ? "border-red-500" : ""}
                    />
                    {errors.launchDate && <p className="text-red-500 text-sm mt-1">{errors.launchDate}</p>}
                  </div>
                </div>
              </CardContent>
            </EditCard>

            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Contract</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractMonths">Months (No Commission)</Label>
                    <div className="flex items-center gap-4">
                      <Select
                        value={formData.contractTerms?.months ? String(formData.contractTerms.months) : ""}
                        onValueChange={(value) =>
                          handleInputChange("contractTerms", {
                            ...formData.contractTerms,
                            months: value === "" ? undefined : Number(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select months" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6].map((month) => (
                            <SelectItem key={month} value={String(month)}>
                              {month} month{month !== 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contractNotes">Notes</Label>
                    <Input
                      id="contractNotes"
                      value={formData.contractTerms?.notes || ""}
                      onChange={(e) =>
                        handleInputChange("contractTerms", {
                          ...formData.contractTerms,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional contract notes"
                    />
                  </div>
                </div>
                {formData.contractTerms?.months && store?.createdAt && (
                  <div className="mt-4 text-sm text-gray-700 text-right">
                    {(() => {
                      const createdAt = new Date(store.createdAt)
                      const expiryDate = new Date(createdAt)
                      expiryDate.setMonth(expiryDate.getMonth() + (formData.contractTerms.months || 0))
                      const now = new Date()
                      const diffMs = expiryDate.getTime() - now.getTime()
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      if (diffDays < 0) {
                        return (
                          <span className="text-red-600 font-semibold">
                            Expired {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? "s" : ""} ago
                          </span>
                        )
                      } else if (diffDays === 0) {
                        return <span className="text-orange-600 font-semibold">Expires today</span>
                      }
                      return (
                        <span className="text-green-600 font-semibold">
                          {diffDays} day{diffDays !== 1 ? "s" : ""} left of 0 comm
                          <br />
                          Expiry date: {formatDateTime(expiryDate)}
                        </span>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </EditCard>

            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Enter any additional notes about this store"
                  rows={4}
                />
              </CardContent>
            </EditCard>

            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Error Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="errorDescription"
                  value={errorDescription}
                  onChange={(e) => setErrorDescription(e.target.value)}
                  placeholder="Describe any errors with this store"
                  rows={4}
                  className={errors.errorDescription ? "border-red-500" : ""}
                />
                {errors.errorDescription && <p className="text-red-500 text-sm">{errors.errorDescription}</p>}
              </CardContent>
            </EditCard>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Contact Persons
                  <Button type="button" variant="outline" size="sm" onClick={addContactPerson}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactPersons.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No contacts added yet.</p>
                )}
                {contactPersons.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Contact {index + 1}</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeContactPerson(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => handleContactPersonChange(index, "name", e.target.value)}
                          placeholder="Contact name"
                        />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input
                          value={contact.designation}
                          onChange={(e) => handleContactPersonChange(index, "designation", e.target.value)}
                          placeholder="Job title"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => handleContactPersonChange(index, "phone", e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={contact.email}
                          onChange={(e) => handleContactPersonChange(index, "email", e.target.value)}
                          placeholder="Email address"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`primary-${index}`}
                        checked={contact.isPrimary || false}
                        onChange={(e) => handleContactPersonChange(index, "isPrimary", e.target.checked)}
                        className="h-4 w-4 text-orange-500 border-gray-300 rounded"
                      />
                      <Label htmlFor={`primary-${index}`}>Primary Contact</Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </EditCard>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Products
                  <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length === 0 && <p className="text-gray-500 text-center py-4">No products added yet.</p>}
                {products.map((product, index) => (
                  <div key={index} className=" rounded-xl p-4 space-y-4 bg-white/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white font-bold rounded-full">
                        {index + 1}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeProduct(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>



                    <div>
                      <Label>Name</Label>
                      <Input
                        value={product.name}
                        onChange={(e) => handleProductChange(index, "name", e.target.value)}
                        placeholder="Product name"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 w-full">
                      <div className="w-full">
                        <Label>Price</Label>
                        <Input
                          className="w-full"
                          type="text"
                          value={
                            product.retailPrice === undefined || product.retailPrice === 0
                              ? ""
                              : `R${product.retailPrice}`
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/^R/, "")
                            const sanitized = val.replace(/[^0-9.]/g, "")
                            if ((sanitized.match(/\./g) || []).length > 1) return
                            handleProductChange(index, "retailPrice", sanitized)
                          }}
                          placeholder="R0.00"
                          inputMode="decimal"
                          pattern="^\d*\.?\d*$"
                        />
                      </div>
                      <div className="w-full">
                        <Label>Value</Label>
                        <Input
                          className="w-full"
                          type="text"
                          value={
                            product.estimatedValue === undefined || product.estimatedValue === 0
                              ? ""
                              : `R${product.estimatedValue}`
                          }
                          onChange={(e) => {
                            const val = e.target.value.replace(/^R/, "")
                            const sanitized = val.replace(/[^0-9.]/g, "")
                            if ((sanitized.match(/\./g) || []).length > 1) return
                            handleProductChange(index, "estimatedValue", sanitized)
                          }}
                          placeholder="R0.00"
                          inputMode="decimal"
                          pattern="^\d*\.?\d*$"
                        />
                      </div>
                    </div>


                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={product.description}
                        onChange={(e) => handleProductChange(index, "description", e.target.value)}
                        placeholder="Product description"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </EditCard>

            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Collection Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(collectionTimes).map(([period, times], index) => (
                  <div
                    key={period}
                    className="flex flex-col md:grid md:grid-cols-3 gap-1 items-left relative"
                  >
                    <div className="md:col-span-1 flex justify-start">
                      <Label className="text-sm text-gray-600 capitalize text-left pt-4">
                        {period === "mondayFriday"
                          ? "Weekday"
                          : period === "saturday"
                            ? "Sat"
                            : period === "sunday"
                              ? "Sun"
                              : period === "publicHoliday"
                                ? "Public Holiday"
                                : period.charAt(0).toUpperCase() + period.slice(1)}
                      </Label>
                    </div>
                    <div className="flex flex-row gap-4 w-full md:col-span-2">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-400">From</Label>
                        <Input
                          type="time"
                          value={times.from}
                          onChange={(e) =>
                            handleCollectionTimeChange(period as keyof CollectionTimes, "from", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Label className="text-xs text-gray-400">To</Label>
                        <Input
                          type="time"
                          value={times.to}
                          onChange={(e) =>
                            handleCollectionTimeChange(period as keyof CollectionTimes, "to", e.target.value)
                          }
                        />
                        {index === 0 && (
                          <button
                            type="button"
                            className="absolute bottom-10 right-0 text-xs text-blue-600 underline mt-1"
                            onClick={() => handleApplyToAll(times.from, times.to)}
                          >
                            Apply to all
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </EditCard>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <EditCard>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="slaDocument" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Signed SLA {isMovingToClosed && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="file"
                      id="slaDocument"
                      accept="application/pdf,image/png,image/jpeg,image/jpg,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => handleFileChange("sla", e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="slaDocument"
                      className={`cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>
                    {(slaFile || formData.slaDocument) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{slaFile?.name || formData.slaDocument?.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("sla")}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {errors.slaDocument && <p className="text-red-500 text-sm mt-1">{errors.slaDocument}</p>}
                  <p className="text-sm text-gray-500 mt-1">Upload a PDF, PNG, JPEG, TXT, or Word file (max 5MB)</p>
                </div>

                <div>
                  <Label htmlFor="bankDocument" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bank Confirmation {isMovingToClosed && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="file"
                      id="bankDocument"
                      accept="application/pdf,image/png,image/jpeg,image/jpg,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => handleFileChange("bank", e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="bankDocument"
                      className={`cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>
                    {(bankFile || formData.bankDocument) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{bankFile?.name || formData.bankDocument?.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile("bank")}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {errors.bankDocument && <p className="text-red-500 text-sm mt-1">{errors.bankDocument}</p>}
                  <p className="text-sm text-gray-500 mt-1">Upload a PDF, PNG, JPEG, TXT, or Word file (max 5MB)</p>
                </div>
              </CardContent>
            </EditCard>
          </TabsContent>

          {isSuperadmin && (
            <TabsContent value="superadmin" className="space-y-6">
              <EditCard>
                <CardHeader>
                  <CardTitle className="text-lg">Copy Store Rollout Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label>Store Name</Label>
                      <Input value={formData.tradingName || ""} readOnly />
                    </div>
                    <div>
                      <Label>Street Address</Label>
                      <Input value={formData.streetAddress || ""} readOnly />
                    </div>
                    <div>
                      <Label>Province</Label>
                      <Input value={formData.province || ""} readOnly />
                    </div>
                    <div>
                      <Label>Store ID</Label>
                      <Input value={formData.storeId || ""} readOnly />
                    </div>
                    <div>
                      <Label>Products</Label>
                      <div className="space-y-2">
                        {products.length === 0 ? (
                          <p className="text-gray-500">No products added.</p>
                        ) : (
                          products.map((product, idx) => (
                            <div key={idx} className="border rounded p-2 bg-gray-50">
                              <div><strong>Name:</strong> {product.name}</div>
                              <div><strong>Description:</strong> {product.description}</div>
                              <div><strong>Retail Price:</strong> {product.retailPrice}</div>
                              <div><strong>Estimated Value:</strong> {product.estimatedValue}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => {
                      const info = {
                        StoreName: formData.tradingName,
                        StreetAddress: formData.streetAddress,
                        province: formData.province || "",

                        StoreID: formData.storeId,
                        Products: products,
                      }
                      navigator.clipboard.writeText(JSON.stringify(info, null, 2))
                    }}
                  >
                    Copy Info to Clipboard
                  </Button>
                </CardContent>
              </EditCard>
            </TabsContent>
          )}
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            onClick={handleMarkAsError}
            disabled={isUploading || !store?.id}
            className="bg-red-500 hover:bg-red-600"
          >
            <AlertCircle className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600" disabled={isUploading}>
            {isUploading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Saving...
              </span>
            ) : store?.id ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


