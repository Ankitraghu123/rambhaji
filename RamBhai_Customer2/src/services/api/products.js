import apiClient from './client';

export const productsApi = {
  getAllProducts: async (category = null, status = null) => {
    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  // Legacy method — /products/fixed-veggies is not in the current spec.
  // Kept for backward compatibility; may need to be replaced with
  // getAllProducts({ category: 'vegetables', sub_category: 'fixed' }) or similar.
  getFixedVeggies: async () => {
    const response = await apiClient.get('/products/fixed-veggies');
    return response.data;
  }
};

