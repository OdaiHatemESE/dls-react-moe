"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, Loader2, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type AcademicYear = {
  id: number;
  academicYear: string;
  yearValue: number;
  isActive: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Generate academic year options (2025-2026 to 2030-2031)
const generateYearOptions = () => {
  const startYear = 2025;
  const options = [];
  
  for (let i = 0; i < 6; i++) {
    const year = startYear + i;
    const nextYear = year + 1;
    options.push({
      label: `${year}-${nextYear}`,
      value: nextYear,
    });
  }
  
  return options;
};

export function AcademicYearManager() {
  const { toast } = useToast();
  const { data: academicYears, mutate } = useSWR<AcademicYear[]>(
    "/api/admin/config/academic-year",
    jsonFetcher
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedYearOption, setSelectedYearOption] = useState<string>("");
  const [formData, setFormData] = useState({
    academicYear: "",
    yearValue: 0,
    isActive: false,
    description: "",
  });

  const yearOptions = generateYearOptions();

  const handleOpenDialog = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year);
      setSelectedYearOption(`${year.yearValue - 1}-${year.yearValue}`);
      setFormData({
        academicYear: year.academicYear,
        yearValue: year.yearValue,
        isActive: year.isActive,
        description: year.description || "",
      });
    } else {
      setEditingYear(null);
      setSelectedYearOption("");
      setFormData({
        academicYear: "",
        yearValue: 0,
        isActive: false,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingYear(null);
    setSelectedYearOption("");
  };

  const handleYearSelect = (value: string) => {
    setSelectedYearOption(value);
    const option = yearOptions.find(opt => opt.label === value);
    if (option) {
      setFormData({
        ...formData,
        academicYear: option.label,
        yearValue: option.value,
      });
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm("This will create all default academic years (2025-2031). Continue?")) return;

    setIsInitializing(true);
    try {
      const res = await fetch("/api/admin/config/academic-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initializeDefaults: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to initialize academic years");
      }

      toast({
        title: "Success",
        description: "Default academic years initialized successfully",
      });

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.academicYear || !formData.yearValue) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = "/api/admin/config/academic-year";
      const method = editingYear ? "PATCH" : "POST";
      const body = editingYear
        ? { id: editingYear.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save academic year");
      }

      toast({
        title: "Success",
        description: `Academic year ${editingYear ? "updated" : "created"} successfully`,
      });

      await mutate();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;

    try {
      const res = await fetch(`/api/admin/config/academic-year?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete academic year");
      }

      toast({
        title: "Success",
        description: "Academic year deleted successfully",
      });

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetActive = async (year: AcademicYear) => {
    if (year.isActive) return; // Already active

    try {
      const res = await fetch("/api/admin/config/academic-year", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: year.id, isActive: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set active year");
      }

      toast({
        title: "Success",
        description: `${year.academicYear} is now the active academic year`,
      });

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-aegreen-700 to-aegreen-600 bg-clip-text text-transparent">
            Academic Year Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage active academic year for the system
          </p>
        </div>
        <div className="flex gap-2">
          {(!academicYears || academicYears.length === 0) && (
            <Button
              onClick={handleInitializeDefaults}
              disabled={isInitializing}
              variant="outline"
              className="border-aegreen-600 text-aegreen-700 hover:bg-aegreen-50"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Initialize Defaults
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-aegreen-700 to-aegreen-600 hover:from-aegreen-800 hover:to-aegreen-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Year
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead className="font-semibold">Academic Year</TableHead>
              <TableHead className="font-semibold">Year Value</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!academicYears ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : academicYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Calendar className="w-12 h-12 text-gray-300" />
                    <div>
                      <p className="font-medium">No academic years configured</p>
                      <p className="text-sm">Click "Initialize Defaults" to create default years</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              academicYears.map((year) => (
                <TableRow
                  key={year.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-aegreen-700" />
                      {year.academicYear}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {year.yearValue}
                  </TableCell>
                  <TableCell>
                    {year.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-aegreen-600 to-aegreen-500 text-white shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(year)}
                        className="text-xs border-gray-300 hover:border-aegreen-600 hover:bg-aegreen-50 hover:text-aegreen-700"
                      >
                        Set Active
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {year.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(year)}
                        className="hover:bg-aegreen-100 hover:text-aegreen-800 dark:hover:bg-aegreen-900/30 dark:hover:text-aegreen-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(year.id)}
                        disabled={year.isActive}
                        className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Academic Year" : "Add Academic Year"}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? "Update the academic year configuration"
                : "Add a new academic year to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select
                  value={selectedYearOption}
                  onValueChange={handleYearSelect}
                  disabled={!!editingYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option.label} value={option.label}>
                        {option.label} (Value: {option.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Year value represents the ending year (e.g., 2025-2026 = 2026)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Set as Active Year</p>
                    <p className="text-xs text-muted-foreground">
                      This will be the current academic year
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 accent-aegreen-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingYear ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
