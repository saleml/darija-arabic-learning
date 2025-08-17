// Simple logger that can be disabled in production
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (..._args: any[]) => {
    if (isDevelopment) {

    }
  },
  error: (..._args: any[]) => {
    // Always log errors

  },
  warn: (..._args: any[]) => {
    if (isDevelopment) {

    }
  },
  info: (..._args: any[]) => {
    if (isDevelopment) {

    }
  }
};