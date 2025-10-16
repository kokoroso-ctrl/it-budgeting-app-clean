"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const mockBudgets = [
  {
    id: 1,
    name: "Q1 2024 IT Infrastructure",
    year: 2024,
    quarter: "Q1",
    category: "Infrastructure",
    amount: 450000,
    status: "approved",
    createdBy: "John Smith",
    approver: "Jane Doe",
  },
  {
    id: 2,
    name: "Annual Software Licenses 2024",
    year: 2024,
    quarter: "Annual",
    category: "Software",
    amount: 280000,
    status: "pending",
    createdBy: "Sarah Johnson",
    approver: "Pending",
  },
  {
    id: 3,
    name: "Q2 2024 Hardware Refresh",
    year: 2024,
    quarter: "Q2",
    category: "Hardware",
    amount: 320000,
    status: "draft",
    createdBy: "Mike Wilson",
    approver: "-",
  },
  {
    id: 4,
    name: "Personnel Training Budget 2024",
    year: 2024,
    quarter: "Annual",
    category: "Personnel",
    amount: 520000,
    status: "approved",
    createdBy: "Emily Brown",
    approver: "Jane Doe",
  },
];

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: "2024",
    quarter: "Q1",
    category: "Hardware",
    amount: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = {
      id: budgets.length + 1,
      name: formData.name,
      year: parseInt(formData.year),
      quarter: formData.quarter,
      category: formData.category,
      amount: parseFloat(formData.amount),
      status: "draft" as const,
      createdBy: "Current User",
      approver: "-",
    };
    setBudgets([...budgets, newBudget]);
    setIsDialogOpen(false);
    setFormData({
      name: "",
      year: "2024",
      quarter: "Q1",
      category: "Hardware",
      amount: "",
      description: "",
    });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Planning</h2>
          <p className="text-muted-foreground">Create and manage annual IT budgets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Define a new budget allocation for your IT department
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q1 2024 Infrastructure"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                      <SelectItem value="Personnel">Personnel</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this budget..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Budget</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle>{budget.name}</CardTitle>
                  <CardDescription>
                    {budget.year} • {budget.quarter} • Created by {budget.createdBy}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(budget.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{budget.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">${(budget.amount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approver</p>
                  <p className="font-medium">{budget.approver}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {budget.status === "draft" && (
                    <Button size="sm">Submit for Approval</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}