"use client";

import { useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

type AdminUser = {
  id: number;
  emirateId: string;
  name: string;
  email?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function AdminUsersManager() {
  const { toast } = useToast();
  const { data: users, mutate } = useSWR<AdminUser[]>(
    "/api/admin/config/users",
    jsonFetcher
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    emirateId: "",
    name: "",
    email: "",
    isActive: true,
  });

  const handleOpenDialog = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        emirateId: user.emirateId,
        name: user.name,
        email: user.email || "",
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        emirateId: "",
        name: "",
        email: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = "/api/admin/config/users";
      const method = editingUser ? "PATCH" : "POST";
      const body = editingUser
        ? { id: editingUser.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save user");
      }

      toast({
        title: "Success",
        description: `User ${editingUser ? "updated" : "created"} successfully`,
      });

      await mutate();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/config/users?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const res = await fetch("/api/admin/config/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }

      await mutate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-aegold-700 to-aegold-600 bg-clip-text text-transparent">
            Admin Users
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users who can access the admin panel
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-aegold-700 to-aegold-600 hover:from-aegold-800 hover:to-aegold-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead className="font-semibold">Emirates ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Created At</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-mono text-sm bg-slate-50 dark:bg-slate-900">
                    <span className="px-2 py-1 bg-aegold-100 dark:bg-aegold-900/30 text-aegold-800 dark:text-aegold-300 rounded-md">
                      {user.emirateId}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleActive(user)}
                      />
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                        className="hover:bg-aegold-100 hover:text-aegold-800 dark:hover:bg-aegold-900/30 dark:hover:text-aegold-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Admin User" : "Add Admin User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update admin user information"
                : "Add a new admin user by Emirates ID"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emirateId">Emirates ID *</Label>
                <Input
                  id="emirateId"
                  placeholder="784-1234-1234567-1"
                  value={formData.emirateId}
                  onChange={(e) =>
                    setFormData({ ...formData, emirateId: e.target.value })
                  }
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
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
                ) : editingUser ? (
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
