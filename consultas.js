const pool = require('./db')
const bcrypt = require('bcryptjs')

// ===== USUARIOS =====

const registrarUsuario = async (nombre, email, password, avatar_url = null) => {
  const passwordHash = await bcrypt.hash(password, 10)
  const query = 'INSERT INTO usuarios (nombre, email, password, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, avatar_url, rol, created_at'
  const { rows } = await pool.query(query, [nombre, email, passwordHash, avatar_url])
  return rows[0]
}

const loginUsuario = async (email, password) => {
  const query = 'SELECT * FROM usuarios WHERE email = $1 AND activo = true'
  const { rows } = await pool.query(query, [email])
  if (rows.length === 0) throw { code: 401, message: 'Email o contraseña incorrectos' }
  const user = rows[0]
  const match = await bcrypt.compare(password, user.password)
  if (!match) throw { code: 401, message: 'Email o contraseña incorrectos' }
  const { password: _, ...userSinPassword } = user
  return userSinPassword
}

const obtenerUsuario = async (id) => {
  const query = 'SELECT id, nombre, email, avatar_url, rol, created_at FROM usuarios WHERE id = $1 AND activo = true'
  const { rows } = await pool.query(query, [id])
  if (rows.length === 0) throw { code: 404, message: 'Usuario no encontrado' }
  return rows[0]
}

// ===== PUBLICACIONES =====

const obtenerPublicaciones = async (filters = {}) => {
  let query = 'SELECT p.*, u.nombre AS autor FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.activo = true'
  const values = []
  if (filters.categoria) {
    values.push(filters.categoria)
    query += ` AND p.categoria = $${values.length}`
  }
  if (filters.usuario_id) {
    values.push(filters.usuario_id)
    query += ` AND p.usuario_id = $${values.length}`
  }
  query += ' ORDER BY p.created_at DESC'
  const { rows } = await pool.query(query, values)
  return rows
}

const obtenerPublicacion = async (id) => {
  const query = 'SELECT p.*, u.nombre AS autor FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1 AND p.activo = true'
  const { rows } = await pool.query(query, [id])
  if (rows.length === 0) throw { code: 404, message: 'Publicación no encontrada' }
  return rows[0]
}

const crearPublicacion = async (usuario_id, titulo, descripcion, precio, imagen_url, categoria) => {
  const query = 'INSERT INTO publicaciones (usuario_id, titulo, descripcion, precio, imagen_url, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
  const { rows } = await pool.query(query, [usuario_id, titulo, descripcion, precio, imagen_url, categoria])
  return rows[0]
}

const actualizarPublicacion = async (id, usuario_id, campos) => {
  const pub = await obtenerPublicacion(id)
  if (pub.usuario_id !== usuario_id) throw { code: 403, message: 'No autorizado' }
  const { titulo, descripcion, precio, imagen_url, categoria } = campos
  const query = 'UPDATE publicaciones SET titulo = $1, descripcion = $2, precio = $3, imagen_url = $4, categoria = $5 WHERE id = $6 RETURNING *'
  const { rows } = await pool.query(query, [titulo || pub.titulo, descripcion || pub.descripcion, precio || pub.precio, imagen_url || pub.imagen_url, categoria || pub.categoria, id])
  return rows[0]
}

const eliminarPublicacion = async (id, usuario_id, rol) => {
  const pub = await obtenerPublicacion(id)
  if (pub.usuario_id !== usuario_id && rol !== 'admin') throw { code: 403, message: 'No autorizado' }
  await pool.query('UPDATE publicaciones SET activo = false WHERE id = $1', [id])
  return { message: 'Publicación eliminada' }
}

// ===== FAVORITOS =====

const obtenerFavoritos = async (usuario_id) => {
  const query = 'SELECT f.id, f.created_at, p.* FROM favoritos f JOIN publicaciones p ON f.publicacion_id = p.id WHERE f.usuario_id = $1 AND p.activo = true ORDER BY f.created_at DESC'
  const { rows } = await pool.query(query, [usuario_id])
  return rows
}

const agregarFavorito = async (usuario_id, publicacion_id) => {
  const query = 'INSERT INTO favoritos (usuario_id, publicacion_id) VALUES ($1, $2) RETURNING *'
  const { rows } = await pool.query(query, [usuario_id, publicacion_id])
  return rows[0]
}

const eliminarFavorito = async (usuario_id, publicacion_id) => {
  const query = 'DELETE FROM favoritos WHERE usuario_id = $1 AND publicacion_id = $2 RETURNING *'
  const { rows } = await pool.query(query, [usuario_id, publicacion_id])
  if (rows.length === 0) throw { code: 404, message: 'Favorito no encontrado' }
  return { message: 'Favorito eliminado' }
}

// ===== CARRITO =====

const obtenerCarrito = async (usuario_id) => {
  let { rows: carritos } = await pool.query('SELECT id FROM carrito WHERE usuario_id = $1', [usuario_id])
  if (carritos.length === 0) {
    const { rows } = await pool.query('INSERT INTO carrito (usuario_id) VALUES ($1) RETURNING id', [usuario_id])
    carritos = rows
  }
  const carrito_id = carritos[0].id
  const query = 'SELECT ic.id, ic.cantidad, p.id AS publicacion_id, p.titulo, p.precio, p.imagen_url, p.categoria FROM items_carrito ic JOIN publicaciones p ON ic.publicacion_id = p.id WHERE ic.carrito_id = $1'
  const { rows: items } = await pool.query(query, [carrito_id])
  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  return { carrito_id, items, total }
}

