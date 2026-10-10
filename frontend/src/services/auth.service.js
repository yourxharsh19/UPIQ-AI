import api from './api';

export const AuthService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, userName, role = 'USER') => {
    const response = await api.post('/auth/register', { email, password, userName, role });
    return response.data;
  },

  loginWithGoogle: async (googleData) => {
    const response = await api.post('/auth/google', googleData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/v1/users/me');
    return response.data;
  },
};

export default AuthService;

