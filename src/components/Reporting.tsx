"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Budget variance analysis and forecasting</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

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
  );
}