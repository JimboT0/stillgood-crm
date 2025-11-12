"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditCard, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { storeService } from "@/lib/firebase/services/store"
import { formatDateTimeForInput, parseDateTime, timestampToDate } from "../../lib/utils/date-utils"
import { isValidTimestamp } from "@/lib/date-validation"
import type { Store, CollectionTimes, Product } from "@/lib/firebase/types"
import { PROVINCES } from "@/lib/firebase/types"
import { bagPresets } from "../../lib/data/bag-presets"
import { Timestamp } from "firebase/firestore"

interface CorporateStoreEditModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onSave: (store: Store) => void
  currentUserId?: string
  initialStoreCount?: number
}

const storeTypes = [
  { value: "spar_corporate", label: "Spar Corporate", prefix: "SC" },
  { value: "picknpay_corporate", label: "PicknPay Corporate", prefix: "PC" },
] as const;

interface StoreFormData {
  tradingName: string
  streetAddress: string
  province: string
  storeType: string
  storeId: string
  notes: string
  errorDescription: string
  launchDate: Timestamp | null
  trainingDate: Timestamp | null
  collectionTimes: CollectionTimes
}

export function CorporateStoreEditModal({
  store,
  isOpen,
  onClose,
  onSave,
  currentUserId,
  initialStoreCount = 1,
}: CorporateStoreEditModalProps) {
  const [storeForms, setStoreForms] = useState<StoreFormData[]>([])
  const [errors, setErrors] = useState<Record<string, string>[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Initialize empty store form
  const emptyStoreForm: StoreFormData = {
    tradingName: "",
    streetAddress: "",
    province: "",
    storeType: "",
    storeId: "",
    notes: "",
    errorDescription: "",
    launchDate: null,
    trainingDate: null,
    collectionTimes: {
      mondayFriday: { from: "", to: "" },
      saturday: { from: "", to: "" },
      sunday: { from: "", to: "" },
      publicHoliday: { from: "", to: "" },
    },
  }

  // Initialize forms based on store or initialStoreCount
  useEffect(() => {
    if (store && isOpen) {
      let trainingDate: Timestamp | null = null
      let launchDate: Timestamp | null = null
      
      if (store.trainingDate) {
        if (store.trainingDate instanceof Timestamp) {
          trainingDate = store.trainingDate
        } else if (isValidTimestamp(store.trainingDate)) {
          // Convert plain timestamp object to proper Timestamp
          const date = timestampToDate(store.trainingDate)
          trainingDate = Timestamp.fromDate(date)
        } else {
          trainingDate = parseDateTime(store.trainingDate) as Timestamp | null
        }
      }
      
      if (store.launchDate) {
        if (store.launchDate instanceof Timestamp) {
          launchDate = store.launchDate
        } else if (isValidTimestamp(store.launchDate)) {
          // Convert plain timestamp object to proper Timestamp
          const date = timestampToDate(store.launchDate)
          launchDate = Timestamp.fromDate(date)
        } else {
          launchDate = parseDateTime(store.launchDate) as Timestamp | null
        }
      }
      const collectionTimes: CollectionTimes = {
        mondayFriday: {
          from: store.collectionTimes?.mondayFriday?.from || "",
          to: store.collectionTimes?.mondayFriday?.to || "",
        },
        saturday: {
          from: store.collectionTimes?.saturday?.from || "",
          to: store.collectionTimes?.saturday?.to || "",
        },
        sunday: {
          from: store.collectionTimes?.sunday?.from || "",
          to: store.collectionTimes?.sunday?.to || "",
        },
        publicHoliday: {
          from: store.collectionTimes?.publicHoliday?.from || "",
          to: store.collectionTimes?.publicHoliday?.to || "",
        },
      }
      setStoreForms([
        {
          tradingName: store.tradingName || "",
          streetAddress: store.streetAddress || "",
          province: store.province || "",
          storeType: store.storeType || "",
          storeId: store.storeId || "",
          notes: store.notes || "",
          errorDescription: store.errorDescription || "",
          launchDate,
          trainingDate,
          collectionTimes,
        },
      ])
      setErrors([{}])
      setUploadError(null)
    } else if (isOpen) {
      setStoreForms(
        Array.from({ length: Math.max(1, initialStoreCount) }, () => ({ ...emptyStoreForm }))
      )
      setErrors(Array.from({ length: Math.max(1, initialStoreCount) }, () => ({})))
      setUploadError(null)
    }
  }, [store, isOpen, initialStoreCount])

  const generateStoreId = (storeType: string, index: number) => {
    const type = storeTypes.find((t) => t.value === storeType)
    if (!type) return ""
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${type.prefix}${randomNum}-${index}`
  }

  const validateForm = (form: StoreFormData, index: number): Record<string, string> => {
    const newErrors: Record<string, string> = {}
    if (!form.tradingName) newErrors.tradingName = "Store name is required"
    if (!form.streetAddress) newErrors.streetAddress = "Street address is required"
    if (!form.province) newErrors.province = "Province is required"
    if (!form.storeType) newErrors.storeType = "Store type is required"
    if (form.launchDate && !isValidTimestamp(form.launchDate)) {
      newErrors.launchDate = "Invalid launch date"
    }
    if (form.trainingDate && !isValidTimestamp(form.trainingDate)) {
      newErrors.trainingDate = "Invalid training date"
    }
    return newErrors
  }

  const handleInputChange = (index: number, field: string, value: any) => {
    setStoreForms((prev) => {
      const updated = [...prev]
      if (field === "trainingDate" || field === "launchDate") {
        let parsedDate: Timestamp | null = null
        if (value && typeof value === "string" && value.trim() !== "") {
          const dateObj = new Date(value)
          if (!isNaN(dateObj.getTime())) {
            parsedDate = Timestamp.fromDate(dateObj)
          }
        } else if (value) {
          // If it's already a Timestamp or valid timestamp object, use parseDateTime
          parsedDate = parseDateTime(value) as Timestamp | null
        }
        updated[index] = { ...updated[index], [field]: parsedDate }
        setErrors((prevErrors) => {
          const updatedErrors = [...prevErrors]
          updatedErrors[index] = {
            ...updatedErrors[index],
            [field]: parsedDate ? "" : "Invalid date",
          }
          return updatedErrors
        })
      } else if (field === "storeType") {
        updated[index] = {
          ...updated[index],
          storeType: value,
          storeId: generateStoreId(value, index),
        }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }

  const handleCollectionTimeChange = (
    index: number,
    period: keyof CollectionTimes,
    field: "from" | "to",
    value: string
  ) => {
    setStoreForms((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        collectionTimes: {
          ...updated[index].collectionTimes,
          [period]: { ...updated[index].collectionTimes[period], [field]: value },
        },
      }
      return updated
    })
  }

  const handleApplyToAll = (index: number, from: string, to: string) => {
    setStoreForms((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        collectionTimes: {
          mondayFriday: { from, to },
          saturday: { from, to },
          sunday: { from, to },
          publicHoliday: { from, to },
        },
      }
      return updated
    })
  }

  const addStoreForm = () => {
    setStoreForms((prev) => [...prev, { ...emptyStoreForm }])
    setErrors((prev) => [...prev, {}])
  }

  const removeStoreForm = (index: number) => {
    setStoreForms((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!currentUserId) {
      setUploadError("User authentication required to save stores")
      return
    }

    const allErrors: Record<string, string>[] = storeForms.map((form, index) => validateForm(form, index))
    setErrors(allErrors)

    if (allErrors.some((err) => Object.keys(err).length > 0)) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      for (const [index, form] of storeForms.entries()) {
        const products: Product[] = form.storeType
          ? bagPresets[form.storeType.includes("picknpay") ? "pnp" : "spar"].map((bag) => ({
              name: bag.name.replace(/ - value bag$/i, ""),
              description: bag.description || "",
              retailPrice: bag.retailPrice || 0,
              estimatedValue: bag.estimatedValue || bag.retailPrice || 0,
            }))
          : []

        const storeData: Store = {
          id: store?.id && index === 0 ? store.id : "",
          tradingName: form.tradingName,
          streetAddress: form.streetAddress,
          province: form.province,
          storeType: form.storeType,
          storeId: form.storeId,
          notes: form.notes,
          errorDescription: form.errorDescription,
          launchDate: form.launchDate,
          trainingDate: form.trainingDate,
          errors: [],
          collectionTimes: Object.values(form.collectionTimes).some(
            (time) => time.from || time.to
          )
            ? form.collectionTimes
            : {
                mondayFriday: { from: "", to: "" },
                saturday: { from: "", to: "" },
                sunday: { from: "", to: "" },
                publicHoliday: { from: "", to: "" },
              },
          products,
          status: "rollout",
          salespersonId: currentUserId,
          isSetup: false,
          setupConfirmed: false,
          setupConfirmedBy: "",
          setupConfirmedAt: undefined,
          pushedToRollout: true,
          pushedToRolloutAt: Timestamp.fromDate(new Date()),
          pushedToRolloutBy: currentUserId,
          hasErrors: !!form.errorDescription,
          errorSetBy: form.errorDescription ? currentUserId : "",
          errorSetAt: form.errorDescription ? new Date() : undefined,
          createdAt: store?.createdAt && index === 0 ? store.createdAt : new Date(),
          updatedAt: new Date(),
          isKeyStore: false,
          isKeyAccount: false,
          keyAccountManager: "",
          assignedOpsUsers: [],
          contactPersons: [],
          contractTerms: { months: undefined, notes: "" },
          slaDocument: undefined,
          bankDocument: undefined,
          bankConfirmation: false,
          signedSla: false,
          bankConfirmationEmail: "",
          whatsappGroupLink: "",
          newleaddetails: [],
          groupId: undefined,
        }

        let savedStoreId: string
        if (store?.id && index === 0) {
          await storeService.update(store.id, storeData)
          savedStoreId = store.id
        } else {
          savedStoreId = await storeService.create(storeData)
          storeData.id = savedStoreId
        }

        onSave(storeData)
      }

      onClose()
      window.location.reload()
    } catch (error: any) {
      console.error("[handleSave] Error saving stores:", error)
      setUploadError(error.message || "Failed to save stores. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-2" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl pt-2">
            {store?.id ? "Edit Store" : `Add ${storeForms.length} Corporate Store${storeForms.length !== 1 ? "s" : ""}`}
          </DialogTitle>
        </DialogHeader>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        <div className="space-y-6">
          {storeForms.map((form, index) => (
            <EditCard key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Store {index + 1}
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStoreForm(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`tradingName-${index}`}>Store Name *</Label>
                    <Input
                      id={`tradingName-${index}`}
                      value={form.tradingName ?? ""}
                      onChange={(e) => handleInputChange(index, "tradingName", e.target.value)}
                      placeholder="Enter store name"
                      className={errors[index]?.tradingName ? "border-red-500" : ""}
                    />
                    {errors[index]?.tradingName && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].tradingName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`streetAddress-${index}`}>Street Address *</Label>
                    <Input
                      id={`streetAddress-${index}`}
                      value={form.streetAddress ?? ""}
                      onChange={(e) => handleInputChange(index, "streetAddress", e.target.value)}
                      placeholder="Enter street address"
                      className={errors[index]?.streetAddress ? "border-red-500" : ""}
                    />
                    {errors[index]?.streetAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].streetAddress}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`province-${index}`}>Province *</Label>
                    <Select
                      value={form.province}
                      onValueChange={(value) => handleInputChange(index, "province", value)}
                    >
                      <SelectTrigger className={errors[index]?.province ? "border-red-500" : ""}>
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
                    {errors[index]?.province && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].province}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`storeType-${index}`}>Store Type *</Label>
                    <Select
                      value={form.storeType}
                      onValueChange={(value) => handleInputChange(index, "storeType", value)}
                    >
                      <SelectTrigger className={errors[index]?.storeType ? "border-red-500" : ""}>
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
                    {errors[index]?.storeType && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].storeType}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`storeId-${index}`}>Store ID</Label>
                    <Input
                      id={`storeId-${index}`}
                      value={form.storeId ?? ""}
                      onChange={(e) => handleInputChange(index, "storeId", e.target.value)}
                      placeholder="Auto-generated (e.g., SC0001)"
                      className={errors[index]?.storeId ? "border-red-500" : ""}
                    />
                    {errors[index]?.storeId && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].storeId}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor={`notes-${index}`}>Notes</Label>
                  <Textarea
                    id={`notes-${index}`}
                    value={form.notes ?? ""}
                    onChange={(e) => handleInputChange(index, "notes", e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor={`errorDescription-${index}`}>Error Description</Label>
                  <Textarea
                    id={`errorDescription-${index}`}
                    value={form.errorDescription ?? ""}
                    onChange={(e) => handleInputChange(index, "errorDescription", e.target.value)}
                    placeholder="Describe any errors with this store"
                    rows={4}
                    className={errors[index]?.errorDescription ? "border-red-500" : ""}
                  />
                  {errors[index]?.errorDescription && (
                    <p className="text-red-500 text-sm mt-1">{errors[index].errorDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`trainingDate-${index}`}>Training Date & Time</Label>
                    <Input
                      id={`trainingDate-${index}`}
                      type="datetime-local"
                      value={form.trainingDate ? formatDateTimeForInput(form.trainingDate) : ""}
                      onChange={(e) => handleInputChange(index, "trainingDate", e.target.value)}
                      className={errors[index]?.trainingDate ? "border-red-500" : ""}
                    />
                    {errors[index]?.trainingDate && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].trainingDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`launchDate-${index}`}>Launch Date & Time</Label>
                    <Input
                      id={`launchDate-${index}`}
                      type="datetime-local"
                      value={form.launchDate ? formatDateTimeForInput(form.launchDate) : ""}
                      onChange={(e) => handleInputChange(index, "launchDate", e.target.value)}
                      className={errors[index]?.launchDate ? "border-red-500" : ""}
                    />
                    {errors[index]?.launchDate && (
                      <p className="text-red-500 text-sm mt-1">{errors[index].launchDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Collection Times</Label>
                  {Object.entries(form.collectionTimes).map(([period, times], timeIndex) => (
                    <div
                      key={`${index}-${period}`}
                      className="flex flex-col md:grid md:grid-cols-3 gap-1 items-left relative"
                    >
                      <div className="md:col-span-1 flex justify-start">
                        <Label className="text-sm text-gray-600 capitalize text-left pt-4">
                          {period === "mondayFriday"
                            ? "Weekday"
                            : period === "publicHoliday"
                              ? "Holiday"
                              : period === "saturday"
                                ? "Sat"
                                : period === "sunday"
                                  ? "Sun"
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
                              handleCollectionTimeChange(index, period as keyof CollectionTimes, "from", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1 relative">
                          <Label className="text-xs text-gray-400">To</Label>
                          <Input
                            type="time"
                            value={times.to}
                            onChange={(e) =>
                              handleCollectionTimeChange(index, period as keyof CollectionTimes, "to", e.target.value)
                            }
                          />
                          {timeIndex === 0 && (
                            <button
                              type="button"
                              className="absolute bottom-10 right-0 text-xs text-blue-600 underline mt-1"
                              onClick={() => handleApplyToAll(index, times.from, times.to)}
                            >
                              Apply to all
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </EditCard>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addStoreForm}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Store
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600"
            disabled={isUploading}
          >
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
              "Create Stores"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
