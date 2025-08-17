// Simple logger that can be disabled in production
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {

    }
  },
  error: (...args: any[]) => {
    // Always log errors

  },
  warn: (...args: any[]) => {
    if (isDevelopment) {

    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {

    }
  }
};