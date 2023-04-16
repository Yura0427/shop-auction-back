import axios, { AxiosRequestConfig } from 'axios';

export const axiosInstance = (token = '') => {
  const instance = axios.create();

  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },
    (error) => {
      return error.data.message;
    },
  );

  return instance;
};
