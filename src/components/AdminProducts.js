import { useState, useMemo } from 'react';
import { Sidebar, Header, AlertTriangle } from 'components';
import { apiCreateProduct, apiUpdateProduct } from 'services';
import MessageCard from './MessageCard';

const AdminProducts = ({ authLoading, currentRole, loading, error, products, searchTerm, categoryFilter, brandFilter, sortBy, currentPage, itemsPerPage, toggleSidebar, setProducts }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [messageCard, setMessageCard] = useState({ show: false, message: '', type: 'success' });

  const showMessageCard = (message, type = 'success') => {
    setMessageCard({ show: true, message, type });
    setTimeout(() => {
      setMessageCard({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleEditProduct = (product) => {
    setShowEditModal(true);
    setEditingProduct(product);
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p._id !== productId));
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const isSelected = selectedProduct?._id === product._id;
      return (
        (product.product_name?.toLowerCase() || product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product['sku/model']?.toLowerCase() || product.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      ) && 
      (!categoryFilter || product.category === categoryFilter) &&
      (!brandFilter || product.brand === brandFilter);
    });
    
    // Sort the filtered products
    return filtered.sort((a, b) => {
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
      
      {/* Message Card */}
      {messageCard.show && (
        <MessageCard
          message={messageCard.message}
          type={messageCard.type}
          onClose={() => setMessageCard({ show: false, message: '', type: 'success' })}
          autoCloseTime={3000}
          showIcon={true}
        />
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center p-4 mb-4 max-w-xs text-gray-500 bg-white rounded-lg shadow-lg border-l-4 ${
          toast.type === 'success' ? 'border-green-500' : 'border-red-500'
        } transition-all duration-300 transform translate-x-0 animate-fade-in-right`}>
          <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
            toast.type === 'success' ? 'text-green-500 bg-green-100' : 'text-red-500 bg-red-100'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </div>
          <div className="ml-3 text-sm font-normal">{toast.message}</div>
          <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 inline-flex h-8 w-8"
            onClick={() => setToast(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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
                      <p className="text-sm text-[#818181] leading-relaxed line-clamp-3">{selectedProduct.description}</p>
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
                                {(product.description || '').substring(0, 60)}...
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
                        <div className="text-xs text-[#818181] truncate">{product.description || ''}</div>
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
              // Show styled message card instead of basic alert
              const messageElement = document.createElement('div');
              messageElement.className = 'fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border-l-4 border-green-500 p-4 w-96 animate-fade-in';
              messageElement.innerHTML = `
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 bg-green-100 rounded-full p-2">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">Product created successfully</p>
                    </div>
                  </div>
                  <button type="button" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              `;
              document.body.appendChild(messageElement);
              
              // Add click event to close button
              const closeButton = messageElement.querySelector('button');
              closeButton.addEventListener('click', () => {
                document.body.removeChild(messageElement);
              });
              
              // Auto-remove after 3 seconds
              setTimeout(() => {
                if (document.body.contains(messageElement)) {
                  document.body.removeChild(messageElement);
                }
              }, 3000);
            } catch (err) {
              console.error('Create error:', err);
              showMessageCard('Failed to create product: ' + err.message, 'error');
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
              
              // Show styled message card instead of basic alert
              const messageElement = document.createElement('div');
              messageElement.className = 'fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border-l-4 border-blue-500 p-4 w-96 animate-fade-in';
              messageElement.innerHTML = `
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">Product updated successfully</p>
                    </div>
                  </div>
                  <button type="button" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              `;
              document.body.appendChild(messageElement);
              
              // Add click event to close button
              const closeButton = messageElement.querySelector('button');
              closeButton.addEventListener('click', () => {
                document.body.removeChild(messageElement);
              });
              
              // Auto-remove after 3 seconds
              setTimeout(() => {
                if (document.body.contains(messageElement)) {
                  document.body.removeChild(messageElement);
                }
              }, 3000);
            } catch (err) {
              console.error('Update error:', err);
              showMessageCard('Failed to update product: ' + err.message, 'error');
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
    category: initialValues?.category || '',
    product_datasheet: initialValues?.product_datasheet || ''
  });

  const [files, setFiles] = useState({
    picture: null,
    datasheet: null
  });
  const [imagePreview, setImagePreview] = useState(
    initialValues?.product_image || initialValues?.picture || null
  );
  const [datasheetName, setDatasheetName] = useState(
    initialValues?.product_datasheet ? initialValues.product_datasheet.split('/').pop() : null
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
  
  const handleDatasheetUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Store the file for form submission
      setFiles(prev => ({ ...prev, datasheet: file }));
      setDatasheetName(file.name);
      
      // Clear any existing product_datasheet value since we're uploading a new file
      setFormData(prev => ({ ...prev, product_datasheet: '' }));
    }
  };
  
  const removeDatasheet = () => {
    setFiles(prev => ({ ...prev, datasheet: null }));
    setDatasheetName(null);
    // Clear the product_datasheet value from formData
    setFormData(prev => ({ ...prev, product_datasheet: '' }));
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"][accept="application/pdf"]');
    if (fileInput) {
      fileInput.value = '';
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

{/* Datasheet Upload */}
<div>
  <label className="block text-sm font-medium text-[#1B2150] mb-2">
    Product Datasheet (PDF)
  </label>
  <div className="border-2 border-dashed border-[#FAFAFB] rounded-lg p-6 text-center bg-white shadow-sm">
    {datasheetName ? (
      <div className="relative flex items-center justify-center">
        <div className="flex items-center bg-gray-100 px-4 py-3 rounded-lg">
          <FileText className="h-6 w-6 text-[#1B2150] mr-2" />
          <span className="text-sm font-medium text-[#1B2150] truncate max-w-xs">{datasheetName}</span>
        </div>
        <button
          type="button"
          onClick={removeDatasheet}
          className="ml-2 bg-[#EB664D] text-white rounded-full p-1 hover:bg-[#EB664D]/80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div>
        <FileText className="mx-auto h-12 w-12 text-[#818181]" />
        <div className="mt-4">
          <label className="cursor-pointer bg-[#1B2150] text-white px-4 py-2 rounded-lg hover:bg-[#EB664D] transition-colors">
            Upload Datasheet
            <input
              type="file"
              accept="application/pdf"
              onChange={handleDatasheetUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-[#818181] mt-2">
          PDF files only, up to 10MB
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
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors.product_name ? 'border-[#EB664D]' : 'border-[#FAFAFB] bg-white shadow-sm'
                  } placeholder-gray-400`}
                  placeholder="Enter product name"
                />
                {errors.product_name && (
                  <p className="text-[#EB664D] text-xs mt-1">
                    {errors.product_name}
                  </p>
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
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B2150] focus:border-transparent ${
                    errors['sku/model'] ? 'border-[#EB664D]' : 'border-[#FAFAFB] bg-white shadow-sm'
                  } placeholder-gray-400`}
                  placeholder="Enter SKU/Model"
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
                    errors.msrp ? 'border-[#EB664D]' : 'border-[#FAFAFB] bg-white shadow-sm'
                  } placeholder-gray-400`}
                  placeholder="Enter MSRP"
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
                    errors.true_cost ? 'border-[#EB664D]' : 'border-[#FAFAFB] bg-white shadow-sm'
                  } placeholder-gray-400`}
                  placeholder="Enter true cost"
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
                    errors.discount_professional ? 'border-[#EB664D]' : 'border-[#FAFAFB] bg-white shadow-sm'
                  } placeholder-gray-400`}
                  placeholder="Enter discount percentage"
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