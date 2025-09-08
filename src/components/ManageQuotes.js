import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FileText, Search, Eye, Package, User, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';
import { getToken } from '../services/auth';

const ManageQuotes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Add this state

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle status change - Multiple endpoint options
  const handleStatusChange = async (quoteId, newStatus) => {
    setUpdatingStatus(quoteId);
    
    try {
      // Update local state immediately for better UX
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          (quote.id === quoteId || quote._id === quoteId) 
            ? { ...quote, status: newStatus }
            : quote
        )
      );

      // Try multiple possible API endpoints for updating quote status
      let response;
      let apiError;
      
      // Option 1: Try dedicated status endpoint
      try {
        response = await fetchWithAuth(`https://njs-01.optimuslab.space/partners/quotes/${quoteId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
          console.log('Status updated via dedicated endpoint');
        }
      } catch (error) {
        console.log('Dedicated status endpoint not available, trying alternatives...');
        apiError = error;
      }
      
      // Option 2: Try general PATCH endpoint if status endpoint failed
      if (!response || !response.ok) {
        try {
          response = await fetchWithAuth(`https://njs-01.optimuslab.space/partners/quotes/${quoteId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          });
          
          if (response.ok) {
            console.log('Status updated via general PATCH endpoint');
          }
        } catch (error) {
          console.log('General PATCH endpoint failed, trying PUT...');
          apiError = error;
        }
      }
      
      // Option 3: Try PUT endpoint if PATCH failed
      if (!response || !response.ok) {
        try {
          // First fetch the current quote data
          const currentQuoteResponse = await fetchWithAuth(`https://njs-01.optimuslab.space/partners/quotes/${quoteId}`);
          if (currentQuoteResponse.ok) {
            const currentQuote = await currentQuoteResponse.json();
            
            // Update with new status
            response = await fetchWithAuth(`https://njs-01.optimuslab.space/partners/quotes/${quoteId}`, {
              method: 'PUT',
              body: JSON.stringify({ ...currentQuote, status: newStatus, updatedAt: new Date().toISOString() })
            });
            
            if (response.ok) {
              console.log('Status updated via PUT endpoint');
            }
          }
        } catch (error) {
          console.log('PUT endpoint also failed');
          apiError = error;
        }
      }
      
      // Check if any of the attempts succeeded
      if (!response || !response.ok) {
        const statusCode = response ? response.status : 'Network Error';
        const errorMessage = response && response.status === 404 
          ? 'Status update endpoint not found. Please contact your system administrator to implement the status update API.'
          : `API request failed with status ${statusCode}`;
        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({ success: true }));
      console.log(`Status updated for quote ${quoteId} to ${newStatus}:`, result);
      
      // Update the selected quote if it's currently being viewed
      if (selectedQuote && (selectedQuote.id === quoteId || selectedQuote._id === quoteId)) {
        setSelectedQuote(prev => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }));
      }
      
    } catch (error) {
      console.error('Error updating quote status:', error);
      
      // Revert the local state change on error
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          (quote.id === quoteId || quote._id === quoteId) 
            ? { ...quote, status: quote.originalStatus || 'New' }
            : quote
        )
      );
      
      setError(`Failed to update quote status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Attempting to refresh token...');
      
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
        console.log('Token refreshed successfully');
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
        console.log('Access token expired (401), attempting refresh...');
        
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
          window.location.href = '/login';
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      if (response.status === 403) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('403 Forbidden response:', errorText);
        
        try {
          const newToken = await refreshAccessToken();
          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, fetchOptions);
          
          if (retryResponse.ok) {
            console.log('403 resolved after token refresh');
            return retryResponse;
          } else {
            throw new Error(`Still forbidden after refresh: ${retryResponse.status}`);
          }
        } catch (refreshError) {
          console.error('Token refresh failed on 403:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error(`Access denied (403). Your session may have expired or you may not have permission. Please login again.`);
        }
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

  // Fetch all quotes from backend
  const fetchQuotes = async () => {
    try {
      console.log('Fetching quotes from backend...');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/quotes');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes: ${response.status}`);
      }
      
      const quotesData = await response.json();
      console.log('Quotes fetched successfully:', quotesData);
      
      const quotesArray = Array.isArray(quotesData) ? quotesData : (quotesData.quotes || []);
      
      // Add default status 'New' to quotes that don't have a status
      const quotesWithStatus = quotesArray.map(quote => ({
        ...quote,
        status: quote.status || 'New',
        originalStatus: quote.status || 'New'
      }));
      
      setQuotes(quotesWithStatus);
      return quotesWithStatus;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  };

  // Fetch all users from backend
  const fetchUsers = async () => {
    try {
      console.log('Fetching users from backend...');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/admin/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const usersData = await response.json();
      console.log('Users fetched successfully:', usersData);
      
      const usersArray = Array.isArray(usersData) ? usersData : (usersData.users || []);
      setUsers(usersArray);
      return usersArray;
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      return [];
    }
  };

  // Fetch all products from backend
  const fetchProducts = async () => {
    try {
      console.log('Fetching products from backend...');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const productsData = await response.json();
      console.log('Products fetched successfully:', productsData);
      
      const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
      setProducts(productsArray);
      return productsArray;
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      return [];
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchQuotes(),
          fetchUsers(),
          fetchProducts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get user details by ID
  const getUserById = (userId) => {
    if (!userId) return null;
    
    const foundUser = users.find(user => 
      user.id === userId || 
      user._id === userId ||
      user.email === userId
    );
    
    return foundUser || null;
  };

  // Get product details by ID
  const getProductById = (productId) => {
    if (!productId) return null;
    
    const foundProduct = products.find(product => 
      product.id === productId || 
      product._id === productId ||
      product.productId === productId
    );
    
    return foundProduct || null;
  };

  // Enhance quotes with user and product data
  const enhancedQuotes = quotes.map(quote => {
    const user = getUserById(quote.userId || quote.userEmail);
    
    const enhancedItems = (quote.items || []).map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        productDetails: product
      };
    });

    return {
      ...quote,
      user: user,
      customerInfo: quote.customerInfo || user || {
        name: quote.userName || 'Unknown User',
        email: quote.userEmail || 'unknown@email.com',
        role: quote.userRole || quote.userLevel || 'user',
        company: quote.customerInfo?.company || user?.companyName || 'Unknown Company'
      },
      items: enhancedItems
    };
  });

  // Filter quotes based on search
  const filteredQuotes = enhancedQuotes.filter(quote => {
    const customerInfo = quote.customerInfo || {};
    const searchFields = [
      customerInfo.name,
      customerInfo.company,
      customerInfo.email,
      quote.userName,
      quote.userEmail,
      quote.id,
      quote._id,
      quote.status
    ].filter(Boolean).join(' ').toLowerCase();
    
    const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchQuotes(),
        fetchUsers(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message || 'Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-[#FAFAFB] text-[#818181]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#FAFAFB] to-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2150]"></div>
              <span className="ml-3 text-[#818181]">Loading quotes...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#FAFAFB] to-white">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#1B2150]/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#EB664D]/5 rounded-full blur-3xl animate-pulse"></div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className="pt-16 relative z-10">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#1B2150]">Manage Quotes</h1>
                <p className="text-[#818181]">Review and manage customer quote requests</p>
              </div>
              <div className="flex items-center gap-6">
                {/* Total Quotes beside Refresh button */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1B2150]">{quotes.length}</div>
                  <div className="text-sm text-[#818181]">Total Quotes</div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-[#1B2150] text-white px-6 py-3 rounded-xl hover:bg-[#EB664D] hover:shadow-lg hover:shadow-[#EB664D]/25 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#FAFAFB] p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#818181] w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer name, company, email, quote ID, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-[#FAFAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white text-lg text-[#818181]"
              />
            </div>
          </div>

          {/* Quotes List */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#FAFAFB] overflow-hidden">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[#818181]" />
                <p className="text-[#818181] mb-2">
                  {quotes.length === 0 ? 'No quotes found' : 'No quotes match your search criteria'}
                </p>
                {quotes.length === 0 && (
                  <p className="text-sm text-[#818181]">Quotes will appear here when customers submit requests</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#FAFAFB]">
                  <thead className="bg-[#FAFAFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Quote Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#1B2150] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#FAFAFB]">
                    {filteredQuotes.map((quote) => {
                      const quoteId = quote.id || quote._id;
                      const customerInfo = quote.customerInfo || {};
                      const itemsCount = quote.items ? quote.items.length : (quote.itemsCount || quote.totalItems || 0);
                      const totalAmount = quote.totalAmount || quote.total || 0;

                      return (
                        <tr key={quoteId} className="hover:bg-[#1B2150]/5 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-[#1B2150] mr-3 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-medium text-[#1B2150]">
                                  {customerInfo.name || quote.userName || 'Unknown User'}
                                </div>
                                <div className="text-sm text-[#818181]">
                                  {customerInfo.company || 'Unknown Company'}
                                </div>
                                <div className="text-sm text-[#818181]">
                                  {customerInfo.email || quote.userEmail || 'No email'}
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#1B2150]/10 text-[#1B2150] mt-1">
                                  {customerInfo.role || quote.userRole || quote.userLevel || 'user'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-[#1B2150] mr-3" />
                              <div>
                                <div className="text-sm font-medium text-[#1B2150]">
                                  {quoteId ? quoteId.slice(0, 8) : 'N/A'}
                                </div>
                                <div className="text-sm text-[#818181]">{itemsCount} items</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#1B2150]">
                              ${totalAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#818181]">
                            {formatDate(quote.createdAt || quote.submittedAt || quote.created)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative inline-block">
                              <select
                                value={quote.status || 'New'}
                                onChange={(e) => handleStatusChange(quoteId, e.target.value)}
                                disabled={updatingStatus === quoteId}
                                className={`appearance-none bg-white border border-[#FAFAFB] rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent cursor-pointer transition-all duration-200 hover:border-[#1B2150] min-w-0 ${getStatusBadgeColor(quote.status || 'New')} ${
                                  updatingStatus === quoteId ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                              {updatingStatus === quoteId ? (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1B2150] border-t-transparent"></div>
                                </div>
                              ) : (
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#818181] pointer-events-none" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(quote)}
                              className="text-[#1B2150] hover:text-[#EB664D] flex items-center transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quote Details Modal */}
          {showQuoteDetails && selectedQuote && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#FAFAFB]">
                {/* Decorative gradient overlay */}
                <div className="h-1 bg-gradient-to-r from-[#1B2150] to-[#EB664D]"></div>
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-[#1B2150]">
                      Quote Details - {(selectedQuote.id || selectedQuote._id || 'N/A').slice(0, 8)}
                    </h2>
                    <button
                      onClick={() => setShowQuoteDetails(false)}
                      className="text-[#818181] hover:text-[#EB664D] text-xl transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Customer Information */}
                    <div className="bg-[#FAFAFB] rounded-xl p-6 border border-[#FAFAFB]">
                      <h3 className="text-lg font-semibold text-[#1B2150] mb-4">Customer Information</h3>
                      <div className="space-y-3">
                        <p><span className="font-medium text-[#1B2150]">Name:</span> <span className="text-[#818181]">{selectedQuote.customerInfo?.name || selectedQuote.userName || 'Unknown User'}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Company:</span> <span className="text-[#818181]">{selectedQuote.customerInfo?.company || selectedQuote.customerInfo?.companyName || 'Unknown Company'}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Email:</span> <span className="text-[#818181]">{selectedQuote.customerInfo?.email || selectedQuote.userEmail || 'No email'}</span></p>
                        <p><span className="font-medium text-[#1B2150]">User Level:</span> <span className="text-[#818181]">{selectedQuote.customerInfo?.role || selectedQuote.userRole || selectedQuote.userLevel || 'user'}</span></p>
                        {selectedQuote.customerInfo?.phone && (
                          <p><span className="font-medium text-[#1B2150]">Phone:</span> <span className="text-[#818181]">{selectedQuote.customerInfo.phone}</span></p>
                        )}
                        {selectedQuote.customerInfo?.address && (
                          <p><span className="font-medium text-[#1B2150]">Address:</span> <span className="text-[#818181]">{selectedQuote.customerInfo.address}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Quote Information */}
                    <div className="bg-[#FAFAFB] rounded-xl p-6 border border-[#FAFAFB]">
                      <h3 className="text-lg font-semibold text-[#1B2150] mb-4">Quote Information</h3>
                      <div className="space-y-3">
                        <p><span className="font-medium text-[#1B2150]">Total:</span> <span className="text-[#818181]">${(selectedQuote.totalAmount || selectedQuote.total || 0).toFixed(2)}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Items:</span> <span className="text-[#818181]">{selectedQuote.items ? selectedQuote.items.length : (selectedQuote.itemsCount || 0)}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Total Quantity:</span> <span className="text-[#818181]">{selectedQuote.itemsCount || selectedQuote.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Status:</span> 
                          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedQuote.status || 'New')}`}>
                            {selectedQuote.status || 'New'}
                          </span>
                        </p>
                        <p><span className="font-medium text-[#1B2150]">Created:</span> <span className="text-[#818181]">{formatDate(selectedQuote.createdAt || selectedQuote.submittedAt || selectedQuote.created)}</span></p>
                        <p><span className="font-medium text-[#1B2150]">Updated:</span> <span className="text-[#818181]">{formatDate(selectedQuote.updatedAt || selectedQuote.lastUpdated)}</span></p>
                        {selectedQuote.requirements && (
                          <p><span className="font-medium text-[#1B2150]">Requirements:</span> <span className="text-[#818181]">{selectedQuote.requirements}</span></p>
                        )}
                        {selectedQuote.additionalNotes && (
                          <p><span className="font-medium text-[#1B2150]">Notes:</span> <span className="text-[#818181]">{selectedQuote.additionalNotes}</span></p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B2150] mb-6">Products</h3>
                    <div className="space-y-4">
                      {selectedQuote.items && selectedQuote.items.length > 0 ? (
                        selectedQuote.items.map((item, index) => (
                          <div key={item.productId || index} className="border-2 border-[#FAFAFB] rounded-xl p-6 hover:border-[#1B2150]/30 transition-colors duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-3">
                                  {item.picture && (
                                    <img 
                                      src={item.picture} 
                                      alt={item.name}
                                      className="w-16 h-16 object-contain rounded-lg bg-[#FAFAFB] border border-[#FAFAFB]"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-[#1B2150] text-lg">{item.name || 'Unknown Product'}</h4>
                                    <p className="text-sm text-[#818181]">
                                      SKU: {item.sku || item.productId || 'N/A'}
                                    </p>
                                    <p className="text-sm text-[#818181]">
                                      Brand: {item.brand || 'N/A'} | Category: {item.category || 'N/A'}
                                    </p>
                                    {item.msrp && item.msrp > 0 && (
                                      <p className="text-sm text-[#818181]">
                                        MSRP: ${item.msrp.toFixed(2)} | Discount: {item.discount || 0}%
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-[#818181] mt-3">{item.description}</p>
                                )}
                                {item.extraFields && Object.keys(item.extraFields).length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-[#1B2150] mb-2">Additional Details:</p>
                                    <div className="bg-[#FAFAFB] rounded p-2 text-sm text-[#818181]">
                                      {Object.entries(item.extraFields).map(([key, value]) => (
                                        <p key={key}><span className="font-medium">{key}:</span> {value}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-6">
                                <p className="font-medium text-[#1B2150]">
                                  ${(item.netPrice || item.price || 0).toFixed(2)} × {item.quantity || 1}
                                </p>
                                <p className="text-xl font-bold text-[#1B2150]">
                                  ${(item.totalPrice || ((item.netPrice || item.price || 0) * (item.quantity || 1))).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[#818181]">
                          <Package className="w-12 h-12 mx-auto mb-4 text-[#818181]" />
                          No products found in this quote
                        </div>
                      )}
                    </div>

                    {/* Quote Summary */}
                    {selectedQuote.items && selectedQuote.items.length > 0 && (
                      <div className="mt-6 bg-[#1B2150]/5 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-[#1B2150] mb-4">Quote Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-md font-bold text-[#1B2150]">{selectedQuote.items.length}</div>
                            <div className="text-sm text-[#818181]">Products</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-md font-bold text-[#1B2150]">
                              {selectedQuote.items.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                            </div>
                            <div className="text-sm text-[#818181]">Total Qty</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-md font-bold text-[#EB664D]">
                              ${(selectedQuote.totalAmount || selectedQuote.total || 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-[#818181]">Total Value</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className={`text-md font-bold ${getStatusBadgeColor(selectedQuote.status || 'New').replace('bg-', 'text-').replace('-100', '-600')}`}>
                              {selectedQuote.status || 'New'}
                            </div>
                            <div className="text-sm text-[#818181]">Status</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageQuotes;




