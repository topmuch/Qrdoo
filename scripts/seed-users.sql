-- ORDOMOTIK Seed Users (pre-hashed passwords)
-- Regenerate hashes with: node -e "const{hash}=require('bcryptjs');hash('QrDomotik2024!',12).then(h=>console.log(h))"

-- Super Admin
INSERT OR IGNORE INTO "users" ("id", "email", "full_name", "password_hash", "role", "onboarding_completed", "created_at", "updated_at")
VALUES ('admin-001', 'admin@qrdomotik.roomscan.pro', 'Administrateur ORDOMOTIK', '$2b$12$3W3kag8LZIzsf8Ei.CbPrOqmCjhzGXsUpxYZqsjkIELou.BAw.M4O', 'superadmin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("email") DO UPDATE SET "password_hash"='$2b$12$3W3kag8LZIzsf8Ei.CbPrOqmCjhzGXsUpxYZqsjkIELou.BAw.M4O', "full_name"='Administrateur ORDOMOTIK', "role"='superadmin';

-- Demo User
INSERT OR IGNORE INTO "users" ("id", "email", "full_name", "password_hash", "role", "onboarding_completed", "created_at", "updated_at")
VALUES ('demo-001', 'demo@qrdomotik.roomscan.pro', 'Utilisateur Demo', '$2b$12$QO/EbDQr7Y6Rj4IqtZmkBecuVDkJ.TMIqcr.i7kr2MNDpUbyi30vC', 'user', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("email") DO UPDATE SET "password_hash"='$2b$12$QO/EbDQr7Y6Rj4IqtZmkBecuVDkJ.TMIqcr.i7kr2MNDpUbyi30vC', "full_name"='Utilisateur Demo';

-- Admin Home (only if not exists)
INSERT OR IGNORE INTO "homes" ("id", "owner_id", "name", "address", "is_active", "created_at", "updated_at")
SELECT 'home-admin-001', "id", 'ORDOMOTIK HQ', 'Siege Social', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" WHERE "email"='admin@qrdomotik.roomscan.pro' AND NOT EXISTS (SELECT 1 FROM "homes" WHERE "owner_id"='admin-001');

-- Demo Home (only if not exists)
INSERT OR IGNORE INTO "homes" ("id", "owner_id", "name", "address", "is_active", "created_at", "updated_at")
SELECT 'home-demo-001', "id", 'Ma Maison Demo', '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" WHERE "email"='demo@qrdomotik.roomscan.pro' AND NOT EXISTS (SELECT 1 FROM "homes" WHERE "owner_id"='demo-001');
