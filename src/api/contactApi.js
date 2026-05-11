import api from './axiosInstance';

export const contactApi = {
  submitContact: (payload) =>
    api.post('/contacts', payload),
};
