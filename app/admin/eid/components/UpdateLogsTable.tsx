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

  const students = data?.students || [];
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Activity</p>
            <p className="text-2xl font-bold text-foreground">{stats.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-aegreen-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-aegreen-700 dark:text-aegreen-400 mb-1">Info Updated</p>
            <p className="text-2xl font-bold text-aegreen-700 dark:text-aegreen-400">
              {stats.infoUpdated || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-blue-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Conduct Signed</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.conductSigned || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-aegold-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-aegold-700 dark:text-aegold-400 mb-1">Both Completed</p>
            <p className="text-2xl font-bold text-aegold-700 dark:text-aegold-400">
              {stats.bothCompleted || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Information Updates Table */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Information Updates & Conduct Agreements</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track student information updates and conduct agreement signatures
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No information update records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Info</TableHead>
                    <TableHead>Emirates ID</TableHead>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Info Updated</TableHead>
                    <TableHead>Update Status</TableHead>
                    <TableHead>Conduct Agreement</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.firstNameEnglish} {student.familyNameEnglish}
                          </p>
                          {student.firstNameArabic && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {student.firstNameArabic} {student.lastNameArabic}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Status: {student.status || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {student.emirateId || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {student.studentNumber || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        {student.isInformationUpdated ? (
                          <div>
                            <Badge className="bg-aegreen-100 text-aegreen-700 border-aegreen-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                            {student.informationUpdatedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(student.informationUpdatedAt), "MMM dd, HH:mm")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.informationUpdateStatus ? (
                          getStatusBadge(student.informationUpdateStatus)
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.isConductAgreementSigned ? (
                          <div>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Signed
                            </Badge>
                            {student.conductAgreementSignedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(student.conductAgreementSignedAt), "MMM dd, yyyy")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Not Signed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.informationUpdatedAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(student.informationUpdatedAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        ) : student.conductAgreementSignedAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {format(new Date(student.conductAgreementSignedAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        ) : student.updatedAt ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(student.updatedAt), "MMM dd, yyyy")}
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
