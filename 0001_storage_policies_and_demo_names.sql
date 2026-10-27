CREATE POLICY "Anyone can read item images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);
UPDATE public.items SET item_name = 'Engineering Mathematics by R.K. Jain (4th Ed.)' WHERE is_demo AND image_path = 'demo:textbook';
UPDATE public.items SET item_name = 'The C Programming Language (Kernighan & Ritchie)', description = 'Classic C programming reference. Clean pages, slightly worn cover. Great for beginners and lab exams.' WHERE is_demo AND image_path = 'demo:programming';
CREATE OR REPLACE FUNCTION public.fix_demo_names() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_demo AND NEW.image_path = 'demo:textbook' THEN NEW.item_name := 'Engineering Mathematics by R.K. Jain (4th Ed.)'; END IF;
  IF NEW.is_demo AND NEW.image_path = 'demo:programming' THEN NEW.item_name := 'The C Programming Language (Kernighan & Ritchie)'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER fix_demo_names BEFORE INSERT ON public.items FOR EACH ROW EXECUTE FUNCTION public.fix_demo_names();