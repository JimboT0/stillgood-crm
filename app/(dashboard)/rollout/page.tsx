"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Search, ChevronsUpDown, Check } from "lucide-react"
import { ProvinceCell, StoreInfoCell } from "@/components/cells/index"
import type { province, Store, User } from "@/lib/firebase/types"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { db } from "@/lib/firebase/config"
import { doc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, onSnapshot } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { Timestamp } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define South African provinces from types.ts
const provinces: province[] = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
]

interface Rollout {
    id: string
    province: province
    area: string
    startDate?: string | Timestamp
    endDate?: string | Timestamp
    storeIds: string[]
}

// Rollout Management Functions
async function createRollout(
    province: province,
    area: string,
    currentUser: User | null,
    startDate?: string,
    endDate?: string
): Promise<void> {
    if (!currentUser || currentUser.role !== "superadmin") {
        throw new Error("Only superadmins can create rollouts")
    }

    const rolloutId = uuidv4()
    const rollout: Rollout = {
        id: rolloutId,
        province,
        area,
        startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : Timestamp.now(),
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : undefined,
        storeIds: [],
    }

    try {
        const rolloutRef = doc(db, "rollouts", rolloutId)
        await setDoc(rolloutRef, rollout)
        toast({
            title: "Success",
            description: `Rollout block for ${area} created successfully`,
        })
    } catch (error) {
        console.error("Error creating rollout:", error)
        toast({
            title: "Error",
            description: "Failed to create rollout",
            variant: "destructive",
        })
        throw new Error("Failed to create rollout")
    }
}

async function editRollout(
    rolloutId: string,
    updates: Partial<Omit<Rollout, 'id'>>,
    currentUser: User | null
): Promise<void> {
    if (!currentUser || currentUser.role !== "superadmin") {
        throw new Error("Only superadmins can edit rollouts")
    }

    try {
        const rolloutRef = doc(db, "rollouts", rolloutId)
        const processedUpdates = {
            ...updates,
            startDate: updates.startDate ? Timestamp.fromDate(
                updates.startDate instanceof Timestamp ? updates.startDate.toDate() : new Date(updates.startDate)
            ) : undefined,
            endDate: updates.endDate ? Timestamp.fromDate(
                updates.endDate instanceof Timestamp ? updates.endDate.toDate() : new Date(updates.endDate)
            ) : undefined,
        }
        await updateDoc(rolloutRef, processedUpdates)
        toast({
            title: "Success",
            description: "Rollout updated successfully",
        })
    } catch (error) {
        console.error("Error editing rollout:", error)
        toast({
            title: "Error",
            description: "Failed to edit rollout",
            variant: "destructive",
        })
        throw new Error("Failed to edit rollout")
    }
}

async function deleteRollout(
    rolloutId: string,
    currentUser: User | null
): Promise<void> {
    if (!currentUser || currentUser.role !== "superadmin") {
        throw new Error("Only superadmins can delete rollouts")
    }

    try {
        const rolloutRef = doc(db, "rollouts", rolloutId)
        await deleteDoc(rolloutRef)
        toast({
            title: "Success",
            description: "Rollout deleted successfully",
        })
    } catch (error) {
        console.error("Error deleting rollout:", error)
        toast({
            title: "Error",
            description: "Failed to delete rollout",
            variant: "destructive",
        })
        throw new Error("Failed to delete rollout")
    }
}

async function assignStoresToRollout(
    rolloutId: string,
    storeIds: string[],
    currentUser: User | null
): Promise<void> {
    if (!currentUser) {
        throw new Error("User must be authenticated")
    }

    try {
        const rolloutRef = doc(db, "rollouts", rolloutId)
        await updateDoc(rolloutRef, {
            storeIds: arrayUnion(...storeIds),
        })
        toast({
            title: "Success",
            description: `Added ${storeIds.length} store(s) successfully`,
        })
    } catch (error) {
        console.error("Error assigning stores to rollout:", error)
        toast({
            title: "Error",
            description: "Failed to assign stores to rollout",
            variant: "destructive",
        })
        throw new Error("Failed to assign stores to rollout")
    }
}

async function removeStoreFromRollout(
    rolloutId: string,
    storeId: string,
    currentUser: User | null
): Promise<void> {
    if (!currentUser) {
        throw new Error("User must be authenticated")
    }

    try {
        const rolloutRef = doc(db, "rollouts", rolloutId)
        await updateDoc(rolloutRef, {
            storeIds: arrayRemove(storeId),
        })
        toast({
            title: "Success",
            description: "Store removed successfully",
        })
    } catch (error) {
        console.error("Error removing store from rollout:", error)
        toast({
            title: "Error",
            description: "Failed to remove store from rollout",
            variant: "destructive",
        })
        throw new Error("Failed to remove store from rollout")
    }
}

