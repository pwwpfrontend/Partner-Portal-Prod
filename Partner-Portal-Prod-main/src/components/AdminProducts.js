import React, { useState, useEffect, useMemo } from 'react';
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
  Edit,
  Trash2,
  Upload,
  Check
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

const AdminProducts = () => {
  const { currentRole, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const itemsPerPage = 10;

  // Normalize description text by converting escaped line breaks to real newlines
  const normalizeDescription = (text) => {
    const raw = String(text || '');
    return raw.replace(/\\r\\n|\\n|\\r/g, '\n');
  };

  // API Base URL
  // const BASE_URL = 'http://optimus-india-njs-01.netbird.cloud:3006';
  const BASE_URL = 'https://njs-01.optimuslab.space/partners';

  // Get token from auth service
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Refresh access token helper (same behavior as other pages)
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) throw new Error('No refresh token available');

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedRefreshToken })
      });
      if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);

      const data = await response.json();
      if (!data.accessToken) throw new Error('No access token in refresh response');
      localStorage.setItem('token', data.accessToken);
      return data.accessToken;
    } catch (err) {
      console.error('AdminProducts refresh token error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw err;
    }
  };

  // Fetch with auth helper
  const fetchWithAuth = async (path, options = {}) => {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (!headers.has('Authorization') && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // If the body is FormData, DO NOT set Content-Type; browser will set boundary.
    const isFormData = options.body instanceof FormData;
    if (isFormData) {
      headers.delete('Content-Type');
    }

    const doFetch = async () => fetch(`${BASE_URL}${path}`, { ...options, headers });

    let res = await doFetch();
    if (res.status === 401 || res.status === 403) {
      try {
        const newToken = await refreshAccessToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        res = await doFetch();
      } catch (e) {
        // bubble up to caller; page-level error UI will handle
        throw e;
      }
    }
    return res;
  };

  // API Functions
  const apiGetProducts = async () => {
    const res = await fetchWithAuth('/products', { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  };

  const buildProductFormData = (values, files) => {
    const fd = new FormData();
    // Text/number fields as strings
    fd.append('product_name', values.product_name ?? '');
    fd.append('sku/model', values['sku/model'] ?? values.skuModel ?? '');
    fd.append('msrp', values.msrp != null ? String(values.msrp) : '');
    fd.append('true_cost', values.true_cost != null ? String(values.true_cost) : '');
    fd.append('discount_expert', values.discount_expert != null ? String(values.discount_expert) : '');
    fd.append('discount_professional', values.discount_professional != null ? String(values.discount_professional) : '');
    fd.append('discount_master', values.discount_master != null ? String(values.discount_master) : '');
    fd.append('description', values.description ?? '');
    fd.append('brand', values.brand ?? '');
    fd.append('category', values.category ?? '');

    // Files — append ONLY if present
    if (files?.picture) {
      // Use the field name the backend persists as (product_image)
      fd.append('product_image', files.picture);
    }

    return fd;
  };

  const apiCreateProduct = async (values, files) => {
    const body = buildProductFormData(values, files);
    const res = await fetchWithAuth('/products', { method: 'POST', body });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Create failed: ${res.status} ${txt}`);
    }
    return res.json();
  };

  const apiUpdateProduct = async (id, values, files) => {
    const body = buildProductFormData(values, files);
    const res = await fetchWithAuth(`/products/${id}`, { method: 'PUT', body });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Update failed: ${res.status} ${txt}`);
    }
    return res.json();
  };

  const apiDeleteProduct = async (id) => {
    const res = await fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return res.json();
  };


  // Handle product selection
  const handleProductClick = (product, event) => {
    if (event.target.closest('button')) {
      return;
    }
    
    setSelectedProduct(selectedProduct?._id === product._id ? null : product);
    
    if (selectedProduct?._id !== product._id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle single delete
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiDeleteProduct(productId);
        setProducts(prev => prev.filter(p => p._id !== productId));
        alert('Product deleted successfully');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  // Handle edit
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiGetProducts();
        console.log('Products fetched successfully:', data);
        
        // Use the products array directly from API response
        const processedProducts = data.products.map(product => ({
          ...product,
          // Ensure we have the correct field names for display
          name: product.product_name || product.name,
          sku: product['sku/model'] || product.sku,
          picture: product.product_image || product.picture,
        }));

        setProducts(processedProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter and search products - exactly matching Products.js logic
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        (product.product_name || product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product['sku/model'] || product.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        (product.category || '').toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesBrand = brandFilter === 'all' || 
        (product.brand || '').toLowerCase() === brandFilter.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.product_name || a.name || '').localeCompare(b.product_name || b.name || '');
        case 'price':
          return (a.msrp || 0) - (b.msrp || 0);
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'sku':
          return (a['sku/model'] || a.sku || '').localeCompare(b['sku/model'] || b.sku || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, brandFilter, sortBy]);

  // Get unique categories and brands for filters - dynamic from current products
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return ['all', ...cats.sort()];
  }, [products]);

  const brands = useMemo(() => {
    const brandList = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return ['all', ...brandList.sort()];
  }, [products]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Wait for auth to resolve to avoid unauthorized flicker
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFB]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2150]"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Role guard - only admin can access
  if (currentRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAFAFB]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-[#EB664D]" />
              <h3 className="text-lg font-medium text-[#1B2150] mb-2">Access Denied</h3>
              <p className="text-[#818181]">You need admin privileges to access this page.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFB]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2150]"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFB]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-[#EB664D]" />
              <h3 className="text-lg font-medium text-[#1B2150] mb-2">Error Loading Products</h3>
              <p className="text-[#818181]">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D]"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      <main className="pt-16">
        {/* Page Header - Updated with right-aligned actions */}
        <div className="bg-[#FAFAFB] p-6 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#1B2150]">Admin Products</h1>
              <div className="mt-1 text-sm text-[#818181]">Manage your product catalog</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Product Detail Modal - Positioned below header and made sticky - EXACTLY matching Products.js */}
        {selectedProduct && (
          <div className="sticky top-16 z-30 bg-white shadow-lg border-b border-[#FAFAFB]">
            <div className="max-w-7xl mx-auto p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Side - Product Image */}
                <div className="col-span-12 lg:col-span-3">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-[#1B2150] leading-tight">{selectedProduct.product_name || selectedProduct.name}</h2>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-[#818181] hover:text-[#1B2150] transition-colors flex-shrink-0 ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-[#FAFAFB] rounded-lg p-4 mb-3">
                    {selectedProduct.product_image || selectedProduct.picture ? (
                      <img 
                        src={selectedProduct.product_image || selectedProduct.picture} 
                        alt={selectedProduct.product_name || selectedProduct.name}
                        className="w-full h-32 object-contain mx-auto"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-32 flex items-center justify-center"
                      style={{ display: (selectedProduct.product_image || selectedProduct.picture) ? 'none' : 'flex' }}
                    >
                      <Package className="w-12 h-12 text-[#818181]" />
                    </div>
                  </div>
                </div>

                {/* Center - Product Details */}
                <div className="col-span-12 lg:col-span-6">
                  {/* SKU, Category, Brand */}
                  <div className="mb-3 text-sm text-[#818181] space-y-1">
                    <div>SKU: <span className="text-[#1B2150] font-medium">{selectedProduct['sku/model'] || selectedProduct.sku}</span></div>
                    <div>Category: <span className="text-[#1B2150] font-medium">{selectedProduct.category}</span> | Brand: <span className="text-[#1B2150] font-medium">{selectedProduct.brand}</span></div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold mb-1">Description</h3>
                      <div className="text-sm text-[#818181] leading-relaxed">
                        <div className="whitespace-pre-wrap">{normalizeDescription(selectedProduct.description)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side - Pricing and Actions */}
                <div className="col-span-12 lg:col-span-3">
                  {/* Pricing Breakdown */}
                  <div className="bg-[#FAFAFB] p-4 rounded-lg mb-4">
                    <h3 className="text-sm font-semibold mb-3">Pricing Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#818181]">MSRP:</span>
                        <span className="font-semibold">${(selectedProduct.msrp || 0).toFixed(2)}</span>
                      </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#818181]">True Cost:</span>
                      <span className="font-semibold">${(selectedProduct.true_cost || 0).toFixed(2)}</span>
                    </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#818181]">Discount (Professional):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_professional || 0).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#818181]">Discount (Expert):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_expert || 0).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#818181]">Discount (Master):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_master || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleEditProduct(selectedProduct)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#1B2150] text-white rounded text-sm hover:bg-[#EB664D] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Product
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(selectedProduct._id)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#EB664D] text-white rounded text-sm hover:bg-[#EB664D]/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 pt-3">
          {/* Filters - Updated without action buttons */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#FAFAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#818181] w-4 h-4" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-[#FAFAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent appearance-none"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-[#FAFAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent appearance-none"
                >
                  {brands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand === 'all' ? 'All Brands' : brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-[#FAFAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent appearance-none"
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

          {/* Products Table/Card - Responsive like Products.js */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-[#FAFAFB]">
                <thead className="bg-[#FAFAFB]">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '40%'}}>
                      Product
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '12%'}}>
                      Brand
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '12%'}}>
                      SKU
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '12%'}}>
                      Category
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '8%'}}>
                      MSRP
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '8%'}}>
                      True Cost
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '8%'}}>
                      Discounts
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-[#818181] uppercase tracking-wider" style={{width: '8%'}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#FAFAFB]">
                  {paginatedProducts.map((product) => {
                    const isSelected = selectedProduct?._id === product._id;
                    return (
                      <tr 
                        key={product._id}
                        className={`hover:bg-[#FAFAFB] cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={(e) => handleProductClick(product, e)}
                      >
                        <td className="px-2 py-2 whitespace-nowrap" style={{width: '40%'}}>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {product.product_image || product.picture ? (
                                <img 
                                  className="h-8 w-8 rounded object-cover" 
                                  src={product.product_image || product.picture} 
                                  alt={product.product_name || product.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="h-8 w-8 rounded bg-[#FAFAFB] flex items-center justify-center"
                                style={{ display: (product.product_image || product.picture) ? 'none' : 'flex' }}
                              >
                                <Package className="w-4 h-4 text-[#818181]" />
                              </div>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <div className="text-sm font-medium text-[#1B2150] truncate">
                                {product.product_name || product.name}
                              </div>
                              <div className="text-xs text-[#818181] truncate">
                                {normalizeDescription(product.description || '').substring(0, 60)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap overflow-hidden" style={{width: '12%'}}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FAFAFB] text-[#1B2150] truncate">
                            {product.brand}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-[#1B2150] truncate" style={{width: '12%'}}>
                          {product['sku/model'] || product.sku}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-[#818181] truncate" style={{width: '12%'}}>
                          {product.category}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-[#1B2150]" style={{width: '8%'}}>
                          ${(product.msrp || 0).toFixed(0)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-[#1B2150]" style={{width: '8%'}}>
                          ${(product.true_cost || 0).toFixed(0)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center" style={{width: '8%'}}>
                          <div className="flex flex-col gap-0.5 text-[10px]">
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-green-100 text-green-800">P{(product.discount_professional || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-green-100 text-green-800">E{(product.discount_expert || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-green-100 text-green-800">M{(product.discount_master || 0).toFixed(0)}%</span>
                          </div>
                          {(() => {
                            const msrp = Number(product.msrp) || 0;
                            const tc = Number(product.true_cost) || 0;
                            const p = Number(product.discount_professional) || 0;
                            const e = Number(product.discount_expert) || 0;
                            const m = Number(product.discount_master) || 0;
                            const pPrice = msrp * (1 - p / 100);
                            const ePrice = msrp * (1 - e / 100);
                            const mPrice = msrp * (1 - m / 100);
                            const below = tc > 0 && (pPrice < tc || ePrice < tc || mPrice < tc);
                            return below ? (
                              <div className="text-[10px] text-red-600 mt-1">Warning: at least one tier below cost</div>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-[#818181]" style={{width: '8%'}}>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                              className="flex items-center justify-center p-1 text-[10px] bg-transparent border border-[#1B2150] text-[#1B2150] rounded hover:border-[#EB664D] hover:text-[#EB664D] transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product._id); }}
                              className="flex items-center justify-center p-1 text-[10px] bg-transparent border border-[#EB664D] text-[#EB664D] rounded hover:border-[#EB664D]/80 hover:text-[#EB664D]/80 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {paginatedProducts.map((product) => {
                return (
                  <div key={product._id} className="bg-white rounded-lg border border-[#FAFAFB] p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.product_image || product.picture ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={product.product_image || product.picture}
                            alt={product.product_name || product.name}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="h-10 w-10 rounded-lg bg-[#FAFAFB] flex items-center justify-center" style={{ display: (product.product_image || product.picture) ? 'none' : 'flex' }}>
                          <Package className="w-5 h-5 text-[#818181]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#1B2150] truncate">{product.product_name || product.name}</div>
                        <div className="text-xs text-[#818181] truncate">{normalizeDescription(product.description || '')}</div>
                        <div className="flex flex-wrap gap-1 mt-2 text-[10px] text-[#1B2150]">
                          <span className="bg-[#FAFAFB] px-2 py-0.5 rounded">{product.brand}</span>
                          <span className="bg-[#FAFAFB] px-2 py-0.5 rounded">{product['sku/model'] || product.sku}</span>
                          <span className="bg-[#FAFAFB] px-2 py-0.5 rounded">{product.category}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <div className="text-sm font-semibold text-[#1B2150]">${(product.msrp || 0).toFixed(2)}</div>
                            <div className="text-xs text-[#818181]">True Cost ${(product.true_cost || 0).toFixed(2)}</div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">P {(product.discount_professional || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">E {(product.discount_expert || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">M {(product.discount_master || 0).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-transparent border border-[#1B2150] text-[#1B2150] rounded hover:border-[#EB664D] hover:text-[#EB664D] transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product._id); }}
                            className="p-1.5 text-xs bg-transparent border border-[#EB664D] text-[#EB664D] rounded-full hover:border-[#EB664D]/80 hover:text-[#EB664D]/80 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination - EXACTLY matching Products.js */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-[#FAFAFB] sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-[#FAFAFB] text-sm font-medium rounded-md text-[#818181] bg-white hover:bg-[#FAFAFB] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#FAFAFB] text-sm font-medium rounded-md text-[#818181] bg-white hover:bg-[#FAFAFB] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#818181]">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredProducts.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#FAFAFB] bg-white text-sm font-medium text-[#818181] hover:bg-[#FAFAFB] disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-[#1B2150] border-[#1B2150] text-white'
                              : 'bg-white border-[#FAFAFB] text-[#818181] hover:bg-[#FAFAFB]'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#FAFAFB] bg-white text-sm font-medium text-[#818181] hover:bg-[#FAFAFB] disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* No Results - EXACTLY matching Products.js */}
          {filteredProducts.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-[#818181]" />
                <h3 className="text-lg font-medium text-[#1B2150] mb-2">No products found</h3>
                <p className="text-[#818181]">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <AdminProductFormModal
          visible={showAddModal}
          mode="create"
          existingBrands={brands.filter(b => b !== 'all')}
          existingCategories={categories.filter(c => c !== 'all')}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (values, files) => {
            try {
              const newProduct = await apiCreateProduct(values, files);
              setProducts(prev => [newProduct, ...prev]);
              setShowAddModal(false);
              alert('Product created successfully');
            } catch (err) {
              console.error('Create error:', err);
              alert('Failed to create product: ' + err.message);
            }
          }}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <AdminProductFormModal
          visible={showEditModal}
          mode="edit"
          initialValues={editingProduct}
          existingBrands={brands.filter(b => b !== 'all')}
          existingCategories={categories.filter(c => c !== 'all')}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSubmit={async (values, files) => {
            try {
              const updatedProduct = await apiUpdateProduct(editingProduct._id, values, files);
              setProducts(prev => prev.map(p => p._id === editingProduct._id ? updatedProduct : p));
              setShowEditModal(false);
              setEditingProduct(null);
              alert('Product updated successfully');
            } catch (err) {
              console.error('Update error:', err);
              alert('Failed to update product: ' + err.message);
            }
          }}
        />
      )}
    </div>
  );
};

// Admin Product Form Modal Component
const AdminProductFormModal = ({ visible, mode, initialValues, existingBrands, existingCategories, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    product_name: initialValues?.product_name || initialValues?.name || '',
    'sku/model': initialValues?.['sku/model'] || initialValues?.sku || '',
    msrp: initialValues?.msrp || '',
    true_cost: initialValues?.true_cost || '',
    discount_expert: initialValues?.discount_expert || '',
    discount_professional: initialValues?.discount_professional || '',
    discount_master: initialValues?.discount_master || '',
    description: initialValues?.description || '',
    brand: initialValues?.brand || '',
    category: initialValues?.category || ''
  });

  const [files, setFiles] = useState({
    picture: null
  });

  const [imagePreview, setImagePreview] = useState(
    initialValues?.product_image || initialValues?.picture || null
  );

  const [errors, setErrors] = useState({});
  
  // States for smart dropdowns
  const [brandDropdownValue, setBrandDropdownValue] = useState(
    existingBrands.includes(initialValues?.brand) ? initialValues?.brand : (initialValues?.brand ? 'new' : '')
  );
  const [categoryDropdownValue, setCategoryDropdownValue] = useState(
    existingCategories.includes(initialValues?.category) ? initialValues?.category : (initialValues?.category ? 'new' : '')
  );
  const [customBrand, setCustomBrand] = useState(
    !existingBrands.includes(initialValues?.brand) ? initialValues?.brand || '' : ''
  );
  const [customCategory, setCustomCategory] = useState(
    !existingCategories.includes(initialValues?.category) ? initialValues?.category || '' : ''
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBrandDropdownChange = (e) => {
    const value = e.target.value;
    setBrandDropdownValue(value);
    
    if (value === 'new') {
      setFormData(prev => ({ ...prev, brand: customBrand }));
    } else {
      setFormData(prev => ({ ...prev, brand: value }));
      setCustomBrand('');
    }
  };

  const handleCategoryDropdownChange = (e) => {
    const value = e.target.value;
    setCategoryDropdownValue(value);
    
    if (value === 'new') {
      setFormData(prev => ({ ...prev, category: customCategory }));
    } else {
      setFormData(prev => ({ ...prev, category: value }));
      setCustomCategory('');
    }
  };

  const handleCustomBrandChange = (e) => {
    const value = e.target.value;
    setCustomBrand(value);
    setFormData(prev => ({ ...prev, brand: value }));
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, picture: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

const removeImage = () => {
  setFiles(prev => ({ ...prev, picture: null }));
  setImagePreview(null);
  // Reset the file input
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.value = '';
  }
};

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!formData['sku/model'].trim()) newErrors['sku/model'] = 'SKU/Model is required';
    if (!formData.msrp || isNaN(formData.msrp) || parseFloat(formData.msrp) <= 0) {
      newErrors.msrp = 'Valid MSRP is required';
    }
    if (!formData.true_cost || isNaN(formData.true_cost) || parseFloat(formData.true_cost) <= 0) {
      newErrors.true_cost = 'Valid true cost is required';
    }
    if (formData.discount_expert === '' || isNaN(formData.discount_expert) || parseFloat(formData.discount_expert) < 0) {
      newErrors.discount_expert = 'Valid expert discount is required';
    }
    if (formData.discount_professional === '' || isNaN(formData.discount_professional) || parseFloat(formData.discount_professional) < 0) {
      newErrors.discount_professional = 'Valid professional discount is required';
    }
    if (formData.discount_master === '' || isNaN(formData.discount_master) || parseFloat(formData.discount_master) < 0) {
      newErrors.discount_master = 'Valid master discount is required';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData, files);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1B2150]">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-[#818181] hover:text-[#1B2150]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
           {/* Image Upload */}
<div>
  <label className="block text-sm font-medium text-[#1B2150] mb-2">
    Product Image
  </label>
  <div className="border-2 border-dashed border-[#FAFAFB] rounded-lg p-6 text-center">
    {imagePreview ? (
      <div className="relative">
        <img 
          src={imagePreview} 
          alt="Preview" 
          className="mx-auto h-32 w-32 object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={removeImage}
          className="absolute -top-2 -right-2 bg-[#EB664D] text-white rounded-full p-1 hover:bg-[#EB664D]/80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div>
        <Upload className="mx-auto h-12 w-12 text-[#818181]" />
        <div className="mt-4">
          <label className="cursor-pointer bg-[#1B2150] text-white px-4 py-2 rounded-lg hover:bg-[#EB664D] transition-colors">
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-[#818181] mt-2">
          PNG, JPG, GIF up to 10MB
        </p>
      </div>
    )}
  </div>
</div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.product_name ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.product_name && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.product_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  SKU/Model *
                </label>
                <input
                  type="text"
                  name="sku/model"
                  value={formData['sku/model']}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors['sku/model'] ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors['sku/model'] && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors['sku/model']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  MSRP *
                </label>
                <input
                  type="number"
                  name="msrp"
                  value={formData.msrp}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.msrp ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.msrp && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.msrp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  True Cost *
                </label>
                <input
                  type="number"
                  name="true_cost"
                  value={formData.true_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.true_cost ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.true_cost && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.true_cost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Discount (Professional) *
                </label>
                <input
                  type="number"
                  name="discount_professional"
                  value={formData.discount_professional}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.discount_professional ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.discount_professional && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.discount_professional}</p>
                )}
                {/* Live discounted price and warning */}
                {(() => {
                  const msrpNum = Number(formData.msrp);
                  const tcNum = Number(formData.true_cost);
                  const dNum = Number(formData.discount_professional);
                  const valid = Number.isFinite(msrpNum) && Number.isFinite(dNum);
                  const discPrice = valid ? msrpNum * (1 - (dNum / 100)) : undefined;
                  const below = Number.isFinite(discPrice) && Number.isFinite(tcNum) && discPrice < tcNum;
                  return (
                    <div className="mt-1">
                      {Number.isFinite(discPrice) && (
                        <div className="text-xs text-[#818181]">Disc. Price: ${discPrice.toFixed(2)}</div>
                      )}
                      {below && (
                        <div className="text-xs text-[#EB664D]">Warning: below cost (${tcNum.toFixed(2)})</div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Discount (Expert) *
                </label>
                <input
                  type="number"
                  name="discount_expert"
                  value={formData.discount_expert}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.discount_expert ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.discount_expert && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.discount_expert}</p>
                )}
                {/* Live discounted price and warning */}
                {(() => {
                  const msrpNum = Number(formData.msrp);
                  const tcNum = Number(formData.true_cost);
                  const dNum = Number(formData.discount_expert);
                  const valid = Number.isFinite(msrpNum) && Number.isFinite(dNum);
                  const discPrice = valid ? msrpNum * (1 - (dNum / 100)) : undefined;
                  const below = Number.isFinite(discPrice) && Number.isFinite(tcNum) && discPrice < tcNum;
                  return (
                    <div className="mt-1">
                      {Number.isFinite(discPrice) && (
                        <div className="text-xs text-[#818181]">Disc. Price: ${discPrice.toFixed(2)}</div>
                      )}
                      {below && (
                        <div className="text-xs text-[#EB664D]">Warning: below cost (${tcNum.toFixed(2)})</div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Discount (Master) *
                </label>
                <input
                  type="number"
                  name="discount_master"
                  value={formData.discount_master}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.discount_master ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                />
                {errors.discount_master && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.discount_master}</p>
                )}
                {/* Live discounted price and warning */}
                {(() => {
                  const msrpNum = Number(formData.msrp);
                  const tcNum = Number(formData.true_cost);
                  const dNum = Number(formData.discount_master);
                  const valid = Number.isFinite(msrpNum) && Number.isFinite(dNum);
                  const discPrice = valid ? msrpNum * (1 - (dNum / 100)) : undefined;
                  const below = Number.isFinite(discPrice) && Number.isFinite(tcNum) && discPrice < tcNum;
                  return (
                    <div className="mt-1">
                      {Number.isFinite(discPrice) && (
                        <div className="text-xs text-[#818181]">Disc. Price: ${discPrice.toFixed(2)}</div>
                      )}
                      {below && (
                        <div className="text-xs text-[#EB664D]">Warning: below cost (${tcNum.toFixed(2)})</div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Smart Brand Dropdown */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Brand *
                </label>
                <select
                  value={brandDropdownValue}
                  onChange={handleBrandDropdownChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.brand ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                >
                  <option value="">Select Brand</option>
                  {existingBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                  <option value="new">+ Add New Brand</option>
                </select>
                
                {brandDropdownValue === 'new' && (
                  <input
                    type="text"
                    placeholder="Enter new brand name"
                    value={customBrand}
                    onChange={handleCustomBrandChange}
                    className="w-full mt-2 px-3 py-2 border border-[#FAFAFB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent"
                  />
                )}
                
                {errors.brand && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.brand}</p>
                )}
              </div>

              {/* Smart Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-[#1B2150] mb-2">
                  Category *
                </label>
                <select
                  value={categoryDropdownValue}
                  onChange={handleCategoryDropdownChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.category ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                  }`}
                >
                  <option value="">Select Category</option>
                  {existingCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="new">+ Add New Category</option>
                </select>
                
                {categoryDropdownValue === 'new' && (
                  <input
                    type="text"
                    placeholder="Enter new category name"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    className="w-full mt-2 px-3 py-2 border border-[#FAFAFB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent"
                  />
                )}
                
                {errors.category && (
                  <p className="text-[#EB664D] text-xs mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2150] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="12"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                  errors.description ? 'border-[#EB664D]' : 'border-[#FAFAFB]'
                }`}
              />
              {errors.description && (
                <p className="text-[#EB664D] text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-[#FAFAFB]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[#818181] bg-[#FAFAFB] rounded-lg hover:bg-[#818181] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B2150] text-white rounded-lg hover:bg-[#EB664D] transition-colors"
              >
                {mode === 'create' ? 'Add Product' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;