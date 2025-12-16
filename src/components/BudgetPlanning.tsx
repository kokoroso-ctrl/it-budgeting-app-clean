"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    year: "2024",
    quarter: "Q1",
    category: "Hardware",
    amount: "",
    description: "",
    approver: "",
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/budgets?sort=year&order=desc');
      if (!response.ok) throw new Error('Failed to fetch budgets');
      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      setError('Failed to load budgets. Please try again.');
      console.error('Fetch budgets error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      year: budget.year.toString(),
      quarter: budget.quarter,
      category: budget.category,
      amount: budget.amount.toString(),
      description: budget.description || "",
      approver: budget.approver || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        year: parseInt(formData.year),
        quarter: formData.quarter,
        category: formData.category,
        amount: parseFloat(formData.amount),
        status: editingBudget ? editingBudget.status : "draft",
        createdBy: editingBudget ? editingBudget.createdBy : "Current User",
        approver: formData.approver || null,
        description: formData.description || null,
      };

      const url = editingBudget ? `/api/budgets?id=${editingBudget.id}` : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingBudget ? 'update' : 'create'} budget`);
      }

      await fetchBudgets();
      setIsDialogOpen(false);
      setEditingBudget(null);
      setFormData({
        name: "",
        year: "2024",
        quarter: "Q1",
        category: "Hardware",
        amount: "",
        description: "",
        approver: "",
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingBudget(null);
      setFormData({
        name: "",
        year: "2024",
        quarter: "Q1",
        category: "Hardware",
        amount: "",
        description: "",
        approver: "",
      });
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/budgets?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update budget');
      }

      await fetchBudgets();
    } catch (err: any) {
      setError(err.message || 'Failed to update budget status');
      console.error('Status update error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/budgets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget');
      }

      await fetchBudgets();
    } catch (err: any) {
      setError(err.message || 'Failed to delete budget');
      console.error('Delete error:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "draft":
        return <Badge variant="secondary"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Perencanaan Anggaran</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Buat dan kelola anggaran IT tahunan</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Buat Anggaran
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingBudget ? 'Edit Anggaran' : 'Buat Anggaran Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingBudget 
                    ? 'Perbarui detail alokasi anggaran'
                    : 'Tentukan alokasi anggaran baru untuk departemen IT Anda'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Nama Anggaran</Label>
                    <Input
                      id="name"
                      placeholder="contoh: Infrastruktur Q1 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 100000000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarter">Period</Label>
                  <Select value={formData.quarter} onValueChange={(value) => setFormData({ ...formData, quarter: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this budget..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver" className="text-sm">Approver</Label>
                <Input
                  id="approver"
                  placeholder="e.g., Jane Doe, John Smith"
                  value={formData.approver}
                  onChange={(e) => setFormData({ ...formData, approver: e.target.value })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (editingBudget ? "Updating..." : "Creating...") : (editingBudget ? "Update Budget" : "Create Budget")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading budgets...</div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">No budgets found</p>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg">{budget.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {budget.year} • {budget.quarter} • Created by {budget.createdBy}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(budget.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Category</p>
                    <p className="font-medium text-sm sm:text-base">{budget.category}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-base sm:text-lg">Rp {(budget.amount / 1000000).toFixed(0)}Jt</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Approver</p>
                    <p className="font-medium text-sm sm:text-base truncate">{budget.approver || "-"}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex justify-start lg:justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(budget)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(budget.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {budget.status === "draft" && (
                      <Button size="sm" onClick={() => handleStatusUpdate(budget.id, 'pending')} className="flex-1 sm:flex-none">
                        Submit
                      </Button>
                    )}
                    {budget.status === "pending" && (
                      <Button size="sm" onClick={() => handleStatusUpdate(budget.id, 'approved')} className="flex-1 sm:flex-none">
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}