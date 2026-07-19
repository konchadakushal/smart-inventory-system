import api from './api';

export const getWarehouseStock = async (warehouseId) => {
  const response = await api.get(`/stock/warehouse/${warehouseId}`);
  return response.data;
};

export const getProductLocations = async (productId) => {
  const response = await api.get(`/stock/product/${productId}`);
  return response.data;
};

export const getLedgerHistory = async () => {
  const response = await api.get('/stock/history');
  return response.data;
};

export const createMovement = async (data) => {
  const response = await api.post('/stock/move', data);
  return response.data;
};
