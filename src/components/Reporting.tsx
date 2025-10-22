"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Data untuk multiple tahun
const allForecastData = {
  2024: [
    { month: "Jan", actual: 1725000000, forecast: 1800000000 },
    { month: "Feb", actual: 1875000000, forecast: 1800000000 },
    { month: "Mar", actual: 1770000000, forecast: 1800000000 },
    { month: "Apr", actual: 1830000000, forecast: 1800000000 },
    { month: "May", actual: 1785000000, forecast: 1800000000 },
    { month: "Jun", actual: 1845000000, forecast: 1800000000 },
    { month: "Jul", actual: null, forecast: 1815000000 },
    { month: "Aug", actual: null, forecast: 1830000000 },
    { month: "Sep", actual: null, forecast: 1785000000 },
    { month: "Oct", actual: null, forecast: 1800000000 },
    { month: "Nov", actual: null, forecast: 1845000000 },
    { month: "Dec", actual: null, forecast: 1875000000 },
  ],
  2025: [
    { month: "Jan", actual: 1950000000, forecast: 1980000000 },
    { month: "Feb", actual: 2025000000, forecast: 1980000000 },
    { month: "Mar", actual: 1890000000, forecast: 1980000000 },
    { month: "Apr", actual: null, forecast: 1980000000 },
    { month: "May", actual: null, forecast: 1980000000 },
    { month: "Jun", actual: null, forecast: 1980000000 },
    { month: "Jul", actual: null, forecast: 1995000000 },
    { month: "Aug", actual: null, forecast: 2010000000 },
    { month: "Sep", actual: null, forecast: 1965000000 },
    { month: "Oct", actual: null, forecast: 1980000000 },
    { month: "Nov", actual: null, forecast: 2025000000 },
    { month: "Dec", actual: null, forecast: 2055000000 },
  ],
  2026: [
    { month: "Jan", actual: null, forecast: 2145000000 },
    { month: "Feb", actual: null, forecast: 2145000000 },
    { month: "Mar", actual: null, forecast: 2145000000 },
    { month: "Apr", actual: null, forecast: 2145000000 },
    { month: "May", actual: null, forecast: 2145000000 },
    { month: "Jun", actual: null, forecast: 2145000000 },
    { month: "Jul", actual: null, forecast: 2160000000 },
    { month: "Aug", actual: null, forecast: 2175000000 },
    { month: "Sep", actual: null, forecast: 2130000000 },
    { month: "Oct", actual: null, forecast: 2145000000 },
    { month: "Nov", actual: null, forecast: 2190000000 },
    { month: "Dec", actual: null, forecast: 2220000000 },
  ],
};

const allVarianceData = {
  2024: [
    { category: "Hardware", budget: 4800000000, actual: 4275000000, variance: 525000000, variancePercent: 10.9 },
    { category: "Software", budget: 4200000000, actual: 3975000000, variance: 225000000, variancePercent: 5.4 },
    { category: "Personnel", budget: 7800000000, actual: 7500000000, variance: 300000000, variancePercent: 3.8 },
    { category: "Services", budget: 2700000000, actual: 2925000000, variance: -225000000, variancePercent: -8.3 },
    { category: "Infrastructure", budget: 6750000000, actual: 6300000000, variance: 450000000, variancePercent: 6.7 },
  ],
  2025: [
    { category: "Hardware", budget: 5280000000, actual: 4650000000, variance: 630000000, variancePercent: 11.9 },
    { category: "Software", budget: 4620000000, actual: 4320000000, variance: 300000000, variancePercent: 6.5 },
    { category: "Personnel", budget: 8580000000, actual: 8250000000, variance: 330000000, variancePercent: 3.8 },
    { category: "Services", budget: 2970000000, actual: 3180000000, variance: -210000000, variancePercent: -7.1 },
    { category: "Infrastructure", budget: 7425000000, actual: 6930000000, variance: 495000000, variancePercent: 6.7 },
  ],
  2026: [
    { category: "Hardware", budget: 5808000000, actual: 0, variance: 5808000000, variancePercent: 100 },
    { category: "Software", budget: 5082000000, actual: 0, variance: 5082000000, variancePercent: 100 },
    { category: "Personnel", budget: 9438000000, actual: 0, variance: 9438000000, variancePercent: 100 },
    { category: "Services", budget: 3267000000, actual: 0, variance: 3267000000, variancePercent: 100 },
    { category: "Infrastructure", budget: 8168000000, actual: 0, variance: 8168000000, variancePercent: 100 },
  ],
};