const agregarAlCarrito = async (usuario_id, publicacion_id, cantidad = 1) => {
  let { rows: carritos } = await pool.query('SELECT id FROM carrito WHERE usuario_id = $1', [usuario_id])
  if (carritos.length === 0) {
    const { rows } = await pool.query('INSERT INTO carrito (usuario_id) VALUES ($1) RETURNING id', [usuario_id])
    carritos = rows
  }
  const carrito_id = carritos[0].id
  const { rows: existe } = await pool.query('SELECT id, cantidad FROM items_carrito WHERE carrito_id = $1 AND publicacion_id = $2', [carrito_id, publicacion_id])
  if (existe.length > 0) {
    const { rows } = await pool.query('UPDATE items_carrito SET cantidad = cantidad + $1 WHERE id = $2 RETURNING *', [cantidad, existe[0].id])
    return rows[0]
  }
  const { rows } = await pool.query('INSERT INTO items_carrito (carrito_id, publicacion_id, cantidad) VALUES ($1, $2, $3) RETURNING *', [carrito_id, publicacion_id, cantidad])
  return rows[0]
}

const actualizarItemCarrito = async (usuario_id, item_id, cantidad) => {
  const { rows: carritos } = await pool.query('SELECT id FROM carrito WHERE usuario_id = $1', [usuario_id])
  if (carritos.length === 0) throw { code: 404, message: 'Carrito no encontrado' }
  if (cantidad <= 0) {
    await pool.query('DELETE FROM items_carrito WHERE id = $1 AND carrito_id = $2', [item_id, carritos[0].id])
    return { message: 'Item eliminado' }
  }
  const { rows } = await pool.query('UPDATE items_carrito SET cantidad = $1 WHERE id = $2 AND carrito_id = $3 RETURNING *', [cantidad, item_id, carritos[0].id])
  return rows[0]
}

const vaciarCarrito = async (usuario_id) => {
  const { rows: carritos } = await pool.query('SELECT id FROM carrito WHERE usuario_id = $1', [usuario_id])
  if (carritos.length === 0) return { message: 'Carrito ya vacío' }
  await pool.query('DELETE FROM items_carrito WHERE carrito_id = $1', [carritos[0].id])
  return { message: 'Carrito vaciado' }
}

// ===== ÓRDENES =====

const confirmarCompra = async (usuario_id) => {
  const carrito = await obtenerCarrito(usuario_id)
  if (carrito.items.length === 0) throw { code: 400, message: 'El carrito está vacío' }
  const { rows: orden } = await pool.query('INSERT INTO ordenes (usuario_id, total) VALUES ($1, $2) RETURNING *', [usuario_id, carrito.total])
  for (const item of carrito.items) {
    await pool.query('INSERT INTO ordenes_detalle (orden_id, publicacion_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)', [orden[0].id, item.publicacion_id, item.cantidad, item.precio])
  }
  await vaciarCarrito(usuario_id)
  return orden[0]
}

const obtenerOrdenes = async (usuario_id) => {
  const query = 'SELECT o.*, json_agg(json_build_object(\'publicacion_id\', od.publicacion_id, \'cantidad\', od.cantidad, \'precio_unitario\', od.precio_unitario)) AS detalle FROM ordenes o LEFT JOIN ordenes_detalle od ON o.id = od.orden_id WHERE o.usuario_id = $1 GROUP BY o.id ORDER BY o.created_at DESC'
  const { rows } = await pool.query(query, [usuario_id])
  return rows
}

const cancelarOrden = async (id, usuario_id) => {
  const { rows } = await pool.query('UPDATE ordenes SET status = $1 WHERE id = $2 AND usuario_id = $3 AND status = $4 RETURNING *', ['cancelada', id, usuario_id, 'pendiente'])
  if (rows.length === 0) throw { code: 404, message: 'Orden no encontrada o ya procesada' }
  return rows[0]
}

const actualizarEstadoOrden = async (id, status) => {
  const validos = ['pendiente', 'procesado', 'completado', 'cancelada']
  if (!validos.includes(status)) throw { code: 400, message: 'Estado no válido' }
  const { rows } = await pool.query('UPDATE ordenes SET status = $1 WHERE id = $2 RETURNING *', [status, id])
  if (rows.length === 0) throw { code: 404, message: 'Orden no encontrada' }
  return rows[0]
}

const obtenerTodasOrdenes = async () => {
  const query = "SELECT o.*, u.nombre AS usuario_nombre, u.email AS usuario_email, json_agg(json_build_object('publicacion_id', od.publicacion_id, 'cantidad', od.cantidad, 'precio_unitario', od.precio_unitario)) AS detalle FROM ordenes o JOIN usuarios u ON o.usuario_id = u.id LEFT JOIN ordenes_detalle od ON o.id = od.orden_id GROUP BY o.id, u.nombre, u.email ORDER BY o.created_at DESC"
  const { rows } = await pool.query(query)
  return rows
}

module.exports = {
  registrarUsuario, loginUsuario, obtenerUsuario,
  obtenerPublicaciones, obtenerPublicacion, crearPublicacion, actualizarPublicacion, eliminarPublicacion,
  obtenerFavoritos, agregarFavorito, eliminarFavorito,
  obtenerCarrito, agregarAlCarrito, actualizarItemCarrito, vaciarCarrito,
  confirmarCompra, obtenerOrdenes, obtenerTodasOrdenes, cancelarOrden, actualizarEstadoOrden
}