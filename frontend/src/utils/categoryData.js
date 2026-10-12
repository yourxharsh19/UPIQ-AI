export const categoryListFromResponse = (response) =>
  Array.isArray(response?.data) ? response.data : [];
