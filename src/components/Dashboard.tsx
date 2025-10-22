"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Pencil, Trash2, Plus, Search, Upload } from "lucide-react";
import { Pie, PieChart, Line, LineChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter states
  const [periodFilter, setPeriodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Clear irrelevant fields when category changes
  useEffect(() => {
    if (formData.category === "Hardware") {
      // Clear license fields when switching to Hardware
      setFormData(prev => ({
        ...prev,
        licenseType: "",
        expiredSubscription: ""
      }));
    } else if (formData.category === "Software" || formData.category === "Website") {
      // Clear warranty fields when switching to Software/Website
      setFormData(prev => ({
        ...prev,
        warranty: "",
        expiredWarranty: ""
      }));
    } else {
      // Clear all optional fields for other categories
      setFormData(prev => ({
        ...prev,
        warranty: "",
        expiredWarranty: "",
        licenseType: "",
        expiredSubscription: ""
      }));
    }
  }, [formData.category]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions - MUST be defined before use
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Parse date from Excel format (DD/MM/YYYY or other formats)
  const parseExcelDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // If it's a string in DD/MM/YYYY format
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    // Try parsing as general date string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    return null;
  };

  // Handle XLSX import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      toast.info("Memproses file XLSX...");

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("File XLSX kosong");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        
        try {
          // Map Excel columns to API fields
          const expenseData: any = {
            date: parseExcelDate(row['Tanggal']),
            category: row['Kategori'],
            description: row['Deskripsi'],
            vendor: row['Vendor'],
            poNumber: row['No PO'] || '',
            amount: parseFloat(String(row['Harga'] || 0)),
            status: row['Status'] || 'pending',
          };

          // Optional fields
          if (row['Status Garansi']) {
            expenseData.warranty = row['Status Garansi'];
          }
          if (row['Expired Garansi']) {
            expenseData.expiredWarranty = parseExcelDate(row['Expired Garansi']);
          }
          if (row['Jenis Lisensi']) {
            expenseData.licenseType = row['Jenis Lisensi'];
          }
          if (row['Expired Lisensi']) {
            expenseData.expiredSubscription = parseExcelDate(row['Expired Lisensi']);
          }

          // Validate required fields
          if (!expenseData.date || !expenseData.category || !expenseData.description || 
              !expenseData.vendor || !expenseData.amount || expenseData.amount <= 0) {
            errors.push(`Baris ${i + 2}: Data tidak lengkap atau tidak valid`);
            errorCount++;
            continue;
          }

          // Send to API
          const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData),
          });

          if (response.ok) {
            successCount++;
          } else {
            const error = await response.json();
            errors.push(`Baris ${i + 2}: ${error.error || 'Gagal menyimpan'}`);
            errorCount++;
          }
        } catch (err: any) {
          errors.push(`Baris ${i + 2}: ${err.message}`);
          errorCount++;
        }
      }

      // Show results
      await fetchExpenses();
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Berhasil mengimport ${successCount} transaksi`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} transaksi berhasil, ${errorCount} gagal. Periksa console untuk detail.`);
        console.error("Import errors:", errors);
      } else {
        toast.error(`Gagal mengimport semua transaksi. ${errors[0]}`);
        console.error("Import errors:", errors);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error("Gagal memproses file XLSX: " + err.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter expenses based on period, category, and search
  const filteredExpenses = expenses.filter((expense) => {
    // Period filter
    if (periodFilter !== "all") {
      const expenseDate = new Date(expense.date);
      const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      if (expenseMonth !== periodFilter) return false;
    }

    // Category filter
    if (categoryFilter !== "all" && expense.category !== categoryFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        formatDate(expense.date).toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.description.toLowerCase().includes(query) ||
        expense.vendor.toLowerCase().includes(query) ||
        (expense.poNumber && expense.poNumber.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Get unique months from expenses for period filter
  const availableMonths = Array.from(
    new Set(
      expenses.map((exp) => {
        const date = new Date(exp.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  // Get unique categories
  const categories = ["Hardware", "Software", "Website", "Services", "Infrastructure", "Accessories & Office Supply"];

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredExpenses.map((expense) => ({
      Tanggal: formatDate(expense.date),
      Kategori: expense.category,
      Deskripsi: expense.description,
      Vendor: expense.vendor,
      'No PO': expense.poNumber || '-',
      Harga: expense.amount,
      'Status Garansi': expense.warranty || '-',
      'Expired Garansi': expense.expiredWarranty ? formatDate(expense.expiredWarranty) : '-',
      'Jenis Lisensi': expense.licenseType || '-',
      'Expired Lisensi': expense.expiredSubscription ? formatDate(expense.expiredSubscription) : '-',
      Status: expense.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `Transaksi_Pengeluaran_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("File XLSX berhasil didownload");
  };

  const handleEdit = (expense: any) => {
    setIsEditMode(true);
    setEditingId(expense.id);
    setFormData({
      date: expense.date.split('T')[0],
      vendor: expense.vendor,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      poNumber: expense.poNumber,
      warranty: expense.warranty || "",
      expiredWarranty: expense.expiredWarranty ? expense.expiredWarranty.split('T')[0] : "",
      licenseType: expense.licenseType || "",
      expiredSubscription: expense.expiredSubscription ? expense.expiredSubscription.split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete expense');
      await fetchExpenses();
      toast.success("Transaksi berhasil dihapus");
    } catch (err) {
      console.error('Delete error:', err);
      toast.error("Gagal menghapus transaksi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        date: new Date(formData.date).toISOString(),
        vendor: formData.vendor,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        status: isEditMode ? undefined : "pending",
        poNumber: formData.poNumber,
      };

      if (formData.category === "Hardware") {
        payload.warranty = formData.warranty || null;
        payload.expiredWarranty = formData.expiredWarranty ? new Date(formData.expiredWarranty).toISOString() : null;
      }

      if (formData.category === "Software" || formData.category === "Website") {
        payload.licenseType = formData.licenseType || null;
        payload.expiredSubscription = formData.expiredSubscription ? new Date(formData.expiredSubscription).toISOString() : null;
      }

      if (isEditMode && editingId !== null) {
        const response = await fetch(`/api/expenses?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update expense');
        toast.success("Transaksi berhasil diupdate");
      } else {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create expense');
        toast.success("Transaksi berhasil ditambahkan");
      }

      await fetchExpenses();
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(isEditMode ? "Gagal mengupdate transaksi" : "Gagal menambahkan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
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

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchExpenses();
      toast.success("Status berhasil diupdate");
    } catch (err) {
      console.error('Status update error:', err);
      toast.error("Gagal mengupdate status");
    }
  };

  // Calculate total spending from filtered data
  const totalSpending = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Group by category for pie chart (from filtered data)
  const categoryData = filteredExpenses.reduce((acc: any, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = 0;
    }
    acc[exp.category] += exp.amount;
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]: [string, any]) => ({
    name,
    value,
    percentage: ((value / totalSpending) * 100).toFixed(0)
  }));

  // Group by month for trend chart (from filtered data)
  const monthlyData = filteredExpenses.reduce((acc: any, exp) => {
    const date = new Date(exp.date);
    const monthKey = `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += exp.amount;
    return acc;
  }, {});

  const trendData = Object.entries(monthlyData)
    .map(([month, amount]: [string, any]) => ({
      month,
      amount: amount / 1000000 // Convert to millions
    }))
    .sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return months.indexOf(monthA) - months.indexOf(monthB);
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Memuat data transaksi...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaksi Pengeluaran</h2>
          <p className="text-muted-foreground">Monitor dan kelola semua pengeluaran IT</p>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-filter" className="text-sm font-medium">Periode</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger id="period-filter" className="bg-white">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter" className="text-sm font-medium">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter" className="bg-white">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Rp {totalSpending.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Jumlah Transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredExpenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
            <CardDescription>Distribusi pengeluaran berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Pengeluaran</CardTitle>
            <CardDescription>Perkembangan pengeluaran per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Juta (Rp)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}M`} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Transaksi</CardTitle>
              <CardDescription>Riwayat transaksi pengeluaran</CardDescription>
            </div>
            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={handleImportClick}
                disabled={isImporting}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import XLSX"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportExcel}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export XLSX
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Transaksi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Transaksi" : "Tambah Transaksi Baru"}</DialogTitle>
                    <DialogDescription>
                      {isEditMode ? "Update informasi transaksi" : "Tambahkan transaksi pengeluaran baru"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Tanggal</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Jumlah (Rp)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="e.g., 5000000"
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
                        <Label htmlFor="category">Kategori</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Services">Services</SelectItem>
                            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="Accessories & Office Supply">Accessories & Office Supply</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="poNumber">No PO</Label>
                      <Input
                        id="poNumber"
                        placeholder="e.g., PO-2024-001"
                        value={formData.poNumber}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        required
                      />
                    </div>

                    {formData.category === "Hardware" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="warranty">Garansi</Label>
                          <Select value={formData.warranty} onValueChange={(value) => setFormData({ ...formData, warranty: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status garansi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ada">Ada</SelectItem>
                              <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiredWarranty">Expired Garansi</Label>
                          <Input
                            id="expiredWarranty"
                            type="date"
                            value={formData.expiredWarranty}
                            onChange={(e) => setFormData({ ...formData, expiredWarranty: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {(formData.category === "Software" || formData.category === "Website") && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="licenseType">Jenis Lisensi</Label>
                          <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis lisensi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Subscription">Subscription</SelectItem>
                              <SelectItem value="Perpetual">Perpetual</SelectItem>
                              <SelectItem value="OEM">OEM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiredSubscription">Expired Lisensi</Label>
                          <Input
                            id="expiredSubscription"
                            type="date"
                            value={formData.expiredSubscription}
                            onChange={(e) => setFormData({ ...formData, expiredSubscription: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        id="description"
                        placeholder="Deskripsi singkat pengeluaran..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isSubmitting}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? "Menyimpan..." : (isEditMode ? "Update Transaksi" : "Tambah Transaksi")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Box */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan tanggal, kategori, deskripsi, vendor, atau PO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                {searchQuery || periodFilter !== "all" || categoryFilter !== "all" 
                  ? "Tidak ada transaksi yang sesuai dengan filter" 
                  : "Belum ada transaksi"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>No PO</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead>Status Garansi</TableHead>
                    <TableHead>Expired Garansi</TableHead>
                    <TableHead>Jenis Lisensi</TableHead>
                    <TableHead>Expired Lisensi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.vendor}</TableCell>
                      <TableCell>{expense.poNumber || "-"}</TableCell>
                      <TableCell className="text-right font-medium">Rp {expense.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{expense.warranty || "-"}</TableCell>
                      <TableCell>{expense.expiredWarranty ? formatDate(expense.expiredWarranty) : "-"}</TableCell>
                      <TableCell>{expense.licenseType || "-"}</TableCell>
                      <TableCell>{expense.expiredSubscription ? formatDate(expense.expiredSubscription) : "-"}</TableCell>
                      <TableCell>
                        <Select 
                          value={expense.status} 
                          onValueChange={(value) => handleStatusChange(expense.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">
                              <Badge className="bg-green-500">Disetujui</Badge>
                            </SelectItem>
                            <SelectItem value="pending">
                              <Badge className="bg-yellow-500">Pending</Badge>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <Badge className="bg-red-500">Ditolak</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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