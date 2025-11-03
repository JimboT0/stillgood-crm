"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, AlertTriangle, Siren, Skull, OctagonAlert } from "lucide-react"
import type { StoreOpsView, User } from "@/lib/firebase/types"
import { ProvinceCell } from "@/components/cells/province-cell"
import { formatDateTime } from "@/lib/utils/date-utils"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckCircle } from "lucide-react"

interface OpsErrorsTabProps {
  stores: StoreOpsView[]
  currentUser: User | null
}

export function OpsErrorsTab({ stores, currentUser }: OpsErrorsTabProps) {
  const storesWithErrors = useMemo(() => {
    return stores
      .filter((store) => (store.errors || []).length > 0)
      .sort((a, b) => (b.errors || []).length - (a.errors || []).length)
  }, [stores])

  const allErrors = useMemo(() => {
    return storesWithErrors
      .flatMap((store) =>
        (store.errors || []).map((error) => {
          const issueTime =
            error.issueTime instanceof Date
              ? error.issueTime
              : typeof error.issueTime === "object" && error.issueTime !== null && "toDate" in error.issueTime
                ? (error.issueTime as { toDate: () => Date }).toDate()
                : new Date(error.issueTime as string)

          return { store, error: { ...error, issueTime } }
        }),
      )
      .sort((a, b) => b.error.issueTime.getTime() - a.error.issueTime.getTime())
  }, [storesWithErrors])

  const getUrgencyBadge = (urgency: number) => {
    switch (urgency) {
      case 1:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
            <AlertCircle size={14} />
            Minor
          </span>
        )
      case 2:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
            <OctagonAlert size={14} />
            Low
          </span>
        )
      case 3:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
            <AlertTriangle size={14} />
            Moderate
          </span>
        )
      case 4:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
            <Siren size={14} />
            High
          </span>
        )
      case 5:
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
            <Skull size={14} />
            Critical
          </span>
        )
      default:
        return <span className="text-gray-600">N/A</span>
    }
  }

  if (storesWithErrors.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={CheckCircle}
            title="No errors found"
            description="All stores are operating without logged errors"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stores with Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storesWithErrors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allErrors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {allErrors.filter((e) => e.error.urgency >= 4).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stores with Logged Errors</CardTitle>
          <CardDescription>Stores requiring attention sorted by error count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Error Count</TableHead>
                  <TableHead>Latest Error</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storesWithErrors.map((store) => {
                  const latestError = (store.errors || []).sort((a, b) => {
                    const aTime =
                      a.issueTime instanceof Date
                        ? a.issueTime
                        : typeof a.issueTime === "object" && "toDate" in a.issueTime
                          ? (a.issueTime as { toDate: () => Date }).toDate()
                          : new Date(a.issueTime as string)
                    const bTime =
                      b.issueTime instanceof Date
                        ? b.issueTime
                        : typeof b.issueTime === "object" && "toDate" in b.issueTime
                          ? (b.issueTime as { toDate: () => Date }).toDate()
                          : new Date(b.issueTime as string)
                    return bTime.getTime() - aTime.getTime()
                  })[0]

                  const latestErrorTime =
                    latestError.issueTime instanceof Date
                      ? latestError.issueTime
                      : typeof latestError.issueTime === "object" && "toDate" in latestError.issueTime
                        ? (latestError.issueTime as { toDate: () => Date }).toDate()
                        : new Date(latestError.issueTime as string)

                  return (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.tradingName || `Store ${store.id}`}</TableCell>
                      <ProvinceCell province={store.province || "N/A"} />
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-red-500 rounded-full">
                          {(store.errors || []).length}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(latestErrorTime)}</TableCell>
                      <TableCell>{getUrgencyBadge(latestError.urgency)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
