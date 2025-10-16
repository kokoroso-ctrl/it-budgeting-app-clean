"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const budgetData = [
  { month: "Jan", budget: 120000, actual: 115000 },
  { month: "Feb", budget: 120000, actual: 125000 },
  { month: "Mar", budget: 120000, actual: 118000 },
  { month: "Apr", budget: 120000, actual: 122000 },
  { month: "May", budget: 120000, actual: 119000 },
  { month: "Jun", budget: 120000, actual: 123000 },
];

const departmentData = [
  { name: "Infrastructure", value: 450000, color: "hsl(var(--chart-1))" },
  { name: "Software", value: 280000, color: "hsl(var(--chart-2))" },
  { name: "Personnel", value: 520000, color: "hsl(var(--chart-3))" },
  { name: "Services", value: 180000, color: "hsl(var(--chart-4))" },
  { name: "Hardware", value: 320000, color: "hsl(var(--chart-5))" },
];

const categorySpending = [
  { category: "Hardware", budget: 320000, spent: 285000, remaining: 35000 },
  { category: "Software", budget: 280000, spent: 265000, remaining: 15000 },
  { category: "Personnel", budget: 520000, spent: 500000, remaining: 20000 },
  { category: "Services", budget: 180000, spent: 195000, remaining: -15000 },
  { category: "Infrastructure", budget: 450000, spent: 420000, remaining: 30000 },
];

export default function Dashboard() {
  const totalBudget = 1750000;
  const totalSpent = 1665000;
  const variance = totalBudget - totalSpent;
  const variancePercent = ((variance / totalBudget) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">Annual IT Budget 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalSpent / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(variance / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">{variancePercent}% under budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Budget overruns detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="budget-vs-actual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget-vs-actual">Budget vs Actual</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="budget-vs-actual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
              <CardDescription>Monthly comparison for 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="hsl(var(--chart-1))" name="Budget" />
                  <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation by Department</CardTitle>
              <CardDescription>Total budget distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Budget Status</CardTitle>
              <CardDescription>Spending status by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySpending.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ${(cat.spent / 1000).toFixed(0)}K / ${(cat.budget / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-secondary">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${
                          cat.remaining < 0 ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((cat.spent / cat.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {((cat.spent / cat.budget) * 100).toFixed(1)}% used
                      </span>
                      <span className={cat.remaining < 0 ? "text-red-500 font-medium" : "text-green-600"}>
                        {cat.remaining < 0 ? "Over" : "Under"} ${Math.abs(cat.remaining / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}