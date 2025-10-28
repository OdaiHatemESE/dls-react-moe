"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, FileText, Calendar } from "lucide-react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { format } from "date-fns";

export function UpdateLogsTable() {
  const { data, isLoading } = useSWR("/api/admin/analytics/updates?limit=50", jsonFetcher);

  const updates = data?.updates || [];
  const stats = data?.stats || {};

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-aegreen-100 text-aegreen-700 border-aegreen-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <FileText className="w-3 h-3 mr-1" />
            Requested
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Updates</p>
            <p className="text-2xl font-bold text-foreground">{stats.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-aegreen-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-aegreen-700 dark:text-aegreen-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-aegreen-700 dark:text-aegreen-400">
              {stats.completed || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-yellow-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {stats.pending || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-aegold-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-aegold-700 dark:text-aegold-400 mb-1">With Agreement</p>
            <p className="text-2xl font-bold text-aegold-700 dark:text-aegold-400">
              {stats.withConductAgreement || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Updates Table */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Update Activity Logs</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track who accessed and updated their information
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No update logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Emirates ID</TableHead>
                    <TableHead>Parent Person ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conduct Agreement</TableHead>
                    <TableHead>Citizenship</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updates.map((update: any) => (
                    <TableRow key={update.Id}>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {update.studentEmirateId || update.studentPersonId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {update.parentPersonId || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(update.infoUpdateRequestStatus)}</TableCell>
                      <TableCell>
                        {update.isConductAgreementSigned ? (
                          <Badge className="bg-aegreen-100 text-aegreen-700 border-aegreen-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Not Signed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{update.citizenship || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {update.updateAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(update.updateAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {update.createAt ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(update.createAt), "MMM dd, yyyy")}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
