-- Kon Club CMS: edición activa, borradores y archivo desde Paprika.
-- Migración aplicada en Supabase Kon Club el 21/10/2026.
-- NO modifica kon_events, kon_orders, pagos, Sheets ni Gmail.
CREATE TABLE IF NOT EXISTS public.kon_editions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text UNIQUE NOT NULL CHECK(slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 archive_number integer UNIQUE CHECK(archive_number>=17),
 title text NOT NULL DEFAULT '',
 film_title text NOT NULL DEFAULT '',
 director text NOT NULL DEFAULT '',
 film_year integer CHECK(film_year BETWEEN 1880 AND 2100),
 tag text NOT NULL DEFAULT 'KON CLUB / CINE',
 headline text NOT NULL DEFAULT '',
 synopsis text NOT NULL DEFAULT '',
 starts_at timestamptz,
 ends_at timestamptz,
 address text NOT NULL DEFAULT '',
 price_ars integer CHECK(price_ars BETWEEN 0 AND 1000000),
 flyer_url text,
 logo_url text,
 ticket_url text,
 palette jsonb NOT NULL DEFAULT '{"bg":"#191919","on":"#f5f2ed","paper":"#dad7d1","ink":"#191919","accent":"#96745d","secondary":"#6b6b6b"}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at>starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS kon_editions_one_published ON public.kon_editions((status)) WHERE status='published';
CREATE INDEX IF NOT EXISTS kon_editions_archive_sort ON public.kon_editions(archive_number DESC) WHERE status='archived';
ALTER TABLE public.kon_editions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.kon_editions FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.kon_editions TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('kon-edition-media','kon-edition-media',true,10485760,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.kon_publish_edition(p_id uuid)
RETURNS public.kon_editions LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp'
AS $$
DECLARE v_new public.kon_editions%ROWTYPE; v_live public.kon_editions%ROWTYPE;
BEGIN
 SELECT * INTO v_new FROM public.kon_editions WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR v_new.status<>'draft' THEN RAISE EXCEPTION 'edition_not_draft'; END IF;
 IF btrim(v_new.film_title)='' OR btrim(v_new.headline)='' OR v_new.starts_at IS NULL OR v_new.ends_at IS NULL
  OR btrim(v_new.address)='' OR v_new.flyer_url IS NULL OR v_new.price_ars IS NULL OR v_new.starts_at>=v_new.ends_at
 THEN RAISE EXCEPTION 'edition_missing_required_content'; END IF;
 IF v_new.starts_at<=now()-interval '6 hours' THEN RAISE EXCEPTION 'edition_date_is_past'; END IF;
 PERFORM pg_advisory_xact_lock(20261021,17);
 SELECT * INTO v_live FROM public.kon_editions WHERE status='published' FOR UPDATE;
 IF FOUND THEN UPDATE public.kon_editions SET status='archived',updated_at=now() WHERE id=v_live.id; END IF;
 UPDATE public.kon_editions SET status='published',
 archive_number=COALESCE(archive_number,(SELECT GREATEST(36,COALESCE(MAX(archive_number),36))+1 FROM public.kon_editions)),
 published_at=now(),updated_at=now()
 WHERE id=p_id RETURNING * INTO v_new;
 RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.kon_publish_edition(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kon_publish_edition(uuid) TO service_role;

INSERT INTO public.kon_editions(slug,status,archive_number,title,film_title,director,film_year,tag,headline,synopsis,starts_at,ends_at,address,price_ars,flyer_url,logo_url,ticket_url,palette)
VALUES('halloween','published',36,
'LA CASA LOBO × THE ROCKY HORROR PICTURE SHOW','LA CASA LOBO × THE ROCKY HORROR PICTURE SHOW','',NULL,'HALLOWEEN / DOBLE FUNCIÓN','EL KON|SE DISFRAZA.','',
'2026-10-25 20:00:00+00','2026-10-26 02:00:00+00','VIRREY OLAGUER Y FELIÚ 3121 · BUENOS AIRES',9000,
'/public/media/df27d971f6912f.webp','/public/media/8e47e9d7df2efb.png','/checkout.html',
'{"bg":"#230519","on":"#fff4e6","paper":"#f4dec4","ink":"#291021","accent":"#f26c37","secondary":"#d64350"}'::jsonb)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO public.kon_editions(slug,status,title,film_title,director,film_year,tag,headline,synopsis,starts_at,ends_at,address,price_ars,palette)
VALUES('hundreds-of-beavers-20261108','draft','HUNDREDS OF BEAVERS','HUNDREDS OF BEAVERS','Mike Cheslik',2022,
'KON CLUB / CINE','HUNDREDS|OF BEAVERS','','2026-11-08 21:00:00+00','2026-11-09 02:00:00+00',
'VIRREY OLAGUER Y FELIÚ 3121 · BUENOS AIRES',9000,
'{"bg":"#191919","on":"#f5f2ed","paper":"#d8d6d2","ink":"#191919","accent":"#94765c","secondary":"#595959"}'::jsonb)
ON CONFLICT(slug) DO NOTHING;
