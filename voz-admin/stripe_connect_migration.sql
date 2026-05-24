-- Migración para Stripe Connect

-- Modificaciones en la tabla `users`
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Modificaciones en la tabla `withdrawal_requests` (Repurpose a pagos vía Stripe)
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
ADD COLUMN IF NOT EXISTS stripe_payout_id text,
ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS net_amount numeric(10,2);