interface RolloutsTabProps {
    stores?: Store[]
    users?: User[]
}

export default function RolloutsTab({ stores = [], users = [] }: RolloutsTabProps) {
    const { currentUser, stores: dashboardStores, users: dashboardUsers } = useDashboardData()
    const effectiveStores = stores.length > 0 ? stores : dashboardStores ?? []
    const effectiveUsers = users.length > 0 ? users : dashboardUsers ?? []
    const [rollouts, setRollouts] = useState<Rollout[]>([])
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedRollout, setSelectedRollout] = useState<Rollout | null>(null)
    const [newRolloutData, setNewRolloutData] = useState<{ province: province; area: string; startDate?: string; endDate?: string }>({
        province: provinces[0],
        area: "",
    })
    const [editRolloutData, setEditRolloutData] = useState<{ province: province; area: string; startDate?: string; endDate?: string }>({
        province: provinces[0],
        area: "",
    })
    const [tabValue, setTabValue] = useState("current")
    const [pastRollouts, setPastRollouts] = useState<Rollout[]>([])

    const isSuperadmin = currentUser?.role === "superadmin"


    // Debug logging for stores and user
    useEffect(() => {
        console.log("RolloutsTab props.stores:", stores)
        console.log("RolloutsTab dashboardStores:", dashboardStores)
        console.log("RolloutsTab effectiveStores:", effectiveStores)
        console.log("RolloutsTab currentUser:", currentUser)
        console.log("RolloutsTab rollouts:", rollouts)
    }, [stores, dashboardStores, effectiveStores, currentUser, rollouts])

    // Real-time listener for rollouts
    useEffect(() => {
        const now = new Date()
        const unsubscribe = onSnapshot(collection(db, "rollouts"), (snapshot) => {
            const rolloutData: Rollout[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    province: data.province,
                    area: data.area,
                    startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
                    endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
                    storeIds: data.storeIds || [],
                }
            })
            setRollouts(rolloutData.filter((r) => !r.endDate || (r.endDate instanceof Timestamp ? r.endDate.toDate() : new Date(r.endDate)) >= now))
            if (tabValue === "past") {
                setPastRollouts(rolloutData.filter((r) => r.endDate && (r.endDate instanceof Timestamp ? r.endDate.toDate() : new Date(r.endDate)) < now))
            }
        }, (error) => {
            console.error("Error fetching rollouts:", error)
            toast({
                title: "Error",
                description: "Failed to fetch rollouts",
                variant: "destructive",
            })
        })

        return () => unsubscribe()
    }, [tabValue])

    function groupByProvince(rolloutsList: Rollout[]): Map<string, Rollout[]> {
        const map = new Map<string, Rollout[]>()
        for (const r of rolloutsList) {
            if (!map.has(r.province)) {
                map.set(r.province, [])
            }
            map.get(r.province)!.push(r)
        }
        return map
    }

    const currentGroups = groupByProvince(rollouts)
    const pastGroups = groupByProvince(pastRollouts)

    const colors = ["bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-purple-100", "bg-pink-100", "bg-indigo-100"]

    function getProvinceColor(province: string): string {
        let hash = 0
        for (let i = 0; i < province.length; i++) {
            hash = province.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }

    const handleOpenAssign = (rollout: Rollout) => {
        setSelectedRollout(rollout)
        setIsAssignModalOpen(true)
    }

    const handleOpenEdit = (rollout: Rollout) => {
        setSelectedRollout(rollout)
        setEditRolloutData({
            province: rollout.province,
            area: rollout.area,
            startDate: rollout.startDate instanceof Timestamp
                ? rollout.startDate.toDate().toISOString().split('T')[0]
                : rollout.startDate,
            endDate: rollout.endDate instanceof Timestamp
                ? rollout.endDate.toDate().toISOString().split('T')[0]
                : rollout.endDate,
        })
        setIsEditModalOpen(true)
    }

    const handleAddRollout = async () => {
        try {
            await createRollout(
                newRolloutData.province,
                newRolloutData.area,
                currentUser,
                newRolloutData.startDate,
                newRolloutData.endDate
            )
            setIsAddModalOpen(false)
            setNewRolloutData({ province: provinces[0], area: "", startDate: undefined, endDate: undefined })
        } catch (error) {
            // Error toast is handled in createRollout
        }
    }

    const handleEditRollout = async () => {
        if (!selectedRollout) return
        try {
            await editRollout(selectedRollout.id, editRolloutData, currentUser)
            setIsEditModalOpen(false)
            setSelectedRollout(null)
        } catch (error) {
            // Error toast is handled in editRollout
        }
    }

    const handleDeleteRollout = async (rolloutId: string) => {
        if (window.confirm("Are you sure you want to delete this rollout?")) {
            try {
                await deleteRollout(rolloutId, currentUser)
            } catch (error) {
                // Error toast is handled in deleteRollout
            }
        }
    }

    const handleAssignStores = async (storeIds: string[]) => {
        if (!selectedRollout) return
        try {
            await assignStoresToRollout(selectedRollout.id, storeIds, currentUser)
            setIsAssignModalOpen(false)
            setSelectedRollout(null)
        } catch (error) {
            // Error toast is handled in assignStoresToRollout
        }
    }

    const handleRemoveStore = async (rolloutId: string, storeId: string) => {
        try {
            await removeStoreFromRollout(rolloutId, storeId, currentUser)
        } catch (error) {
            // Error toast is handled in removeStoreFromRollout
        }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Rollouts Management</h2>
                    <p className="text-sm text-gray-600">Manage rollout blocks by province and area</p>
                </div>
                {isSuperadmin && (
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" /> Add New Rollout Block
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Rollout Block</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="province" className="text-right">
                                        Province
                                    </Label>
                                    <Select
                                        value={newRolloutData.province}
                                        onValueChange={(value) =>
                                            setNewRolloutData({ ...newRolloutData, province: value as province })
                                        }
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select Province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((prov) => (
                                                <SelectItem key={prov} value={prov}>
                                                    {prov}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="area" className="text-right">
                                        Area
                                    </Label>
                                    <Input
                                        id="area"
                                        value={newRolloutData.area}
                                        onChange={(e) =>
                                            setNewRolloutData({ ...newRolloutData, area: e.target.value })
                                        }
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="startDate" className="text-right">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={newRolloutData.startDate || ""}
                                        onChange={(e) =>
                                            setNewRolloutData({ ...newRolloutData, startDate: e.target.value })
                                        }
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="endDate" className="text-right">
                                        End Date
                                    </Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={newRolloutData.endDate || ""}
                                        onChange={(e) =>
                                            setNewRolloutData({ ...newRolloutData, endDate: e.target.value })
                                        }
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddRollout}
                                    disabled={!newRolloutData.province || !newRolloutData.area}
                                >
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Tabs defaultValue="current" value={tabValue} onValueChange={setTabValue}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Current Rollouts</TabsTrigger>
                    <TabsTrigger value="past">Past Rollouts</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                    <h3 className="text-lg font-medium">Current Rollouts</h3>
                    {currentGroups.size === 0 ? (
                        <p className="text-gray-600">No current rollouts</p>
                    ) : (
                        Array.from(currentGroups).map(([province, rs]) => (
                            <div key={province} className="mb-6">
                                <h4 className="text-md font-medium mb-2">{province}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rs.map((rollout) => {
                                        const color = getProvinceColor(rollout.province)
                                        const assignedStores = rollout.storeIds
                                            .map((id) => effectiveStores.find((s) => s.id === id))
                                            .filter((store): store is Store => !!store)

                                        return (
                                            <Card key={rollout.id} className={`${color}`}>
                                                <CardHeader>
                                                    <CardTitle>{rollout.area}</CardTitle>
                                                    <CardDescription>
                                                        {rollout.startDate
                                                            ? format(
                                                                rollout.startDate instanceof Timestamp
                                                                    ? rollout.startDate.toDate()
                                                                    : new Date(rollout.startDate),
                                                                "PPP"
                                                            )
                                                            : "N/A"}{" "}
                                                        -{" "}
                                                        {rollout.endDate
                                                            ? format(
                                                                rollout.endDate instanceof Timestamp
                                                                    ? rollout.endDate.toDate()
                                                                    : new Date(rollout.endDate),
                                                                "PPP"
                                                            )
                                                            : "N/A"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <h5 className="font-medium mb-2">Assigned Stores ({assignedStores.length})</h5>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Store</TableHead>
                                                                <TableHead>Location</TableHead>
                                                                <TableHead>Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {assignedStores.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={3}>No stores assigned</TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                assignedStores.map((store) => (
                                                                    <TableRow key={store.id}>
                                                                        <StoreInfoCell
                                                                            tradingName={store.tradingName || ""}
                                                                            streetAddress={store.streetAddress || ""}
                                                                        />
                                                                        <ProvinceCell province={store.province || ""} />
                                                                        <TableCell>
                                                                            {isSuperadmin && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="text-red-600 hover:text-red-700"
                                                                                    onClick={() => handleRemoveStore(rollout.id, store.id)}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    <div className="flex gap-2 mt-4">
                                                        <Button onClick={() => handleOpenAssign(rollout)}>Assign Stores</Button>
                                                        {isSuperadmin && (
                                                            <>
                                                                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleOpenEdit(rollout)}
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-2" /> Edit
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Rollout Block</DialogTitle>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-4">
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="edit-province" className="text-right">
                                                                                    Province
                                                                                </Label>
                                                                                <Select
                                                                                    value={editRolloutData.province}
                                                                                    onValueChange={(value) =>
                                                                                        setEditRolloutData({
                                                                                            ...editRolloutData,
                                                                                            province: value as province,
                                                                                        })
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="col-span-3">
                                                                                        <SelectValue placeholder="Select Province" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {provinces.map((prov) => (
                                                                                            <SelectItem key={prov} value={prov}>
                                                                                                {prov}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="edit-area" className="text-right">
                                                                                    Area
                                                                                </Label>
                                                                                <Input
                                                                                    id="edit-area"
                                                                                    value={editRolloutData.area}
                                                                                    onChange={(e) =>
                                                                                        setEditRolloutData({
                                                                                            ...editRolloutData,
                                                                                            area: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className="col-span-3"
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="edit-startDate" className="text-right">
                                                                                    Start Date
                                                                                </Label>
                                                                                <Input
                                                                                    id="edit-startDate"
                                                                                    type="date"
                                                                                    value={editRolloutData.startDate || ""}
                                                                                    onChange={(e) =>
                                                                                        setEditRolloutData({
                                                                                            ...editRolloutData,
                                                                                            startDate: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className="col-span-3"
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label htmlFor="edit-endDate" className="text-right">
                                                                                    End Date
                                                                                </Label>
                                                                                <Input
                                                                                    id="edit-endDate"
                                                                                    type="date"
                                                                                    value={editRolloutData.endDate || ""}
                                                                                    onChange={(e) =>
                                                                                        setEditRolloutData({
                                                                                            ...editRolloutData,
                                                                                            endDate: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className="col-span-3"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={() => setIsEditModalOpen(false)}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                            <Button
                                                                                onClick={handleEditRollout}
                                                                                disabled={!editRolloutData.province || !editRolloutData.area}
                                                                            >
                                                                                Save
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                <Button
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() => handleDeleteRollout(rollout.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>
                <TabsContent value="past">
                    <h3 className="text-lg font-medium">Past Rollouts</h3>
                    {pastGroups.size === 0 ? (
                        <p className="text-gray-600">No past rollouts</p>
                    ) : (
                        Array.from(pastGroups).map(([province, rs]) => (
                            <div key={province} className="mb-6">
                                <h4 className="text-md font-medium mb-2">{province}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rs.map((rollout) => {
                                        const color = getProvinceColor(rollout.province)
                                        const assignedStores = rollout.storeIds
                                            .map((id) => effectiveStores.find((s) => s.id === id))
                                            .filter((store): store is Store => !!store)
                                            .filter((store) => store.pushedToRollout === true);

                                        return (
                                            <Card key={rollout.id} className={`${color}`}>
                                                <CardHeader>
                                                    <CardTitle>{rollout.area}</CardTitle>
                                                    <CardDescription>
                                                        {rollout.startDate
                                                            ? format(
                                                                rollout.startDate instanceof Timestamp
                                                                    ? rollout.startDate.toDate()
                                                                    : new Date(rollout.startDate),
                                                                "PPP"
                                                            )
                                                            : "N/A"}{" "}
                                                        -{" "}
                                                        {rollout.endDate
                                                            ? format(
                                                                rollout.endDate instanceof Timestamp
                                                                    ? rollout.endDate.toDate()
                                                                    : new Date(rollout.endDate),
                                                                "PPP"
                                                            )
                                                            : "N/A"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <h5 className="font-medium mb-2">Assigned Stores ({assignedStores.length})</h5>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Store</TableHead>
                                                                <TableHead>Location</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {assignedStores.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={2}>No stores assigned</TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                assignedStores.map((store) => (
                                                                    <TableRow key={store.id}>
                                                                        <StoreInfoCell
                                                                            tradingName={store.tradingName || ""}
                                                                            streetAddress={store.streetAddress || ""}
                                                                        />
                                                                        <ProvinceCell province={store.province || ""} />
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {selectedRollout && (
                <AssignStoresModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    rollout={selectedRollout}
                    stores={effectiveStores}
                    currentUser={currentUser}
                    users={effectiveUsers}
                    onAssign={handleAssignStores}
                />
            )}
        </div>
    )
}

interface AssignStoresModalProps {
    isOpen: boolean
    onClose: () => void
    rollout: Rollout
    stores: Store[]
    currentUser: User | null
    users: User[]
    onAssign: (storeIds: string[]) => void
}

function AssignStoresModal({
    isOpen,
    onClose,
    rollout,
    stores = [],
    currentUser,
    users = [],
    onAssign,
}: AssignStoresModalProps) {
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
    const [storeSearchTerm, setStoreSearchTerm] = useState("")

    const isSuperadmin = currentUser?.role === "superadmin"

    // Debug logging for filtered stores
    useEffect(() => {
        console.log("AssignStoresModal stores:", stores)
        console.log("AssignStoresModal rollout:", rollout)
        console.log("AssignStoresModal filteredStores:", filteredStores)
        console.log("AssignStoresModal currentUser:", currentUser)
    }, [stores, rollout])

    const filteredStores = stores
        .filter((s) => s.pushedToRollout === true)
        .filter((s) => s.province && s.province === rollout.province)
        .filter((s) => !rollout.storeIds.includes(s.id))
        .filter((s) => {
            // Filter stores that fall within the rollout date range
            if (!s.launchDate || !rollout.startDate) return true;

            const storeLaunchDate = s.launchDate instanceof Timestamp
                ? s.launchDate.toDate()
                : new Date(s.launchDate);

            const rolloutStartDate = rollout.startDate instanceof Timestamp
                ? rollout.startDate.toDate()
                : new Date(rollout.startDate);

            const rolloutEndDate = rollout.endDate
                ? (rollout.endDate instanceof Timestamp
                    ? rollout.endDate.toDate()
                    : new Date(rollout.endDate))
                : null;

            // Store launch date should be within or after rollout start date
            if (storeLaunchDate < rolloutStartDate) return false;

            // If there's an end date, store launch date should be before or on end date
            if (rolloutEndDate && storeLaunchDate > rolloutEndDate) return false;

            return true;
        })
        .filter((s) => s.tradingName?.toLowerCase().includes(storeSearchTerm.toLowerCase()) || storeSearchTerm === "")
        .map((store) => ({
            value: store.id,
            label: store.tradingName || `Store ${store.id}`,
            store,
        }))




    const handleToggle = (storeId: string) => {
        setSelectedStoreIds((prev) =>
            prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
        )
    }

    const handleSubmit = () => {
        onAssign(selectedStoreIds)
        setSelectedStoreIds([])
        setStoreSearchTerm("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Assign Stores to {rollout.area} ({rollout.province})</DialogTitle>
                </DialogHeader>
                {stores.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">No stores available to assign</p>
                ) : (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div className="overflow-y-auto max-h-[400px] border rounded-md">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-[50px]">Select</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStores.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                No available stores in {rollout.province}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStores.map(({ store }) => (
                                            <TableRow key={store.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedStoreIds.includes(store.id)}
                                                        onCheckedChange={() => handleToggle(store.id)}
                                                    />
                                                </TableCell>
                                                <StoreInfoCell
                                                    tradingName={store.tradingName || ""}
                                                    streetAddress={store.streetAddress || ""}
                                                />
                                                <TableCell>
                                                    {store.launchDate
                                                        ? (() => {
                                                            try {
                                                                const date = store.launchDate instanceof Timestamp
                                                                    ? store.launchDate.toDate()
                                                                    : new Date(store.launchDate);
                                                                
                                                                if (isNaN(date.getTime())) {
                                                                    return "Invalid date";
                                                                }
                                                                
                                                                return format(date, "MMM dd, yyyy");
                                                            } catch (error) {
                                                                return "Invalid date";
                                                            }
                                                        })()
                                                        : "No date"}
                                                </TableCell>
                                                <ProvinceCell province={store.province || ""} />
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={selectedStoreIds.length === 0}>
                        Assign Selected ({selectedStoreIds.length})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}