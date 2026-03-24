CREATE DATABASE IF NOT EXISTS kikedev
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kikedev;

CREATE TABLE IF NOT EXISTS contactos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  ticket       VARCHAR(30)  NOT NULL UNIQUE,
  nombre       VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  discord      VARCHAR(255) DEFAULT NULL,
  servicio     VARCHAR(50)  NOT NULL,
  pack         VARCHAR(100) DEFAULT NULL,
  presupuesto  VARCHAR(50)  DEFAULT NULL,
  descripcion  TEXT         NOT NULL,
  estado       VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  notas_admin  TEXT         DEFAULT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ticket  (ticket),
  INDEX idx_estado  (estado),
  INDEX idx_servicio(servicio),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
