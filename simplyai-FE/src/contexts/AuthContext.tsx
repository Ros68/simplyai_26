import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "@/services/ApiService";

interface User {
  password?: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "premium_user" | "administrator";
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isLoading: boolean;
  session: any;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  signOut: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setTokenState(storedToken);
          setUserState(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading auth state from local storage:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
    else localStorage.removeItem("user");
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) localStorage.setItem("token", newToken);
    else localStorage.removeItem("token");
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // 🌟 FIX 1: Passed as a single object { email, password } (Expected 1 argument)
      const response = await loginUser({ email, password });

      if (response.success && response.data) {
        const { user: userInfo, token: userToken } = response.data;
        const userWithRole = {
          ...userInfo,
          isAdmin: userInfo.role === "administrator",
        };
        setUser(userWithRole);
        setToken(userToken);
        console.log("✅ Login successful:", userWithRole.email);
      }

      return response;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await registerUser(userData);

      if (response.success) {
        if (response.requiresVerification) {
          console.log("ℹ️ Registration requires verification, not logging in automatically.");
        } else if (response.data) {
          const { user: userInfo, token: userToken } = response.data;
          const userWithRole = {
            ...userInfo,
            isAdmin: userInfo.role === "administrator",
          };
          setUser(userWithRole);
          setToken(userToken);
          console.log("✅ Registration successful:", userWithRole.email);
        }
      } else {
        throw new Error(response.message);
      }

      return response;
    } catch (error) {
      console.error("❌ Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 1. Clear State
      setUserState(null);
      setTokenState(null);

      // 2. Force clean all cache completely!
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("registered_user"); 
      localStorage.removeItem("registered_plan"); 
      sessionStorage.clear(); 

      // 3. 🌟 FIX 2: Passed token as 1 argument to satisfy TypeScript
      try {
        if (token) {
          await logoutUser(token); 
        }
      } catch (e) {
        // Ignore if API call fails
      }

      console.log("✅ Logout and Cache Clean complete");
      console.log("🚪 Logging out...");
      window.location.href = "/";
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  useEffect(() => {
    console.log("🔄 Auth state changed:", {
      hasUser: !!user,
      hasToken: !!token,
      loading,
      isAuthenticated: !!user && !!token,
      userEmail: user?.email,
    });
  }, [user, token, loading]);

  const value: AuthContextType = {
    user,
    token,
    loading,
    isLoading: loading,
    session: user ? { user } : null,
    login,
    register,
    logout,
    signOut: logout,
    setUser,
    setToken,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};