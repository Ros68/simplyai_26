// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// Debug logging
console.log(
  "API Config - VITE_API_BASE_URL:",
  import.meta.env.VITE_API_BASE_URL
);
console.log("API Config - Final API_BASE_URL:", API_BASE_URL);
