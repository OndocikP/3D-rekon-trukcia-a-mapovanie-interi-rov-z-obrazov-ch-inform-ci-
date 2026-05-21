-- ============================================
-- PASSWORD RESET - DATABÁZA SETUP
-- ============================================
-- Spusť tento skript v Supabase SQL Editor

-- 1. Vytvor tabuľku na uloženie reset tokenov
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 2. Vytvor indexy pre rýchlejšie dotazy
CREATE INDEX IF NOT EXISTS idx_password_reset_email 
ON password_reset_tokens(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_code 
ON password_reset_tokens(reset_code);

CREATE INDEX IF NOT EXISTS idx_password_reset_expires 
ON password_reset_tokens(expires_at);

-- 3. Nastav RLS (Row Level Security) - VOLITEĽNÉ ale ODPORÚČANÉ
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Všetci anonymní používatelia môžu vkladať a aktualizovať
CREATE POLICY "Allow public insert" 
ON password_reset_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select" 
ON password_reset_tokens 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update" 
ON password_reset_tokens 
FOR UPDATE 
USING (true);

-- 4. Vytvor funkciu na vymazanie starých tokenov (VOLITEĽNÉ)
-- Tuto funkciu môžeš spustiť ako CRON job
CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW()
    AND used = false;
END;
$$ LANGUAGE plpgsql;

-- 5. Vytvor funkciu na obnovenie hesla (ako register_user)
-- Táto funkcia hashuje heslo ako sa hashuje pri registrácii
CREATE OR REPLACE FUNCTION reset_user_password_with_hash(
  p_user_id UUID,
  p_new_password VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Aktualizuj heslo s hashovaním (crypt funkcia hashuje heslo ako pri registrácii)
  UPDATE users 
  SET password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFIKÁCIA - Kontrola či funguje
-- ============================================
-- Spusti to a mal by si vidieť prázdnu tabuľku
SELECT * FROM password_reset_tokens;

-- Alebo skontroluj stav tabuľky
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename = 'password_reset_tokens';

-- ============================================
-- VYČISTENIE (ak potrebuješ resetovať)
-- ============================================
-- DROP TABLE IF EXISTS password_reset_tokens;
-- DROP FUNCTION IF EXISTS cleanup_expired_password_tokens();
-- DROP FUNCTION IF EXISTS reset_user_password_with_hash(UUID, VARCHAR);
