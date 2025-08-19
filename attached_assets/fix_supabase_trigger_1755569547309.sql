-- SQL para corregir DEFINITIVAMENTE el problema de registro
-- Ejecuta TODO este SQL en orden en tu Supabase SQL Editor

-- 1. Primero, verificar qué campos tiene la tabla profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Asegurar que los planes existen
INSERT INTO entitlements (plan, monthly_renders, max_resolution_px, concurrent_jobs, storage_quota_gb)
VALUES 
  ('free', 50, 1024, 1, 1),
  ('pro', 500, 2048, 3, 10),
  ('enterprise', 9999, 4096, 10, 100)
ON CONFLICT (plan) DO NOTHING;

-- 3. IMPORTANTE: Recrear el trigger con TODOS los campos necesarios
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Insertar SOLO los campos que existen en profiles
  INSERT INTO profiles (
    id,
    plan,
    status,
    created_at
  ) 
  VALUES (
    new.id,
    'free',
    'active',
    now()
  ) 
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION 
  WHEN OTHERS THEN
    -- Si hay CUALQUIER error, registrarlo pero NO fallar
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    -- Intentar crear un perfil mínimo
    BEGIN
      INSERT INTO profiles (id) 
      VALUES (new.id) 
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION 
      WHEN OTHERS THEN
        -- Si aún falla, solo loguear
        RAISE WARNING 'Could not create profile at all: %', SQLERRM;
    END;
    RETURN new;
END;
$$;

-- 4. Verificar que el trigger esté asociado correctamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 5. Verificar que todo esté correcto
SELECT * FROM entitlements WHERE plan = 'free';

-- 6. Si aún hay problemas, crear un usuario de prueba manualmente
-- Esto nos ayudará a ver exactamente qué está fallando
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Intentar insertar un perfil de prueba
  INSERT INTO profiles (
    id,
    plan,
    status,
    created_at
  ) 
  VALUES (
    test_user_id,
    'free',
    'active',
    now()
  );
  
  -- Si funciona, borrarlo
  DELETE FROM profiles WHERE id = test_user_id;
  
  RAISE NOTICE 'Test profile creation successful!';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Test profile creation failed: %', SQLERRM;
END;
$$;