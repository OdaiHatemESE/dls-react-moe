"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, User, Mail, Phone, MapPin } from "lucide-react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";

export function StudentsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading } = useSWR(
    `/api/admin/analytics/students?page=${page}&limit=${limit}&search=${search}`,
    jsonFetcher
  );

  const students = data?.students || [];
  const pagination = data?.pagination || {};

  return (
    <Card className="border-0 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Students Directory</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete list of all students with detailed information
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, EID, or student #"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
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
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No students found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Info</TableHead>
                    <TableHead>Emirates ID</TableHead>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update Status</TableHead>
                    <TableHead>Contacts</TableHead>
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
                          <p className="text-xs text-gray-500 mt-1">{student.username}</p>
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
                        <Badge variant="outline" className="capitalize">
                          {student.gender || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            student.status === "active"
                              ? "bg-aegreen-100 text-aegreen-700 border-aegreen-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.hasUpdateRequest ? (
                          <Badge className="bg-aegold-100 text-aegold-700 border-aegold-200">
                            Update Requested
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">No request</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {student.StudentContact?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              {student.StudentContact.length}
                            </Badge>
                          )}
                          {student.StudentAddress?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {student.StudentAddress.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} students
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
