const request = require('supertest')
const app = require('../index')

let token = ''
let publicacionId = ''

describe('API Viaje Conexión - Tests', () => {

  // TEST 1: GET / — ruta raíz responde 200
  test('GET / debe responder con status 200', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBeDefined()
  })

  // TEST 2: POST /api/auth/register — registro exitoso 201
  test('POST /api/auth/register debe registrar un usuario (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: '123456'
      })
    expect(res.statusCode).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.nombre).toBe('Test User')
    token = res.body.token
  })

  // TEST 3: POST /api/auth/register — sin datos 400
  test('POST /api/auth/register sin datos debe responder 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  // TEST 4: POST /api/auth/login — credenciales incorrectas 401
  test('POST /api/auth/login con credenciales incorrectas debe responder 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrong' })
    expect(res.statusCode).toBe(401)
  })

  // TEST 5: GET /api/publicaciones — lista pública 200
  test('GET /api/publicaciones debe responder con status 200', async () => {
    const res = await request(app).get('/api/publicaciones')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  // TEST 6: GET /api/favoritos — sin token 401
  test('GET /api/favoritos sin token debe responder 401', async () => {
    const res = await request(app).get('/api/favoritos')
    expect(res.statusCode).toBe(401)
  })

  // TEST 7: GET /api/carrito — con token 200
  test('GET /api/carrito con token debe responder 200', async () => {
    const res = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.items).toBeDefined()
  })

  // TEST 8: POST /api/publicaciones — crear con token 201
  test('POST /api/publicaciones con token debe crear (201)', async () => {
    const res = await request(app)
      .post('/api/publicaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Destino Test',
        descripcion: 'Un destino de prueba',
        precio: 500,
        imagen_url: 'test.jpg',
        categoria: 'costa'
      })
    expect(res.statusCode).toBe(201)
    expect(res.body.titulo).toBe('Destino Test')
    publicacionId = res.body.id
  })

})
