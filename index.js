const express = require('express')
const cors = require('cors')
require('dotenv').config()

const {
  registrarUsuario, loginUsuario, obtenerUsuario,
  obtenerPublicaciones, obtenerPublicacion, crearPublicacion, actualizarPublicacion, eliminarPublicacion,
  obtenerFavoritos, agregarFavorito, eliminarFavorito,
  obtenerCarrito, agregarAlCarrito, actualizarItemCarrito, vaciarCarrito,
  confirmarCompra, obtenerOrdenes, obtenerTodasOrdenes, cancelarOrden
} = require('./consultas')

const { generarToken } = require('./secretKey')
const { verificarAuth, verificarAdmin, logRequest, manejarError } = require('./middlewares')

const app = express()

// ===== MIDDLEWARES GLOBALES =====
app.use(cors())
app.use(express.json())
app.use(logRequest)

// ===== RUTA RAÍZ =====
app.get('/', (req, res) => {
  res.json({ message: 'API Viaje Conexión funcionando 🚀', version: '1.0.0' })
})

// ===== RUTAS AUTH =====
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { nombre, email, password, avatar_url } = req.body
    if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y password son requeridos' })
    const user = await registrarUsuario(nombre, email, password, avatar_url)
    const token = generarToken(user)
    res.status(201).json({ user, token })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' })
    next(err)
  }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y password son requeridos' })
    const user = await loginUsuario(email, password)
    const token = generarToken(user)
    res.json({ user, token })
  } catch (err) {
    next(err)
  }
})

// ===== RUTA PERFIL =====
app.get('/api/auth/me', verificarAuth, async (req, res, next) => {
  try {
    const user = await obtenerUsuario(req.user.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// ===== RUTAS PUBLICACIONES =====
app.get('/api/publicaciones', async (req, res, next) => {
  try {
    const { categoria, usuario_id } = req.query
    const publicaciones = await obtenerPublicaciones({ categoria, usuario_id })
    res.json(publicaciones)
  } catch (err) {
    next(err)
  }
})

app.get('/api/publicaciones/:id', async (req, res, next) => {
  try {
    const pub = await obtenerPublicacion(req.params.id)
    res.json(pub)
  } catch (err) {
    next(err)
  }
})

app.post('/api/publicaciones', verificarAuth, async (req, res, next) => {
  try {
    const { titulo, descripcion, precio, imagen_url, categoria } = req.body
    if (!titulo || !precio || !imagen_url) return res.status(400).json({ error: 'Titulo, precio e imagen son requeridos' })
    const pub = await crearPublicacion(req.user.id, titulo, descripcion, precio, imagen_url, categoria)
    res.status(201).json(pub)
  } catch (err) {
    next(err)
  }
})

app.put('/api/publicaciones/:id', verificarAuth, async (req, res, next) => {
  try {
    const pub = await actualizarPublicacion(req.params.id, req.user.id, req.body)
    res.json(pub)
  } catch (err) {
    next(err)
  }
})

app.delete('/api/publicaciones/:id', verificarAuth, async (req, res, next) => {
  try {
    const result = await eliminarPublicacion(req.params.id, req.user.id, req.user.rol)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ===== RUTAS FAVORITOS =====
app.get('/api/favoritos', verificarAuth, async (req, res, next) => {
  try {
    const favs = await obtenerFavoritos(req.user.id)
    res.json(favs)
  } catch (err) {
    next(err)
  }
})

app.post('/api/favoritos', verificarAuth, async (req, res, next) => {
  try {
    const { publicacion_id } = req.body
    if (!publicacion_id) return res.status(400).json({ error: 'publicacion_id es requerido' })
    const fav = await agregarFavorito(req.user.id, publicacion_id)
    res.status(201).json(fav)
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya está en favoritos' })
    next(err)
  }
})

app.delete('/api/favoritos/:publicacion_id', verificarAuth, async (req, res, next) => {
  try {
    const result = await eliminarFavorito(req.user.id, req.params.publicacion_id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ===== RUTAS CARRITO =====
app.get('/api/carrito', verificarAuth, async (req, res, next) => {
  try {
    const carrito = await obtenerCarrito(req.user.id)
    res.json(carrito)
  } catch (err) {
    next(err)
  }
})

app.post('/api/carrito', verificarAuth, async (req, res, next) => {
  try {
    const { publicacion_id, cantidad } = req.body
    if (!publicacion_id) return res.status(400).json({ error: 'publicacion_id es requerido' })
    const item = await agregarAlCarrito(req.user.id, publicacion_id, cantidad || 1)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
})

app.put('/api/carrito/:item_id', verificarAuth, async (req, res, next) => {
  try {
    const { cantidad } = req.body
    const result = await actualizarItemCarrito(req.user.id, req.params.item_id, cantidad)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

app.delete('/api/carrito', verificarAuth, async (req, res, next) => {
  try {
    const result = await vaciarCarrito(req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ===== RUTAS ÓRDENES =====
app.post('/api/ordenes', verificarAuth, async (req, res, next) => {
  try {
    const { nombre_completo, telefono, direccion, ciudad, metodo_pago, notas } = req.body
    const orden = await confirmarCompra(req.user.id, { nombre_completo, telefono, direccion, ciudad, metodo_pago, notas })
    res.status(201).json(orden)
  } catch (err) {
    next(err)
  }
})

app.get('/api/ordenes', verificarAuth, async (req, res, next) => {
  try {
    const ordenes = await obtenerOrdenes(req.user.id)
    res.json(ordenes)
  } catch (err) {
    next(err)
  }
})

// Admin: ver TODAS las órdenes con datos de contacto
app.get('/api/admin/ordenes', verificarAuth, verificarAdmin, async (req, res, next) => {
  try {
    const ordenes = await obtenerTodasOrdenes()
    res.json(ordenes)
  } catch (err) {
    next(err)
  }
})

app.put('/api/ordenes/:id/cancelar', verificarAuth, async (req, res, next) => {
  try {
    const orden = await cancelarOrden(req.params.id, req.user.id)
    res.json(orden)
  } catch (err) {
    next(err)
  }
})

// ===== MIDDLEWARE DE ERRORES =====
app.use(manejarError)

// ===== LEVANTAR SERVIDOR =====
const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`)
  })
}

module.exports = app