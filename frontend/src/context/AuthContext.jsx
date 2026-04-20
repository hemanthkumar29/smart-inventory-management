import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchMe, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

const getApiErrorMessage = (error, fallback = "") => {
  const details = error?.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details[0]?.message || fallback;
  }

  return error?.response?.data?.message || fallback;
};

const isDuplicateEmailRegistrationError = (error) => {
  if (error?.response?.status !== 409) {
    return false;
  }

  const message = getApiErrorMessage(error, "").toLowerCase();
  return message.includes("email") || message.includes("already exists") || message.includes("duplicate");
};

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
    try {
      const result = await registerUser(payload);
      persistAuth(result.token, result.user);
      return {
        user: result.user,
        wasRecovered: false,
      };
    } catch (error) {
      if (!isDuplicateEmailRegistrationError(error)) {
        throw error;
      }

      const loginResult = await loginUser({
        email: payload.email,
        password: payload.password,
      });
      persistAuth(loginResult.token, loginResult.user);
      return {
        user: loginResult.user,
        wasRecovered: true,
      };
    }
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
