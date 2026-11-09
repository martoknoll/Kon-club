-- Kon Club: transactional emails for FUTURE editions only.
-- Hard-excludes Halloween, staging and Hundreds of Beavers.
-- Does not enqueue retrospective emails or activate ticket sales.
-- The Gmail sender and global mail settings remain unchanged.
CREATE OR REPLACE FUNCTION public.kon_queue_transactional_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $function$
DECLARE
  v_enabled boolean;
  v_event public.kon_events%rowtype;
  v_kind text;
BEGIN
  SELECT enabled INTO v_enabled FROM public.kon_mail_settings WHERE id=1;
  IF NOT coalesce(v_enabled,false) THEN RETURN new; END IF;
  SELECT * INTO v_event FROM public.kon_events WHERE id=new.event_id;
  IF NOT found OR v_event.slug IN ('halloween','halloween-staging','beavers')
     OR v_event.starts_at IS NULL
     OR v_event.starts_at <= now()
     OR v_event.starts_at < timestamptz '2026-11-09 00:00:00+00'
     OR new.deleted_at IS NOT NULL
     OR new.email IS NULL
     OR new.email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR new.email ~* '@example\.(invalid|test)$'
  THEN RETURN new; END IF;
  IF tg_op='INSERT' AND new.status='pending' THEN
    v_kind='received';
  ELSIF tg_op='UPDATE' AND old.status IS DISTINCT FROM new.status
       AND new.status IN ('verified','courtesy') THEN
    v_kind=new.status;
  ELSE
    RETURN new;
  END IF;
  INSERT INTO public.kon_mail_outbox(order_id,kind,recipient_email)
  VALUES(new.id,v_kind,new.email)
  ON CONFLICT (order_id,kind) DO NOTHING;
  RETURN new;
END;
$function$;

-- The mailer may claim only emails for future, non-deleted, approved editions.
-- Previously queued items for ended/excluded dates are SKIPPED rather than sent.
CREATE OR REPLACE FUNCTION public.kon_claim_next_email(p_lease_sha256 text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $function$
DECLARE
  v public.kon_mail_outbox%rowtype;
  v_order public.kon_orders%rowtype;
  v_event public.kon_events%rowtype;
  v_settings public.kon_mail_settings%rowtype;
  v_ineligible boolean;
BEGIN
  IF p_lease_sha256 !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_lease';
  END IF;
  SELECT * INTO v_settings FROM public.kon_mail_settings WHERE id=1;
  IF NOT found OR NOT v_settings.enabled THEN RETURN null; END IF;
  LOOP
    SELECT * INTO v FROM public.kon_mail_outbox
     WHERE state='queued'
     ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1;
    IF NOT found THEN RETURN null; END IF;
    SELECT * INTO v_order FROM public.kon_orders WHERE id=v.order_id;
    IF v_order.id IS NOT NULL THEN
      SELECT * INTO v_event FROM public.kon_events WHERE id=v_order.event_id;
    ELSE
      v_event := null;
    END IF;
    v_ineligible := v_order.id IS NULL OR v_event.id IS NULL
      OR v_event.slug IN ('halloween','halloween-staging','beavers')
      OR v_event.starts_at IS NULL
      OR v_event.starts_at <= now()
      OR v_event.starts_at < timestamptz '2026-11-09 00:00:00+00'
      OR v_order.deleted_at IS NOT NULL
      OR lower(coalesce(v_order.email,'')) <> lower(v.recipient_email)
      OR v_order.email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      OR v_order.email ~* '@example\.(invalid|test)$';
    IF v.kind='received' THEN
      v_ineligible := v_ineligible OR v_order.status<>'pending';
    ELSIF v.kind='verified' THEN
      v_ineligible := v_ineligible OR v_order.status<>'verified';
    ELSIF v.kind='courtesy' THEN
      v_ineligible := v_ineligible OR v_order.status<>'courtesy';
    ELSIF v.kind='reminder' THEN
      v_ineligible := v_ineligible
        OR v_order.status NOT IN ('verified','courtesy')
        OR NOT coalesce(v_settings.reminders_enabled,false)
        OR v_settings.reminder_approved_starts_at IS DISTINCT FROM v_event.starts_at
        OR now()<v_event.starts_at-interval '24 hours'
        OR now()>=v_event.starts_at-interval '22 hours'
        OR NOT exists(
          SELECT 1 FROM public.kon_order_lines l
          JOIN public.kon_products p ON p.id=l.product_id
          WHERE l.order_id=v_order.id AND p.slug IN ('general','post') AND l.quantity>0
        );
    ELSE
      v_ineligible := true;
    END IF;
    IF v_ineligible THEN
      UPDATE public.kon_mail_outbox
        SET state='skipped',last_error='event_or_order_not_eligible_for_delivery'
        WHERE id=v.id;
      CONTINUE;
    END IF;
    UPDATE public.kon_mail_outbox
      SET state='sending',lease_sha256=p_lease_sha256,
          leased_at=now(),attempts=attempts+1 WHERE id=v.id;
    RETURN jsonb_build_object(
      'id',v.id,'order_id',v.order_id,'kind',v.kind,'recipient',v.recipient_email);
  END LOOP;
END;
$function$;

-- Reminders require an explicitly approved event datetime, not a hardcoded slug.
-- Existing approval is the old Halloween datetime, so no new reminders are enabled.
CREATE OR REPLACE FUNCTION public.kon_queue_due_reminders(p_at timestamptz DEFAULT now())
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $function$
DECLARE
  v_event public.kon_events%rowtype;
  v_settings public.kon_mail_settings%rowtype;
  v_count integer:=0;
BEGIN
  SELECT * INTO v_settings FROM public.kon_mail_settings WHERE id=1;
  IF NOT found OR NOT coalesce(v_settings.enabled,false)
     OR NOT coalesce(v_settings.reminders_enabled,false)
     OR v_settings.reminder_approved_starts_at IS NULL
  THEN RETURN 0; END IF;
  SELECT * INTO v_event FROM public.kon_events
   WHERE starts_at=v_settings.reminder_approved_starts_at
     AND slug NOT IN ('halloween','halloween-staging','beavers')
     AND starts_at > now()
     AND starts_at >= timestamptz '2026-11-09 00:00:00+00'
     AND btrim(coalesce(address,''))<>''
   ORDER BY created_at DESC LIMIT 1;
  IF NOT found THEN RETURN 0; END IF;
  IF p_at < v_event.starts_at-interval '24 hours'
     OR p_at >= v_event.starts_at-interval '22 hours'
     OR p_at >= v_event.starts_at THEN RETURN 0; END IF;
  INSERT INTO public.kon_mail_outbox(order_id,kind,recipient_email)
  SELECT o.id,'reminder',o.email FROM public.kon_orders o
  WHERE o.event_id=v_event.id AND o.deleted_at IS NULL
    AND o.status IN ('verified','courtesy')
    AND o.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND o.email !~* '@example\.(invalid|test)$'
    AND exists(
      SELECT 1 FROM public.kon_order_lines l
      JOIN public.kon_products p ON p.id=l.product_id
      WHERE l.order_id=o.id AND l.quantity>0 AND p.slug IN ('general','post')
    )
  ON CONFLICT (order_id,kind) DO NOTHING;
  GET DIAGNOSTICS v_count = row_count;
  RETURN v_count;
END;
$function$;
