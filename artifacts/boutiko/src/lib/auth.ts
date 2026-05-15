export const setAuthToken = (token: string) => {
  localStorage.setItem("boutiko_token", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("boutiko_token") || "";
};

export const removeAuthToken = () => {
  localStorage.removeItem("boutiko_token");
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
