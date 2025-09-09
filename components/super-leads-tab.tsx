"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, UserIcon, DoorClosed, Flame, Snowflake, Share, KeySquare } from "lucide-react"
import {
    ContactsCell,
    ContractTermsCell,
    DocumentsCell,
    LaunchTrainDateCell,
    ProvinceCell,
    SalespersonCell,
    StoreInfoCell,
    StoreStatusBadge,
} from "./cells/index"
import type { Store, User } from "@/lib/firebase/types"
import { SearchInput, StatusFilter, AssignedOpsFilter, FilterBar, LEAD_STATUS_OPTIONS } from "@/components/shared/filters"
import { useState } from "react"
import { StoreDetailModal } from "./rollout/store-detail-modal"
import { Checkbox } from "@/components/ui/checkbox" // Assuming you have a Checkbox component from shadcn/ui
import { Label } from "@/components/ui/label"
import { AssignedOpsCell } from "./cells/assigned-ops-cell"

interface LeadsTabProps {
    stores: Store[]
    users: User[]
    currentUser: User | null
    salesPersonId?: string
    salespersonName?: string
    onAddStore: () => void
    onEditStore: (store: Store) => void
    onDeleteStore: (storeId: string) => void
    onStatusChange: (storeId: string, newStatus: Store["status"]) => void
    onViewDocument?: (store: Store, documentType: "sla" | "bank") => void
    onToggleSetup: (storeId: string) => Promise<void>
    onSetupConfirmation: (storeId: string) => Promise<void>
    updateCredentials: (storeId: string, credentials: Store['credentials']) => Promise<void>
}

