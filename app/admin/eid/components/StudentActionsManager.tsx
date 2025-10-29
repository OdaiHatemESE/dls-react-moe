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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Edit, Plus, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type StudentAction = {
  id: number;
  educationType: string;
  actionName: string;
  actionKey: string;
  isEnabled: boolean;
  displayOrder: number;
  description?: string | null;
  configJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

const EDUCATION_TYPES = [
  "Public",
  "Private",
  "Charter",
  "Homeschool",
  "International",
  "Special",
];

const normalizeEducationType = (value: string) => {
  if (!value) {
    return value;
  }
  const match = EDUCATION_TYPES.find(
    (type) => type.toLowerCase() === value.toLowerCase()
  );
  return match ?? value;
};

export function StudentActionsManager() {
  const { toast } = useToast();
  const { data: actions, mutate } = useSWR<StudentAction[]>(
    "/api/admin/config/actions",
    jsonFetcher
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<StudentAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    educationType: "",
    actionName: "",
    actionKey: "",
    isEnabled: true,
    displayOrder: 0,
    description: "",
    configJson: "",
  });

  const handleOpenDialog = (action?: StudentAction) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        educationType: normalizeEducationType(action.educationType),
        actionName: action.actionName,
        actionKey: action.actionKey,
        isEnabled: action.isEnabled,
        displayOrder: action.displayOrder,
        description: action.description || "",
        configJson: action.configJson || "",
      });
    } else {
      setEditingAction(null);
      setFormData({
        educationType: "",
        actionName: "",
        actionKey: "",
        isEnabled: true,
        displayOrder: 0,
        description: "",
        configJson: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate JSON if provided
      if (formData.configJson.trim()) {
        try {
          JSON.parse(formData.configJson);
        } catch {
          throw new Error("Invalid JSON in configuration");
        }
      }

      const url = "/api/admin/config/actions";
      const method = editingAction ? "PATCH" : "POST";
      const normalizedFormData = {
        ...formData,
        educationType: normalizeEducationType(formData.educationType),
      };
      const body = editingAction
        ? { id: editingAction.id, ...normalizedFormData }
        : normalizedFormData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save action");
      }

      toast({
        title: "Success",
        description: `Action ${editingAction ? "updated" : "created"} successfully`,
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
    if (!confirm("Are you sure you want to delete this action?")) return;

    try {
      const res = await fetch(`/api/admin/config/actions?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete action");
      }

      toast({
        title: "Success",
        description: "Action deleted successfully",
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

  const handleToggleEnabled = async (action: StudentAction) => {
    try {
      const res = await fetch("/api/admin/config/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, isEnabled: !action.isEnabled }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update action");
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

  // Group actions by education type
  const groupedActions = actions?.reduce((acc, action) => {
    const normalizedType = normalizeEducationType(action.educationType);
    const key = normalizedType || action.educationType;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(action);
    return acc;
  }, {} as Record<string, StudentAction[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-aegold-700 to-aered-600 bg-clip-text text-transparent">
            Student Actions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure available actions by education type
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-aegold-700 to-aered-600 hover:from-aegold-800 hover:to-aered-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-6">
        {!groupedActions ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : Object.keys(groupedActions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No student actions configured
          </div>
        ) : (
          Object.entries(groupedActions).map(([educationType, typeActions]) => (
            <div key={educationType} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-aegold-50 to-aegreen-50 dark:from-aegold-900/20 dark:to-aegreen-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-aegold-900 dark:text-aegold-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-aegold-700 rounded-full" />
                  {educationType} Education
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="font-semibold">Order</TableHead>
                    <TableHead className="font-semibold">Action Name</TableHead>
                    <TableHead className="font-semibold">Action Key</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeActions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((action) => (
                      <TableRow key={action.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-mono text-sm">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
                            {action.displayOrder}
                          </span>
                        </TableCell>
                        <TableCell>
                                                    <div>\n                            <div className="font-medium flex items-center gap-2">\n                              <SettingsIcon className="w-4 h-4 text-purple-600" />\n                              {action.actionName}\n                            </div>
                            {action.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {action.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                            {action.actionKey}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={action.isEnabled}
                              onCheckedChange={() => handleToggleEnabled(action)}
                            />
                            {action.isEnabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                Disabled
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(action)}
                              className="hover:bg-aegold-100 hover:text-aegold-800 dark:hover:bg-aegold-900/30 dark:hover:text-aegold-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(action.id)}
                              className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? "Edit Student Action" : "Add Student Action"}
            </DialogTitle>
            <DialogDescription>
              {editingAction
                ? "Update student action configuration"
                : "Configure a new action for a specific education type"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="educationType">Education Type *</Label>
                <Select
                  value={formData.educationType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      educationType: normalizeEducationType(value),
                    })
                  }
                  disabled={!!editingAction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actionName">Action Name *</Label>
                  <Input
                    id="actionName"
                    placeholder="e.g., Update Address"
                    value={formData.actionName}
                    onChange={(e) =>
                      setFormData({ ...formData, actionName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionKey">Action Key *</Label>
                  <Input
                    id="actionKey"
                    placeholder="e.g., update_address"
                    value={formData.actionKey}
                    onChange={(e) =>
                      setFormData({ ...formData, actionKey: e.target.value })
                    }
                    required
                    disabled={!!editingAction}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description of this action"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="configJson">Configuration JSON</Label>
                <Textarea
                  id="configJson"
                  placeholder='{"key": "value"}'
                  value={formData.configJson}
                  onChange={(e) =>
                    setFormData({ ...formData, configJson: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-sm"
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
                <Label htmlFor="isEnabled">Enable this action</Label>
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
                ) : editingAction ? (
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
