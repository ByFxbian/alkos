INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt") 
VALUES ('walkin-system-user', 'walkin@alkosbarber.at', 'Walk-In Kunde', 'KUNDE', NOW(), NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO "Settings" (id, key, value, "updatedAt") 
VALUES ('walkin-pin-setting', 'walkin_pin', '1234', NOW()) 
ON CONFLICT (key) DO NOTHING;
