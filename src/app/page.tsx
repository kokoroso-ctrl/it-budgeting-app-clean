"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Receipt, BarChart3, Menu, LogOut } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";
import BudgetPlanning from "@/components/BudgetPlanning";
import CostTracking from "@/components/CostTracking";
import Reporting from "@/components/Reporting";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Gagal logout");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/login");
      toast.success("Logout berhasil");
    }
  };

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "planning", name: "Budget Planning", icon: FileText },
    { id: "tracking", name: "Vendor Tracking", icon: Receipt },
    { id: "reporting", name: "Reports & Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 border-r bg-card overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PT MAMAGREEN PACIFIC</h1>
              <p className="text-xs text-muted-foreground">IT Budgeting Dashboard</p>
            </div>
          </div>
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
                <p className="text-sm font-medium">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground">IT Department</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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