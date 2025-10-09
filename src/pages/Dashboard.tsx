import { Navigate, Routes, Route, Link, useLocation } from "react-router-dom";
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

const Dashboard = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", path: "/dashboard", icon: ShoppingCart },
    { name: "Products", path: "/dashboard/products", icon: Package },
    { name: "Sales", path: "/dashboard/sales", icon: BarChart3 },
    { name: "Order Takers", path: "/dashboard/order-takers", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo and Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-text" />
              ) : (
                <Menu className="h-5 w-5 text-text" />
              )}
            </Button>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold text-text">
                Tahir Fruit Chaat
              </h1>
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-muted">
              Welcome,{" "}
              <span className="font-semibold text-text">
                {user?.username || "User"}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-border text-text hover:bg-primary hover:text-white transition"
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
          className={`fixed md:sticky top-[56px] md:top-0 left-0 z-40
            w-64 bg-[#000000] text-white min-h-[calc(100vh-56px)]
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-base font-medium rounded-lg
                      ${
                        isActive
                          ? "bg-primary text-white hover:bg-hover"
                          : "text-gray-200 hover:bg-gray-800 hover:text-primary"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 bg-background overflow-x-hidden">
          <div className="rounded-lg shadow-sm border border-border bg-white p-4 md:p-6">
            <Routes>
              <Route path="/" element={<POSInterface />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/order-takers" element={<OrderTakers />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
