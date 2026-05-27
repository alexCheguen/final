// Variables de entorno para tests
process.env.JWT_SECRET = 'test_jwt_secret_parqueo_uspg';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_parqueo_uspg';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';

// Mock global de NextResponse para entorno node
if (typeof globalThis.Response === 'undefined') {
  const { Response, Request, Headers } = require('node-fetch');
  globalThis.Response = Response;
  globalThis.Request = Request;
  globalThis.Headers = Headers;
}
