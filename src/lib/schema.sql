-- Tablas para la App VOZ en Supabase (Versión Robusta)

-- 1. Usuarios de la App
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    reputation INTEGER DEFAULT 10,
    wallet_balance DECIMAL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    bio TEXT,
    profile_image TEXT,
    is_creator BOOLEAN DEFAULT FALSE
);

-- 2. Vídeos
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_url TEXT NOT NULL,
    user_handle TEXT NOT NULL,
    description TEXT,
    music TEXT,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_ad BOOLEAN DEFAULT FALSE
);

-- 3. Cola de Moderación
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT, -- Identificador visible (estilo matrícula)
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    user_handle TEXT NOT NULL,
    reported_by TEXT,
    content TEXT,
    report_reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderated_by TEXT, -- Nombre del empleado que moderó
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.1 Penalizaciones a Usuarios
CREATE TABLE IF NOT EXISTS user_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    content_url TEXT,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_handle TEXT NOT NULL,
    receiver_handle TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL,
    video_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ventas de Monedas (Histórico de Stripe)
CREATE TABLE IF NOT EXISTS coin_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    pack_type TEXT NOT NULL,
    price DECIMAL NOT NULL,
    coins INTEGER NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'succeeded',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Empleados (Moderadores/Admin)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role INTEGER DEFAULT 3,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 7. Empresas (Anunciantes)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    address TEXT,
    city TEXT,
    zip TEXT,
    country TEXT,
    phone TEXT,
    contact_email TEXT,
    balance DECIMAL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Campañas (Publicidad)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    budget DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    type TEXT DEFAULT 'video',
    video_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    force_view BOOLEAN DEFAULT FALSE,
    target TEXT,
    impressions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Logs del Sistema (Actividad de empleados)
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Productividad de Empleados
CREATE TABLE IF NOT EXISTS productivity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    cycle_videos INTEGER DEFAULT 0,
    total_videos INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Solicitudes de Canje (Redemptions)
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    method TEXT, -- 'paypal', 'bank_transfer', etc.
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar empleado administrador inicial (password: 123)
-- Usamos INSERT ... ON CONFLICT para no duplicar si el script se corre varias veces
INSERT INTO employees (username, password, role) 
VALUES ('admin', '123', 1)
ON CONFLICT (username) DO NOTHING;
