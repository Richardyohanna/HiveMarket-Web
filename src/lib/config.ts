// Centralized API base URL. Override at build time with VITE_API_BASE_URL.
export const API_BASE_URL: string = "http://172.20.10.8:8080";
  //(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
 // 'https://api.hivemarket.ng';

// Optional display-only hint for which email is expected to be the seeded admin.
// This has NO security meaning - the backend is the sole source of truth for admin access.
export const ADMIN_HINT_EMAIL: string | undefined = import.meta.env.VITE_ADMIN_EMAIL as
  | string
  | undefined;
