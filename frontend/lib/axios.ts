import axios from "axios";

/**
 * Pre-configured Axios instance. Base URL comes from the environment so the
 * same build works against local and containerized backends.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});
