require('dotenv').config()
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'v1aj3_c0n3x10n_s3cr3t_k3y_2025'

const generarToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

const verificarToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = { JWT_SECRET, generarToken, verificarToken }
