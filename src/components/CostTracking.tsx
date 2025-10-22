"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CostTracking() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

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
    } finally {
      setIsLoading(false);
    }
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
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status');
      console.error('Status update error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendor Tracking</h2>
          <p className="text-muted-foreground">Kelola dan pantau vendor</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daftar Vendor</CardTitle>
              <CardDescription>Ringkasan vendor dan kontrak mereka</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-1" />
                Cari
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Memuat vendor...</div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Tidak ada vendor ditemukan</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Vendor</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Total Pengeluaran</TableHead>
                  <TableHead className="text-center">Kontrak Aktif</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.category}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {vendor.totalSpent.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">{vendor.contracts}</TableCell>
                    <TableCell>
                      <Select 
                        value={vendor.status} 
                        onValueChange={(value) => handleStatusChange(vendor.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <span className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              Aktif
                            </span>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <span className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                              Tidak Aktif
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}