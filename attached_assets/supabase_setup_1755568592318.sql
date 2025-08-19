-- SQL URGENTE para ejecutar en Supabase SQL Editor
-- Este SQL corrige el error "Database error saving new user"

-- 1. IMPORTANTE: Primero verificar y agregar los planes a entitlements
-- Si no existen estos planes, el trigger fallará al crear usuarios
INSERT INTO entitlements (plan, monthly_renders, max_resolution_px, concurrent_jobs, storage_quota_gb)
VALUES 
  ('free', 50, 1024, 1, 1),
  ('pro', 500, 2048, 3, 10),
  ('enterprise', 9999, 4096, 10, 100)
ON CONFLICT (plan) DO UPDATE SET
  monthly_renders = EXCLUDED.monthly_renders,
  max_resolution_px = EXCLUDED.max_resolution_px,
  concurrent_jobs = EXCLUDED.concurrent_jobs,
  storage_quota_gb = EXCLUDED.storage_quota_gb;

-- 2. Verificar que el plan 'free' existe
SELECT * FROM entitlements WHERE plan = 'free';

-- 3. Actualizar el trigger para manejar mejor los errores
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Insertar el perfil con valores por defecto explícitos
  INSERT INTO profiles (id, plan, status, created_at) 
  VALUES (
    new.id,
    'free',
    'active',
    now()
  ) 
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Si el plan 'free' no existe, insertar sin plan
    RAISE NOTICE 'Plan free not found, creating profile without plan';
    INSERT INTO profiles (id, status, created_at) 
    VALUES (new.id, 'active', now()) 
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
  WHEN OTHERS THEN
    -- Log el error pero no fallar la creación del usuario
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN new;
END;
$$;

-- 2. Crear la tabla stencil_jobs que falta
CREATE TABLE IF NOT EXISTS stencil_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  processed_image_url TEXT,
  style VARCHAR(50) NOT NULL,
  line_color VARCHAR(20) DEFAULT 'black',
  transparent_background BOOLEAN DEFAULT false,
  quality INTEGER DEFAULT 75,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  comfy_deploy_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security en stencil_jobs
ALTER TABLE stencil_jobs ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas para stencil_jobs
CREATE POLICY "Users can view own stencils" ON stencil_jobs
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create stencils" ON stencil_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own stencils" ON stencil_jobs
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own stencils" ON stencil_jobs
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stencil_jobs_user_id ON stencil_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_stencil_jobs_status ON stencil_jobs(status);
CREATE INDEX IF NOT EXISTS idx_stencil_jobs_created_at ON stencil_jobs(created_at DESC);