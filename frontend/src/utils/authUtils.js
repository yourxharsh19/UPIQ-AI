import { clearAuthSession, isWellFormedJwt } from './authFlow.js';

export const getInitialAuthState = () => {
  try {
    const isAuthStored = localStorage.getItem('upiq_auth');
    const isDemoStored = localStorage.getItem('upiq_demo');
    const token = localStorage.getItem('token');
    const profile = localStorage.getItem('upiq_profile');

    // Explicit demo sessions do not require a backend JWT.
    if (isDemoStored === 'true' || isAuthStored === '"demo"' || isAuthStored === 'demo') {
      return true;
    }

    // This checks JWT structure only. The backend remains authoritative for authenticity.
    if (isAuthStored && isAuthStored !== 'false' && isWellFormedJwt(token)) {
      return true;
    }

    if (isAuthStored || isDemoStored || token !== null || profile !== null) {
      clearAuthSession(localStorage, { clearProfile: true });
    }
    return false;
  } catch {
    return false;
  }
};