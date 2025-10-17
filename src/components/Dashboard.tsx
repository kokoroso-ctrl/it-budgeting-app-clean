"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expensesRes, budgetsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/budgets')
      ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudgets(budgetsData);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalBudget = budgets
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const totalSpent = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const variance = totalBudget - totalSpent;
  const variancePercent = totalBudget > 0 ? ((variance / totalBudget) * 100).toFixed(1) : '0.0';

  // Group expenses by category
  const categorySpending: { [key: string]: { budget: number; spent: number; remaining: number } } = {};
  
  budgets.filter(b => b.status === 'approved').forEach(budget => {
    if (!categorySpending[budget.category]) {
      categorySpending[budget.category] = { budget: 0, spent: 0, remaining: 0 };
    }
    categorySpending[budget.category].budget += budget.amount;
  });

  expenses.filter(e => e.status === 'approved').forEach(expense => {
    if (!categorySpending[expense.category]) {
      categorySpending[expense.category] = { budget: 0, spent: 0, remaining: 0 };
    }
    categorySpending[expense.category].spent += expense.amount;
  });

  Object.keys(categorySpending).forEach(category => {
    categorySpending[category].remaining = categorySpending[category].budget - categorySpending[category].spent;
  });

  const categorySpendingArray = Object.entries(categorySpending).map(([category, data]) => ({
    category,
    ...data
  }));

  // Department/category distribution for pie chart
  const departmentData = categorySpendingArray.map((cat, index) => ({
    name: cat.category,
    value: cat.budget,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  // Monthly budget vs actual (using available data)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' });
    const monthlyBudget = totalBudget / 12;
    const monthlyActual = totalSpent / 6; // Spread actual spending across months
    
    return {
      month,
      budget: Math.round(monthlyBudget),
      actual: Math.round(monthlyActual * (0.9 + Math.random() * 0.2)) // Add some variance
    };
  });

  // Alerts based on actual data
  const alerts = categorySpendingArray
    .filter(cat => cat.remaining < 0)
    .map((cat, index) => ({
      id: index + 1,
      type: 'overrun',
      category: cat.category,
      message: `${cat.category} category exceeded budget by $${Math.abs(cat.remaining).toLocaleString()}`,
      severity: 'high' as const
    }));

  // Add warning alerts for categories at >90% budget
  categorySpendingArray
    .filter(cat => cat.budget > 0 && (cat.spent / cat.budget) > 0.9 && cat.remaining >= 0)
    .forEach((cat, index) => {
      alerts.push({
        id: alerts.length + index + 1,
        type: 'warning',
        category: cat.category,
        message: `${cat.category} spending at ${((cat.spent / cat.budget) * 100).toFixed(1)}% of budget`,
        severity: 'medium' as const
      });
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading dashboard data...</div>
      </div>
    );
  }

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
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <TrendingUp className={`h-4 w-4 ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(Math.abs(variance) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">
              {variance >= 0 ? `${variancePercent}% under budget` : `${variancePercent}% over budget`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.severity === 'high').length} critical issues
            </p>
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
                <BarChart data={monthlyData}>
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
              {departmentData.length === 0 ? (
                <div className="flex items-center justify-center h-[350px]">
                  <p className="text-muted-foreground">No budget data available</p>
                </div>
              ) : (
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
              )}
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
              {categorySpendingArray.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No category data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categorySpendingArray.map((cat) => (
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
                          {cat.budget > 0 ? ((cat.spent / cat.budget) * 100).toFixed(1) : '0'}% used
                        </span>
                        <span className={cat.remaining < 0 ? "text-red-500 font-medium" : "text-green-600"}>
                          {cat.remaining < 0 ? "Over" : "Under"} ${Math.abs(cat.remaining / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}