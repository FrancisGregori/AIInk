-- Simple migration for storage folder structure

-- 1. Add storageFolder column to users table (UUID)
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_folder VARCHAR UNIQUE;

-- 2. Generate storage folders for existing users
UPDATE users
SET storage_folder = gen_random_uuid()
WHERE storage_folder IS NULL;

-- 3. Make storage_folder NOT NULL after populating
ALTER TABLE users ALTER COLUMN storage_folder SET NOT NULL;
ALTER TABLE users ALTER COLUMN storage_folder SET DEFAULT gen_random_uuid();

-- 4. Create index for public gallery queries
CREATE INDEX IF NOT EXISTS user_gallery_is_public_idx ON user_gallery(is_public);

-- Note: The imageUrl and thumbnailUrl columns in user_gallery will now store the new format:
-- imageUrl: /api/images/{storageFolder}/{imageName}
-- thumbnailUrl: /api/images/{storageFolder}/{thumbName}

COMMIT;