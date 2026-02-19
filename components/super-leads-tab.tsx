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
    ChecklistCell,
} from "./cells/index"
import type { Store, User } from "@/lib/firebase/types"
import { SearchInput, StatusFilter, AssignedOpsFilter, FilterBar, LEAD_STATUS_OPTIONS } from "@/components/shared/filters"
import { useState } from "react"
import { StoreDetailModal } from "./rollout/store-detail-modal"
import { AssignedOpsCell } from "./cells/assigned-ops-cell"
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, subMonths } from "date-fns" // Add date-fns for date manipulation

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
    const [dateFilter, setDateFilter] = useState<string>("All") // New state for date filter

    const [selectedStore, setSelectedStore] = useState<Store | null>(null)
    const [modalMode, setModalMode] = useState<"share" | "confirmSetup">("share")
    const [columnVisibility, setColumnVisibility] = useState({
        Creator: true,
        Assigned: true,
        Contact: true,
        Location: true,
        Dates: true,
        Docs: true,
        Contract: true,
        Checklist: true,
    })

    const filters = {
        salespersonFilter,
        assignedOpsFilter,
        searchTerm,
        statusFilter,
        provinceFilter,
        dateFilter,
    }

    const hasActiveFilters =
        !!salespersonFilter || !!searchTerm || !!statusFilter || !!provinceFilter || dateFilter !== "All"

    const clearFilters = () => {
        setSalespersonFilter("")
        setSearchTerm("")
        setStatusFilter("")
        setAssignedOpsFilter("")
        setProvinceFilter("")
        setDateFilter("All")
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

    // Date filter options
    const dateFilterOptions = [
        { value: "All", label: "All Time" },
        { value: "This Week", label: "This Week" },
        { value: "Previous Week", label: "Previous Week" },
        { value: "Past Month", label: "Past Month" },
    ]

    // Helper to handle filter changes
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
    const handleDateChange = (value: string) => {
        setDateFilter(value)
        if (value === "All") clearFilters()
    }

    // Date range helper
    const getDateRange = (filter: string) => {
        const now = new Date()
        switch (filter) {
            case "This Week":
                return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
            case "Previous Week":
                return {
                    start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
                    end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
                }
            case "Past Month":
                return { start: startOfMonth(subMonths(now, 1)), end: now }
            default:
                return { start: null, end: null }
        }
    }

    // Filter and sort stores
    const filteredStores = stores
        .filter((store) => {
            const matchesSearch =
                !filters.searchTerm ||
                store.tradingName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                store.streetAddress?.toLowerCase().includes(filters.searchTerm.toLowerCase())

            const matchesStatus =
                !filters.statusFilter || filters.statusFilter === "All" || store.status === filters.statusFilter

            const matchesAssignedOps =
                !filters.assignedOpsFilter ||
                filters.assignedOpsFilter === "All" ||
                store.assignedOpsIds?.includes(filters.assignedOpsFilter)

            const matchesSalesperson =
                !filters.salespersonFilter ||
                filters.salespersonFilter === "All" ||
                store.salespersonId === filters.salespersonFilter

            const matchesProvince =
                !filters.provinceFilter ||
                filters.provinceFilter === "All" ||
                store.province === filters.provinceFilter

            const { start, end } = getDateRange(filters.dateFilter)
            const matchesDate =
                !start || !end || !store.createdAt
                    ? true
                    : new Date(store.createdAt) >= start && new Date(store.createdAt) <= end

            return matchesSearch && matchesStatus && matchesSalesperson && matchesAssignedOps && matchesProvince && matchesDate
        })
        .sort((a, b) => {
            // Sort by createdAt in descending order (most recent first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

    const handleOpenModal = (store: Store, mode: "share" | "confirmSetup") => {
        setSelectedStore(store)
        setModalMode(mode)
    }

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
                    <h2 className="text-xl font-semibold text-foreground">Leads Management</h2>
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
                <StatusFilter
                    value={filters.dateFilter}
                    onChange={handleDateChange}
                    options={dateFilterOptions}
                    placeholder="Filter by date"
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
                            className={`px-3 py-1 rounded-full transition-colors text-sm font-medium ${
                                isVisible ? "bg-background text-foreground" : "bg-gray-100 text-gray-400"
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
                                <TableHead>Status</TableHead>
                                {columnVisibility.Contact && <TableHead>Contact</TableHead>}
                                {columnVisibility.Location && <TableHead>Location</TableHead>}
                                {columnVisibility.Dates && <TableHead>Dates</TableHead>}
                                {columnVisibility.Docs && <TableHead>Docs</TableHead>}
                                {columnVisibility.Contract && <TableHead>Contract</TableHead>}
                                {columnVisibility.Checklist && <TableHead>Checklist</TableHead>}
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
                                    <StoreStatusBadge status={store.status} isKeyAccount={!!store.isKeyAccount} />
                                    {columnVisibility.Contact && (
                                        <ContactsCell contactPersons={store.contactPersons ?? []} />
                                    )}
                                    {columnVisibility.Location && <ProvinceCell province={store.province || ""} />}
                                    {columnVisibility.Dates && (
                                        <LaunchTrainDateCell
                                            launchDate={store.launchDate}
                                            trainingDate={store.trainingDate}
                                        />
                                    )}
                                    {columnVisibility.Docs && <DocumentsCell store={store} onViewDocument={onViewDocument} />}
                                    {columnVisibility.Contract && (
                                        <ContractTermsCell contractTerms={store.contractTerms} />
                                    )}
                                    {columnVisibility.Checklist && (
                                        <ChecklistCell checklist={store.onboardingChecklist} />
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
