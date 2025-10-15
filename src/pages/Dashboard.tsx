import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ShoppingCart,
  Package,
  BarChart3,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import POSInterface from "@/components/pos/POSInterface";
import Products from "@/components/pos/Products";
import Sales from "@/components/pos/Sales";
import OrderTakers from "@/components/pos/OrderTakers";
import AdminList from "../components/pos/AdminList";

const Dashboard = () => {
  const { user, logout, loading } = useAuth(); // ✅ include loading
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ Wait until AuthContext finishes loading
  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading...</div>;
  }

  // ✅ Only redirect if finished loading and no user
  if (!user) return <Navigate to="/login" />;

  const allNavigation = [
    { name: "Home", path: "/dashboard", icon: ShoppingCart },
    { name: "Products", path: "/dashboard/products", icon: Package },
    { name: "Sales", path: "/dashboard/sales", icon: BarChart3 },
    { name: "Order Takers", path: "/dashboard/order-takers", icon: UserCheck },
    { name: "Admins", path: "/dashboard/admins", icon: UserCheck },
  ];

  const navigation =
    user.role === "superadmin"
      ? allNavigation
      : allNavigation.filter((item) => item.name !== "Order Takers" && item.name !== "Admins" && item.name !== "Sales");

  return (
    <div className="min-h-screen flex flex-col text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-xl border-b border-white/20 shadow-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition">
              <img src="https://res.cloudinary.com/dtipim18j/image/upload/v1760371396/logo_rnsgxs.png" alt="Logo" className="h-12 w-12 rounded-full object-cover" />
              <h1 className="text-lg sm:text-xl font-semibold tracking-wide">Tahir Fruit Chaat</h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-700">
              Welcome, <span className="font-medium">{user.username}</span>
              {user.role === "superadmin" && " (SuperAdmin)"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-gray-300 text-gray-700 bg-white/30 backdrop-blur-sm hover:text-white transition"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-[60px] md:top-0 left-0 z-40
            w-64 md:w-60 min-h-[calc(100vh-60px)] 
            bg-white/15 backdrop-blur-lg border-r pt-4 border-white/30 shadow-lg
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <nav className="p-4 grid gap-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                      ${isActive
                        ? "bg-orange-500/90 text-white shadow-md scale-[1.02]"
                        : "bg-white/40 hover:bg-white/60 text-gray-800 "
                      }`}
                  >
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-md p-4 sm:p-6">
            <Routes>
              <Route path="/" element={<POSInterface />} />
              <Route path="/products" element={<Products />} />

              {user.role === "superadmin" && (
                <>
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/order-takers" element={<OrderTakers />} />
                  <Route path="/admins" element={<AdminList />} />
                </>
              )}
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
