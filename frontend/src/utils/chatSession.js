const INITIAL_CHAT_MESSAGES = Object.freeze([
  Object.freeze({
    id: 'm1',
    sender: 'ai',
    text: 'Hello! I am your UPIQ Finance Assistant. I can answer questions on supported financial ledger intents: income, expenses, category spending, monthly summaries, period comparisons, spending trends, net balance, and largest transactions. AI-generated answers require the backend server and Ollama to be running.',
    timestamp: 'Just now',
  }),
]);

export const getChatSessionKey = (profile, mode = 'authenticated') => {
  if (!profile || typeof profile !== 'object') return null;
  if (profile.id != null) return `${mode}:user:${profile.id}`;
  if (typeof profile.email === 'string' && profile.email.trim()) return `${mode}:email:${profile.email.trim().toLowerCase()}`;
  return null;
};

export const getChatMessages = (conversations, sessionKey) => {
  const messages = sessionKey ? conversations?.[sessionKey] : null;
  return Array.isArray(messages) ? messages : [...INITIAL_CHAT_MESSAGES];
};

export const appendChatMessage = (conversations, sessionKey, activeSessionKey, message) => {
  if (!sessionKey || sessionKey !== activeSessionKey || !message || typeof message !== 'object') {
    return conversations;
  }
  const current = Array.isArray(conversations?.[sessionKey])
    ? conversations[sessionKey]
    : [...INITIAL_CHAT_MESSAGES];
  return { ...conversations, [sessionKey]: [...current, message] };
};

export const clearChatMessages = (conversations, sessionKey = null) => {
  if (!sessionKey) return {};
  const next = { ...conversations };
  delete next[sessionKey];
  return next;
};
