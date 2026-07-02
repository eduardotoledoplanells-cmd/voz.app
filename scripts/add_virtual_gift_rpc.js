const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projRef = match ? match[1] : 'thiftwzubmvcrdhuwcwm';
  const password = process.env.SUPABASE_DB_PASSWORD || 'VozDatabase2026!';

  const sqlQuery = `
    CREATE OR REPLACE FUNCTION public.send_virtual_gift(
      p_sender_id UUID, 
      p_receiver_id UUID, 
      p_amount INT, 
      p_video_id UUID
    ) RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_sender_wallet_id UUID;
        v_receiver_wallet_id UUID;
        v_amount_microcoins BIGINT;
        v_entries JSONB;
        v_res JSONB;
    BEGIN
        -- 1. Get wallet IDs
        SELECT id INTO v_sender_wallet_id FROM public.wallets WHERE user_id = p_sender_id;
        IF v_sender_wallet_id IS NULL THEN
            RAISE EXCEPTION 'Sender wallet not found';
        END IF;

        SELECT id INTO v_receiver_wallet_id FROM public.wallets WHERE user_id = p_receiver_id;
        IF v_receiver_wallet_id IS NULL THEN
            RAISE EXCEPTION 'Receiver wallet not found';
        END IF;

        v_amount_microcoins := p_amount::BIGINT * 1000;

        -- 2. Construct double-entry JSON
        v_entries := jsonb_build_array(
            jsonb_build_object('wallet_id', v_sender_wallet_id, 'entry_type', 'AVAILABLE', 'amount', -v_amount_microcoins),
            jsonb_build_object('wallet_id', v_receiver_wallet_id, 'entry_type', 'AVAILABLE', 'amount', v_amount_microcoins)
        );

        -- 3. Execute under the core ledger engine (handles locks, balances, history)
        v_res := public.execute_ledger_transaction(
            'video_gift',
            v_entries,
            p_video_id,
            NULL,
            jsonb_build_object('sender_id', p_sender_id, 'receiver_id', p_receiver_id, 'video_id', p_video_id)
        );

        RETURN TRUE;
    END;
    $$;

    NOTIFY pgrst, 'reload schema';
  `;

  const hosts = [
      `db.${projRef}.supabase.co`,
      `db.${projRef}.supabase.net`,
      `aws-0-eu-central-1.pooler.supabase.com`
  ];
  const ports = [5432, 6543];
  let success = false;

  for (const host of hosts) {
      for (const port of ports) {
          console.log(`Connecting to ${host}:${port} with user postgres...`);
          const client = new Client({
              host,
              port,
              user: `postgres.${projRef}`,
              password,
              database: 'postgres',
              ssl: { rejectUnauthorized: false },
              connectionTimeoutMillis: 5000,
          });

          try {
              await client.connect();
              console.log(`✅ Connected successfully to ${host}:${port}! Executing query...`);
              await client.query(sqlQuery);
              await client.end();
              success = true;
              break;
          } catch (err) {
              console.error(`Migration failed for ${host}:${port}:`, err.message);
          }
          
          if (!success) {
              // Try connecting as postgres user without suffix
              console.log(`Connecting to ${host}:${port} with user postgres (no suffix)...`);
              const client2 = new Client({
                  host,
                  port,
                  user: `postgres`,
                  password,
                  database: 'postgres',
                  ssl: { rejectUnauthorized: false },
                  connectionTimeoutMillis: 5000,
              });
              try {
                  await client2.connect();
                  console.log(`✅ Connected successfully as postgres to ${host}:${port}! Executing query...`);
                  await client2.query(sqlQuery);
                  await client2.end();
                  success = true;
                  break;
              } catch (err) {
                  console.error(`Migration failed for ${host}:${port} as postgres:`, err.message);
              }
          }
      }
      if (success) break;
  }

  if (success) {
      console.log("🎉 send_virtual_gift RPC successfully created in Supabase database!");
  } else {
      console.error("❌ Failed to connect to database to apply migration.");
      process.exit(1);
  }
}

run();
