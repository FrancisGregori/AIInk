-- Migration SQL for adding storage paths and removing userId from URLs

-- 1. Add storagePath column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_path VARCHAR UNIQUE;

-- 2. Add storage path columns to user_gallery table
ALTER TABLE user_gallery ADD COLUMN IF NOT EXISTS image_storage_path VARCHAR;
ALTER TABLE user_gallery ADD COLUMN IF NOT EXISTS thumbnail_storage_path VARCHAR;

-- 3. Generate storage paths for existing users
UPDATE users
SET storage_path = CONCAT('user_', MD5(RANDOM()::text), '_', EXTRACT(EPOCH FROM NOW())::int)
WHERE storage_path IS NULL;

-- 4. Create index for public gallery queries
CREATE INDEX IF NOT EXISTS user_gallery_is_public_idx ON user_gallery(is_public);

-- 5. Update existing gallery items to have storage paths (optional - run if needed)
-- This will need to be customized based on your existing data structure
-- UPDATE user_gallery
-- SET image_storage_path = image_url,
--     thumbnail_storage_path = thumbnail_url
-- WHERE image_storage_path IS NULL;

COMMIT;