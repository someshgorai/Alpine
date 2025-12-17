import db from "../lib/db.js";

export async function initDatabase() {


  await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);


  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legal_name TEXT NOT NULL,
      email VARCHAR(255) UNIQUE,
      gstin VARCHAR(32) UNIQUE,

      website VARCHAR(255),
      industry_category VARCHAR(255),
      company_type VARCHAR(255),

      address TEXT,
      pincode VARCHAR(6) CHECK (pincode ~ '^[0-9]{6}$'),
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255),

      year_of_incorporation INTEGER,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
  `);


  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('admin','sales','technical','pricing');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
        CREATE TYPE user_status_enum AS ENUM ('active','inactive','suspended');
      END IF;
    END $$;
  `);


  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

      email VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL,

      full_name VARCHAR(255),
      official_designation VARCHAR(255),

      role user_role_enum NOT NULL DEFAULT 'admin',
      status user_status_enum NOT NULL DEFAULT 'active',

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
  `);


  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

      manufacturer VARCHAR(255) NOT NULL,
      sku VARCHAR(255) NOT NULL,

      technical_specs JSONB NOT NULL, 

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (company_id, sku)
      );
  `);


  await db.query(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      base_price NUMERIC(18,2) NOT NULL,

      is_active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (product_id, valid_from)
      );
  `);


  await db.query(`
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

      service_name VARCHAR(255) NOT NULL,

      cost NUMERIC(18,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',

      is_active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (company_id, service_name)
      );
  `);


  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
    CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
    CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
  `);

  console.log("Database initialized ✔");
}
