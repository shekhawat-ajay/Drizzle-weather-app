import axios from "axios";

const apiClient = axios.create({
  timeout: 10_000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return Promise.reject(new Error("Request timed out. Please check your connection and retry."));
      }
      const status = error.response?.status;
      if (status === 429) {
        return Promise.reject(new Error("Too many requests — please wait a moment and retry."));
      }
      if (status && status >= 500) {
        return Promise.reject(new Error("Server error — please retry in a few seconds."));
      }
      const msg = (error.response?.data as { reason?: string })?.reason || error.message;
      return Promise.reject(new Error(msg || "Network error"));
    }
    return Promise.reject(error);
  },
);

export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data;
};
