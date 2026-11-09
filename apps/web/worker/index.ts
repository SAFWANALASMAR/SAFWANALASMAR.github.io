// Forwards /api/* to the API Worker over a service binding (same origin, no CORS, API not public).
// Everything else is served from static assets.
interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  API: Fetcher;
  ASSETS: Fetcher;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    return pathname.startsWith('/api/') ? env.API.fetch(request) : env.ASSETS.fetch(request);
  },
};
