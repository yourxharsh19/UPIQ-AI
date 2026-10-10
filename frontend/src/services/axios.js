// Unified API client export: delegates to the canonical api.js instance
// to ensure a single shared Axios instance and avoid duplicate interceptors.
import api from './api.js';

export default api;
