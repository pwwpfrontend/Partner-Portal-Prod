import axios from "axios";

const API_BASE_URL = "https://njs-01.optimuslab.space/partners";

// Storage keys
const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "role";
const EMAIL_KEY = "email";

// Basic storage helpers
export const getToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const getEmail = () => localStorage.getItem(EMAIL_KEY);

const setAuthData = ({ token, refreshToken, role, email }) => {
  console.log('Setting auth data:', { token: !!token, refreshToken: !!refreshToken, role, email });
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (role) localStorage.setItem(ROLE_KEY, role);
  if (email) localStorage.setItem(EMAIL_KEY, email);
  console.log('Auth data set in localStorage');
};

export const clearAuthData = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
};

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL
});

// Request: attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Refresh token single-flight control
let isRefreshing = false;
let pendingRequestsQueue = [];

const addPendingRequest = (callback) => {
  pendingRequestsQueue.push(callback);
};

const resolvePendingRequests = (newToken) => {
  pendingRequestsQueue.forEach((callback) => callback(newToken));
  pendingRequestsQueue = [];
};

const rejectPendingRequests = (error) => {
  pendingRequestsQueue.forEach((callback) => callback(null, error));
  pendingRequestsQueue = [];
};

// Response: handle 401 -> try refresh once, then logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const backendMsg = error?.response?.data?.message?.toString()?.toLowerCase() || '';

    // Avoid infinite loop and ignore for refresh endpoint itself
    const isAuthEndpoint = originalRequest?.url?.includes("/login") || originalRequest?.url?.includes("/refresh") || originalRequest?.url?.includes("/logout");

    const tokenLikelyInvalid = backendMsg.includes('token') || backendMsg.includes('jwt') || backendMsg.includes('expired') || backendMsg.includes('invalid');
    const shouldAttemptRefresh = (status === 401) || (status === 403 && tokenLikelyInvalid);

    if (shouldAttemptRefresh && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (isRefreshing) {
          // Wait for the current refresh to resolve
          const newAccessToken = await new Promise((resolve, reject) => {
            addPendingRequest((tokenResult, err) => {
              if (err) return reject(err);
              resolve(tokenResult);
            });
          });

          if (newAccessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }

        isRefreshing = true;
        const refreshed = await refreshToken();
        isRefreshing = false;
        resolvePendingRequests(refreshed.token);

        originalRequest.headers["Authorization"] = `Bearer ${refreshed.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        rejectPendingRequests(refreshError);
        // On refresh failure, perform local cleanup
        clearAuthData();
        // Hard redirect to login page; router may not be available here
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API calls
export async function login(email, password, recaptchaToken = null) {
  console.log('Login attempt for:', email);
  try {
    const payload = { email, password };
    if (recaptchaToken) {
      payload.recaptchaToken = recaptchaToken;
      payload['g-recaptcha-response'] = recaptchaToken;
    }
    const response = await api.post("/auth/login", payload);
    console.log('Login response:', response.data);
    
    // Handle various possible response formats from backend
    const responseData = response.data || {};
    const { 
      accessToken, 
      refreshToken, 
      role, 
      token,
      access_token,
      refresh_token,
      user
    } = responseData;
    
    // Try different token field names
    const authToken = accessToken || token || access_token;
    const authRefreshToken = refreshToken || refresh_token;
    const userRole = role || user?.role;
    
    if (!authToken) {
      console.error('No token found in response. Available fields:', Object.keys(responseData));
      throw new Error("No access token received from server");
    }
    
    setAuthData({ 
      token: authToken, 
      refreshToken: authRefreshToken, 
      role: userRole, 
      email 
    });
    
    console.log('Auth data set:', { 
      token: !!authToken, 
      refreshToken: !!authRefreshToken, 
      role: userRole, 
      email 
    });
    
    return { 
      token: authToken, 
      refreshToken: authRefreshToken, 
      role: userRole 
    };
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method
    });
    throw error;
  }
}

export async function refreshToken() {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) {
    throw new Error("No refresh token available");
  }
  
  try {
    // API requires { "token": "<refreshToken>" } format
    const response = await api.post("/auth/refresh", { token: storedRefreshToken });
    const { accessToken } = response.data || {};
    
    if (!accessToken) {
      throw new Error("No access token received from refresh");
    }
    
    // Only update accessToken, preserve refreshToken and role
    setAuthData({ token: accessToken });
    return { token: accessToken };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const token = getToken();
    if (token) {
      await api.post("/auth/logout", {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    // Handle logout errors gracefully (401/403 are expected for expired tokens)
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.log('Logout failed with auth error (expected for expired tokens):', status);
    } else {
      console.error('Logout error:', error);
    }
  } finally {
    // Always clear auth data regardless of API call success/failure
    clearAuthData();
  }
}

// Get current user profile and role
export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/me");
    const { role, email } = response.data || {};
    
    // Update stored role and email if they've changed
    if (role || email) {
      setAuthData({ role, email });
    }
    
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}

// Admin APIs
export async function getAllUsers() {
  try {
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

export async function approveUserRole(userId, newRole) {
  try {
    const response = await api.put(`/auth/approve/${userId}`, { role: newRole });
    return response.data;
  } catch (error) {
    console.error('Approve user role error:', error);
    throw error;
  }
}

export async function deleteUser(userId) {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

const authService = {
  api,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  getAllUsers,
  approveUserRole,
  deleteUser,
  getToken,
  getRole,
  getEmail
};

export default authService;

