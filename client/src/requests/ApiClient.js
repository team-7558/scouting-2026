// ApiClient.js
import axios from "axios";
import { hasValidToken } from "../TokenUtils.js";

class ApiClient {
  constructor(baseURL) {
    this.instance = axios.create({
      baseURL,
      timeout: 120000,
    });

    // Add a request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (!hasValidToken()) {
          console.log("no valid token");
          // URL encode the current location
          const currentLocation = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          // Redirect to /signIn with the redirect parameter
          window.location.href = `/signIn?redirect=${currentLocation}`;
          return Promise.reject(new Error("Invalid token"));
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED') {
          alert('Backend waking up (~30-90s). Try again soon');
          return Promise.reject(new Error('Backend waking up... please wait or retry'));
        }
        return Promise.reject(error);  // Other errors pass through
      }
    )
  }

  get(url, config) {
    return this.instance.get(url, config);
  }

  post(url, data, config) {
    return this.instance.post(url, data, config);
  }

  put(url, data, config) {
    return this.instance.put(url, data, config);
  }

  delete(url, config) {
    return this.instance.delete(url, config);
  }
}

export default ApiClient;
