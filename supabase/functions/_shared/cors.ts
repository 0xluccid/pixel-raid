// CORS helper — lock to allowed origins
const ALLOWED_ORIGINS = [
  'https://0xluccid.github.io',
  'https://pixel.brebross.xyz',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }
}

export { ALLOWED_ORIGINS, getCorsHeaders }
