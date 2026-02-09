-- Base de datos: viaje_conexion
-- Ejecutar: psql -U postgres -f script.sql

-- Crear la base de datos (ejecutar primero por separado si no existe)
-- CREATE DATABASE viaje_conexion;

-- Conectar a la base de datos
-- \c viaje_conexion;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  rol VARCHAR(20) DEFAULT 'user',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de publicaciones (paquetes de viaje)
CREATE TABLE IF NOT EXISTS publicaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio INTEGER NOT NULL,
  imagen_url TEXT NOT NULL,
  categoria VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, publicacion_id)
);

-- Tabla de carrito
CREATE TABLE IF NOT EXISTS carrito (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Items dentro del carrito
CREATE TABLE IF NOT EXISTS items_carrito (
  id SERIAL PRIMARY KEY,
  carrito_id INTEGER NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  total INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detalle de cada orden
CREATE TABLE IF NOT EXISTS ordenes_detalle (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id),
  cantidad INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_categoria ON publicaciones(categoria);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes(usuario_id);

-- Datos de prueba
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Admin', 'admin@viaje.com', '$2b$10$gestnAseLxvYseZjphqd.uksUYp45y5eRXk3kTDnY2ORzN4C8klgK', 'admin'),
('Usuario Demo', 'demo@viaje.com', '$2b$10$gestnAseLxvYseZjphqd.uksUYp45y5eRXk3kTDnY2ORzN4C8klgK', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO publicaciones (usuario_id, titulo, descripcion, precio, imagen_url, categoria) VALUES
(1, 'Lunahuaná Full Day aventura', 'Canotaje, cuatrimotos y degustación de vino.', 180, 'lunahuana.mp4', 'costa'),
(1, 'Huaraz & Cordillera Blanca', 'Laguna 69, Llanganuco y nevados impresionantes.', 420, 'huaraz.mp4', 'sierra'),
(1, 'Tarapoto Selva Mágica', 'Cataratas, city tour y gastronomía selvática.', 650, 'tarapoto.mp4', 'selva'),
(1, 'Cusco clásico + Machu Picchu', 'Historia, cultura y una de las maravillas del mundo.', 1350, 'cusco.mp4', 'sierra'),
(1, 'Salar de Uyuni (Bolivia)', 'El espejo natural más grande del mundo.', 1200, 'uyuni.mp4', 'sudamerica'),
(1, 'Ica, Paracas & Huacachina', 'Islas Ballestas, Reserva de Paracas y sandboarding.', 350, 'ica.mp4', 'costa'),
(1, 'Puno & Lago Titicaca', 'Islas flotantes de los Uros y Taquile.', 480, 'fondo.mp4', 'sierra'),
(1, 'Iquitos & Amazonas', 'Aventura en la selva amazónica.', 750, 'amazonas.mp4', 'selva'),
(1, 'Playas del norte (Máncora)', 'Sol, playa y relax en el norte del Perú.', 550, 'costa.mp4', 'costa')
ON CONFLICT DO NOTHING;
