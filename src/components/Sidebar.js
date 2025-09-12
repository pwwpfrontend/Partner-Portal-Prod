import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Home, Folder, MessageSquare, HelpCircle, ChevronDown, Settings, Users } from 'lucide-react';
import { logout, getToken } from '../services/auth';
import useAuth from '../hooks/useAuth';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  console.log('Sidebar rendering with props:', { isOpen, toggleSidebar: !!toggleSidebar });
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Add a simple test to see if Sidebar is working
  console.log('Sidebar location:', location.pathname);

  const storedEmail = useMemo(() => localStorage.getItem('email') || '', []);
  const storedRole = useMemo(() => localStorage.getItem('role') || '', []);
  const storedName = useMemo(() => localStorage.getItem('name') || '', []);
  
  // State for current user from API
  const [currentUser, setCurrentUser] = useState(null);
  
  const getNavigationItems = () => {
    const role = storedRole;
    
    // Admin navigation - no Products or Support
    if (role === 'admin') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Admin Products', path: '/admin/products', icon: Folder },
        { name: 'Admin Users', path: '/admin/users', icon: Users },
        { name: 'Manage Quotes', path: '/admin/quotes', icon: MessageSquare },
      ];
    }

    // User navigation (Level1, Level2, Level3)
    const baseItems = [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Products', path: '/products', icon: Folder },
      { name: 'Request Quote', path: '/request-quote', icon: MessageSquare },
      { name: 'Support', path: '/support', icon: HelpCircle },
    ];

    // All user levels (Level1, Level2, Level3) can see quotes
    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    // Close sidebar when any navigation item is clicked
    if (isOpen) {
      toggleSidebar();
    }
  };

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      // const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/auth/refresh', {
      const response = await fetch('https://njs-01.optimuslab.space/partners/auth/refresh', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: storedRefreshToken }),
        credentials: 'omit',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        return data.accessToken;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  // Enhanced fetch with token refresh
  const fetchWithAuth = async (url, options = {}) => {
    let token = getToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const fetchOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers
      },
      credentials: 'omit',
      mode: 'cors'
    };

    try {
      let response = await fetch(url, fetchOptions);
      
      if (response.status === 401) {
        try {
          const newToken = await refreshAccessToken();
          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, fetchOptions);
          
          if (!response.ok) {
            throw new Error(`Request failed after token refresh: ${response.status}`);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Fetch current user details
  const fetchCurrentUser = async () => {
    if (!isAuthenticated) return null;
    
    try {
      // const response = await fetchWithAuth('http://optimus-india-njs-01.netbird.cloud:3006/auth/me');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/auth/me');

      
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Current user fetched in sidebar:', userData);
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching current user in sidebar:', error);
      return null;
    }
  };

  // Fetch user details when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated]);

  // Fixed display logic to show name and email properly from API or localStorage
  const displayName = useMemo(() => {
    // Priority: API data > localStorage name > fallback
    if (currentUser?.name && currentUser.name.trim()) {
      return currentUser.name.trim();
    }
    if (currentUser?.companyName && currentUser.companyName.trim()) {
      return currentUser.companyName.trim();
    }
    if (storedName && storedName.trim()) {
      return storedName.trim();
    }
    return 'User'; // Default fallback
  }, [currentUser, storedName]);

  const displayEmail = useMemo(() => {
    // Priority: API data > localStorage email > fallback
    return currentUser?.email || storedEmail || 'user@example.com';
  }, [currentUser, storedEmail]);

  const displayLetter = useMemo(() => {
    // Use first letter of name if available, otherwise first letter of email
    const nameToUse = displayName !== 'User' ? displayName : displayEmail;
    return (nameToUse?.[0] || 'U').toUpperCase();
  }, [displayName, displayEmail]);

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen bg-white shadow-lg z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-[300px]
      `}>
        {/* Top Section: Logo + Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-[#FAFAFB]">
          <div className="flex items-center space-x-2">
            <img
              src="/logo192.png"
              alt="Partner Portal Logo"
              className="h-8 w-8"
            />
            <span className="font-bold text-lg text-[#1B2150]">Partner Portal</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-[#FAFAFB] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-[#818181]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive(item.path) 
                        ? 'bg-[#FAFAFB] text-[#1B2150] border-l-4 border-[#1B2150]' 
                        : 'text-[#818181] hover:bg-[#FAFAFB] hover:text-[#1B2150]'
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section: Account Info + Dropdown */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#FAFAFB]">
          <div>
            <button
              onClick={handleToggleMenu}
              className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-[#FAFAFB] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#1B2150] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{displayLetter}</span>
                </div>
                <div className="text-left">
                  <p className="text-[#1B2150] font-medium text-sm leading-tight">{displayName}</p>
                  <p className="text-[#818181] text-xs leading-tight">{displayEmail}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#818181] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${isMenuOpen ? 'max-h-40 mt-2' : 'max-h-0'}`}>
              <div className="bg-white border border-[#FAFAFB] rounded-md shadow-sm">
                <div
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-[#EB664D] hover:bg-[#FAFAFB] cursor-pointer"
                >
                  Logout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;