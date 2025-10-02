import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  Package, 
  Search, 
  Filter, 
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  X,
  ShoppingCart
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getToken } from '../services/auth';

const Products = () => {
  const { currentRole, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [addToCartLoading, setAddToCartLoading] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(null);
  const itemsPerPage = 25;

  // Load animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('quoteCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('quoteCart');
        setCartItems([]);
      }
    }
  }, []);

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Attempting to refresh token...');
      
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
        // Only update access token; do not overwrite refresh token
        localStorage.setItem('token', data.accessToken);
        console.log('Token refreshed successfully');
        return data.accessToken;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear on definitive refresh failure
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

  // Determine per-product discount based on user role and API fields
  const getDiscountFromProduct = (product, userRole) => {
    if (!product || !userRole || userRole === 'admin') return 0;

    const map = {
      professional: product.discount_professional,
      expert: product.discount_expert,
      master: product.discount_master
    };

    const raw = map[userRole];
    const num = typeof raw === 'number' ? raw : parseFloat(raw);
    return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0;
  };

  // Extract brand from various data fields - with null safety
  const extractBrand = (product) => {
    if (!product) return 'Other';
    
    if (product.extraFields?.brand) {
      return product.extraFields.brand;
    }
    
    if (product.extraFields?.extraFields?.brand) {
      return product.extraFields.extraFields.brand;
    }
    
    if (product.brand) {
      return product.brand;
    }
    
    const productName = (product.name || product.product_name || '').toLowerCase();
    if (productName.includes('humly')) return 'Humly';
    if (productName.includes('milesight')) return 'Milesight';
    if (productName.includes('supernet')) return 'SuperNet';
    if (productName.includes('acmecorp')) return 'AcmeCorp';
    
    return 'Other';
  };

