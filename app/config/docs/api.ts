export interface ApiDoc {
  method: 'GET' | 'POST'
  path: string
  authType: 'none' | 'api-key'
  description: string
  requestBody?: string
  responseShape: string
  exampleCurl: string
}

/**
 * Only endpoints reachable without a staff login: no-auth (used by the login flow
 * itself) and x-api-key (used by external consumer apps like Backbone/Ticketing).
 * Internal admin/RBAC endpoints (require a user JWT + permission) are intentionally
 * out of scope here — see server/api/v1/admin/** source directly for those.
 */
export const apiDocs: ApiDoc[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    authType: 'none',
    description: 'Authenticates with email + password. Returns a short-lived access token and a refresh token.',
    requestBody: `{ email: string, password: string }`,
    responseShape: `{ data: { accessToken: string, refreshToken: string, user: { id, email, role } } }`,
    exampleCurl: `curl -X POST https://<host>/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@gii.local","password":"..."}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/refresh',
    authType: 'none',
    description: 'Exchanges a still-valid refresh token for a new access token (access tokens are short-lived; call this when one expires).',
    requestBody: `{ refreshToken: string }`,
    responseShape: `{ data: { accessToken: string } }`,
    exampleCurl: `curl -X POST https://<host>/api/v1/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"..."}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/logout',
    authType: 'none',
    description: 'Revokes a refresh token (idempotent — succeeds even if the token is already invalid/expired).',
    requestBody: `{ refreshToken: string }`,
    responseShape: `{ data: { loggedOut: true } }`,
    exampleCurl: `curl -X POST https://<host>/api/v1/auth/logout \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"..."}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/activate',
    authType: 'none',
    description: 'Sets a new employee\'s password using the one-time activation token from their invite link (sent out-of-band, e.g. by HR).',
    requestBody: `{ token: string, password: string }`,
    responseShape: `{ data: { activated: true } }`,
    exampleCurl: `curl -X POST https://<host>/api/v1/auth/activate \\
  -H "Content-Type: application/json" \\
  -d '{"token":"<raw-activation-token>","password":"newpassword123"}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/verify',
    authType: 'api-key',
    description: 'Server-to-server: lets a consumer app (Backbone, Ticketing) verify whether a Baseque-issued access token is still valid, and read its payload. Consumers should cache a positive result for ~the token\'s TTL rather than calling this per request.',
    requestBody: `{ accessToken: string }`,
    responseShape: `{ data: { valid: true, user: { sub, email, role } } } | { data: { valid: false } }`,
    exampleCurl: `curl -X POST https://<host>/api/v1/auth/verify \\
  -H "x-api-key: <consumer-app-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"accessToken":"<token-to-check>"}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/employees/[id]',
    authType: 'api-key',
    description: 'Server-to-server: looks up a single employee record by id — e.g. Backbone resolving a Backbone user to their HRIS employee record.',
    responseShape: `{ data: Employee } (404 if not found)`,
    exampleCurl: `curl https://<host>/api/v1/employees/<employee-id> \\
  -H "x-api-key: <consumer-app-api-key>"`,
  },
]
