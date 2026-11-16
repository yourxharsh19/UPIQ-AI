const countIsValid = (value) => Number.isSafeInteger(value) && value >= 0;
const totalIsValid = (value) => typeof value === 'string' && /^\d+(?:\.\d{1,2})?$/.test(value);

export function normalizeAdminSummary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !countIsValid(value.userCount) || !countIsValid(value.activeUserCount)
    || !countIsValid(value.transactionCount) || !totalIsValid(value.recordedIncome)
    || !totalIsValid(value.recordedExpenses) || Object.hasOwn(value, 'transactions')) return null;
  return {
    userCount: value.userCount,
    activeUserCount: value.activeUserCount,
    transactionCount: value.transactionCount,
    recordedIncome: value.recordedIncome,
    recordedExpenses: value.recordedExpenses,
  };
}

export function normalizeAdminUsers(value) {
  if (!Array.isArray(value)) return null;
  const users = value.map((user) => {
    if (!user || typeof user !== 'object' || Array.isArray(user)
      || user.id == null || !['ADMIN', 'USER'].includes(user.role)
      || typeof user.active !== 'boolean' || typeof user.email !== 'string'
      || typeof user.username !== 'string'
      || Object.hasOwn(user, 'password')) return null;
    return {
      id: String(user.id),
      email: user.email,
      username: user.username,
      fullName: typeof user.fullName === 'string' ? user.fullName : '',
      role: user.role,
      active: user.active,
      createdAt: typeof user.createdAt === 'string' ? user.createdAt : null,
      lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : null,
    };
  });
  return users.some((user) => user == null) ? null : users;
}