const alerts = [
  {
    id: 1,
    type: "overrun",
    category: "Services",
    message: "Kategori Services melebihi anggaran sebesar Rp 225.000.000",
    severity: "high",
  },
  {
    id: 2,
    type: "warning",
    category: "Software",
    message: "Pengeluaran Software mencapai 94,6% dari anggaran",
    severity: "medium",
  },
  {
    id: 3,
    type: "info",
    category: "Hardware",
    message: "Pengeluaran Hardware 10,9% di bawah anggaran",
    severity: "low",
  },
];

// Custom Tooltip for better formatting
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: Rp {(entry.value / 1000000).toFixed(0)}Jt
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reporting() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [forecastYear, setForecastYear] = useState("2024");
  const [varianceYear, setVarianceYear] = useState("2024");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, selectedMonth, selectedCategory, expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (filterType === "month" && selectedMonth) {
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.date);
        const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
        return expMonth === selectedMonth;
      });
    }

    if (filterType === "category" && selectedCategory) {
      filtered = filtered.filter((exp) => exp.category === selectedCategory);
    }

    setFilteredExpenses(filtered);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const calculateCategorySummary = () => {
    const summary: { [key: string]: number } = {};
    filteredExpenses.forEach((exp) => {
      if (!summary[exp.category]) {
        summary[exp.category] = 0;
      }
      summary[exp.category] += exp.amount || 0;
    });
    return Object.entries(summary).map(([category, total]) => ({ category, total }));
  };

  const months = Array.from(new Set(expenses.map((exp) => {
    const d = new Date(exp.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort();

  const categories = Array.from(new Set(expenses.map((exp) => exp.category)));

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
        }
      `}} />

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan & Analitik</h2>
          <p className="text-muted-foreground">Laporan pengeluaran dan analisis anggaran</p>
        </div>
      </div>

      {/* Expense Report Section */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Laporan Pengeluaran</CardTitle>
          <CardDescription>Filter dan cetak laporan pengeluaran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="month">Per Bulan</SelectItem>
                <SelectItem value="category">Per Kategori</SelectItem>
              </SelectContent>
            </Select>

            {filterType === "month" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterType === "category" && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Total Records: {filteredExpenses.length} | Total Amount: Rp {calculateTotal().toLocaleString("id-ID")}
          </div>

          {/* Category Summary */}
          {filteredExpenses.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-sm mb-3">Ringkasan Total Pengeluaran per Kategori</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {calculateCategorySummary().map(({ category, total }) => (
                  <div key={category} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{category}:</span>
                    <span className="font-semibold">Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Report */}
      <div id="printable-report" ref={printRef} className="hidden print:block">
        <div className="space-y-4">
          {/* Company Letterhead */}
          <div className="border-b-2 border-gray-800 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <img 
                  src="https://mamagreen.com/wp-content/uploads/2024/10/MAMAGREEN-PRIMARY-LOGO-100px.jpg" 
                  alt="Mamagreen Logo" 
                  className="h-12 mb-2"
                />
                <h1 className="text-xl font-bold">PT MAMAGREEN PACIFIC</h1>
                <p className="text-xs mt-1">
                  Jl. Gunung Kelir No. 11, Karanganyar, Tugu, Semarang, Jawa Tengah
                </p>
              </div>
              <div className="text-right text-xs">
                <p>www.mamagreen.com</p>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center">
            <h2 className="text-lg font-bold">LAPORAN PENGELUARAN IT</h2>
            {filterType === "month" && selectedMonth && (
              <p className="text-xs mt-1">
                Periode: {new Date(selectedMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            )}
            {filterType === "category" && selectedCategory && (
              <p className="text-xs mt-1">Kategori: {selectedCategory}</p>
            )}
          </div>

          {/* Report Content */}
          <div className="mt-4">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-1 px-1">No</th>
                  <th className="text-left py-1 px-1">Tanggal</th>
                  <th className="text-left py-1 px-1">Kategori</th>
                  <th className="text-left py-1 px-1">Deskripsi</th>
                  <th className="text-left py-1 px-1">Vendor</th>
                  <th className="text-left py-1 px-1">No PO</th>
                  <th className="text-right py-1 px-1">Harga (Rp)</th>
                  <th className="text-left py-1 px-1">Status Garansi</th>
                  <th className="text-left py-1 px-1">Jenis Lisensi</th>
                  <th className="text-left py-1 px-1">Expired Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} className="border-b border-gray-300">
                    <td className="py-1 px-1">{index + 1}</td>
                    <td className="py-1 px-1 whitespace-nowrap">{new Date(expense.date).toLocaleDateString("id-ID")}</td>
                    <td className="py-1 px-1">{expense.category}</td>
                    <td className="py-1 px-1">{expense.description}</td>
                    <td className="py-1 px-1">{expense.vendor}</td>
                    <td className="py-1 px-1">{expense.poNumber || "-"}</td>
                    <td className="text-right py-1 px-1 whitespace-nowrap">{expense.amount.toLocaleString("id-ID")}</td>
                    <td className="py-1 px-1">{expense.warranty || "-"}</td>
                    <td className="py-1 px-1">{expense.licenseType || "-"}</td>
                    <td className="py-1 px-1 whitespace-nowrap">
                      {expense.expiredWarranty 
                        ? new Date(expense.expiredWarranty).toLocaleDateString("id-ID") 
                        : expense.expiredSubscription 
                          ? new Date(expense.expiredSubscription).toLocaleDateString("id-ID")
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 font-bold">
                  <td colSpan={6} className="py-2 px-1 text-right">TOTAL:</td>
                  <td className="text-right py-2 px-1">Rp {calculateTotal().toLocaleString("id-ID")}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer with Category Summary */}
          <div className="mt-4 text-xs">
            <p className="font-bold">Total Pengeluaran: Rp {calculateTotal().toLocaleString("id-ID")}</p>
            <p>Jumlah Transaksi: {filteredExpenses.length}</p>
            
            {/* Category Summary in Print */}
            {filteredExpenses.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="font-bold mb-2">Ringkasan per Kategori:</p>
                <div className="grid grid-cols-3 gap-2">
                  {calculateCategorySummary().map(({ category, total }) => (
                    <div key={category}>
                      <span className="font-medium">{category}:</span> Rp {total.toLocaleString("id-ID")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Sections */}
      <div className="print:hidden">
        {/* Alerts Section */}
        <div className="grid gap-4 md:grid-cols-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  {alert.severity === "high" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  {alert.severity === "medium" && <TrendingUp className="h-5 w-5 text-yellow-500" />}
                  {alert.severity === "low" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                    {alert.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{alert.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Forecast Chart with Year Filter */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Ramalan Anggaran</CardTitle>
                <CardDescription>Pengeluaran aktual vs ramalan</CardDescription>
              </div>
              <Select value={forecastYear} onValueChange={setForecastYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={allForecastData[forecastYear as keyof typeof allForecastData]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Aktual"
                  connectNulls={false}
                  dot={{ fill: "#10b981", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#6366f1"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Ramalan"
                  dot={{ fill: "#6366f1", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Variance Report Table with Year Filter */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Laporan Varians Anggaran</CardTitle>
                <CardDescription>Rincian detail per kategori</CardDescription>
              </div>
              <Select value={varianceYear} onValueChange={setVarianceYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Anggaran</TableHead>
                  <TableHead className="text-right">Aktual</TableHead>
                  <TableHead className="text-right">Varians</TableHead>
                  <TableHead className="text-right">Varians %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allVarianceData[varianceYear as keyof typeof allVarianceData].map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">Rp {(item.budget / 1000000).toFixed(0)}Jt</TableCell>
                    <TableCell className="text-right">Rp {(item.actual / 1000000).toFixed(0)}Jt</TableCell>
                    <TableCell className={`text-right font-medium ${item.variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      Rp {(Math.abs(item.variance) / 1000000).toFixed(0)}Jt
                    </TableCell>
                    <TableCell className={`text-right ${item.variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                    </TableCell>
                    <TableCell>
                      {item.variance < 0 ? (
                        <Badge variant="destructive">Melebihi Anggaran</Badge>
                      ) : (
                        <Badge className="bg-green-500">Di Bawah Anggaran</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Beautiful Variance Chart with Year Filter */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Visualisasi Varians</CardTitle>
                <CardDescription>Anggaran vs pengeluaran aktual per kategori</CardDescription>
              </div>
              <Select value={varianceYear} onValueChange={setVarianceYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={allVarianceData[varianceYear as keyof typeof allVarianceData]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}M`}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="budget" 
                  fill="url(#budgetGradient)" 
                  name="Anggaran" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
                <Bar 
                  dataKey="actual" 
                  fill="url(#actualGradient)" 
                  name="Aktual" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}