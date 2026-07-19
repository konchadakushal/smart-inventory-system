import api from './api';

export const getOverview = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};
