"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Receipt, BarChart3, Menu } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import BudgetPlanning from "@/components/BudgetPlanning";
import CostTracking from "@/components/CostTracking";
import Reporting from "@/components/Reporting";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "planning", name: "Budget Planning", icon: FileText },
    { id: "tracking", name: "Cost Tracking", icon: Receipt },
    { id: "reporting", name: "Reports & Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 border-r bg-card overflow-hidden`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            IT Budgeting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Financial Management</p>
        </div>
        <nav className="space-y-1 px-3">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">IT Department</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600" />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "planning" && <BudgetPlanning />}
          {activeTab === "tracking" && <CostTracking />}
          {activeTab === "reporting" && <Reporting />}
        </div>
      </main>
    </div>
  );
}