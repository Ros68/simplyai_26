import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart,
  GridIcon,
  MessageSquare,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to admin login if not authenticated or not administrator
  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
    } else if (user.role !== "administrator") {
      navigate("/admin/login");
    }
  }, [user, navigate]);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: location.pathname === "/admin",
    },
    {
      name: "Editor Pagine",
      href: "/admin/page-editor",
      icon: FileText,
      active: location.pathname.startsWith("/admin/page-editor"),
    },
    {
      name: "Form Builder",
      href: "/admin/form-builder",
      icon: GridIcon,
      active: location.pathname.startsWith("/admin/form-builder"),
    },
    {
      name: "Gestione Piani",
      href: "/admin/plans",
      icon: CreditCard,
      active: location.pathname.startsWith("/admin/plans"),
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: BarChart,
      active:
        location.pathname === "/admin/reports" ||
        location.pathname.startsWith("/admin/reports/"),
    },
    {
      name: "Utenti",
      href: "/admin/users",
      icon: Users,
      active: location.pathname.startsWith("/admin/users"),
    },
    {
      name: "ChatGPT",
      href: "/admin/chatgpt",
      icon: MessageSquare,
      active: location.pathname.startsWith("/admin/chatgpt"),
    },
    {
      name: "Impostazioni",
      href: "/admin/settings",
      icon: Settings,
      active: location.pathname.startsWith("/admin/settings"),
    },
  ];

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-[var(--color-primary-300)] text-white shadow-md">
        <Link to="/" className="text-xl font-bold">
          SimolyAI Admin
        </Link>
        <button
          type="button"
          className="text-white hover:text-gray-200 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-[var(--color-primary-300)] text-white transform transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-primary-700)]">
            <Link
              to="/"
              className="text-xl font-bold"
              onClick={() => setMobileMenuOpen(false)}
            >
              SimolyAI Admin
            </Link>
            <button
              type="button"
              className="text-white hover:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  item.active
                    ? "bg-[var(--color-primary-700)] text-white"
                    : "text-white hover:bg-[var(--color-primary-700)]",
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-md"
                )}
              >
                <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-[var(--color-primary-700)]">
            <Link
              to="/admin/login"
              onClick={handleLogout}
              className="text-sm font-medium text-white hover:text-gray-200"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-[var(--color-primary-300)] text-white">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link to="/" className="text-xl font-bold">
              SimolyAI Admin
            </Link>
          </div>

          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  item.active
                    ? "bg-[var(--color-primary-700)] text-white"
                    : "text-white hover:bg-[var(--color-primary-700)]",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-[var(--color-primary-700)]">
            <Link
              to="/admin/login"
              onClick={handleLogout}
              className="text-sm font-medium text-white hover:text-gray-200"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64 flex-1">
        <main className="pt-16 md:pt-0 p-6 min-h-screen w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
