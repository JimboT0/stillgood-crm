"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Store, User } from "@/lib/firebase/types"
import { subMonths, isAfter } from "date-fns"
import { ArrowDownRightSquare, ArrowLeftSquare } from "lucide-react"

interface PerformanceProps {
  stores: Store[]
  users: User[]
}

export function Performance({ stores, users }: PerformanceProps) {
  const now = new Date()
  const oneMonthAgo = subMonths(now, 1)
  const twoMonthsAgo = subMonths(now, 2)
  const threeMonthsAgo = subMonths(now, 3)
  const sixMonthsAgo = subMonths(now, 6)

  const userStoreCounts = users
    .map((user) => {
      const userStores = stores.filter(
        (store) => store.salespersonId === user.id && store.createdAt && store.pushedToRollout === true
      )
      const oneMonthCount = userStores.filter((store) => isAfter(new Date(store.createdAt!), oneMonthAgo)).length
      return {
        userId: user.id,
        userName: user.name || user.email,
        oneMonth: oneMonthCount,
        twoMonths: userStores.filter((store) => isAfter(new Date(store.createdAt!), twoMonthsAgo)).length,
        threeMonths: userStores.filter((store) => isAfter(new Date(store.createdAt!), threeMonthsAgo)).length,
        sixMonths: userStores.filter((store) => isAfter(new Date(store.createdAt!), sixMonthsAgo)).length,
      }
    })
    .filter((userCount) => userCount.sixMonths > 0)

  const sortedUserStoreCounts = userStoreCounts.sort((a, b) => b.oneMonth - a.oneMonth)

  const topPerformer = sortedUserStoreCounts.length > 0 ? sortedUserStoreCounts[0] : null

  const getPerformanceStatus = (count: number) => {
    if (count >= 15) {
      return { text: "Very Well", icon:<ArrowLeftSquare className="text-green-600" /> }
    } else if (count >= 8) {
      return { text: "Satisfactory", icon: <ArrowLeftSquare className="text-yellow-600" /> }
    } else {
      return { text: "", className: "", icon: <ArrowDownRightSquare className="text-red-600" /> }
    }
  }

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Last 1 Month</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Last 2 Months</TableHead>
                <TableHead>Last 3 Months</TableHead>
                <TableHead>Last 6 Months</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUserStoreCounts.map((userCount) => {
                const performance = getPerformanceStatus(userCount.oneMonth)
                return (
                  <TableRow key={userCount.userId}>
                    <TableCell>
                      {userCount.userName}
                      {topPerformer?.userId === userCount.userId && userCount.oneMonth > 0 && (
                        <span className="ml-2" title="Top Performer">🥇</span>
                      )}
                    </TableCell>
                    <TableCell>{userCount.oneMonth}</TableCell>
                    <TableCell className={performance.className}>
                      {performance.icon ? performance.icon : performance.text}
                    </TableCell>
                    <TableCell>{userCount.twoMonths}</TableCell>
                    <TableCell>{userCount.threeMonths}</TableCell>
                    <TableCell>{userCount.sixMonths}</TableCell>
                  </TableRow>
                )
              })}
              {sortedUserStoreCounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No users have onboarded rolled-out stores in the specified periods.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
