-- Seed default admin user
-- Email: admin@mycityquest.local | Password: admin123

INSERT INTO users (email, password_hash, role)
VALUES (
    'admin@mycityquest.local',
    '$2a$10$cDm45EQp58TqoPKpHsIXyuee6evnTrIzy3IMSfNEP/xxBFfAOKi9q',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