export function SuperLeadsTab({
    stores,
    users,
    currentUser,
    onViewDocument,
    onEditStore,
    onDeleteStore,
    onStatusChange,
    onToggleSetup,
    onSetupConfirmation,
    updateCredentials,
}: LeadsTabProps) {
    // State for filters
    const [salespersonFilter, setSalespersonFilter] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [assignedOpsFilter, setAssignedOpsFilter] = useState<string>("")

    const [provinceFilter, setProvinceFilter] = useState<string>("")
    // State for modal
    const [selectedStore, setSelectedStore] = useState<Store | null>(null)
    const [modalMode, setModalMode] = useState<"share" | "confirmSetup">("share")
    // State for column visibility
    const [columnVisibility, setColumnVisibility] = useState({
        Creator: true,
        Assigned: true,
        Contact: true,
        Location: true,
        Dates: true,
        Docs: true,
        Contract: true,
    })

    const filters = {
        salespersonFilter,
        assignedOpsFilter,
        searchTerm,
        statusFilter,
        provinceFilter,
    }

    const hasActiveFilters =
        !!salespersonFilter || !!searchTerm || !!statusFilter || !!provinceFilter

    const clearFilters = () => {
        setSalespersonFilter("")
        setSearchTerm("")
        setStatusFilter("")
        setAssignedOpsFilter("")
        setProvinceFilter("")
    }

    const handleDeleteClick = (storeId: string, storeName: string) => {
        if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
            onDeleteStore(storeId)
        }
    }

    const isSuperadmin = currentUser?.role === "superadmin" || currentUser?.role === "salesperson"

    // Salesperson options
    const salespersonOptions = users.map((u) => ({
        value: u.id,
        label: u.name || u.email,
    }))

    // Province options
    const provinceOptions = Array.from(new Set(stores.map((s) => s.province))).map((province) => ({
        value: province,
        label: province,
    }))

    // Helper to handle "All" selection for filters
    const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        if (value === "All") clearFilters()
    }
    const handleSalespersonChange = (value: string) => {
        setSalespersonFilter(value)
        if (value === "All") clearFilters()
    }
    const handleProvinceChange = (value: string) => {
        setProvinceFilter(value)
        if (value === "All") clearFilters()
    }

    // Filter stores based on filters
    const filteredStores = stores.filter((store) => {
        const matchesSearch =
            !filters.searchTerm ||
            store.tradingName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            store.streetAddress?.toLowerCase().includes(filters.searchTerm.toLowerCase())

        const matchesStatus =
            !filters.statusFilter || filters.statusFilter === "All" || store.status === filters.statusFilter

        const matchesAssignedOps =
            !filters.assignedOpsFilter || filters.assignedOpsFilter === "All" || store.assignedOpsIds?.includes(filters.assignedOpsFilter)

        const matchesSalesperson =
            !filters.salespersonFilter || filters.salespersonFilter === "All" || store.salespersonId === filters.salespersonFilter

        const matchesProvince =
            !filters.provinceFilter || filters.provinceFilter === "All" || store.province === filters.provinceFilter

        return matchesSearch && matchesStatus && matchesSalesperson && matchesAssignedOps && matchesProvince
    })

    // Handler to open the modal
    const handleOpenModal = (store: Store, mode: "share" | "confirmSetup") => {
        setSelectedStore(store)
        setModalMode(mode)
    }

    // Handler for column visibility toggle
    const toggleColumn = (column: keyof typeof columnVisibility) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [column]: !prev[column],
        }))
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Leads Management</h2>
                    <p className="text-sm text-gray-600">Manage all user leads</p>
                </div>
            </div>

            <FilterBar>
                <SearchInput value={filters.searchTerm} onChange={setSearchTerm} placeholder="Search leads..." />
                <StatusFilter
                    value={filters.statusFilter}
                    onChange={handleStatusChange}
                    options={LEAD_STATUS_OPTIONS}
                    placeholder="Filter by status"
                />
                <StatusFilter
                    value={filters.salespersonFilter}
                    onChange={setSalespersonFilter}
                    options={[{ value: "All", label: "All Salespersons" }, ...salespersonOptions]}
                    placeholder="Filter by salesperson"
                />
                <StatusFilter
                    value={filters.provinceFilter}
                    onChange={setProvinceFilter}
                    options={[{ value: "All", label: "All Locations" }, ...provinceOptions]}
                    placeholder="Filter by location"
                />
                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto bg-transparent">
                        Clear Filters
                    </Button>
                )}
            </FilterBar>

            {/* Column Visibility Checkboxes */}
            <div className="flex flex-wrap gap-1 px-3">
                {Object.keys(columnVisibility).map((column) => {
                    const isVisible = columnVisibility[column as keyof typeof columnVisibility]
                    return (
                        <button
                            key={column}
                            type="button"
                            onClick={() => toggleColumn(column as keyof typeof columnVisibility)}
                            className={`px-3 py-1 rounded-full transition-colors text-sm font-medium ${isVisible
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-400"
                                }`}
                        >
                            {column}
                        </button>
                    )
                })}
            </div>

            {/* Leads Table */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>All Leads</CardTitle>
                    <CardDescription>Manage your sales pipeline</CardDescription>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Store</TableHead>
                                {columnVisibility.Creator && <TableHead>Creator</TableHead>}
                                {columnVisibility.Assigned && <TableHead>Ops</TableHead>}
                                <TableHead>ID</TableHead>
                                <TableHead>Status</TableHead>
                                {columnVisibility.Contact && <TableHead>Contact</TableHead>}
                                {columnVisibility.Location && <TableHead>Location</TableHead>}
                                {columnVisibility.Dates && <TableHead>Dates</TableHead>}
                                {columnVisibility.Docs && <TableHead>Docs</TableHead>}
                                {columnVisibility.Contract && <TableHead>Contract</TableHead>}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStores.map((store) => (
                                <TableRow key={store.id}>
                                    <StoreInfoCell tradingName={store.tradingName} streetAddress={store.streetAddress} />
                                    {columnVisibility.Creator && (
                                        <SalespersonCell isSuperadmin={isSuperadmin} salespersonId={store.salespersonId} users={users} />
                                    )}
                                    {columnVisibility.Assigned && (
                                        <AssignedOpsCell isSuperadmin={isSuperadmin} users={users} assignedOpsIds={store.assignedOpsIds ?? []} />
                                    )}
                                                                 <TableCell>{store.id}</TableCell>
                                    <StoreStatusBadge status={store.status} isKeyAccount={!!store.isKeyAccount} />
                                    {columnVisibility.Contact && (
                                        <ContactsCell contactPersons={store.contactPersons ?? []} />
                                    )}

                                    {columnVisibility.Location && <ProvinceCell province={store.province} />}

                                    {columnVisibility.Dates && (
                                        <LaunchTrainDateCell
                                            launchDate={store.launchDate}
                                            trainingDate={store.trainingDate}
                                        />
                                    )}
                                    {columnVisibility.Docs && <DocumentsCell store={store} onViewDocument={onViewDocument} />}
                                    {columnVisibility.Contract && (
                                        <ContractTermsCell
                                            contractTerms={store.contractTerms}
                                            // isKeyAccount={!!store.isKeyAccount}
                                        />
                                    )}
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                                onClick={() => handleDeleteClick(store.id, store.tradingName)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEditStore(store)}
                                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 bg-transparent"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenModal(store, "confirmSetup")}
                                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent"
                                            >
                                                <KeySquare className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Store Detail Modal */}
            {selectedStore && (
                <StoreDetailModal
                    store={selectedStore}
                    isOpen={!!selectedStore}
                    onClose={() => setSelectedStore(null)}
                    users={users}
                    currentUser={currentUser}
                    onToggleSetup={onToggleSetup}
                    onSetupConfirmation={onSetupConfirmation}
                    updateCredentials={updateCredentials}
                    mode={modalMode}
                />
            )}
        </div>
    )
}



