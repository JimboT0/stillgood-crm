


"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, Calendar, Trash2, Pencil, RotateCcw, AlertCircle, AlertTriangle, Siren, Skull, BatteryWarningIcon, CircleAlert, OctagonAlert } from "lucide-react";
import { StoreOpsView, User, Error } from "@/lib/firebase/types";
import { formatDateTime } from "@/lib/utils/date-utils";
import toast, { Toaster } from "react-hot-toast";
import { ProvinceCell } from "@/components/cells/province-cell";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";



export default function ErrorPage() {
  const { stores, users, currentUser, loading } = useDashboardData();
  console.log("ErrorPage stores:", stores); // Debug
  console.log("ErrorPage currentUser:", currentUser); // Debug

  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeSearchTerm, setStoreSearchTerm] = useState(""); // For searchable store dropdown
  const [urgency, setUrgency] = useState<1 | 2 | 3 | 4 | 5 | "">("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueType, setIssueType] = useState<
    "expired & spoiled" | "unexpired & spoiled" | "incorrect category" | "undervalue" | "damaged" | "invalid" | ""
  >("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState(""); // For table/card search
  const [sortMode, setSortMode] = useState<"errors-desc" | "errors-asc">("errors-desc");
  const [editError, setEditError] = useState<{ storeId: string; error: Error } | null>(null);
  const isSuperadmin = currentUser?.role === "superadmin";
  const [reloadTrigger, setReloadTrigger] = useState(0);



  // Available issue types
  const issueTypes = [
    "expired & spoiled",
    "unexpired & spoiled",
    "incorrect category",
    "undervalue",
    "damaged",
    "invalid",
  ] as const;

  // Handle form submission for new error
  const handleSubmitError = async () => {
    if (!selectedStoreId || !urgency || !issueDescription || !issueType || !issueDate) {
      toast.error("Please fill in all required fields", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
      return;
    }


    if (stores.length === 0) {
      toast.error("No stores available to log errors", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
      return;
    }

    try {
      const store = stores.find((s) => s.id === selectedStoreId);
      if (!store) {
        toast.error("Selected store not found", {
          style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
        });
        return;
      }

      const newError: Error = {
        id: `error-${Date.now()}`,
        urgency: urgency as 1 | 2 | 3 | 4 | 5,
        issueDescription,
        issueType: issueType as Error["issueType"],
        issueTime: new Date(issueDate),
      };

      // Update Firestore
      await updateDoc(doc(db, "stores", store.id), {
        errors: [...(store.errors || []), newError],
      });

      toast.success("Error logged successfully!", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });

      // Reset form
      setUrgency("");
      setIssueDescription("");
      setIssueType("");
      setIssueDate("");
    } catch (error) {
      console.error("Error logging error:", error);
      toast.error("Failed to log error", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
    }
  };

  // Handle edit error
  const handleEditError = async () => {
    if (!editError || !urgency || !issueDescription || !issueType || !issueDate) {
      toast.error("Please fill in all required fields", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
      return;
    }

    try {
      const store = stores.find((s) => s.id === editError.storeId);
      if (!store) {
        toast.error("Store not found", {
          style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
        });
        return;
      }

      const updatedErrors = (store.errors || []).map((err) =>
        err.id === editError.error.id
          ? {
            ...err,
            urgency: urgency as 1 | 2 | 3 | 4 | 5,
            issueDescription,
            issueType: issueType as Error["issueType"],
            issueTime: new Date(issueDate),
          }
          : err
      );

      // Update Firestore
      await updateDoc(doc(db, "stores", store.id), {
        errors: updatedErrors,
      });

      toast.success("Error updated successfully!", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });

      // Reset form and close modal
      setEditError(null);
      setUrgency("");
      setIssueDescription("");
      setIssueType("");
      setIssueDate("");
    } catch (error) {
      console.error("Error updating error:", error);
      toast.error("Failed to update error", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
    }
  };

  // Handle delete error
  const handleDeleteError = async (storeId: string, errorId: string) => {
    try {
      const store = stores.find((s) => s.id === storeId);
      if (!store) {
        toast.error("Store not found", {
          style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
        });
        return;
      }

      const updatedErrors = (store.errors || []).filter((err) => err.id !== errorId);

      // Update Firestore
      await updateDoc(doc(db, "stores", store.id), {
        errors: updatedErrors,
      });

      toast.success("Error deleted successfully!", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
    } catch (error) {
      console.error("Error deleting error:", error);
      toast.error("Failed to delete error", {
        style: { background: "#fff", color: "#111827", border: "1px solid #f97316" },
      });
    }
  };

  // Set date to today or yesterday
  const setDateToToday = () => {
    const today = new Date();
    setIssueDate(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    );
  };

  const setDateToYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setIssueDate(
      `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSortMode("errors-desc");
  };

  // Filter stores for dropdown (searchable)
  const filteredDropdownStores = useMemo(() => {
    if (!storeSearchTerm) return stores;
    return stores.filter((store) =>
      store.tradingName?.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  }, [stores, storeSearchTerm]);

  // Filter and sort stores for errors and stores views
  const filteredAndSortedStores = useMemo(() => {
    let result = stores;

    // Apply text search (always active)
    if (searchTerm) {
      result = result.filter((store) =>
        store.tradingName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by number of errors
    result = [...result].sort((a, b) => {
      const aErrors = (a.errors || []).length;
      const bErrors = (b.errors || []).length;
      return sortMode === "errors-desc" ? bErrors - aErrors : aErrors - bErrors;
    });

    console.log("ErrorPage filtered and sorted stores:", result); // Debug
    return result;
  }, [stores, searchTerm, sortMode]);

  // Get all errors across filtered and sorted stores for errors view
  const allErrors = useMemo(() => {
    const errors = filteredAndSortedStores
      .flatMap((store) =>
        (store.errors || []).map((error) => {
          // Handle Firestore Timestamp or plain Date
          const issueTime =
            error.issueTime instanceof Date
              ? error.issueTime
              : (typeof error.issueTime === "object" && error.issueTime !== null && "toDate" in error.issueTime)
                ? (error.issueTime as { toDate: () => Date }).toDate()
                : new Date(error.issueTime as string); // fallback

          return { store, error: { ...error, issueTime } };
        })
      )
      .sort((a, b) => b.error.issueTime.getTime() - a.error.issueTime.getTime());
    return errors;
  }, [filteredAndSortedStores]);

  // Get stores with errors for stores view (filtered and sorted)
  const storesWithErrors = useMemo(() => {
    return filteredAndSortedStores.filter((store) => (store.errors || []).length > 0);
  }, [filteredAndSortedStores]);

  // Open edit modal
  const openEditModal = (storeId: string, error: Error) => {
    setEditError({ storeId, error });
    setUrgency(error.urgency);
    setIssueDescription(error.issueDescription);
    setIssueType(error.issueType as typeof issueType);
    setIssueDate(
      `${error.issueTime.getFullYear()}-${String(error.issueTime.getMonth() + 1).padStart(2, "0")}-${String(
        error.issueTime.getDate()
      ).padStart(2, "0")}`
    );
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading error log data...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!currentUser) {
    return (
      <div className="text-red-500 text-center py-4" role="alert">
        Please log in to view the error log.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Card>
        <CardHeader>
          <CardTitle>{editError ? "Edit Error" : "Log New Error"}</CardTitle>
          <CardDescription>
            {editError ? "Edit an existing store error" : "Enter details to log a new store error"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between w-full"
                >
                  <span className="truncate max-w-[180px] block">
                    {editError
                      ? stores.find((s) => s.id === editError.storeId)?.tradingName || "Select Store"
                      : selectedStoreId
                        ? stores.find((s) => s.id === selectedStoreId)?.tradingName || "Select Store"
                        : "Select Store"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px]">
                <Command>
                  <CommandInput placeholder="Search store..." />
                  <CommandList>
                    <CommandEmpty>No store found.</CommandEmpty>
                    <CommandGroup>
                      {stores.map((store) => (
                        <CommandItem
                          key={store.id}
                          onSelect={() => {
                            if (!editError) setSelectedStoreId(store.id);
                          }}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate max-w-[180px] block">{store.tradingName || `Store ${store.id}`}</span>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedStoreId === store.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>   <Select
              value={urgency.toString()}
              onValueChange={(value) => setUrgency(Number(value) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Urgency" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { level: 1, icon: <AlertCircle size={16} className="mr-2 text-blue-500" />, label: "Minor" },
                  { level: 2, icon: <OctagonAlert size={16} className="mr-2 text-purple-500" />, label: "Low" },
                  { level: 3, icon: <AlertTriangle size={16} className="mr-2 text-yellow-500" />, label: "Moderate" },
                  { level: 4, icon: <Siren size={16} className="mr-2 text-orange-500" />, label: "High" },
                  { level: 5, icon: <Skull size={16} className="mr-2 text-red-500" />, label: "Critical" },
                ].map(({ level, icon, label }) => (
                  <SelectItem key={level} value={level.toString()}>
                    <div className="flex items-center">
                      {icon}
                      {level} - {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Issue Description"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />

            <Select value={issueType} onValueChange={(value) => setIssueType(value as typeof issueType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Issue Type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2">
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-row gap-1">
              <Button
                onClick={setDateToToday}
                size="icon"
                className="py-2 text-[10px] h-8 text-xs"
                style={{ minWidth: "10px" }}
              >
                T
              </Button>
              <Button
                onClick={setDateToYesterday}
                size="icon"
                className="py-2 text-[10px] h-8 text-xs"
                style={{ minWidth: "10px" }}
              >
                Y
              </Button>
              </div>   
              <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (editError) {
                    await handleEditError();
                  } else {
                    await handleSubmitError();
                  }
                  setReloadTrigger((prev) => prev + 1);
                  window.location.reload();
                }}
                disabled={stores.length === 0}
                className="border-2 border-red-400 bg-white hover:bg-red-200 text-red-400"
              >
                {editError ? "Update Error" : "Log Error"}
              </Button>
              {editError && (
                <Button variant="outline" onClick={() => setEditError(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="errors" className="mt-6">
        <TabsList>
          <TabsTrigger value="errors">Logged Errors</TabsTrigger>
          <TabsTrigger value="stores">Stores with Errors</TabsTrigger>
        </TabsList>
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Logged Errors</CardTitle>
              <CardDescription>View all logged store errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by store name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as typeof sortMode)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="errors-desc">Most Errors</SelectItem>
                    <SelectItem value="errors-asc">Fewest Errors</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Issue Description</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Errors Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allErrors.map(({ store, error }, index) => (
                    <TableRow key={`${store.id}-${error.id}-${index}`}>
                      <TableCell>{store.tradingName || `Store ${store.id}`}</TableCell>
                      <ProvinceCell province={store.province || "N/A"} />
                      <TableCell>
                        <div className="flex items-center">
                          {(() => {
                            switch (error.urgency) {
                              case 1:
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                    <AlertCircle size={14} />
                                    Minor
                                  </span>
                                );
                              case 2:
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                    <OctagonAlert size={14} />
                                    Low
                                  </span>
                                );
                              case 3:
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                    <AlertTriangle size={14} />
                                    Moderate
                                  </span>
                                );
                              case 4:
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                    <Siren size={14} />
                                    High
                                  </span>
                                );
                              case 5:
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                    <Skull size={14} />
                                    Critical
                                  </span>
                                );
                              default:
                                return <span className="text-gray-600">N/A</span>;
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="flex items-center justify-center gap-1 p-2 rounded text-xs bg-gray-100 text-orange-400">
                          {error.issueType}
                        </span>
                      </TableCell>   <TableCell>{error.issueDescription}</TableCell>
                      <TableCell>{formatDateTime(error.issueTime)}</TableCell>
                      <TableCell>{(store.errors || []).length}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              openEditModal(store.id, error);
                              setReloadTrigger((prev) => prev + 1);
                            }}
                            disabled={!isSuperadmin}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await handleDeleteError(store.id, error.id);
                              setReloadTrigger((prev) => prev + 1);
                              window.location.reload(); // Reload the page after action
                            }}
                            disabled={!isSuperadmin}

                          >
                            <Trash2 size={16} />
                          </Button>   </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {allErrors.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "Try adjusting your search criteria" : "No errors have been logged"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Stores with Errors</CardTitle>
              <CardDescription>View stores sorted by error count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by store name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as typeof sortMode)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="errors-desc">Most Errors</SelectItem>
                    <SelectItem value="errors-asc">Fewest Errors</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {storesWithErrors.map((store, index) => (
                  <Card key={store.id || `unknown-${index}`} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {store.tradingName || `Store ${store.id}`}
                      </CardTitle>
                      <CardDescription>
                        <ProvinceCell province={store.province || "N/A"} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-gray-600">
                        Errors: {(store.errors || []).length}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {storesWithErrors.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stores with errors</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "Try adjusting your search criteria" : "No stores have logged errors"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
