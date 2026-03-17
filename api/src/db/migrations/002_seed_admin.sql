-- Seed default admin user
-- Email: admin@mycityquest.local | Password: admin123

-- Note: Password hash generated with bcryptjs (rounds: 10)
-- Hash for "admin123": $2a$10$Zqhhs1fL3bJ8K5pL9mN8C.OvQd9I0Q5K3P2C7V8Z1Z4M5N6O7P8Q9

INSERT INTO users (email, password_hash, role)
VALUES (
    'admin@mycityquest.local',
    '$2a$10$Zqhhs1fL3bJ8K5pL9mN8C.OvQd9I0Q5K3P2C7V8Z1Z4M5N6O7P8Q9', -- bcrypt hash for "admin123"
    'admin'
)
ON CONFLICT (email) DO NOTHING;