// Handle product selection
const handleProductClick = (product, event) => {
  if (event.target.closest('button')) {
    return;
  }
  
  // Only set the product if it's different from the currently selected one
  // Don't close the modal if clicking on the same product
  if (selectedProduct?.id !== product.id) {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  // Generate PDF document function using jsPDF
const generatePDFDocument = (product) => {
  try {
    // Access jsPDF from window object (when using CDN) or import it
    const doc = new window.jspdf.jsPDF();
    
    const currentDate = new Date().toLocaleDateString();
    const savings = product.msrp - product.netPrice;
    
    // Set up fonts and colors
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(27, 33, 80); // #1B2150
    
    // Header
    doc.text('Product Datasheet', 20, 30);
    
    // Product name
    doc.setFontSize(16);
    doc.text(product.name, 20, 50);
    
    // Draw a line under product name
    doc.setDrawColor(27, 33, 80);
    doc.line(20, 55, 190, 55);
    
    // Product Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Product Information', 20, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let yPosition = 85;
    
    // Product details
    doc.text(`SKU: ${product.sku}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Category: ${product.category}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Brand: ${product.brand}`, 20, yPosition);
    yPosition += 15;
    
    // Description section
    if (product.description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Description', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Split long description into multiple lines
      const splitDescription = doc.splitTextToSize(product.description, 170);
      doc.text(splitDescription, 20, yPosition);
      yPosition += splitDescription.length * 5 + 10;
    }
    
    // Pricing Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Pricing Information', 20, yPosition);
    yPosition += 15;
    
    // Create pricing table background
    doc.setFillColor(248, 249, 250); // Light gray background
    doc.rect(20, yPosition - 5, 170, 40, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text(`MSRP: $${product.msrp.toFixed(2)}`, 25, yPosition + 5);
    doc.text(`Discount: ${product.discount.toFixed(0)}%`, 25, yPosition + 15);
    
    // Your Price - highlighted
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(27, 33, 80);
    doc.text(`Your Price: $${product.netPrice.toFixed(2)}`, 25, yPosition + 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(226, 36, 0); // Accent color for savings
    doc.text(`You Save: $${savings.toFixed(2)}`, 25, yPosition + 35);
    
    yPosition += 50;
    
    // Additional Information Section
    if (Object.keys(product.extraFields).length > 0) {
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Additional Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      Object.entries(product.extraFields).forEach(([key, value]) => {
        if (key !== 'brand' && value && key !== 'extraFields' && yPosition < 270) {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
          const displayValue = typeof value === 'boolean' ? 
            (value ? 'Yes' : 'No') : 
            String(value);
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${formattedKey}:`, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          
          // Handle long values
          const splitValue = doc.splitTextToSize(displayValue, 120);
          doc.text(splitValue, 80, yPosition);
          yPosition += Math.max(splitValue.length * 5, 8);
        }
      });
    }
    
    // Footer
    doc.setTextColor(102, 102, 102); // Gray color
    doc.setFontSize(8);
    doc.text(`Generated on ${currentDate}`, 20, 285);
    doc.text(`Product Catalog - ${currentRole === 'admin' ? 'Administrator' : (currentRole || 'Partner')} Level`, 20, 290);
    
    // Save the PDF
    const fileName = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_datasheet.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF document:', error);
    throw error;
  }
};
// Handle download with PDF document generation
const handleDownload = async (product) => {
  setDownloadLoading(product.id);
  
  try {
    generatePDFDocument(product);  // <-- Fixed: changed from generateWordDocument to generatePDFDocument
    showToast(`Datasheet downloaded for ${product.name} `);
  } catch (error) {
    console.error('Error downloading datasheet:', error);
    showToast('Failed to generate document. Please try again.', 'error');
  } finally {
    setDownloadLoading(null);
  }
};

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle add to cart - store in localStorage only
  const handleAddToCart = async (product) => {
    setAddToCartLoading(product.id);
    
    try {
      const cartProduct = {
        productId: product.id,
        id: product.id, // Keep both for compatibility
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        category: product.category,
        msrp: product.msrp,
        netPrice: product.netPrice,
        discount: product.discount,
        description: product.description,
        picture: product.picture,
        extraFields: product.extraFields,
        quantity: 1,
        totalPrice: product.netPrice
      };

      const existingItemIndex = cartItems.findIndex(item => 
        item.productId === product.id || item.id === product.id
      );
      
      let updatedCart;
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        updatedCart = cartItems.map((item, index) => 
          index === existingItemIndex
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.netPrice
              }
            : item
        );
      } else {
        // Add new item to cart
        updatedCart = [...cartItems, cartProduct];
      }

      setCartItems(updatedCart);
      localStorage.setItem('quoteCart', JSON.stringify(updatedCart));
      
      // Show toast notification
      showToast(`${product.name} added to quote cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add product to cart. Please try again.', 'error');
    } finally {
      setAddToCartLoading(null);
    }
  };

  // Get cart items count
  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Fetch products from API with enhanced error handling and token refresh
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated) {
          throw new Error('Please login to view products.');
        }

        console.log('Current role:', currentRole);
        console.log('Is authenticated:', isAuthenticated);

        const token = getToken();
        console.log('Token exists:', !!token);

        console.log('Fetching products...');

        const response = await fetchWithAuth(
          // 'http://optimus-india-njs-01.netbird.cloud:3006/products',
          'https://njs-01.optimuslab.space/partners/products',

          {
            method: 'GET',
            signal: AbortSignal.timeout(30000)
          }
        );

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          console.error('Error response body:', errorText);
          
          if (response.status === 403) {
            throw new Error(`Access denied. Server response: ${errorText || 'You do not have permission to view products.'}`);
          } else if (response.status === 404) {
            throw new Error('Products API endpoint not found. Please contact support.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else if (response.status >= 500) {
            throw new Error(`Server error (${response.status}). Please try again later or contact support.`);
          } else {
            throw new Error(`Failed to fetch products. Status: ${response.status}. ${errorText || ''}`);
          }
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Invalid response format. Expected JSON, got: ${contentType}`);
        }

        const data = await response.json();
        console.log('Products fetched successfully:', {
          role: data.role,
          productsCount: data.products?.length || 0,
          firstProduct: data.products?.[0]?.product_name || data.products?.[0]?.name || 'N/A',
          sampleProduct: data.products?.[0]
        });

        if (!data || !Array.isArray(data.products)) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response format from server. Expected products array.');
        }

        if (data.products.length === 0) {
          console.log('No products found in response');
          setProducts([]);
          setError(null);
          return;
        }
        
        // Process products to flatten models into individual products, applying per-product role discount
        const processedProducts = [];
        
        data.products.forEach(product => {
          if (!product) return;
          
          const brand = extractBrand(product);
          const productName = product.name || product.product_name || 'Unnamed Product';
          const discountPercent = getDiscountFromProduct(product, currentRole);
          
          if (product.models && product.models.length > 0) {
            product.models.forEach((model, index) => {
              if (!model) return;
              
              const modelPrice = model.msrp || model.price || product.msrp || product.price || 0;
              const netPrice = modelPrice * (1 - (discountPercent / 100));
              const modelName = model.name || `Model ${index + 1}`;
              
              processedProducts.push({
                id: `${product._id || product.id || `product-${index}`}-model-${index}`,
                parentId: product._id || product.id,
                name: `${productName} - ${modelName}`,
                description: model.description || product.description || '',
                sku: model.sku || product.sku || `${product._id || 'unknown'}-${index}`,
                brand: brand,
                category: product.category || 'Uncategorized',
                msrp: modelPrice,
                netPrice: netPrice,
                discount: discountPercent,
                features: product.features || [],
                picture: model.picture || product.picture || product.product_image || '',
                duration: model.duration || '',
                isModel: true,
                modelName: modelName,
                parentProduct: product,
                parentDescription: product.description || '',
                extraFields: { ...product.extraFields, ...model.extraFields }
              });
            });
          } else {
            const productPrice = product.msrp || product.price || 0;
            const netPrice = productPrice * (1 - (discountPercent / 100));
            processedProducts.push({
              id: product._id || product.id || `product-${Math.random()}`,
              parentId: null,
              name: productName,
              description: product.description || '',
              sku: product.sku || product['sku/model'] || product._id || 'unknown',
              brand: brand,
              category: product.category || 'Uncategorized',
              msrp: productPrice,
              netPrice: netPrice,
              discount: discountPercent,
              features: product.features || [],
              picture: product.picture || product.product_image || '',
              duration: '',
              isModel: false,
              parentProduct: null,
              extraFields: product.extraFields || {}
            });
          }
        });

        setProducts(processedProducts);
        setError(null);
        console.log('Processed products count:', processedProducts.length);
        
        // Automatically select the first product if none is selected
        if (processedProducts.length > 0 && !selectedProduct) {
          setSelectedProduct(processedProducts[0]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && currentRole) {
      console.log('Starting product fetch...');
      fetchProducts();
    } else if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated');
      setError('Please login to view products.');
      setLoading(false);
    } else {
      console.log('Waiting for auth...', { authLoading, isAuthenticated, currentRole });
    }
  }, [currentRole, isAuthenticated, authLoading]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleExpanded = (productId) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Filter and search products - with null safety
  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      const productName = (product.name || '').toLowerCase();
      const productDescription = (product.description || '').toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      const productSku = (product.sku || '').toLowerCase();
      const searchTermLower = (searchTerm || '').toLowerCase();
      
      const matchesSearch = 
        productName.includes(searchTermLower) ||
        productDescription.includes(searchTermLower) ||
        productBrand.includes(searchTermLower) ||
        productSku.includes(searchTermLower);
      
      const matchesCategory = categoryFilter === 'all' || 
        (product.category || '').toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesBrand = brandFilter === 'all' || 
        (product.brand || '').toLowerCase() === brandFilter.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesBrand;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price':
          return (a.msrp || 0) - (b.msrp || 0);
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'sku':
          return (a.sku || '').localeCompare(b.sku || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, brandFilter, sortBy]);

  // Get unique categories and brands for filters
  const categories = React.useMemo(() => {
    const cats = [...new Set(products.map(p => p.category || 'Uncategorized').filter(Boolean))];
    return ['all', ...cats];
  }, [products]);

  const brands = React.useMemo(() => {
    const brandList = [...new Set(products.map(p => p.brand || 'Other').filter(Boolean))];
    return ['all', ...brandList];
  }, [products]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle Quote Cart button click
  const handleQuoteCartClick = () => {
    if (!isAuthenticated) {
      alert('Please login to access your quote cart.');
      return;
    }
    window.location.href = '/request-quote';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FAFAFB]"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#1B2150] absolute top-0 left-0"></div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-lg font-semibold text-[#1B2150]">Loading Products</div>
                  <div className="text-sm text-[#818181] mt-2">Please wait while we fetch your catalog...</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-4 md:p-6">
            <div className="text-center py-12">
              <div className="relative inline-block">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#1B2150] mb-4">Unable to Load Products</h3>
              <p className="text-[#818181] mb-8 max-w-2xl mx-auto leading-relaxed">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 bg-[#1B2150] text-white rounded-xl hover:bg-green-600 transition-all duration-300 font-semibold"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                  }} 
                  className="px-6 py-3 bg-[#5F6485] text-white rounded-xl hover:bg-[#1B2150] transition-all duration-300 font-semibold"
                >
                  Login Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/20">
      {/* Background decoration elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#1B2150]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-[#1B2150]/10 to-[#5F6485]/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      <main className="pt-16">
        {/* Fixed Top Section - Enhanced Header */}
        <div className="sticky top-16 z-20 backdrop-blur-sm bg-white/90 border-b border-[#FAFAFB]">
          {/* Page Header - Enhanced */}
          <div className={`bg-gradient-to-r from-white to-gray-50/50 p-4 pb-2 transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1B2150] leading-tight tracking-tight">
                  Product Catalog
                </h1>
                <div className="w-24 h-1 bg-[#1B2150] rounded-full mt-2"></div>
                <div className="mt-2 text-sm text-[#818181]">
                  Your Level: <span className="font-bold text-[#1B2150]">
                    {currentRole === 'admin' ? 'Administrator' : (currentRole || 'Partner')}
                  </span>
                </div>
              </div>
              
              {/* Enhanced Quote Cart Button */}
              {getCartItemsCount() > 0 && (
                <div className="relative">
                  <button
                    onClick={handleQuoteCartClick}
                    className="group bg-[#1B2150] text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-300 flex items-center gap-2 sm:gap-3 font-semibold relative overflow-hidden text-sm sm:text-base"
                  >
                    <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Quote Cart</span>
                    <span className="relative z-10 sm:hidden">Cart</span>
                    <span className="bg-white text-[#1B2150] rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold relative z-10 shadow-lg">
                      {getCartItemsCount()}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Product Detail Modal - Enhanced Responsive */}
          {selectedProduct && (
            <div className="bg-white shadow-lg border-b border-[#FAFAFB]">
              <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Side - Product Image */}
                  <div className="lg:col-span-3">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-base sm:text-lg font-bold text-[#1B2150] leading-tight pr-2">{selectedProduct.name}</h2>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-[#818181] hover:text-[#1B2150] transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-[#FAFAFB] rounded-lg p-3 mb-2">
                      {selectedProduct.picture ? (
                        <img 
                          src={selectedProduct.picture} 
                          alt={selectedProduct.name}
                          className="w-full h-32 object-contain mx-auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-32 flex items-center justify-center"
                        style={{ display: selectedProduct.picture ? 'none' : 'flex' }}
                      >
                        <Package className="w-12 h-12 text-[#818181]" />
                      </div>
                    </div>
                  </div>

                  {/* Center - Product Details */}
                  <div className="lg:col-span-6">
                    <div className="mb-2 text-sm text-[#818181] space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <div>SKU: <span className="text-[#1B2150] font-medium">{selectedProduct.sku}</span></div>
                        <div>Category: <span className="text-[#1B2150] font-medium">{selectedProduct.category}</span></div>
                        <div>Brand: <span className="text-[#1B2150] font-medium">{selectedProduct.brand}</span></div>
                      </div>
                    </div>

                    {selectedProduct.description && (
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold mb-1">Description</h3>
                        <div className="text-sm text-[#818181] leading-relaxed">
                          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: selectedProduct.description.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/\r/g, '<br>')}} />
                        </div>
                      </div>
                    )}

                    {Object.keys(selectedProduct.extraFields).length > 0 && (
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold mb-1">Additional Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-sm">
                          {Object.entries(selectedProduct.extraFields).slice(0, 8).map(([key, value]) => {
                            if (key === 'brand' || !value || key === 'extraFields') return null;
                            
                            return (
                              <div key={key} className="flex flex-col sm:flex-row">
                                <span className="font-medium text-[#1B2150] sm:w-2/5 capitalize text-xs">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-[#818181] sm:w-3/5 text-xs">
                                  {typeof value === 'boolean' ? 
                                    (value ? 'Yes' : 'No') : 
                                    String(value).length > 25 ? 
                                    String(value).substring(0, 25) + '...' :
                                    String(value)
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Pricing and Actions */}
                  <div className="lg:col-span-3">
                    <div className="bg-[#FAFAFB] p-3 rounded-lg mb-3">
                      <h3 className="text-sm font-semibold mb-2">Pricing</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#818181]">MSRP:</span>
                          <span className="font-semibold">${selectedProduct.msrp.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#818181]">Discount:</span>
                          <span className="font-semibold text-green-600">{selectedProduct.discount.toFixed(0)}%</span>
                        </div>
                        <div className="border-t pt-1 flex justify-between">
                          <span className="text-sm text-[#818181]">Your Price:</span>
                          <span className="text-lg font-bold text-[#1B2150]">${selectedProduct.netPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-center text-xs text-[#818181]">
                          Save: ${(selectedProduct.msrp - selectedProduct.netPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleAddToCart(selectedProduct)}
                        disabled={addToCartLoading === selectedProduct.id}
                        className="flex items-center justify-center gap-1 w-full px-3 py-1.5 bg-[#1B2150] text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {addToCartLoading === selectedProduct.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Add to Quote
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(selectedProduct)}
                        disabled={downloadLoading === selectedProduct.id}
                        className="flex items-center justify-center gap-1 w-full px-3 py-1.5 bg-[#5F6485] text-white rounded text-sm hover:bg-[#1B2150] transition-colors disabled:opacity-50"
                      >
                        {downloadLoading === selectedProduct.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            Download Datasheet
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Filters Section - Fully Responsive */}
          <div className={`bg-white/90 backdrop-blur-sm shadow-lg p-4 transform transition-all duration-700 delay-300 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Enhanced Search */}
              <div className="sm:col-span-2 lg:col-span-2 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4 group-focus-within:text-[#1B2150] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search products, brands, SKUs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-[#FAFAFB] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#1B2150]/20 focus:border-[#1B2150] transition-all duration-300 text-sm bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#405952]/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              {/* Enhanced Category Filter */}
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4 group-focus-within:text-[#1B2150] transition-colors duration-300" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#405952]/20 focus:border-[#405952] transition-all duration-300 appearance-none text-sm bg-white/80 backdrop-blur-sm font-medium"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Brand Filter */}
              <div className="relative group">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#405952]/20 focus:border-[#405952] transition-all duration-300 appearance-none text-sm bg-white/80 backdrop-blur-sm font-medium"
                >
                  {brands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand === 'all' ? 'All Brands' : brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Sort */}
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#405952]/20 focus:border-[#405952] transition-all duration-300 appearance-none text-sm bg-white/80 backdrop-blur-sm font-medium"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="brand">Sort by Brand</option>
                  <option value="category">Sort by Category</option>
                  <option value="sku">Sort by SKU</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Scrollable Products Table Section - Fully Responsive */}
        <div className={`p-4 sm:p-6 transform transition-all duration-1000 delay-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Enhanced Products Table - Responsive */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#FAFAFB] overflow-hidden relative">
            {/* Gradient overlay for visual depth */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B2150]"></div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-white to-[#FAFAFB] sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      Product Details
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      MSRP
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-[#818181] uppercase tracking-wider">
                      Your Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-[#FAFAFB]">
                  {paginatedProducts.map((product, index) => {
                    const isExpanded = expandedProducts.has(product.id);
                    const isSelected = selectedProduct?.id === product.id;
                    const isInCart = cartItems.some(item => item.productId === product.id || item.id === product.id);
                    
                    return (
                      <React.Fragment key={product.id}>
                        <tr 
                          className={`group hover:bg-[#1B2150]/5 cursor-pointer transition-all duration-300 ${
                            isSelected ? 'bg-[#1B2150]/10 border-l-4 border-[#1B2150]' : ''
                          }`}
                          onClick={(e) => handleProductClick(product, e)}
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                          }}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                {product.picture ? (
                                  <div className="relative group-hover:scale-105 transition-transform duration-300">
                                    <img 
                                      className="h-10 w-10 rounded-xl object-cover shadow-md" 
                                      src={product.picture} 
                                      alt={product.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-[#1B2150]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  </div>
                                ) : null}
                                <div 
                                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300"
                                  style={{ display: product.picture ? 'none' : 'flex' }}
                                >
                                  <Package className="w-6 h-6 text-[#818181]" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-xs font-bold text-[#1B2150] flex items-center group-hover:text-[#1B2150] transition-colors duration-300">
                                  {product.name}
                                  {product.isModel && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                                      Model
                                    </span>
                                  )}
                                  {isInCart && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm">
                                      In Quote
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#818181] leading-relaxed">
                                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: (product.description.length > 50 
                                    ? `${product.description.substring(0, 50)}...`
                                    : product.description
                                  ).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/\r/g, '<br>')}} />
                                </div>
                                {product.duration && (
                                  <div className="text-xs text-[#818181] mt-1">
                                    Duration: {product.duration}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAFB] text-[#1B2150] shadow-sm">
                              {product.brand}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-[#1B2150] font-mono">
                            {product.sku}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-[#818181] font-medium">
                            {product.category}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-[#1B2150] font-bold">
                            ${product.msrp.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-100 to-green-200 text-[#1B2150] shadow-sm">
                              {product.discount.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-base font-black text-[#1B2150]">
                            ${product.netPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-[#818181]">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                disabled={addToCartLoading === product.id}
                                className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all duration-300 font-semibold shadow-md disabled:opacity-50 ${
                                  isInCart 
                                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 hover:shadow-lg' 
                                    : 'bg-[#1B2150] hover:bg-green-600 text-white'
                                }`}
                                title={isInCart ? 'Add More' : 'Add to Quote'}
                              >
                                {addToCartLoading === product.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                                ) : (
                                  <Plus className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                                )}
                                {isInCart ? 'Add More' : 'Add'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4 max-h-96 overflow-y-auto p-4">
              {paginatedProducts.map((product, index) => {
                const isSelected = selectedProduct?.id === product.id;
                const isInCart = cartItems.some(item => item.productId === product.id || item.id === product.id);
                
                return (
                  <div 
                    key={product.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-[#405952]/30 ${
                      isSelected ? 'ring-2 ring-[#405952] border-[#405952]' : ''
                    }`}
                    onClick={(e) => handleProductClick(product, e)}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: isLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 relative">
                          {product.picture ? (
                            <img 
                              className="h-16 w-16 rounded-lg object-cover shadow-md" 
                              src={product.picture} 
                              alt={product.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="h-16 w-16 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center shadow-md"
                            style={{ display: product.picture ? 'none' : 'flex' }}
                          >
                            <Package className="w-8 h-8 text-gray-500" />
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                              {product.name}
                              {product.isModel && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                                  Model
                                </span>
                              )}
                              {isInCart && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm">
                                  In Quote
                                </span>
                              )}
                            </h3>
                            
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                              <span className="bg-gray-100 px-2 py-1 rounded">SKU: {product.sku}</span>
                              <span className="bg-gray-100 px-2 py-1 rounded">{product.brand}</span>
                              <span className="bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                            </div>
                            
                            <div className="text-sm text-gray-600 leading-relaxed mb-3">
                              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: (product.description.length > 80 
                                ? `${product.description.substring(0, 80)}...`
                                : product.description
                              ).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/\r/g, '<br>')}} />
                            </div>
                          </div>

                          {/* Pricing on Mobile */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm text-gray-500 line-through">${product.msrp.toFixed(2)}</div>
                            <div className="text-lg font-bold text-[#405952]">${product.netPrice.toFixed(2)}</div>
                            <div className="text-xs text-green-600 font-semibold">{product.discount.toFixed(0)}% OFF</div>
                          </div>
                        </div>

                        {/* Actions on Mobile */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={addToCartLoading === product.id}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 font-semibold shadow-md disabled:opacity-50 ${
                              isInCart 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 hover:shadow-lg' 
                                : 'bg-gradient-to-r from-[#405952] to-[#30423f] hover:from-[#30423f] hover:to-[#405952] text-white hover:shadow-xl hover:shadow-[#405952]/25'
                            }`}
                          >
                            {addToCartLoading === product.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            {isInCart ? 'Add More' : 'Add to Quote'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(product);
                            }}
                            disabled={downloadLoading === product.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 font-semibold shadow-md"
                          >
                            {downloadLoading === product.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination - Responsive */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-r from-white to-gray-50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
                {/* Mobile Pagination */}
                <div className="flex justify-between w-full sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-300"
                  >
                    Previous
                  </button>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 font-medium">
                      Page <span className="font-bold text-[#405952]">{currentPage}</span> of{' '}
                      <span className="font-bold text-[#405952]">{totalPages}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-300"
                  >
                    Next
                  </button>
                </div>
                
                {/* Desktop Pagination */}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      Showing <span className="font-bold text-[#405952]">{startIndex + 1}</span> to{' '}
                      <span className="font-bold text-[#405952]">
                        {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                      </span>{' '}
                      of <span className="font-bold text-[#405952]">{filteredProducts.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-lg -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all duration-300"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-bold transition-all duration-300 ${
                              page === currentPage
                                ? 'z-10 bg-gradient-to-r from-[#405952] to-[#30423f] border-[#405952] text-white shadow-lg'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all duration-300"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced No Results - Responsive */}
          {filteredProducts.length === 0 && !loading && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#405952] to-[#30423f]"></div>
              <div className="text-center py-12 sm:py-16">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">No Products Found</h3>
                <p className="text-gray-600 leading-relaxed px-4">Try adjusting your search criteria or filters to discover more products</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Toast Notification - Responsive */}
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm">
          <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl transition-all duration-300 transform backdrop-blur-sm border ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400' 
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold break-words">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Products;