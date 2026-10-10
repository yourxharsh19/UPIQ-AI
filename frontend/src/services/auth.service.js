import api from './api.js';

export const AuthService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, userName, role = 'USER') => {
    const response = await api.post('/auth/register', { email, password, userName, role });
    return response.data;
  },

  loginWithGoogle: async () => {
    // Google OAuth is not implemented on the backend; disabled to prevent unverified auth attempts
    throw new Error('Google OAuth login is not supported by the backend.');
  },

  getMe: async () => {
    const response = await api.get('/v1/users/me');
    return response.data;
  },
};

export default AuthService;
