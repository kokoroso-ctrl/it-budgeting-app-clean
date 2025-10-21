"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const forecastData = [
  { month: "Jan", actual: 115000, forecast: 120000 },
  { month: "Feb", actual: 125000, forecast: 120000 },
  { month: "Mar", actual: 118000, forecast: 120000 },
  { month: "Apr", actual: 122000, forecast: 120000 },
  { month: "May", actual: 119000, forecast: 120000 },
  { month: "Jun", actual: 123000, forecast: 120000 },
  { month: "Jul", actual: null, forecast: 121000 },
  { month: "Aug", actual: null, forecast: 122000 },
  { month: "Sep", actual: null, forecast: 119000 },
  { month: "Oct", actual: null, forecast: 120000 },
  { month: "Nov", actual: null, forecast: 123000 },
  { month: "Dec", actual: null, forecast: 125000 },
];

const varianceData = [
  { category: "Hardware", budget: 320000, actual: 285000, variance: 35000, variancePercent: 10.9 },
  { category: "Software", budget: 280000, actual: 265000, variance: 15000, variancePercent: 5.4 },
  { category: "Personnel", budget: 520000, actual: 500000, variance: 20000, variancePercent: 3.8 },
  { category: "Services", budget: 180000, actual: 195000, variance: -15000, variancePercent: -8.3 },
  { category: "Infrastructure", budget: 450000, actual: 420000, variance: 30000, variancePercent: 6.7 },
];

const alerts = [
  {
    id: 1,
    type: "overrun",
    category: "Services",
    message: "Services category exceeded budget by $15,000",
    severity: "high",
  },
  {
    id: 2,
    type: "warning",
    category: "Software",
    message: "Software spending at 94.6% of budget",
    severity: "medium",
  },
  {
    id: 3,
    type: "info",
    category: "Hardware",
    message: "Hardware spending 10.9% under budget",
    severity: "low",
  },
];

export default function Reporting() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Expense reports and budget analysis</p>
        </div>
      </div>

      {/* Expense Report Section */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Expense Report</CardTitle>
          <CardDescription>Filter and print expense reports</CardDescription>
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
                  <th className="text-left py-1 px-1">Expired Date</th>
                  <th className="text-left py-1 px-1">Jenis Lisensi</th>
                  <th className="text-left py-1 px-1">Status Garansi</th>
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
                    <td className="py-1 px-1 whitespace-nowrap">
                      {expense.expiredWarranty 
                        ? new Date(expense.expiredWarranty).toLocaleDateString("id-ID") 
                        : expense.expiredSubscription 
                          ? new Date(expense.expiredSubscription).toLocaleDateString("id-ID")
                          : "-"}
                    </td>
                    <td className="py-1 px-1">{expense.licenseType || "-"}</td>
                    <td className="py-1 px-1">{expense.warranty || "-"}</td>
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

          {/* Footer */}
          <div className="mt-4 text-xs">
            <p className="font-bold">Total Pengeluaran: Rp {calculateTotal().toLocaleString("id-ID")}</p>
            <p>Jumlah Transaksi: {filteredExpenses.length}</p>
          </div>
        </div>
      </div>

      {/* Existing Analytics Sections - Hidden on Print */}
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

        {/* Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Forecast</CardTitle>
            <CardDescription>Actual vs forecasted spending for 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Actual"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Variance Report */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance Report</CardTitle>
            <CardDescription>Detailed breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varianceData.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">${item.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.actual.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-medium ${item.variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      ${Math.abs(item.variance).toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right ${item.variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                    </TableCell>
                    <TableCell>
                      {item.variance < 0 ? (
                        <Badge variant="destructive">Over Budget</Badge>
                      ) : (
                        <Badge className="bg-green-500">Under Budget</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Variance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Visualization</CardTitle>
            <CardDescription>Budget vs actual spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={varianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" fill="hsl(var(--chart-1))" name="Budget" />
                <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}