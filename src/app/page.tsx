"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Receipt, BarChart3, Menu, LogOut, X, User } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";
import BudgetPlanning from "@/components/BudgetPlanning";
import CostTracking from "@/components/CostTracking";
import Reporting from "@/components/Reporting";
import Profile from "@/components/Profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      { id: "profile", name: "Profil", icon: User },
    ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r bg-card overflow-y-auto
      `}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1764895004570.png?width=8000&height=8000&resize=contain"
                alt="MAMAGREEN Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">IT Budgeting</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="space-y-1 px-3 pb-4">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="text-sm sm:text-base">{item.name}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground">IT Department</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "planning" && <BudgetPlanning />}
          {activeTab === "tracking" && <CostTracking />}
          {activeTab === "reporting" && <Reporting />}
        </div>
      </main>
    </div>
  );
}"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Receipt, BarChart3, Menu, LogOut, X, User } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";
import BudgetPlanning from "@/components/BudgetPlanning";
import CostTracking from "@/components/CostTracking";
import Reporting from "@/components/Reporting";
import Profile from "@/components/Profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      { id: "profile", name: "Profil", icon: User },
    ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r bg-card overflow-y-auto
      `}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logommg-1764895004570.png?width=8000&height=8000&resize=contain"
                alt="MAMAGREEN Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">IT Budgeting</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <nav className="space-y-1 px-3 pb-4">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="text-sm sm:text-base">{item.name}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground">IT Department</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "planning" && <BudgetPlanning />}
            {activeTab === "tracking" && <CostTracking />}
            {activeTab === "reporting" && <Reporting />}
            {activeTab === "profile" && <Profile />}
          </div>
      </main>
    </div>
  );
}