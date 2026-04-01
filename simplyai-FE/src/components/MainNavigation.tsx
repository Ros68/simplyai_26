import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavigationItem {
  id: string;
  title: string;
  path: string;
  inMainMenu: boolean;
}

const defaultNavItems: NavigationItem[] = [
  { id: "home", title: "Home", path: "/", inMainMenu: true },
  { id: "about", title: "Chi Siamo", path: "/about", inMainMenu: true },
  { id: "guide", title: "Guida", path: "/guide", inMainMenu: true },
  { id: "pricing", title: "Prezzi", path: "/pricing", inMainMenu: true },
  { id: "contact", title: "Contatti", path: "/contact", inMainMenu: true },
];

interface MainNavigationProps {
  variant?: "default" | "dashboard" | "questionnaire";
  title?: string;
}

const MainNavigation: React.FC<MainNavigationProps> = ({
  variant = "default",
  title,
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>(defaultNavItems);

  const isActive = (path: string) => location.pathname === path;

  // Logica per caricare le pagine dal backend
  useEffect(() => {
    // In produzione, qui faresti una chiamata API per caricare le pagine
    // Per ora usiamo i valori predefiniti
  }, []);

  // Gestisce diversi stili di navigazione in base alla variante
  const renderNavigationContent = () => {
    switch (variant) {
      case "dashboard":
        return (
          <>
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-simoly-purple to-simoly-purple-dark bg-clip-text text-transparent"
              >
                SimplyAI
              </Link>
              <span className="mx-4 text-gray-300">|</span>
              <h1 className="text-lg font-medium">Dashboard</h1>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  I miei questionari
                </Button>
              </Link>
              <Link to="/dashboard/reports">
                <Button variant="ghost" size="sm">
                  Report
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profilo
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link to="/profile" className="w-full">
                      Il mio profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="w-full">
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/logout" className="w-full">
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        );

      case "questionnaire":
        return (
          <>
            <div className="flex items-center">
              
              
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5 mr-2" />
                    Navigazione
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link to="/dashboard" className="w-full">
                      I miei questionari
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/dashboard/reports" className="w-full">
                      Report
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/profile" className="w-full">
                      Profilo
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link to="/profile" className="w-full">
                      Il mio profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="w-full">
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/logout" className="w-full">
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        );

      default:
        return (
          <>
            <Link
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-simoly-purple to-simoly-purple-dark bg-clip-text text-transparent"
            >
              SimplyAI
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              {navItems
                .filter((item) => item.inMainMenu)
                .map((item) => (
                  <Link key={item.id} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={
                        isActive(item.path)
                          ? "bg-simoly-purple hover:bg-simoly-purple-dark"
                          : ""
                      }
                    >
                      {item.title}
                    </Button>
                  </Link>
                ))}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link to="/dashboard" className="w-full">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/profile" className="w-full">
                        Profilo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/logout" className="w-full">
                        Logout
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Accedi
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button
                      size="sm"
                      className="bg-simoly-purple hover:bg-simoly-purple-dark"
                    >
                      Registrati
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="md:hidden flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <nav className="w-full py-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {renderNavigationContent()}
        </div>
      </nav>

      {/* Menu mobile */}
      {isMenuOpen && variant === "default" && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white shadow-md p-4 z-50 flex flex-col space-y-2 animate-in fade-in slide-in-from-top">
          {navItems
            .filter((item) => item.inMainMenu)
            .map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-4 py-2 rounded-lg ${
                  isActive(item.path) ? "bg-simoly-purple text-white" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.title}
              </Link>
            ))}

          <div className="border-t pt-2 mt-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 rounded-lg block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profilo
                </Link>
                <Link
                  to="/logout"
                  className="px-4 py-2 rounded-lg block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Logout
                </Link>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link
                  to="/pricing"
                  className="px-4 py-2 rounded-lg bg-simoly-purple text-white block text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrati
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MainNavigation;
