const SAFE_MESSAGES = new Map([
  [400, 'The request could not be processed. Check the submitted information.'],
  [401, 'Authentication failed. Check your credentials and try again.'],
  [403, 'You do not have permission to perform this action.'],
  [404, 'The requested item was not found.'],
  [429, 'Too many attempts. Please wait and try again.'],
]);

export const normalizeApiError = (error) => {
  const status = Number.isInteger(error?.response?.status) ? error.response.status : null;
  const url = typeof error?.config?.url === 'string' ? error.config.url : '';
  const authMessage = url.includes('/auth/login')
    ? 'Invalid email or password.'
    : url.includes('/auth/register')
      ? 'Registration could not be completed. Please try again.'
      : 'Your session has expired. Please sign in again.';
  return {
    status,
    code: typeof error?.code === 'string' ? error.code : null,
    message: status === 401 ? authMessage : SAFE_MESSAGES.get(status)
      || (status && status >= 500 ? 'The service is temporarily unavailable.' : 'An unexpected error occurred.'),
  };
};
