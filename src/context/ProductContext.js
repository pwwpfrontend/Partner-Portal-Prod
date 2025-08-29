import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock products data - replace with actual API call
  const mockProducts = [
    {
      id: 'PROD-001',
      name: 'Cisco Router 2900',
      description: 'Enterprise-grade router with advanced security features',
      msrp: 2500.00,
      category: 'Networking',
      brand: 'Cisco',
      sku: 'CIS-2900-ENT',
      features: ['Advanced Security', 'High Performance', 'Scalable', '24/7 Support'],
      image: '/placeholder-product.jpg'
    },
    {
      id: 'PROD-002',
      name: 'HP ProLiant Server',
      description: 'High-performance server for enterprise applications',
      msrp: 4500.00,
      category: 'Servers',
      brand: 'HP',
      sku: 'HP-PL-ENT-01',
      features: ['Enterprise Grade', 'High Availability', 'Redundant Power', 'Management Tools'],
      image: '/placeholder-product.jpg'
    },
    {
      id: 'PROD-003',
      name: 'Dell OptiPlex Desktop',
      description: 'Business desktop computer with latest specifications',
      msrp: 1200.00,
      category: 'Desktops',
      brand: 'Dell',
      sku: 'DELL-OPT-7040',
      features: ['Latest Intel Processor', 'SSD Storage', 'Windows 11 Pro', '3-Year Warranty'],
      image: '/placeholder-product.jpg'
    },
    {
      id: 'PROD-004',
      name: 'Microsoft Office 365',
      description: 'Cloud-based productivity suite for businesses',
      msrp: 15.00,
      category: 'Software',
      brand: 'Microsoft',
      sku: 'MS-O365-BUS',
      features: ['Word, Excel, PowerPoint', 'Cloud Storage', 'Email Hosting', 'Collaboration Tools'],
      image: '/placeholder-product.jpg'
    },
    {
      id: 'PROD-005',
      name: 'Samsung Monitor 27"',
      description: 'Professional monitor with 4K resolution',
      msrp: 350.00,
      category: 'Monitors',
      brand: 'Samsung',
      sku: 'SAM-MON-27-4K',
      features: ['4K Resolution', 'HDR Support', 'USB-C Connectivity', 'Ergonomic Stand'],
      image: '/placeholder-product.jpg'
    },
    {
      id: 'PROD-006',
      name: 'Apple MacBook Pro',
      description: 'Professional laptop for creative and development work',
      msrp: 2499.00,
      category: 'Laptops',
      brand: 'Apple',
      sku: 'APP-MBP-14-2023',
      features: ['M2 Pro Chip', '14-inch Retina Display', '16GB RAM', '512GB SSD'],
      image: '/placeholder-product.jpg'
    }
  ];

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, []);

  const addProduct = (productData) => {
    const newProduct = {
      id: `PROD-${Date.now()}`,
      ...productData
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (productId, productData) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...productData } : p
    ));
  };

  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const value = {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};


