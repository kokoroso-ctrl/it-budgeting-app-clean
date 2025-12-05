"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CostTracking() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Hardware",
    contracts: "0",
    status: "active",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, categoryFilter]);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/vendors?sort=totalSpent&order=desc');
      if (!response.ok) throw new Error('Gagal memuat vendor');
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      setError('Gagal memuat vendor. Silakan coba lagi.');
      console.error('Fetch vendors error:', err);
      toast.error("Gagal memuat vendor");
    } finally {
      setIsLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = [...vendors];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(vendor => vendor.category === categoryFilter);
    }

    setFilteredVendors(filtered);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/vendors?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah status');
      }

      await fetchVendors();
      toast.success("Status vendor berhasil diubah");
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status');
      toast.error(err.message || 'Gagal mengubah status');
      console.error('Status update error:', err);
    }
  };

  const handleEdit = (vendor: any) => {
    setIsEditMode(true);
    setEditingId(vendor.id);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contracts: vendor.contracts.toString(),
      status: vendor.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus vendor ini?")) return;

    try {
      const response = await fetch(`/api/vendors?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus vendor');
      }

      await fetchVendors();
      toast.success("Vendor berhasil dihapus");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus vendor");
      console.error('Delete error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        contracts: parseInt(formData.contracts),
        status: formData.status,
      };

      if (isEditMode && editingId !== null) {
        const response = await fetch(`/api/vendors?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mengupdate vendor');
        }
        toast.success("Vendor berhasil diupdate");
      } else {
        const response = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menambahkan vendor');
        }
        toast.success("Vendor berhasil ditambahkan");
      }

      await fetchVendors();
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || (isEditMode ? "Gagal mengupdate vendor" : "Gagal menambahkan vendor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "Hardware",
      contracts: "0",
      status: "active",
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
  };

  const uniqueCategories = Array.from(new Set(vendors.map(v => v.category)));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendor Tracking</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola dan pantau vendor</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Daftar Vendor</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Total pengeluaran dihitung otomatis dari akumulasi transaksi</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || categoryFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">{isEditMode ? "Edit Vendor" : "Tambah Vendor Baru"}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {isEditMode ? "Update informasi vendor" : "Tambahkan vendor baru ke sistem. Total pengeluaran akan dihitung otomatis dari transaksi."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Vendor</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Dell Indonesia"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                    <div className="space-y-2">
                      <Label htmlFor="contracts">Jumlah Kontrak</Label>
                      <Input
                        id="contracts"
                        type="number"
                        placeholder="0"
                        value={formData.contracts}
                        onChange={(e) => setFormData({ ...formData, contracts: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                        {isSubmitting ? "Menyimpan..." : (isEditMode ? "Update" : "Tambah")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Memuat vendor...</div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                {vendors.length === 0 ? "Tidak ada vendor ditemukan" : "Tidak ada hasil yang cocok dengan filter"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nama Vendor</TableHead>
                      <TableHead className="text-xs sm:text-sm">Kategori</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Total Pengeluaran</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Kontrak</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{vendor.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{vendor.category}</TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          Rp {vendor.totalSpent.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{vendor.contracts}</TableCell>
                        <TableCell>
                          <Select 
                            value={vendor.status} 
                            onValueChange={(value) => handleStatusChange(vendor.id, value)}
                          >
                            <SelectTrigger className="w-[100px] sm:w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <span className="flex items-center text-xs">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                  Aktif
                                </span>
                              </SelectItem>
                              <SelectItem value="inactive">
                                <span className="flex items-center text-xs">
                                  <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                                  Tidak Aktif
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(vendor)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(vendor.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}