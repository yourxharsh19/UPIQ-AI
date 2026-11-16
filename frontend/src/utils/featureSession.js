export const getFeatureSessionKey = (profile, mode) => {
  const identity = profile?.id != null
    ? `user:${profile.id}`
    : typeof profile?.email === 'string' && profile.email.trim()
      ? `email:${profile.email.trim().toLowerCase()}`
      : 'no-profile';
  return `${mode}:${identity}:${profile?.role ?? ''}`;
};

export const isCurrentFeatureRequest = (request, currentRequest) => Boolean(request
  && currentRequest
  && request.id === currentRequest.id
  && request.sessionKey === currentRequest.sessionKey);

export const getUndismissedNotifications = (notifications, dismissedIds) => {
  if (!Array.isArray(notifications)) return [];
  const dismissed = new Set(Array.isArray(dismissedIds) ? dismissedIds : []);
  return notifications.filter((notification) => notification?.id && !dismissed.has(notification.id));
};
