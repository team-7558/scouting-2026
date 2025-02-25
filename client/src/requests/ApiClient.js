// ApiClient.js
import axios from "axios";
import { hasValidToken } from "../ProtectedRoute.js";

class ApiClient {
  constructor(baseURL) {
    this.instance = axios.create({
      baseURL,
    });

    // Add a request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        console.log("interceptor");
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
