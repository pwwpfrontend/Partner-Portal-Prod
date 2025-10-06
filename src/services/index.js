import { api } from './auth';

// Create a new product with optional files
export const apiCreateProduct = async (productData, files = {}) => {
  try {
    const formData = new FormData();
    
    // Add all product data fields to formData
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    // Add files if they exist
    if (files.picture) {
      formData.append('product_image', files.picture);
    }
    
    // Add datasheet if it exists
    if (files.datasheet) {
      formData.append('product_datasheet', files.datasheet);
    }
    
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update an existing product with optional files
export const apiUpdateProduct = async (productId, productData, files = {}) => {
  try {
    const formData = new FormData();
    
    // Add all product data fields to formData
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    // Add files if they exist
    if (files.picture) {
      formData.append('product_image', files.picture);
    }
    
    // Add datasheet if it exists
    if (files.datasheet) {
      formData.append('product_datasheet', files.datasheet);
    }
    
    const response = await api.put(`/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};