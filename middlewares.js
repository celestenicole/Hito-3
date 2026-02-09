const { verificarToken } = require('./secretKey')

// Middleware: verificar que el usuario está autenticado
const verificarAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' })

  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Formato de token inválido' })

  try {
    const decoded = verificarToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// Middleware: verificar que el usuario es admin
const verificarAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin.' })
  }
  next()
}

// Middleware: log de requests
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
}

// Middleware: manejo de errores
const manejarError = (err, req, res, next) => {
  console.error('Error:', err.message || err)
  const code = err.code && typeof err.code === 'number' ? err.code : 500
  res.status(code).json({ error: err.message || 'Error interno del servidor' })
}

module.exports = { verificarAuth, verificarAdmin, logRequest, manejarError }
