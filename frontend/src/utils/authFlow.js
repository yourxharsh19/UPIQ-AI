const INVALID_TOKEN_ERROR = 'Authentication failed: Server did not return a valid access token.';

const decodeJwtJsonSegment = (segment) => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
};

const isBase64UrlSegment = (segment) => {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    atob(padded);
    return true;
  } catch {
    return false;
  }
};

export const isWellFormedJwt = (token) => {
  if (typeof token !== 'string' || token.trim() !== token) return false;

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part || !/^[A-Za-z0-9_-]+$/.test(part)
      || !isBase64UrlSegment(part))) {
    return false;
  }

  try {
    const header = decodeJwtJsonSegment(parts[0]);
    const payload = decodeJwtJsonSegment(parts[1]);
    return Boolean(header && typeof header === 'object' && !Array.isArray(header)
      && typeof header.alg === 'string' && header.alg.toLowerCase() !== 'none'
      && payload && typeof payload === 'object' && !Array.isArray(payload));
  } catch {
    return false;
  }
};

export const clearAuthSession = (storage, { clearProfile = false } = {}) => {
  const keys = ['token', 'upiq_auth', 'upiq_demo'];
  if (clearProfile) keys.push('upiq_profile');

  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      // Continue attempting to clear other keys when storage is restricted.
    }
  }
};

export const applySessionExpiration = ({
  storage,
  handledRef,
  setIsAuthenticated,
  setCurrentView,
  setProfile,
  initialProfile,
  addToast,
}) => {
  if (handledRef.current) return false;

  handledRef.current = true;
  clearAuthSession(storage, { clearProfile: true });
  setProfile(initialProfile);
  setIsAuthenticated(false);
  setCurrentView('login');
  addToast('Session Expired', 'Your session has expired. Please log in again.', 'warning');
  return true;
};

export const authenticateWithBackend = async ({
  authService,
  email,
  password,
  profile,
  currency,
  storage,
}) => {
  try {
    const response = await authService.login(email, password || '');
    const token = response?.data?.token;

    if (response?.success !== true || !isWellFormedJwt(token)) {
      return { success: false, error: INVALID_TOKEN_ERROR };
    }

    try {
      storage.setItem('token', token);
      storage.setItem('upiq_auth', JSON.stringify(true));
      storage.removeItem('upiq_demo');
      storage.setItem('upiq_profile', JSON.stringify(profile));
      storage.setItem('upiq_currency', JSON.stringify(currency));
    } catch {
      clearAuthSession(storage);
      return { success: false, error: 'Failed to persist authentication token.' };
    }

    return { success: true, mode: 'backend' };
  } catch (err) {
    const error = err?.userFriendlyMessage
      || err?.response?.data?.message
      || err?.message
      || 'Invalid email or password.';
    return { success: false, error };
  }
};

export const activateDemoSession = ({ storage, profile, currency }) => {
  try {
    storage.removeItem('token');
    storage.removeItem('upiq_auth');
    storage.setItem('upiq_demo', 'true');
    storage.setItem('upiq_auth', JSON.stringify('demo'));
    storage.setItem('upiq_profile', JSON.stringify(profile));
    storage.setItem('upiq_currency', JSON.stringify(currency));
    return { success: true, mode: 'demo' };
  } catch {
    clearAuthSession(storage);
    return { success: false, error: 'Storage failure while activating demo mode.' };
  }
};
