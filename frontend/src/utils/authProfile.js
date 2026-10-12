export const mapAuthenticatedProfile = (account, baseProfile = {}) => {
  const email = account?.email || baseProfile.email || '';
  const candidates = [account?.fullName, account?.username];
  const name = candidates
    .map((candidate) => typeof candidate === 'string' ? candidate.trim() : '')
    .find((candidate) => candidate && candidate.toLowerCase() !== email.toLowerCase())
    || 'User Account';

  return {
    ...baseProfile,
    name,
    email,
    role: account?.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
  };
};
