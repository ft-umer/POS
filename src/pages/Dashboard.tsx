import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ShoppingCart, Package, BarChart3, Menu, X, UserCheck } from 'lucide-react';
import { useState } from 'react';
import POSInterface from '@/components/pos/POSInterface';
import Products from '@/components/pos/Products';
import Sales from '@/components/pos/Sales';
import OrderTakers from '@/components/pos/OrderTakers';

const Dashboard = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const navigation = [
    { name: 'Home', path: '/dashboard', icon: ShoppingCart },
    { name: 'Products', path: '/dashboard/products', icon: Package },
    { name: 'Sales', path: '/dashboard/sales', icon: BarChart3 },
    { name: 'Order Takers', path: '/dashboard/order-takers', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className='flex items-center gap-2 sm:gap-3"'>
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold">Tahir Fruit Chaat</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user?.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1 sm:gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar - Desktop & Mobile */}
        <aside className={`
          fixed md:sticky top-[57px] md:top-0 left-0 z-40
          w-64 border-r bg-card min-h-[calc(100vh-57px)]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
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
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full m-1 justify-start text-base"
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
        <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<POSInterface />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/order-takers" element={<OrderTakers />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
