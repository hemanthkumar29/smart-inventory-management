import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchMe, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("smart_inventory_token"));
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem("smart_inventory_token", nextToken);
    localStorage.setItem("smart_inventory_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("smart_inventory_token");
    localStorage.removeItem("smart_inventory_user");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (payload) => {
    const result = await loginUser(payload);
    persistAuth(result.token, result.user);
    return result.user;
  }, [persistAuth]);

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload);
    persistAuth(result.token, result.user);
    return result.user;
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("smart_inventory_token")) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await fetchMe();
      setUser(profile);
    } catch (_error) {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    const unauthorizedHandler = () => {
      if (localStorage.getItem("smart_inventory_token")) {
        toast.error("Session expired. Please login again");
      }
      clearAuth();
    };

    window.addEventListener("auth:unauthorized", unauthorizedHandler);
    return () => window.removeEventListener("auth:unauthorized", unauthorizedHandler);
  }, [clearAuth]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile, token]);

  const contextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    refreshProfile,
  }), [user, token, isLoading, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;
