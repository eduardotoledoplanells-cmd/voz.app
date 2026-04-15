-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);

-- Enable RLS (Optional, can be skipped if you want it open, but better enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Allow service_role full access" ON public.notifications 
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow users to read their own notifications (if auth.uid is handle or similar)
-- For now, we manually bypass this using the service role in the API.
