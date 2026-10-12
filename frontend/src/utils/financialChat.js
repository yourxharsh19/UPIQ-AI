export const requestFinancialChatAnswer = async (ask, question) => {
  try {
    const response = await ask(question);
    const result = response?.data;
    if (response?.success !== true || result?.error) {
      const backendError = response?.success === true && result?.error === true
        && typeof result?.answer === 'string' ? result.answer.trim() : '';
      return {
        success: false,
        error: backendError || 'The assistant could not complete this request. Please retry.',
      };
    }
    const answer = result?.answer;
    if (typeof answer !== 'string' || !answer.trim()) {
      return { success: false, error: 'I could not retrieve a verified answer. Please try again.' };
    }
    return { success: true, answer };
  } catch (error) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { success: false, error: 'Your session is no longer authorized. Please sign in again.' };
    }
    if (error?.code === 'ECONNABORTED' || error?.name === 'TimeoutError') {
      return { success: false, error: 'The assistant request timed out. Please try again.' };
    }
    const status = error?.response?.status;
    if (status >= 500) {
      return { success: false, error: 'The assistant service is temporarily unavailable. Please retry.' };
    }
    if (status) {
      return { success: false, error: `The assistant request failed (HTTP ${status}). Please retry.` };
    }
    return { success: false, error: 'Could not reach the assistant service. Check the connection and retry.' };
  }
};

