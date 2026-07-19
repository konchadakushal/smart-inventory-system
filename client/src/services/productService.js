import api from './api';

export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const stockInProduct = async (data) => {
  const response = await api.post('/products/stock-in', data);
  return response.data;
};

export const stockOutProduct = async (data) => {
  const response = await api.post('/products/stock-out', data);
  return response.data;
};

export const duplicateProduct = async (productId) => {
  const response = await api.post('/products/duplicate', { productId });
  return response.data;
};

export const searchProducts = async (q) => {
  const response = await api.get('/products/search', { params: { q } });
  return response.data;
};

export const exportProducts = async () => {
  const response = await api.get('/products/export');
  return response.data;
};
