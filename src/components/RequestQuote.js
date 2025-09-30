import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FileText, Search, Trash2, Send, ShoppingCart, AlertTriangle, Package, CheckCircle, Clock, User, Mail, Phone, Building } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getToken } from '../services/auth';

const RequestQuote = () => {
  const { currentRole, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fetchingCart, setFetchingCart] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Quote confirmation state - now with persistence
  const [submittedQuote, setSubmittedQuote] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState([]);
  
  // Additional message state
  const [additionalMessage, setAdditionalMessage] = useState('');
  
  // Load animation state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate short quote number (5-7 digits)
  const generateQuoteNumber = () => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 99); // 0-99
    return `Q${timestamp}${random.toString().padStart(2, '0')}`.slice(0, 8); // Ensures 7-8 characters total
  };

  // Load persisted quote confirmation on component mount
  useEffect(() => {
    const loadPersistedQuoteState = () => {
      try {
        const persistedQuote = localStorage.getItem('lastSubmittedQuote');
        const persistedTimestamp = localStorage.getItem('lastQuoteSubmissionTime');
        
        if (persistedQuote && persistedTimestamp) {
          const submissionTime = parseInt(persistedTimestamp);
          const now = Date.now();
          const timeDiff = now - submissionTime;
          
          // Show confirmation for 10 minutes after submission
          if (timeDiff < 10 * 60 * 1000) {
            const quote = JSON.parse(persistedQuote);
            setSubmittedQuote(quote);
            setShowConfirmation(true);
            setSuccess(true);
          } else {
            // Clean up old data
            localStorage.removeItem('lastSubmittedQuote');
            localStorage.removeItem('lastQuoteSubmissionTime');
          }
        }

        // Load recent quotes list
        const recentQuotesData = localStorage.getItem('recentQuotes');
        if (recentQuotesData) {
          setRecentQuotes(JSON.parse(recentQuotesData));
        }
      } catch (error) {
        console.error('Error loading persisted quote state:', error);
      }
    };

    loadPersistedQuoteState();
  }, []);

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
      
      // If token is invalid/expired, try to refresh
      if (response.status === 401) {
        console.log('Access token expired (401), attempting refresh...');
        
        try {
          const newToken = await refreshAccessToken();
          
          // Retry the original request with new token
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
      
      // Handle 403 Forbidden specifically
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
          throw new Error(`Access denied (403). Your session may have expired or you may not have permission. Please login again. Server response: ${errorText}`);
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

  // Fetch current user details
  const fetchCurrentUser = async () => {
    if (!isAuthenticated) return null;
    
    try {
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/auth/me');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Current user fetched:', userData);
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  // Fetch the latest quote details from backend
  const fetchLatestQuote = async (quoteId) => {
    try {
      console.log('Fetching latest quote details for:', quoteId);
      const response = await fetchWithAuth(`https://njs-01.optimuslab.space/partners/quotes/${quoteId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quote details: ${response.status}`);
      }
      
      const quoteData = await response.json();
      console.log('Latest quote details fetched:', quoteData);
      return quoteData;
    } catch (error) {
      console.error('Error fetching latest quote details:', error);
      return null;
    }
  };

  // Load cart items from localStorage and fetch user details
  useEffect(() => {
    const loadCartItems = () => {
      try {
        console.log('Loading cart from localStorage...');
        const savedCart = localStorage.getItem('quoteCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('Loaded cart from localStorage:', parsedCart);
          setCartItems(parsedCart);
        } else {
          console.log('No cart found in localStorage');
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('quoteCart');
        setCartItems([]);
      } finally {
        setFetchingCart(false);
      }
    };

    // Load cart regardless of auth status
    loadCartItems();
    
    // Fetch current user if authenticated
    if (isAuthenticated && !authLoading) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, authLoading]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Remove product from quote
  const removeFromQuote = (productId) => {
    const updatedItems = cartItems.filter(p => (p.id !== productId && p.productId !== productId));
    setCartItems(updatedItems);
    localStorage.setItem('quoteCart', JSON.stringify(updatedItems));
  };

  // Update product quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromQuote(productId);
      return;
    }

    const updatedItems = cartItems.map(p => {
      const matchesId = p.id === productId || p.productId === productId;
      if (matchesId) {
        const newTotalPrice = (p.netPrice || p.price) * quantity;
        return { ...p, quantity, totalPrice: newTotalPrice };
      }
      return p;
    });

    setCartItems(updatedItems);
    localStorage.setItem('quoteCart', JSON.stringify(updatedItems));
  };

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, product) => {
      const price = product.netPrice || product.price || 0;
      const quantity = product.quantity || 1;
      const totalPrice = product.totalPrice || (price * quantity);
      return total + totalPrice;
    }, 0);
  };

  // Submit quote request using POST API (Database and Email)
  const handleSubmitQuote = async () => {
    if (cartItems.length === 0) {
      setError('Please add at least one product to your quote.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to submit a quote request.');
      return;
    }

    // Ensure we have current user details
    let userDetails = currentUser;
    if (!userDetails) {
      userDetails = await fetchCurrentUser();
      if (!userDetails) {
        setError('Unable to fetch user details. Please try again.');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Generate a short quote number
      const shortQuoteNumber = generateQuoteNumber();

      // Prepare quote data for database API
      const quoteData = {
        type: 'quote',
        status: 'New', // Default status for new quotes
        quoteNumber: shortQuoteNumber,
        
        // User information from /auth/me
        userId: userDetails.id || userDetails._id,
        userEmail: userDetails.email,
        userName: userDetails.name || userDetails.companyName,
        userRole: userDetails.role || currentRole,
        userLevel: userDetails.role || currentRole,
        
        // Customer/User details - Fixed field mapping
        customerInfo: {
          id: userDetails.id || userDetails._id,
          name: userDetails.name || userDetails.contactPersonName || userDetails.companyName,
          email: userDetails.email,
          role: userDetails.role || currentRole,
          level: userDetails.role || currentRole,
          company: userDetails.companyName,
          phone: userDetails.phone || userDetails.phoneNumber || '',
          address: userDetails.address || userDetails.companyAddress || '',
          country: userDetails.country || userDetails.companyCountry || '',
          submissionDate: new Date().toISOString()
        },
        
        // Quote items
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          name: item.name,
          sku: item.sku,
          brand: item.brand,
          category: item.category,
          description: item.description || '',
          msrp: item.msrp || 0,
          netPrice: item.netPrice || item.price || 0,
          discount: item.discount || 0,
          picture: item.picture || '',
          extraFields: item.extraFields || {},
          quantity: item.quantity || 1,
          totalPrice: item.totalPrice || (item.netPrice || item.price || 0) * (item.quantity || 1)
        })),
        
        // Quote summary
        totalAmount: calculateTotal(),
        totalItems: cartItems.length,
        itemsCount: cartItems.reduce((total, item) => total + (item.quantity || 1), 0),
        
        // Timestamps
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Additional info
        additionalNotes: additionalMessage || '',
        client_message: additionalMessage || '',
        requirements: additionalMessage ? `Customer quote request from web portal. Additional message: ${additionalMessage}` : 'Customer quote request from web portal'
      };

      // Prepare mail data with user schema format - Fixed field mapping for mail
      const mailData = {
        _id: userDetails.id || userDetails._id,
        companyName: userDetails.name || userDetails.contactPersonName || userDetails.companyName,
        companyAddress: userDetails.address || userDetails.companyAddress || '',
        companyCountry: userDetails.country || userDetails.companyCountry || '',
        businessType: userDetails.businessType || 'integrator',
        contactPersonName: userDetails.name || userDetails.contactPersonName || userDetails.companyName,
        email: userDetails.email,
        phoneNumber: userDetails.phone || userDetails.phoneNumber || '',
        country: userDetails.country || userDetails.companyCountry || '',
        position: userDetails.position || userDetails.role || currentRole,
        certificateUrl: userDetails.certificateUrl || null,
        role: userDetails.role || currentRole,
        date: new Date().toISOString(),
        status: 'New',
        client_message: additionalMessage || '',
        quote_id: shortQuoteNumber,
        cart: {
          type: 'cart',
          status: 'New',
          quoteNumber: shortQuoteNumber,
          items: cartItems.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            sku: item.sku,
            brand: item.brand,
            category: item.category,
            description: item.description || '',
            msrp: item.msrp || 0,
            netPrice: item.netPrice || item.price || 0,
            discount: item.discount || 0,
            picture: item.picture || '',
            quantity: item.quantity || 1,
            totalPrice: item.totalPrice || (item.netPrice || item.price || 0) * (item.quantity || 1)
          })),
          userLevel: userDetails.role || currentRole,
          totalAmount: calculateTotal()
        }
      };

      console.log('Submitting quote to database:', quoteData);
      console.log('Submitting quote to mail:', mailData);

      // Submit to both APIs simultaneously
      const [quoteResponse, mailResponse] = await Promise.allSettled([
        // Submit to quotes database API
        fetchWithAuth(
          'https://njs-01.optimuslab.space/partners/quotes',
          {
            method: 'POST',
            body: JSON.stringify(quoteData),
            signal: AbortSignal.timeout(50000)
          }
        ),
        // Submit to mail API with different schema
        fetchWithAuth(
          'http://optimus-india-njs-01.netbird.cloud:3006/partners/mail',
          {
            method: 'POST',
            body: JSON.stringify(mailData),
            signal: AbortSignal.timeout(50000)
          }
        )
      ]);

      // Check quotes API response
      if (quoteResponse.status === 'rejected') {
        console.error('Quote submission to database failed:', quoteResponse.reason);
        throw new Error(`Failed to submit quote to database: ${quoteResponse.reason.message}`);
      }

      if (!quoteResponse.value.ok) {
        const errorText = await quoteResponse.value.text().catch(() => 'Unable to read error response');
        console.error('Quote database submission failed:', quoteResponse.value.status, errorText);
        throw new Error(`Failed to submit quote request to database. Status: ${quoteResponse.value.status}. ${errorText || ''}`);
      }

      // Check mail API response
      if (mailResponse.status === 'rejected') {
        console.warn('Mail submission failed:', mailResponse.reason);
        // Don't throw error for mail failure - log warning but continue
      } else if (!mailResponse.value.ok) {
        const mailErrorText = await mailResponse.value.text().catch(() => 'Unable to read mail error response');
        console.warn('Mail API submission failed:', mailResponse.value.status, mailErrorText);
        // Don't throw error for mail failure - log warning but continue
      } else {
        console.log('Mail sent successfully');
      }

      // Get the quote result from database API
      const quoteResult = await quoteResponse.value.json();
      console.log('Quote submitted successfully to database:', quoteResult);

      // Log mail result if successful
      if (mailResponse.status === 'fulfilled' && mailResponse.value.ok) {
        try {
          const mailResult = await mailResponse.value.json();
          console.log('Mail API response:', mailResult);
        } catch (e) {
          console.log('Mail sent successfully (no JSON response)');
        }
      }

      // Use the actual quote ID from the backend response or fallback to our generated number
      const actualQuoteId = quoteResult.id || quoteResult._id || quoteResult.quoteNumber || shortQuoteNumber;
      console.log('Actual quote ID from backend:', actualQuoteId);

      // Fetch the complete quote details from backend if we have an ID
      let completeQuoteDetails = null;
      if (actualQuoteId) {
        completeQuoteDetails = await fetchLatestQuote(actualQuoteId);
      }

      // Store submitted quote details for confirmation - use actual backend data if available
      const submittedQuoteDetails = completeQuoteDetails || {
        id: actualQuoteId,
        _id: actualQuoteId,
        quoteNumber: shortQuoteNumber,
        submittedAt: new Date().toISOString(),
        userDetails: userDetails,
        items: [...cartItems],
        totalAmount: calculateTotal(),
        totalItems: cartItems.length,
        itemsCount: cartItems.reduce((total, item) => total + (item.quantity || 1), 0),
        status: 'New',
        customerInfo: quoteData.customerInfo
      };

      console.log('Submitted quote details:', submittedQuoteDetails);

      // Persist quote confirmation state
      localStorage.setItem('lastSubmittedQuote', JSON.stringify(submittedQuoteDetails));
      localStorage.setItem('lastQuoteSubmissionTime', Date.now().toString());

      // Update recent quotes
      const updatedRecentQuotes = [submittedQuoteDetails, ...recentQuotes.slice(0, 4)];
      setRecentQuotes(updatedRecentQuotes);
      localStorage.setItem('recentQuotes', JSON.stringify(updatedRecentQuotes));

      setSubmittedQuote(submittedQuoteDetails);
      setShowConfirmation(true);

      // Clear cart, message and show success
      setCartItems([]);
      localStorage.removeItem('quoteCart');
      setAdditionalMessage('');

      setSuccess(true);
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => setSuccess(false), 10000);
      
    } catch (err) {
      console.error('Error submitting quote:', err);
      setError(err.message || 'An error occurred while submitting your quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear all items from your quote?')) {
      setCartItems([]);
      localStorage.removeItem('quoteCart');
    }
  };

  // Get cart items count
  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Reset to create new quote
  const createNewQuote = () => {
    setShowConfirmation(false);
    setSubmittedQuote(null);
    setSuccess(false);
    setError(null);
    setAdditionalMessage(''); // Clear the message field
    // Clear persisted state
    localStorage.removeItem('lastSubmittedQuote');
    localStorage.removeItem('lastQuoteSubmissionTime');
  };

  // View quote details (for recent quotes)
  const viewQuoteDetails = (quote) => {
    setSubmittedQuote(quote);
    setShowConfirmation(true);
  };

  if (fetchingCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFB] via-white to-[#FAFAFB]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16 relative z-10">
          <div className="p-4">
            <div className="flex items-center justify-center h-32">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-[#1B2150]"></div>
              </div>
              <span className="ml-3 text-sm font-medium text-[#818181]">
                Loading your quote cart...
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFB] via-white to-[#FAFAFB]">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className="pt-16 relative z-10">
        <div className="p-4">
          {/* Quote Confirmation Modal/Section */}
          {showConfirmation && submittedQuote && (
            <div className={`mb-6 transform transition-all duration-700 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <div className="bg-white backdrop-blur-sm rounded-xl shadow-lg border-2 border-green-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-green-100 rounded-full p-4 mr-4">
                    <CheckCircle className="w-12 h-12 text-[#1B2150]" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#1B2150] mb-1">
                      Quote Request Submitted Successfully!
                    </h2>
                    <p className="text-lg text-[#1B2150]">
                      Your quote number is: <span className="font-bold text-[#1B2150]">
                        {submittedQuote.quoteNumber || submittedQuote.id || submittedQuote._id || 'Processing...'}
                      </span>
                    </p>
                    {submittedQuote.submittedAt && (
                      <p className="text-sm text-[#1B2150] mt-1">
                        Submitted: {new Date(submittedQuote.submittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Products Summary */}
                <div className="mb-6">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Requested Products ({submittedQuote.items?.length || 0})
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {(submittedQuote.items || []).map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                {item.picture ? (
                                  <img 
                                    src={item.picture} 
                                    alt={item.name}
                                    className="w-8 h-8 object-contain rounded"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <Package 
                                  className="w-5 h-5 text-[#1B2150]" 
                                  style={{ display: item.picture ? 'none' : 'block' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-green-800 text-sm truncate">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-green-100 text-[#1B2150] px-2 py-1 rounded">
                                    {item.sku}
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {item.brand}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-[#1B2150]">
                                Qty: {item.quantity}
                              </div>
                              <div className="text-sm font-bold text-green-800">
                                ${(item.totalPrice || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quote Summary */}
                <div className="mb-6 bg-green-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#1B2150]">{submittedQuote.totalItems || submittedQuote.items?.length || 0}</div>
                      <div className="text-sm text-[#1B2150]">Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#1B2150]">{submittedQuote.itemsCount || 0}</div>
                      <div className="text-sm text-[#1B2150]">Total Qty</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#1B2150]">${(submittedQuote.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-sm text-[#1B2150]">Total Value</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#1B2150]">{submittedQuote.status || 'New'}</div>
                      <div className="text-sm text-[#1B2150]">Status</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={createNewQuote}
                    className="bg-[#1B2150] text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium text-center"
                  >
                    Create New Quote
                  </button>
                  <a
                    href="/products"
                    className="border border-[#1B2150] text-[#1B2150] hover:bg-[#1B2150] hover:text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium text-center"
                  >
                    Browse More Products
                  </a>
                  <a
                    href="/dashboard"
                        className="bg-[#1B2150] text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium text-base"
                  >
                    View Dashboard
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Recent Quotes Section - Only show if not showing current confirmation */}
          {!showConfirmation && recentQuotes.length > 0 && (
            <div className={`mb-6 transform transition-all duration-700 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#FAFAFB]">
                <h2 className="text-xl font-bold text-[#1B2150] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Quotes
                </h2>
                <div className="space-y-3">
                  {recentQuotes.slice(0, 3).map((quote, index) => (
                    <div key={quote.id || quote._id || index} 
                         className="flex items-center justify-between p-3 bg-[#FAFAFB] rounded-lg hover:bg-[#1B2150]/5 transition-colors cursor-pointer"
                         onClick={() => viewQuoteDetails(quote)}>
                      <div className="flex items-center gap-3">
                        <div className="bg-[#1B2150] rounded-lg p-2">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1B2150]">
                            {quote.quoteNumber || (quote.id || quote._id || '').slice(0, 8)}
                          </p>
                          <p className="text-sm text-[#818181]">
                            {quote.items?.length || 0} items • ${(quote.totalAmount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#818181]">
                          {quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Only show the regular interface if not showing confirmation */}
          {!showConfirmation && (
            <>
              {/* Compact Page Header */}
              <div className={`mb-4 transform transition-all duration-700 ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#FAFAFB]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-[#1B2150]">
                        Request Quote
                      </h1>
                      <p className="text-base text-[#818181] mt-1">Review selected products and submit quote request</p>
                      {currentUser && (
                        <div className="mt-2 inline-flex items-center px-3 py-1 bg-[#1B2150]/10 rounded-md text-sm">
                          <span className="text-[#1B2150] font-medium">
                            Submitting as: {currentUser.name || currentUser.companyName} ({currentUser.role || currentRole})
                          </span>
                        </div>
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="text-right bg-[#1B2150]/5 p-3 rounded-lg">
                          <div className="text-sm text-[#818181]">Total</div>
                          <div className="text-xl font-bold text-[#1B2150]">
                            ${calculateTotal().toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={handleSubmitQuote}
                          disabled={loading || !isAuthenticated}
                    className="bg-[#1B2150] text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Request Quote
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className={`mb-4 transform transition-all duration-500 ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="bg-green-500 rounded-lg p-1 mr-3">
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-800">
                        Quote request submitted successfully! We will contact you soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className={`mb-4 transform transition-all duration-500 ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                      <button 
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Items - More Compact */}
              <div className={`transform transition-all duration-700 delay-200 ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#FAFAFB]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#1B2150] flex items-center gap-2">
                      <div className="bg-[#1B2150] rounded-lg p-2">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      Quote Items ({getCartItemsCount()})
                    </h2>
                    
                    {cartItems.length === 0 && (
                      <a
                        href="/products"
                        className="bg-[#1B2150] text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Browse Products
                      </a>
                    )}
                    
                    {cartItems.length > 0 && (
                      <button 
                        onClick={clearCart}
                        className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg transition-colors duration-200 text-base flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Cart
                      </button>
                    )}
                  </div>

                  {/* Authentication Warning */}
                  {!isAuthenticated && cartItems.length > 0 && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                          <p className="text-base font-medium text-yellow-800">
                            Please login to submit your quote request.
                          </p>
                        </div>
                        <a
                          href="/login"
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors duration-200 text-base"
                        >
                          Login
                        </a>
                      </div>
                    </div>
                  )}

                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-[#FAFAFB] rounded-2xl p-4 inline-block mb-3">
                        <ShoppingCart className="w-12 h-12 text-[#818181]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1B2150] mb-2">
                        Your quote cart is empty
                      </h3>
                      <p className="text-base text-[#818181] mb-4">Add products from the Products page to create your quote</p>
                      <a
                        href="/products"
                        className="inline-flex items-center px-5 py-2.5 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] transition-colors duration-200 font-medium text-base"
                      >
                        Browse Products
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((product, index) => {
                        const productId = product.id || product.productId;
                        const netPrice = product.netPrice || product.price || 0;
                        const quantity = product.quantity || 1;
                        const totalPrice = product.totalPrice || (netPrice * quantity);
                        
                        return (
                          <div 
                            key={productId} 
                            className={`bg-white border border-[#FAFAFB] rounded-lg p-3 hover:shadow-sm hover:border-[#EB664D] transition-all duration-200 transform ${
                              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                            }`}
                            style={{ transitionDelay: `${300 + index * 50}ms` }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-[#FAFAFB] rounded-lg flex items-center justify-center flex-shrink-0">
                                  {product.picture ? (
                                    <img 
                                      src={product.picture} 
                                      alt={product.name}
                                      className="w-10 h-10 object-contain rounded"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="w-10 h-10 flex items-center justify-center text-[#1B2150]"
                                    style={{ display: product.picture ? 'none' : 'flex' }}
                                  >
                                    <Package className="w-6 h-6" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-[#1B2150] text-base truncate">{product.name}</h3>
                                  <div className="flex items-center gap-2 text-sm text-[#818181] mt-1">
                                    <span className="bg-[#1B2150]/10 px-2 py-1 rounded text-[#1B2150] font-medium">
                                      {product.sku}
                                    </span>
                                    <span className="bg-[#FAFAFB] px-2 py-1 rounded">
                                      {product.brand}
                                    </span>
                                    <span className="bg-[#5F6485]/10 px-2 py-1 rounded text-[#5F6485]">
                                      {product.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Quantity Controls */}
                                <div className="flex items-center bg-[#FAFAFB] rounded-lg p-1">
                                  <button
                                    onClick={() => updateQuantity(productId, quantity - 1)}
                                    className="w-8 h-8 bg-white rounded flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-base font-bold transition-colors duration-200"
                                  >
                                    -
                                  </button>
                                  <span className="w-10 text-center text-base font-medium text-[#818181]">{quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(productId, quantity + 1)}
                                    className="w-8 h-8 bg-white rounded flex items-center justify-center hover:bg-green-50 hover:text-[#1B2150] text-base font-bold transition-colors duration-200"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                {/* Price */}
                                <div className="text-right min-w-0">
                                  <div className="text-sm text-[#818181]">
                                    ${netPrice.toFixed(2)} × {quantity}
                                  </div>
                                  <div className="text-base font-bold text-[#1B2150]">
                                    ${totalPrice.toFixed(2)}
                                  </div>
                                </div>
                                
                                {/* Remove Button */}
                                <button
                                  onClick={() => removeFromQuote(productId)}
                                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Remove from quote"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input Section */}
              {cartItems.length > 0 && (
                <div className={`mt-4 transform transition-all duration-700 delay-300 ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#FAFAFB]">
                    <h3 className="text-lg font-semibold text-[#1B2150] mb-3 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Additional Message (Optional)
                    </h3>
                    <textarea
                      value={additionalMessage}
                      onChange={(e) => setAdditionalMessage(e.target.value)}
                      placeholder="Add any questions, special requirements, or additional information for this quote request..."
                      className="w-full border-2 border-[#FAFAFB] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent transition-all duration-200 bg-[#FAFAFB] hover:bg-white resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Compact Summary Section */}
              {cartItems.length > 0 && (
                <div className={`mt-4 transform transition-all duration-700 delay-300 ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm p-4 border border-[#FAFAFB] text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="bg-[#1B2150]/10 px-4 py-2 rounded-lg">
                        <div className="text-lg font-bold text-[#1B2150]">
                          Total: ${calculateTotal().toFixed(2)}
                        </div>
                        <div className="text-xs text-[#818181]">
                          {getCartItemsCount()} {getCartItemsCount() === 1 ? 'product' : 'products'} in quote
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitQuote}
                      disabled={loading || !isAuthenticated}
                      className="w-full max-w-sm bg-[#1B2150] text-white py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mx-auto"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Request Quote
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[#818181] mt-3">
                      By submitting this quote request, you agree to be contacted by our sales team.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RequestQuote;