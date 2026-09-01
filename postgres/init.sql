-- ==============================================
--   FIEL RIO PARDO — Schema do Banco de Dados
-- ==============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ROLES ────────────────────────────────────
-- Somente 3 níveis: MASTER (1 único), ADMIN, USER

CREATE TABLE roles (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('MASTER', 'Dono único do sistema — acesso total irrestrito'),
  ('ADMIN',  'Administrador — gerencia jogos, bolão, notícias e usuários'),
  ('USER',   'Participante — acessa o bolão, dá palpites e vê ranking');

-- ─── PERMISSÕES ───────────────────────────────

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

INSERT INTO permissions (module, action, description) VALUES
  -- Master (somente MASTER)
  ('master',   'all',    'Acesso irrestrito ao painel master'),
  ('settings', 'write',  'Editar configurações do sistema e API keys'),
  ('audit',    'read',   'Ver logs de auditoria completos'),
  ('users',    'roles',  'Alterar roles de usuários'),
  -- Admin
  ('matches',  'write',  'Criar e editar jogos'),
  ('bolao',    'manage', 'Gerenciar bolão: fechar, corrigir, calcular'),
  ('news',     'write',  'Aprovar, editar e remover notícias'),
  ('users',    'manage', 'Ver, bloquear e desbloquear usuários'),
  ('agents',   'trigger','Disparar agentes AI manualmente'),
  -- User (todos autenticados)
  ('bolao',    'predict','Enviar e alterar palpite'),
  ('bolao',    'read',   'Ver palpites e ranking'),
  ('matches',  'read',   'Ver jogos e informações'),
  ('news',     'read',   'Ler notícias e conteúdo');

CREATE TABLE role_permissions (
    role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- MASTER tem TODAS as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'MASTER';

-- ADMIN: tudo exceto master/audit/settings write/roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.module NOT IN ('master', 'audit')
  AND NOT (p.module = 'settings' AND p.action = 'write')
  AND NOT (p.module = 'users'    AND p.action = 'roles');

-- USER: leitura + palpites
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'USER'
  AND p.action IN ('read', 'predict');

-- ─── USUÁRIOS ─────────────────────────────────

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name      VARCHAR(150) NOT NULL,
    nick           VARCHAR(50)  UNIQUE NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    whatsapp       VARCHAR(20),
    city           VARCHAR(100),
    state          CHAR(2),
    is_active      BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url     TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ─── SEED: USUÁRIO MASTER ─────────────────────
-- Rocha — thiago@rochanet.net.br — único MASTER do sistema

DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
BEGIN
  INSERT INTO users (full_name, nick, email, password_hash, city, state, is_active, email_verified)
  VALUES (
    'Rocha',
    'Rocha',
    'thiago@rochanet.net.br',
    '$2b$12$C/Yq0GvjrLQdI2m1nCsIT.t1zrcoFAUtzIyUOdRKGrgfJHx.3J7ny',
    'São José do Rio Pardo', 'SP', TRUE, TRUE
  )
  RETURNING id INTO v_user_id;

  SELECT id INTO v_role_id FROM roles WHERE name = 'MASTER';

  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (v_user_id, v_role_id, v_user_id);

  RAISE NOTICE 'Usuário MASTER criado: % (%)', 'Rocha', v_user_id;
END $$;

-- ─── CONFIGURAÇÕES DO SISTEMA ─────────────────

CREATE TABLE system_settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         VARCHAR(100) UNIQUE NOT NULL,
    value       TEXT,
    description TEXT,
    category    VARCHAR(50) DEFAULT 'general',
    is_public   BOOLEAN DEFAULT FALSE,
    updated_by  UUID REFERENCES users(id),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description, category, is_public) VALUES
  ('bolao_close_minutes_before', '1',                             'Minutos antes do jogo p/ fechar palpites',   'bolao',        false),
  ('bolao_prize_first',          'R$ 150,00',                     'Primeiro prêmio',                            'bolao',        true),
  ('bolao_prize_second',         'Uma camisa do Timão',           'Segundo prêmio',                             'bolao',        true),
  ('bolao_prize_third',          'Kit presente do Timão',         'Terceiro prêmio',                            'bolao',        true),
  ('bolao_points_sole_winner',   '2',                             'Pontos: acertou sozinho',                    'bolao',        false),
  ('bolao_points_shared_winner', '1',                             'Pontos: acertou junto com outros',           'bolao',        false),
  ('bolao_tiebreak_2nd',         'Gu Almeida',                    'Responsável pelo desempate no 2º prêmio',    'bolao',        true),
  ('bolao_tiebreak_3rd',         'BrunoDeCarvalho',               'Responsável pelo desempate no 3º prêmio',    'bolao',        true),
  ('bolao_season',               '2026',                          'Temporada atual do bolão',                   'bolao',        true),
  ('anthropic_api_key',          '',                              'Chave da Claude API (Anthropic)',             'integrations', false),
  ('anthropic_model',            'claude-opus-4-5',               'Modelo Claude a utilizar',                   'integrations', false),
  ('football_api_key',           '',                              'Chave da API de Futebol (API-Football)',      'integrations', false),
  ('site_name',                  'Fiel Rio Pardo',                'Nome do site',                               'general',      true),
  ('site_description',           'Torcida Organizada Fiel Rio Pardo — São José do Rio Pardo/SP', 'Descrição', 'general',      true),
  ('radio_coringao_url',         'http://www.radiocoringao.com.br','URL da Rádio Coringão',                     'general',      true),
  ('instagram_url',              'https://www.instagram.com/fielriopardo', 'Instagram da torcida',             'social',       true),
  ('facebook_url',               'https://www.facebook.com/fielriopardo',  'Facebook da torcida',              'social',       true),
  ('news_refresh_minutes',       '30',                            'Intervalo de atualização de notícias (min)', 'agents',       false),
  ('match_poll_seconds',         '60',                            'Intervalo de polling durante partida (seg)', 'agents',       false);

-- ─── JOGOS ────────────────────────────────────

CREATE TYPE match_status      AS ENUM ('scheduled','live','finished','cancelled','postponed');
CREATE TYPE match_competition AS ENUM ('BRASILEIRAO','COPA_BRASIL','LIBERTADORES','SUL_AMERICANA','PAULISTAO','AMISTOSO','OUTRO');

CREATE TABLE matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(50),
    competition     match_competition DEFAULT 'BRASILEIRAO',
    season          VARCHAR(10) DEFAULT '2026',
    round_number    INTEGER,
    round_label     VARCHAR(50),
    home_team       VARCHAR(100) NOT NULL,
    away_team       VARCHAR(100) NOT NULL,
    home_team_logo  TEXT,
    away_team_logo  TEXT,
    match_date      TIMESTAMPTZ NOT NULL,
    stadium         VARCHAR(150),
    city            VARCHAR(100),
    tv_channel      VARCHAR(100),
    radio_url       TEXT DEFAULT 'http://www.radiocoringao.com.br',
    status          match_status DEFAULT 'scheduled',
    home_score      INTEGER,
    away_score      INTEGER,
    bolao_closed_at TIMESTAMPTZ,
    bolao_open      BOOLEAN DEFAULT TRUE,
    match_stats     JSONB DEFAULT '{}',
    match_events    JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOLÃO ────────────────────────────────────

CREATE TABLE predictions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score   INTEGER NOT NULL CHECK (home_score >= 0),
    away_score   INTEGER NOT NULL CHECK (away_score >= 0),
    change_count INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE TABLE match_scores (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    points         INTEGER NOT NULL DEFAULT 0,
    is_sole_winner BOOLEAN DEFAULT FALSE,
    predicted_home INTEGER NOT NULL,
    predicted_away INTEGER NOT NULL,
    actual_home    INTEGER NOT NULL,
    actual_away    INTEGER NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE TABLE season_ranking (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season       VARCHAR(10) NOT NULL DEFAULT '2026',
    total_points INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won    INTEGER DEFAULT 0,
    sole_wins    INTEGER DEFAULT 0,
    position     INTEGER,
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season)
);

-- ─── NOTÍCIAS & AI ────────────────────────────

CREATE TYPE news_category AS ENUM ('news','match_preview','retrospect','trivia','transfer');

CREATE TABLE news_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(300) NOT NULL,
    summary     TEXT,
    content     TEXT,
    source_url  TEXT,
    image_url   TEXT,
    category    news_category DEFAULT 'news',
    is_approved BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    fetched_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE TABLE ai_content (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type         VARCHAR(50) NOT NULL,
    match_id     UUID REFERENCES matches(id),
    content_json JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours'
);

-- ─── AUDITORIA ────────────────────────────────

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    module      VARCHAR(50)  NOT NULL,
    description TEXT,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ──────────────────────────────────

CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_users_nick          ON users(nick);
CREATE INDEX idx_matches_date        ON matches(match_date);
CREATE INDEX idx_matches_status      ON matches(status);
CREATE INDEX idx_predictions_match   ON predictions(match_id);
CREATE INDEX idx_predictions_user    ON predictions(user_id);
CREATE INDEX idx_match_scores_match  ON match_scores(match_id);
CREATE INDEX idx_season_ranking      ON season_ranking(season, total_points DESC);
CREATE INDEX idx_news_cache_cat      ON news_cache(category, fetched_at DESC);
CREATE INDEX idx_audit_user          ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_module        ON audit_logs(module, created_at DESC);

-- ─── TRIGGER updated_at ───────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matches_upd  BEFORE UPDATE ON matches     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pred_upd     BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── REGRA: somente 1 MASTER no sistema ───────

CREATE OR REPLACE FUNCTION enforce_single_master()
RETURNS TRIGGER AS $fn$
DECLARE v_role_name VARCHAR;
BEGIN
  SELECT name INTO v_role_name FROM roles WHERE id = NEW.role_id;
  IF v_role_name = 'MASTER' THEN
    IF EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'MASTER' AND ur.user_id <> NEW.user_id) THEN
      RAISE EXCEPTION 'Já existe um usuário MASTER no sistema. Apenas 1 é permitido.';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_master
