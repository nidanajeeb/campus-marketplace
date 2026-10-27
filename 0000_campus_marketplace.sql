CREATE TABLE public.items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL CHECK (char_length(trim(item_name)) BETWEEN 2 AND 100),
  category text NOT NULL CHECK (category IN ('Books','Electronics','Engineering Tools','Lab Supplies','Stationery','Accessories','Other')),
  price numeric(10,2) NOT NULL CHECK (price >= 0 AND price <= 1000000),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 10 AND 1000),
  seller_name text NOT NULL CHECK (char_length(trim(seller_name)) BETWEEN 2 AND 60),
  image_path text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold')),
  seller_id uuid DEFAULT auth.uid(),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Users insert own items" ON public.items FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND is_demo = false);
CREATE POLICY "Users update own items" ON public.items FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid() AND is_demo = false);
CREATE POLICY "Users delete own items" ON public.items FOR DELETE TO authenticated USING (seller_id = auth.uid());

CREATE TABLE public.item_contacts (
  item_id uuid PRIMARY KEY REFERENCES public.items(item_id) ON DELETE CASCADE,
  seller_contact text NOT NULL CHECK (char_length(trim(seller_contact)) BETWEEN 5 AND 120)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_contacts TO authenticated;
GRANT ALL ON public.item_contacts TO service_role;
ALTER TABLE public.item_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users view contacts" ON public.item_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners insert contact" ON public.item_contacts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.items i WHERE i.item_id = item_contacts.item_id AND i.seller_id = auth.uid()));
CREATE POLICY "Owners update contact" ON public.item_contacts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.items i WHERE i.item_id = item_contacts.item_id AND i.seller_id = auth.uid()));
CREATE POLICY "Owners delete contact" ON public.item_contacts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.items i WHERE i.item_id = item_contacts.item_id AND i.seller_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.reset_demo_items()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.items WHERE is_demo = true;
  WITH ins AS (
    INSERT INTO public.items (item_name, category, price, description, seller_name, image_path, status, seller_id, is_demo, created_at) VALUES
    ('Engineering Mathematics by B.S. Grewal (44th Ed.)','Books',450,'Well-kept copy with light pencil notes in the first three chapters. No torn pages. Ideal for first and second year.','Demo Seller – Aarav','demo:textbook','available',NULL,true, now() - interval '1 hour'),
    ('Casio fx-991ES Plus Scientific Calculator','Electronics',650,'Fully working, exam-approved model. Comes with the original slide cover. Battery replaced last month.','Demo Seller – Priya','demo:calculator','available',NULL,true, now() - interval '5 hours'),
    ('Engineering Drawing Kit with Mini Drafter','Engineering Tools',550,'Mini drafter, compass set, protractor and French curves in a carry case. Used for one semester.','Demo Seller – Rohan','demo:drawingkit','available',NULL,true, now() - interval '1 day'),
    ('White Lab Coat – Size M','Lab Supplies',250,'Cotton lab coat, washed and ironed. Full sleeves, three pockets. Suitable for chemistry and biology labs.','Demo Seller – Sneha','demo:labcoat','available',NULL,true, now() - interval '2 days'),
    ('Let Us C by Yashavant Kanetkar','Books',180,'Classic C programming reference. Clean pages, slightly worn cover. Great for beginners.','Demo Seller – Kabir','demo:programming','available',NULL,true, now() - interval '3 days'),
    ('Laptop Cooling Pad + USB Hub','Accessories',400,'Dual-fan cooling pad with built-in 4-port USB hub. Fits laptops up to 15.6 inches.','Demo Seller – Ananya','demo:laptopacc','available',NULL,true, now() - interval '4 days'),
    ('Drawing Instruments Box (Compass & Divider Set)','Engineering Tools',220,'Metal compass, divider, bow pens and lead holder. All pieces present, no rust.','Demo Seller – Vikram','demo:instruments','sold',NULL,true, now() - interval '6 days'),
    ('Stationery Bundle – Notebooks, Pens & Highlighters','Stationery',150,'Five unused A4 notebooks, ten gel pens and a set of four highlighters. Bought extra by mistake.','Demo Seller – Meera','demo:stationery','available',NULL,true, now() - interval '7 days')
    RETURNING item_id, item_name
  )
  INSERT INTO public.item_contacts (item_id, seller_contact)
  SELECT item_id, 'demo.seller@campus.example (demo listing)' FROM ins;
END; $$;
REVOKE ALL ON FUNCTION public.reset_demo_items() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_demo_items() TO authenticated;
SELECT public.reset_demo_items();