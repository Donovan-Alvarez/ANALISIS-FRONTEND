export const environment = {
  production: false,
  // Vacío a propósito: las peticiones son relativas (/auth, /api/...) y
  // el dev-server las reenvía a http://localhost:8080 vía proxy.conf.json,
  // evitando problemas de CORS en desarrollo.
  apiUrl: ''
};