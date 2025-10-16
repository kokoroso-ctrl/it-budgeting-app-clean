"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockExpenses = [
  { id: 1, date: "2024-01-15", vendor: "AWS", category: "Infrastructure", amount: 15000, description: "Cloud hosting - January", status: "approved", poNumber: "PO-2024-001" },
  { id: 2, date: "2024-01-20", vendor: "Microsoft", category: "Software", amount: 8500, description: "Office 365 licenses", status: "approved", poNumber: "PO-2024-002", licenseType: "Subscription", expiredSubscription: "2024-12-31" },
  { id: 3, date: "2024-02-05", vendor: "Dell", category: "Hardware", amount: 25000, description: "Laptop refresh program", status: "pending", poNumber: "PO-2024-003", warranty: "Ada", expiredWarranty: "2027-02-05" },
  { id: 4, date: "2024-02-10", vendor: "Cisco", category: "Infrastructure", amount: 12000, description: "Network equipment", status: "approved", poNumber: "PO-2024-004" },
  { id: 5, date: "2024-02-15", vendor: "Salesforce", category: "Software", amount: 18000, description: "CRM subscription", status: "approved", poNumber: "PO-2024-005", licenseType: "Subscription", expiredSubscription: "2024-12-31" },
  { id: 6, date: "2024-03-01", vendor: "Google Cloud", category: "Infrastructure", amount: 9500, description: "Cloud services", status: "pending", poNumber: "PO-2024-006" },
];

const mockVendors = [
  { id: 1, name: "AWS", category: "Infrastructure", totalSpent: 45000, contracts: 3, status: "active" },
  { id: 2, name: "Microsoft", category: "Software", totalSpent: 32000, contracts: 5, status: "active" },
  { id: 3, name: "Dell", category: "Hardware", totalSpent: 78000, contracts: 2, status: "active" },
  { id: 4, name: "Cisco", category: "Infrastructure", totalSpent: 54000, contracts: 4, status: "active" },
  { id: 5, name: "Salesforce", category: "Software", totalSpent: 36000, contracts: 2, status: "active" },
];

export default function CostTracking() {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    vendor: "",
    category: "Hardware",
    amount: "",
    description: "",
    poNumber: "",
    warranty: "",
    expiredWarranty: "",
    licenseType: "",
    expiredSubscription: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense = {
      id: expenses.length + 1,
      date: formData.date,
      vendor: formData.vendor,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      status: "pending" as const,
      poNumber: formData.poNumber,
      ...(formData.category === "Hardware" && {
        warranty: formData.warranty,
        expiredWarranty: formData.expiredWarranty,
      }),
      ...((formData.category === "Software" || formData.category === "Website") && {
        licenseType: formData.licenseType,
        expiredSubscription: formData.expiredSubscription,
      }),
    };
    setExpenses([newExpense, ...expenses]);
    setIsDialogOpen(false);
    setFormData({
      date: "",
      vendor: "",
      category: "Hardware",
      amount: "",
      description: "",
      poNumber: "",
      warranty: "",
      expiredWarranty: "",
      licenseType: "",
      expiredSubscription: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cost Tracking</h2>
          <p className="text-muted-foreground">Monitor expenses and manage vendors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Add a new expense entry to track against your budget
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g., AWS, Microsoft"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    required
                  />
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
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Personnel">Personnel</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  placeholder="e.g., PO-2024-001"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  required
                />
              </div>

              {formData.category === "Hardware" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="warranty">Warranty</Label>
                      <Select value={formData.warranty} onValueChange={(value) => setFormData({ ...formData, warranty: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warranty status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ada">Ada</SelectItem>
                          <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiredWarranty">Expired Warranty</Label>
                      <Input
                        id="expiredWarranty"
                        type="date"
                        value={formData.expiredWarranty}
                        onChange={(e) => setFormData({ ...formData, expiredWarranty: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {(formData.category === "Software" || formData.category === "Website") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseType">License Type</Label>
                      <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Subscription">Subscription</SelectItem>
                          <SelectItem value="Perpetual">Perpetual</SelectItem>
                          <SelectItem value="OEM">OEM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiredSubscription">Expired Subscription</Label>
                      <Input
                        id="expiredSubscription"
                        type="date"
                        value={formData.expiredSubscription}
                        onChange={(e) => setFormData({ ...formData, expiredSubscription: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the expense..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Expense</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Track all IT-related expenses</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Expired Warranty</TableHead>
                      <TableHead>Expired Subscription</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell className="font-medium">{expense.poNumber}</TableCell>
                        <TableCell className="font-medium">{expense.vendor}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.expiredWarranty || "-"}</TableCell>
                        <TableCell>{expense.expiredSubscription || "-"}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.warranty || "-"}</TableCell>
                        <TableCell>{expense.licenseType || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {expense.status === "approved" ? (
                            <Badge className="bg-green-500">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>Overview of IT vendors and their contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-center">Active Contracts</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.category}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${vendor.totalSpent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">{vendor.contracts}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}