BEFORE INSERT ON user_roles
FOR EACH ROW EXECUTE FUNCTION enforce_single_master();


-- SMTP Email settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
  ('smtp_host',       '',                       'Servidor SMTP (ex: smtp.gmail.com)',         'email', false),
  ('smtp_port',       '587',                    'Porta SMTP (587=TLS, 465=SSL, 25=sem cript)','email', false),
  ('smtp_user',       '',                       'Usuário/email da conta SMTP',                'email', false),
  ('smtp_pass',       '',                       'Senha ou app-password da conta SMTP',        'email', false),
  ('smtp_from_name',  'Fiel Rio Pardo',         'Nome do remetente nos emails',               'email', false),
  ('smtp_from_email', 'noreply@fielriopardo.com.br', 'Email remetente',                       'email', false),
  ('email_welcome_enabled', 'true',             'Enviar email de boas-vindas ao cadastrar',   'email', false),
  ('email_bolao_open_enabled', 'true',          'Notificar participantes quando bolão abrir', 'email', false),
  ('email_result_enabled',  'true',             'Enviar resultado e ranking após jogo',       'email', false)
ON CONFLICT (key) DO NOTHING;

-- ── Caravanas (added 2026-04-05) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS caravans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  match_id      UUID REFERENCES matches(id) ON DELETE SET NULL,
  departure_city VARCHAR(100) NOT NULL,
  departure_point TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  return_datetime    TIMESTAMPTZ,
  price         NUMERIC(10,2) DEFAULT 0,
  capacity      INT DEFAULT 50,
  spots_taken   INT DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','full','cancelled','completed')),
  contact_whatsapp VARCHAR(30),
  contact_name     VARCHAR(100),
  cover_image      TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caravan_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caravan_id  UUID REFERENCES caravans(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     VARCHAR(300),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200),
  description TEXT,
  url         TEXT NOT NULL,
  category    VARCHAR(50) DEFAULT 'geral',
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
