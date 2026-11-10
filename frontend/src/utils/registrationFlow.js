import { normalizeApiError } from '../services/safeApiError.js';

const registrationErrorMessage = (error) => normalizeApiError(error).message;

export const resolveAuthView = (currentView, isAuthenticated) => {
  if (currentView === 'home') return 'home';
  if (currentView === 'register') return 'register';
  if (currentView === 'login' || !isAuthenticated) return 'login';
  return 'app';
};

export const navigateToRegistration = (setCurrentView) => setCurrentView('register');

export const submitRegistration = async ({ authService, form, navigateToLogin }) => {
  const name = form.name.trim();
  const email = form.email.trim();
  if (!name || !email || !form.password) {
    return { success: false, error: 'Enter your name, email address, and password.' };
  }
  if (name.length < 3 || name.length > 50) {
    return { success: false, error: 'Name must be between 3 and 50 characters.' };
  }
  if (form.password.length < 12 || new TextEncoder().encode(form.password).length > 72) {
    return { success: false, error: 'Password must be at least 12 characters and no more than 72 UTF-8 bytes.' };
  }

  try {
    const response = await authService.register(email, form.password, name);
    if (response?.success !== true) {
      return { success: false, error: 'Registration could not be completed. Please try again.' };
    }
    navigateToLogin();
    return { success: true };
  } catch (error) {
    return { success: false, error: registrationErrorMessage(error) };
  }
};
