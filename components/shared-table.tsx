"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table } from "lucide-react"
import { TableHead, TableRow, TableBody } from "./ui/table"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => ReactNode
  className?: string
}

interface SharedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: (item: T) => ReactNode
  emptyMessage?: string
  mobileCardRender?: (item: T) => ReactNode
}

export function SharedTable<T extends { id?: string }>({
  data,
  columns,
  actions,
  emptyMessage = "No data available",
  mobileCardRender,
}: SharedTableProps<T>) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Mobile: Card-based layout */}
        <div className="block md:hidden space-y-4 p-4">
          {data.map((item, index) => (
            <Card key={item.id || index} className="p-4 bg-gray-50">
              {mobileCardRender ? (
                mobileCardRender(item)
              ) : (
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div key={String(column.key)} className="flex justify-between">
                      <span className="font-medium">{column.label}:</span>
                      <span>{column.render ? column.render(item) : String(item[column.key as keyof T] || "N/A")}</span>
                    </div>
                  ))}
                  {actions && <div className="flex gap-2 pt-2 border-t">{actions(item)}</div>}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <Table className="hidden md:table w-full" role="grid">
          <TableHead>
            <TableRow className="border-b bg-gray-50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`p-3 text-left text-sm font-medium ${column.className || ""}`}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="p-3 text-left text-sm font-medium" scope="col">
                  Actions
                </th>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id || index} className="hover:bg-gray-50 border-b">
                {columns.map((column) => (
                  <TableData key={String(column.key)} className={`p-3 text-sm ${column.className || ""}`}>
                    {column.render ? column.render(item) : String(item[column.key as keyof T] || "N/A")}
                  </TableData>
                ))}
                {actions && (
                  <TableData className="p-3">
                    <div className="flex gap-2">{actions(item)}</div>
                  </TableData>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
