import { clearAuthSession, isWellFormedJwt, isJwtExpired } from './authFlow.js';

export const getInitialAuthState = (storage = globalThis.localStorage) => {
  try {
    const isAuthStored = storage?.getItem('upiq_auth');
    const isDemoStored = storage?.getItem('upiq_demo');
    const token = storage?.getItem('token');
    const profile = storage?.getItem('upiq_profile');

    // Explicit demo sessions do not require a backend JWT.
    if (isDemoStored === 'true' || isAuthStored === '"demo"' || isAuthStored === 'demo') {
      return true;
    }

    // Checks JWT structure and expiration. The backend remains authoritative for authenticity.
    if (isAuthStored && isAuthStored !== 'false' && isWellFormedJwt(token) && !isJwtExpired(token)) {
      return true;
    }

    if (isAuthStored || isDemoStored || token !== null || profile !== null) {
      clearAuthSession(storage, { clearProfile: true });
    }
    return false;
  } catch {
    return false;
  }
};