import { useEffect, useState } from "react";
import { getToken, getRole, getCurrentUser } from "../services/auth";

export default function useAuth(requiredRoles = []) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      const storedRole = getRole();
      
      if (!token) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        setCurrentRole(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch current user profile to get latest role
        const userData = await getCurrentUser();
        const latestRole = userData?.role || storedRole;
        
        console.log('useAuth effect:', { 
          token: !!token, 
          storedRole, 
          latestRole, 
          requiredRoles 
        });
        
        setIsAuthenticated(true);
        setCurrentRole(latestRole);

        if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
          const authorized = requiredRoles.includes(latestRole);
          console.log('useAuth authorization:', { 
            authed: true, 
            currentRole: latestRole, 
            requiredRoles, 
            authorized 
          });
          setIsAuthorized(authorized);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // If /auth/me fails, fall back to stored role
        const fallbackRole = storedRole;
        setIsAuthenticated(true);
        setCurrentRole(fallbackRole);

        if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
          const authorized = fallbackRole && requiredRoles.includes(fallbackRole);
          setIsAuthorized(authorized);
        } else {
          setIsAuthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRoles]);

  return { isAuthenticated, isAuthorized, currentRole, loading };
}


