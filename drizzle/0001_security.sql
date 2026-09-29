-- Row Level Security : toutes les tables sont verrouillées.
-- L'application accède à la base côté serveur uniquement (rôle propriétaire, non soumis au RLS).
-- Sur Supabase, les clés publiques (anon / authenticated) ne peuvent donc rien lire ni écrire via l'API REST.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','customers','customer_notes','categories','products','product_variants','inventory',
    'events','event_products','promotions','orders','order_items','custom_orders','payments',
    'pickup_slots','notifications','settings','media','messages','counters','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
