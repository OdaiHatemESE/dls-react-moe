"use client";

import { useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2, Edit, Plus, Loader2, CalendarIcon } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type UpdatePeriod = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function UpdatePeriodsManager() {
  const { toast } = useToast();
  const { data: periods, mutate } = useSWR<UpdatePeriod[]>(
    "/api/admin/config/periods",
    jsonFetcher
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<UpdatePeriod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isEnabled: false,
    description: "",
  });

  const handleOpenDialog = (period?: UpdatePeriod) => {
    if (period) {
      setEditingPeriod(period);
      // Format dates for input[type="datetime-local"]
      const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };
      setFormData({
        name: period.name,
        startDate: formatDate(period.startDate),
        endDate: formatDate(period.endDate),
        isEnabled: period.isEnabled,
        description: period.description || "",
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        isEnabled: false,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPeriod(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = "/api/admin/config/periods";
      const method = editingPeriod ? "PATCH" : "POST";
      const body = editingPeriod
        ? { id: editingPeriod.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save period");
      }

      toast({
        title: "Success",
        description: `Period ${editingPeriod ? "updated" : "created"} successfully`,
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
    if (!confirm("Are you sure you want to delete this period?")) return;

    try {
      const res = await fetch(`/api/admin/config/periods?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete period");
      }

      toast({
        title: "Success",
        description: "Period deleted successfully",
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

  const handleToggleEnabled = async (period: UpdatePeriod) => {
    try {
      const res = await fetch("/api/admin/config/periods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: period.id, isEnabled: !period.isEnabled }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update period");
      }

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDisplayDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCurrentlyActive = (period: UpdatePeriod) => {
    if (!period.isEnabled) return false;
    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-aegreen-700 to-aegreen-600 bg-clip-text text-transparent">
            Update Periods
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure time windows for information updates
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-aegreen-700 to-aegreen-600 hover:from-aegreen-800 hover:to-aegreen-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Period
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Start Date</TableHead>
              <TableHead className="font-semibold">End Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Enabled</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!periods ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No update periods found
                </TableCell>
              </TableRow>
            ) : (
              periods.map((period) => (
                <TableRow key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-aegreen-700" />
                      {period.name}
                    </div>
                    {period.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {period.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDisplayDate(period.startDate)}</TableCell>
                  <TableCell className="text-sm">{formatDisplayDate(period.endDate)}</TableCell>
                  <TableCell>
                    {isCurrentlyActive(period) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-aegreen-600 to-aegreen-500 text-white shadow-sm">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Active Now
                      </span>
                    ) : period.isEnabled ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-aegreen-100 text-aegreen-800 dark:bg-aegreen-900/30 dark:text-aegreen-300">
                        Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        Disabled
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={period.isEnabled}
                      onCheckedChange={() => handleToggleEnabled(period)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(period)}
                        className="hover:bg-aegreen-100 hover:text-aegreen-800 dark:hover:bg-aegreen-900/30 dark:hover:text-aegreen-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(period.id)}
                        className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? "Edit Update Period" : "Add Update Period"}
            </DialogTitle>
            <DialogDescription>
              {editingPeriod
                ? "Update the information update period configuration"
                : "Create a new time period for parent information updates"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Period Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Fall 2025 Update Period"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description of this update period"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, isEnabled: checked })
                  }
                />
                <Label htmlFor="isEnabled">Enable this period</Label>
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
                ) : editingPeriod ? (
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
