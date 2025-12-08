"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Pencil, Trash2, Plus, Search, Upload, FileText, Eye, X, Check } from "lucide-react";
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

// Modern color palette for categories
const CATEGORY_COLORS: { [key: string]: string } = {
  'Hardware': '#a855f7',      // Purple
  'Software': '#3b82f6',       // Blue
  'Website': '#06b6d4',        // Cyan
  'Services': '#f59e0b',       // Orange
  'Infrastructure': '#10b981', // Green
  'Accessories & Office Supply': '#6b7280' // Gray
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [notifiedExpiries, setNotifiedExpiries] = useState<Set<number>>(new Set());
  
  // Upload invoice states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingExpenseId, setUploadingExpenseId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Detail dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  
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
    fetchVendors();
  }, []);

  // Clear irrelevant fields when category changes
  useEffect(() => {
    if (formData.category === "Hardware") {
      setFormData(prev => ({
        ...prev,
        licenseType: "",
        expiredSubscription: ""
      }));
    } else if (formData.category === "Software" || formData.category === "Website") {
      setFormData(prev => ({
        ...prev,
        warranty: "",
        expiredWarranty: ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        warranty: "",
        expiredWarranty: "",
        licenseType: "",
        expiredSubscription: ""
      }));
    }
  }, [formData.category]);

  // Check for expiring items and send Telegram notifications
  useEffect(() => {
    if (expenses.length > 0) {
      checkExpiringItems();
    }
  }, [expenses]);

  const checkExpiringItems = async () => {
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21);
    
    const expiringItems: string[] = [];

    expenses.forEach((expense) => {
      if (expense.expiredWarranty && !notifiedExpiries.has(expense.id)) {
        const expiryDate = new Date(expense.expiredWarranty);
        if (expiryDate <= threeWeeksFromNow && expiryDate >= new Date()) {
          const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          expiringItems.push(
            `⚠️ <b>GARANSI AKAN EXPIRED</b>\n` +
            `📦 Item: ${expense.description}\n` +
            `🏢 Vendor: ${expense.vendor}\n` +
            `📅 Expired: ${formatDate(expense.expiredWarranty)}\n` +
            `⏰ Sisa: ${daysLeft} hari\n`
          );
          setNotifiedExpiries(prev => new Set([...prev, expense.id]));
        }
      }

      if (expense.expiredSubscription && !notifiedExpiries.has(expense.id + 1000000)) {
        const expiryDate = new Date(expense.expiredSubscription);
        if (expiryDate <= threeWeeksFromNow && expiryDate >= new Date()) {
          const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          expiringItems.push(
            `⚠️ <b>LISENSI AKAN EXPIRED</b>\n` +
            `📦 Item: ${expense.description}\n` +
            `🏢 Vendor: ${expense.vendor}\n` +
            `🔐 Jenis: ${expense.licenseType}\n` +
            `📅 Expired: ${formatDate(expense.expiredSubscription)}\n` +
            `⏰ Sisa: ${daysLeft} hari\n`
          );
          setNotifiedExpiries(prev => new Set([...prev, expense.id + 1000000]));
        }
      }
    });

    if (expiringItems.length > 0) {
      const message = `🚨 <b>PERINGATAN EXPIRED MAMAGREEN IT</b> 🚨\n\n` +
        expiringItems.join('\n---\n') +
        `\n📊 Total: ${expiringItems.length} item akan expired dalam 3 minggu`;
      
      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
      } catch (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    }
  };

  const isExpiringSoon = (dateString: string | null): boolean => {
    if (!dateString) return false;
    
    const expiryDate = new Date(dateString);
    const today = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(today.getDate() + 21);
    
    return expiryDate <= threeWeeksFromNow && expiryDate >= today;
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses?limit=1000&sort=date&order=desc');
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

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors?status=active&sort=name&order=asc');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      console.error('Fetch vendors error:', err);
      toast.error("Gagal memuat daftar vendor");
    }
  };

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

  const parseExcelDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
      
      if (!isNaN(jsDate.getTime())) {
        return jsDate.toISOString();
      }
    }
    
    if (dateValue instanceof Date) {
      const utcDate = new Date(Date.UTC(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate()
      ));
      return utcDate.toISOString();
    }
    
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      const utcDate = new Date(Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      ));
      return utcDate.toISOString();
    }
    
    return null;
  };

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
          if (!row['Tanggal'] || !row['Kategori'] || !row['Deskripsi'] || !row['Vendor']) {
            console.log(`Baris ${i + 2}: Baris kosong, dilewati`);
            continue;
          }

          const cleanValue = (value: any): string | null => {
            if (!value || value === '-' || value === '' || value === 'null') return null;
            return String(value).trim();
          };

          const parsedDate = parseExcelDate(row['Tanggal']);
          if (!parsedDate) {
            errors.push(`Baris ${i + 2}: Tanggal tidak valid (${row['Tanggal']})`);
            errorCount++;
            continue;
          }

          const expenseData: any = {
            date: parsedDate,
            category: String(row['Kategori']).trim(),
            description: String(row['Deskripsi']).trim(),
            vendor: String(row['Vendor']).trim(),
            poNumber: cleanValue(row['No PO']) || '-',
            amount: parseFloat(String(row['Harga'] || 0)),
            status: cleanValue(row['Status']) || 'pending',
          };

          if (expenseData.category === "Hardware") {
            const warrantyValue = cleanValue(row['Status Garansi']);
            const expiredWarrantyValue = cleanValue(row['Expired Garansi']);
            
            if (warrantyValue) {
              expenseData.warranty = warrantyValue;
            }
            if (expiredWarrantyValue) {
              const parsedWarrantyDate = parseExcelDate(expiredWarrantyValue);
              if (parsedWarrantyDate) {
                expenseData.expiredWarranty = parsedWarrantyDate;
              }
            }
          }

          if (expenseData.category === "Software" || expenseData.category === "Website") {
            const licenseTypeValue = cleanValue(row['Jenis Lisensi']);
            const expiredLicenseValue = cleanValue(row['Expired Lisensi']);
            
            if (licenseTypeValue) {
              expenseData.licenseType = licenseTypeValue;
            }
            if (expiredLicenseValue) {
              const parsedLicenseDate = parseExcelDate(expiredLicenseValue);
              if (parsedLicenseDate) {
                expenseData.expiredSubscription = parsedLicenseDate;
              }
            }
          }

          if (!expenseData.date || !expenseData.category || !expenseData.description || 
              !expenseData.vendor || !expenseData.amount || expenseData.amount <= 0) {
            errors.push(`Baris ${i + 2}: Data tidak lengkap atau tidak valid`);
            errorCount++;
            continue;
          }

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

      await fetchExpenses();
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Berhasil mengimport ${successCount} transaksi`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} transaksi berhasil, ${errorCount} gagal. Periksa console untuk detail.`);
        console.error("Import errors:", errors);
      } else {
        toast.error(`Gagal mengimport semua transaksi. ${errors.length > 0 ? errors[0] : 'Tidak ada data valid'}`);
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

  const filteredExpenses = expenses.filter((expense) => {
    if (periodFilter !== "all") {
      const expenseDate = new Date(expense.date);
      const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      if (expenseMonth !== periodFilter) return false;
    }

    if (categoryFilter !== "all" && expense.category !== categoryFilter) {
      return false;
    }

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

  const availableMonths = Array.from(
    new Set(
      expenses.map((exp) => {
        const date = new Date(exp.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  const categories = ["Hardware", "Software", "Website", "Services", "Infrastructure", "Accessories & Office Supply"];

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
      'Bukti Transaksi': expense.invoiceData ? 'Ada' : 'Tidak Ada',
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
        payload.licenseType = null;
        payload.expiredSubscription = null;
      } else if (formData.category === "Software" || formData.category === "Website") {
        payload.licenseType = formData.licenseType || null;
        payload.expiredSubscription = formData.expiredSubscription ? new Date(formData.expiredSubscription).toISOString() : null;
        payload.warranty = null;
        payload.expiredWarranty = null;
      } else {
        payload.warranty = null;
        payload.expiredWarranty = null;
        payload.licenseType = null;
        payload.expiredSubscription = null;
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
    // If changing to approved, show upload dialog
    if (newStatus === 'approved') {
      setUploadingExpenseId(id);
      setIsUploadDialogOpen(true);
      return;
    }

    // For other status changes, update directly
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Hanya file gambar (JPG, PNG, GIF, WEBP) atau PDF yang diizinkan");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadInvoice = async () => {
    if (!selectedFile || !uploadingExpenseId) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('expenseId', uploadingExpenseId.toString());
      formData.append('file', selectedFile);

      const response = await fetch('/api/expenses/upload-invoice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload invoice');
      }

      // Update status to approved
      const statusResponse = await fetch(`/api/expenses?id=${uploadingExpenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!statusResponse.ok) throw new Error('Failed to update status');

      await fetchExpenses();
      toast.success("Bukti transaksi berhasil diupload dan status disetujui");
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadingExpenseId(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error("Gagal mengupload bukti transaksi: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipUpload = async () => {
    if (!uploadingExpenseId) return;

    try {
      const response = await fetch(`/api/expenses?id=${uploadingExpenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchExpenses();
      toast.success("Status berhasil disetujui");
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadingExpenseId(null);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error("Gagal mengupdate status");
    }
  };

  const handleViewDetail = (expense: any) => {
    setSelectedExpense(expense);
    setIsDetailDialogOpen(true);
  };

  // Calculate total spending from filtered data
  const totalSpending = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Group by category for pie chart with transaction count
  const categoryData = filteredExpenses.reduce((acc: any, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { total: 0, count: 0 };
    }
    acc[exp.category].total += exp.amount;
    acc[exp.category].count += 1;
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, data]: [string, any]) => ({
    name,
    value: data.total,
    count: data.count,
    percentage: ((data.total / totalSpending) * 100).toFixed(0),
    color: CATEGORY_COLORS[name] || '#6b7280'
  }));

  // Group by month for trend chart
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
      amount: amount / 1000000
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
    <div className="space-y-4 sm:space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink-red {
          0%, 100% { 
            color: #ef4444;
            font-weight: 700;
          }
          50% { 
            color: #dc2626;
            font-weight: 900;
          }
        }
        .expiring-soon {
          animation: blink-red 1s infinite;
        }
      `}} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Transaksi Pengeluaran</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Monitor dan kelola semua pengeluaran IT</p>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Total Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              Rp {totalSpending.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">Jumlah Transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">{filteredExpenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Modern Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Kategori Tiket</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribusi berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-sm text-muted-foreground">Belum ada data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Donut Chart */}
                <ResponsiveContainer width="100%" height={250} className="sm:h-[280px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={{
                        stroke: '#94a3b8',
                        strokeWidth: 1
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Modern Legend Badges */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {pieData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                      style={{ 
                        borderColor: entry.color,
                        backgroundColor: `${entry.color}15`
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span 
                        className="text-xs font-medium"
                        style={{ color: entry.color }}
                      >
                        {entry.name}: {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Trend Pengeluaran</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Perkembangan pengeluaran per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-sm text-muted-foreground">Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Juta (Rp)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} tick={{ fontSize: 12 }} />
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

      {/* Transactions Section - MODERN CARD VIEW */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Daftar Transaksi</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Riwayat transaksi pengeluaran</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
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
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportExcel}
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
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
                        <Select 
                          value={formData.vendor} 
                          onValueChange={(value) => setFormData({ ...formData, vendor: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.length === 0 ? (
                              <SelectItem value="no-vendor" disabled>
                                Belum ada vendor
                              </SelectItem>
                            ) : (
                              vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.name}>
                                  {vendor.name} - {vendor.category}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                {searchQuery || periodFilter !== "all" || categoryFilter !== "all" 
                  ? "Tidak ada transaksi yang sesuai dengan filter" 
                  : "Belum ada transaksi"}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{expense.description}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                📅 {formatDate(expense.date)}
                              </span>
                              <span>•</span>
                              <span>🏢 {expense.vendor}</span>
                              <span>•</span>
                              <span>📦 {expense.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-green-600">
                              Rp {expense.amount.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              PO: {expense.poNumber || "-"}
                            </div>
                          </div>
                        </div>

                        {/* Expiry warnings */}
                        {(expense.expiredWarranty || expense.expiredSubscription) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {expense.expiredWarranty && (
                              <span className={`px-2 py-1 rounded-full ${isExpiringSoon(expense.expiredWarranty) ? 'bg-red-100 text-red-700 font-semibold' : 'bg-gray-100 text-gray-700'}`}>
                                ⚠️ Garansi: {formatDate(expense.expiredWarranty)}
                              </span>
                            )}
                            {expense.expiredSubscription && (
                              <span className={`px-2 py-1 rounded-full ${isExpiringSoon(expense.expiredSubscription) ? 'bg-red-100 text-red-700 font-semibold' : 'bg-gray-100 text-gray-700'}`}>
                                🔐 Lisensi: {formatDate(expense.expiredSubscription)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Invoice indicator */}
                        {expense.invoiceData && (
                          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>Bukti transaksi tersedia</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <Select 
                          value={expense.status} 
                          onValueChange={(value) => handleStatusChange(expense.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
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

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetail(expense)}
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Invoice Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Bukti Transaksi</DialogTitle>
            <DialogDescription>
              Upload invoice atau bukti transaksi untuk persetujuan ini (Opsional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-file">File Invoice/Bukti (Gambar atau PDF, Max 5MB)</Label>
              <Input
                ref={invoiceInputRef}
                id="invoice-file"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleSkipUpload}
                disabled={isUploading}
              >
                Lewati
              </Button>
              <Button
                onClick={handleUploadInvoice}
                disabled={!selectedFile || isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? "Mengupload..." : "Upload & Setujui"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              Informasi lengkap transaksi pengeluaran
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tanggal</Label>
                  <p className="font-medium">{formatDate(selectedExpense.date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={
                      selectedExpense.status === 'approved' ? 'bg-green-500' :
                      selectedExpense.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {selectedExpense.status === 'approved' ? 'Disetujui' :
                       selectedExpense.status === 'pending' ? 'Pending' : 'Ditolak'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedExpense.vendor}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kategori</Label>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">No PO</Label>
                  <p className="font-medium">{selectedExpense.poNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jumlah</Label>
                  <p className="font-bold text-lg text-green-600">
                    Rp {selectedExpense.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {selectedExpense.category === "Hardware" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status Garansi</Label>
                    <p className="font-medium">{selectedExpense.warranty || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Expired Garansi</Label>
                    <p className={`font-medium ${isExpiringSoon(selectedExpense.expiredWarranty) ? 'text-red-600 font-bold' : ''}`}>
                      {selectedExpense.expiredWarranty ? formatDate(selectedExpense.expiredWarranty) : "-"}
                    </p>
                  </div>
                </div>
              )}

              {(selectedExpense.category === "Software" || selectedExpense.category === "Website") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Jenis Lisensi</Label>
                    <p className="font-medium">{selectedExpense.licenseType || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Expired Lisensi</Label>
                    <p className={`font-medium ${isExpiringSoon(selectedExpense.expiredSubscription) ? 'text-red-600 font-bold' : ''}`}>
                      {selectedExpense.expiredSubscription ? formatDate(selectedExpense.expiredSubscription) : "-"}
                    </p>
                  </div>
                </div>
              )}

              {selectedExpense.invoiceData && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bukti Transaksi</Label>
                  <div className="mt-2 space-y-3">
                    {selectedExpense.invoiceMimeType === 'application/pdf' ? (
                      <>
                        {/* PDF Preview */}
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                          <iframe
                            src={`data:${selectedExpense.invoiceMimeType};base64,${selectedExpense.invoiceData}`}
                            className="w-full h-[500px]"
                            title="PDF Preview"
                          />
                        </div>
                        {/* Download Button */}
                        <a
                          href={`data:${selectedExpense.invoiceMimeType};base64,${selectedExpense.invoiceData}`}
                          download={selectedExpense.invoiceFilename || 'invoice.pdf'}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </a>
                      </>
                    ) : (
                      <>
                        {/* Image Preview */}
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={`data:${selectedExpense.invoiceMimeType};base64,${selectedExpense.invoiceData}`}
                            alt="Invoice"
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                        {/* Download Button */}
                        <a
                          href={`data:${selectedExpense.invoiceMimeType};base64,${selectedExpense.invoiceData}`}
                          download={selectedExpense.invoiceFilename || 'invoice.jpg'}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Gambar</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}