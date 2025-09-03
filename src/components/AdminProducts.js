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
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingMany, setDeletingMany] = useState(false);
  const itemsPerPage = 10;

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

  const apiDeleteMany = async (ids) => {
    const fd = new FormData();
    fd.append('ids', JSON.stringify(ids));
    const res = await fetchWithAuth('/products', { method: 'DELETE', body: fd });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Multi-delete failed: ${res.status} ${txt}`);
    }
    return res.json();
  };

  // Handle product selection
  const handleProductClick = (product, event) => {
    if (event.target.closest('button') || event.target.closest('input[type="checkbox"]')) {
      return;
    }
    
    setSelectedProduct(selectedProduct?._id === product._id ? null : product);
    
    if (selectedProduct?._id !== product._id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle checkbox selection
  const handleSelectProduct = (productId, event) => {
    event.stopPropagation();
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts(new Set(paginatedProducts.map(p => p._id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0 || deletingMany) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;

    try {
      setDeletingMany(true);
      await apiDeleteMany(Array.from(selectedProducts));
      setProducts(prev => prev.filter(p => !selectedProducts.has(p._id)));
      setSelectedProducts(new Set());
      alert('Products deleted successfully');
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Failed to delete products: ' + err.message);
    } finally {
      setDeletingMany(false);
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
      <div className="min-h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#405952]"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Role guard - only admin can access
  if (currentRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#405952]"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
              <p className="text-gray-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-[#405952] text-white rounded-lg hover:bg-[#2d3f38]"
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
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      <main className="pt-16">
        {/* Page Header - Updated with right-aligned actions */}
        <div className="bg-gray-100 p-6 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Products</h1>
              <div className="mt-1 text-sm text-[#405952]">Manage your product catalog</div>
            </div>

            <div className="flex items-center gap-2">
              {selectedProducts.size > 0 && (
                <button
                  type="button"
                  disabled={deletingMany}
                  aria-busy={deletingMany ? 'true' : 'false'}
                  onClick={(e) => { e.stopPropagation(); handleBulkDelete(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingMany ? 'Deleting...' : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Selected ({selectedProducts.size})
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#405952] text-white rounded-lg hover:bg-[#2d3f38] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Product Detail Modal - Positioned below header and made sticky - EXACTLY matching Products.js */}
        {selectedProduct && (
          <div className="sticky top-16 z-30 bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Side - Product Image */}
                <div className="col-span-12 lg:col-span-3">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedProduct.product_name || selectedProduct.name}</h2>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
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
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Center - Product Details */}
                <div className="col-span-12 lg:col-span-6">
                  {/* SKU, Category, Brand */}
                  <div className="mb-3 text-sm text-gray-600 space-y-1">
                    <div>SKU: <span className="text-gray-900 font-medium">{selectedProduct['sku/model'] || selectedProduct.sku}</span></div>
                    <div>Category: <span className="text-gray-900 font-medium">{selectedProduct.category}</span> | Brand: <span className="text-gray-900 font-medium">{selectedProduct.brand}</span></div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold mb-1">Description</h3>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>

                {/* Right Side - Pricing and Actions */}
                <div className="col-span-12 lg:col-span-3">
                  {/* Pricing Breakdown */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="text-sm font-semibold mb-3">Pricing Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">MSRP:</span>
                        <span className="font-semibold">${(selectedProduct.msrp || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount (Professional):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_professional || 0).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount (Expert):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_expert || 0).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount (Master):</span>
                        <span className="font-semibold text-green-600">{(selectedProduct.discount_master || 0).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleEditProduct(selectedProduct)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#405952] text-white rounded text-sm hover:bg-[#2d3f38] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Product
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(selectedProduct._id)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent appearance-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent appearance-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent appearance-none"
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

          {/* Products Table - Updated with responsive columns */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-[#405952] focus:ring-[#405952]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MSRP
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Discounts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => {
                    const isSelected = selectedProduct?._id === product._id;
                    const isChecked = selectedProducts.has(product._id);
                    
                    return (
                      <tr 
                        key={product._id}
                        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={(e) => handleProductClick(product, e)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectProduct(product._id, e)}
                            className="rounded border-gray-300 text-[#405952] focus:ring-[#405952]"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.product_image || product.picture ? (
                                <img 
                                  className="h-10 w-10 rounded-lg object-cover" 
                                  src={product.product_image || product.picture} 
                                  alt={product.product_name || product.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center"
                                style={{ display: (product.product_image || product.picture) ? 'none' : 'flex' }}
                              >
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.product_name || product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(product.description || '').length > 50 
                                  ? `${(product.description || '').substring(0, 50)}...`
                                  : (product.description || '')
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.brand}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {product['sku/model'] || product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(product.msrp || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell text-center">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">P {(product.discount_professional || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">E {(product.discount_expert || 0).toFixed(0)}%</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">M {(product.discount_master || 0).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-[#405952] hover:bg-[#2d3f38] text-white rounded transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product._id);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination - EXACTLY matching Products.js */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
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
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-[#405952] border-[#405952] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
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
const AdminProductFormModal = ({ visible, mode, initialValues, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    product_name: initialValues?.product_name || initialValues?.name || '',
    'sku/model': initialValues?.['sku/model'] || initialValues?.sku || '',
    msrp: initialValues?.msrp || '',
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
    setImagePreview(initialValues?.product_image || initialValues?.picture || null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!formData['sku/model'].trim()) newErrors['sku/model'] = 'SKU/Model is required';
    if (!formData.msrp || isNaN(formData.msrp) || parseFloat(formData.msrp) <= 0) {
      newErrors.msrp = 'Valid MSRP is required';
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
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer bg-[#405952] text-white px-4 py-2 rounded-lg hover:bg-[#2d3f38] transition-colors">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.product_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU/Model *
                </label>
                <input
                  type="text"
                  name="sku/model"
                  value={formData['sku/model']}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors['sku/model'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['sku/model'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['sku/model']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MSRP *
                </label>
                <input
                  type="number"
                  name="msrp"
                  value={formData.msrp}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.msrp ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.msrp && (
                  <p className="text-red-500 text-xs mt-1">{errors.msrp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (Professional) *
                </label>
                <input
                  type="number"
                  name="discount_professional"
                  value={formData.discount_professional}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.discount_professional ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.discount_professional && (
                  <p className="text-red-500 text-xs mt-1">{errors.discount_professional}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (Expert) *
                </label>
                <input
                  type="number"
                  name="discount_expert"
                  value={formData.discount_expert}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.discount_expert ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.discount_expert && (
                  <p className="text-red-500 text-xs mt-1">{errors.discount_expert}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (Master) *
                </label>
                <input
                  type="number"
                  name="discount_master"
                  value={formData.discount_master}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.discount_master ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.discount_master && (
                  <p className="text-red-500 text-xs mt-1">{errors.discount_master}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.brand ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#405952] text-white rounded-lg hover:bg-[#2d3f38] transition-colors"
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