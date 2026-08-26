/**
 * Dynamic URL helper for local development and Vercel/production deployments.
 * Prevents production deployments on Vercel from hard-redirecting to localhost:5173 or localhost:3000.
 */

export const getFlowCanvasUrl = () => {
  if (process.env.NEXT_PUBLIC_FLOW_CANVAS_URL) {
    return process.env.NEXT_PUBLIC_FLOW_CANVAS_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/forms';
  }
  return 'http://localhost:5173';
};

export const getDashboardUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/';
  }
  return 'http://localhost:3000';
};
