import api from './api';

export const getWarehouses = async () => {
  const response = await api.get('/warehouses');
  return response.data;
};

export const getWarehouseById = async (id) => {
  const response = await api.get(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (data) => {
  const response = await api.post('/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (id, data) => {
  const response = await api.put(`/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id) => {
  const response = await api.delete(`/warehouses/${id}`);
  return response.data;
};
