export const waitForGooglePopupHandoff = ({ windowObject, authorizationUrl, expectedOrigin, timeoutMs = 300000 }) => new Promise((resolve, reject) => {
  const popup = windowObject.open(authorizationUrl, 'upiq-google-sign-in', 'popup,width=520,height=680');
  if (!popup) {
    reject(new Error('Your browser blocked the sign-in popup. Allow popups and try again.'));
    return;
  }

  let settled = false;
  let pollId;
  let timeoutId;
  const finish = (error, value) => {
    if (settled) return;
    settled = true;
    windowObject.removeEventListener('message', onMessage);
    windowObject.clearInterval(pollId);
    windowObject.clearTimeout(timeoutId);
    if (!popup.closed) popup.close();
    if (error) reject(error);
    else resolve(value);
  };
  const onMessage = (event) => {
    if (event.origin !== expectedOrigin || event.source !== popup || typeof event.data?.type !== 'string') return;
    if (event.data.type === 'UPIQ_GOOGLE_AUTH_SUCCESS' && typeof event.data.value === 'string') {
      finish(null, event.data.value);
    } else if (event.data.type === 'UPIQ_GOOGLE_AUTH_FAILURE') {
      finish(new Error('Google sign-in could not be completed. Try again or use email and password.'));
    }
  };

  windowObject.addEventListener('message', onMessage);
  pollId = windowObject.setInterval(() => {
    if (popup.closed) finish(new Error('Google sign-in was cancelled.'));
  }, 500);
  timeoutId = windowObject.setTimeout(() => finish(new Error('Google sign-in timed out. Please try again.')), timeoutMs);
});
