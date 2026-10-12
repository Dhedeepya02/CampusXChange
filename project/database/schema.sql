-- ============================================================
-- CampusXChange - MySQL Database Schema
-- Run this file once to set up the database.
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusxchange
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusxchange;

-- ──────────────────────────────────────────────
-- USERS  (authentication)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ──────────────────────────────────────────────
-- PROFILES  (campus-specific data per user)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          VARCHAR(36)  NOT NULL,
  full_name   VARCHAR(255) NOT NULL,
  campus_id   VARCHAR(100) NOT NULL,
  university  VARCHAR(255) NOT NULL,
  phone       VARCHAR(50)  DEFAULT NULL,
  avatar_url  TEXT         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ──────────────────────────────────────────────
-- PRODUCTS  (listings)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)    NOT NULL,
  title         VARCHAR(255)   NOT NULL,
  description   TEXT           NOT NULL,
  category      VARCHAR(50)    NOT NULL DEFAULT 'Other',
  `condition`   VARCHAR(50)    NOT NULL DEFAULT 'Good',
  price         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  exchange_type VARCHAR(20)    NOT NULL DEFAULT 'both',
  image_url     TEXT           DEFAULT NULL,
  status        VARCHAR(20)    NOT NULL DEFAULT 'available',
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_products_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_products_user_id   (user_id),
  INDEX idx_products_category  (category),
  INDEX idx_products_status    (status),
  INDEX idx_products_created   (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ──────────────────────────────────────────────
-- OFFERS  (purchase / trade offers on a product)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  product_id    VARCHAR(36)   NOT NULL,
  buyer_id      VARCHAR(36)   NOT NULL,
  offer_type    VARCHAR(20)   NOT NULL DEFAULT 'purchase',
  offer_price   DECIMAL(10,2) DEFAULT NULL,
  offer_message TEXT          DEFAULT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_offers_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_offers_buyer
    FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,

  INDEX idx_offers_product_id (product_id),
  INDEX idx_offers_buyer_id   (buyer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ──────────────────────────────────────────────
-- CONVERSATIONS  (chat thread per product+buyer)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  buyer_id   VARCHAR(36) NOT NULL,
  seller_id  VARCHAR(36) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_conversation (product_id, buyer_id),

  CONSTRAINT fk_conversations_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_buyer
    FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_conversations_seller
    FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE CASCADE,

  INDEX idx_conv_buyer_id  (buyer_id),
  INDEX idx_conv_seller_id (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ──────────────────────────────────────────────
-- MESSAGES  (individual chat messages)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              VARCHAR(36) NOT NULL DEFAULT (UUID()),
  conversation_id VARCHAR(36) NOT NULL,
  sender_id       VARCHAR(36) NOT NULL,
  content         TEXT        NOT NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_messages_conv_id (conversation_id),
  INDEX idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
