DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        GROUP BY lower(btrim(email))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot normalize user emails: case-insensitive trimmed duplicates exist';
    END IF;
END $$;

UPDATE users SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));

CREATE UNIQUE INDEX uk_users_email_ci ON users (lower(btrim(email)));
