-- Drop the overly permissive policies
DROP POLICY IF EXISTS "auth_insert_products" ON products;
DROP POLICY IF EXISTS "auth_update_products" ON products;
DROP POLICY IF EXISTS "auth_delete_products" ON products;

-- Create admin-only policies using the existing has_role function
CREATE POLICY "admin_insert_products" ON products 
  FOR INSERT 
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_products" ON products 
  FOR UPDATE 
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_products" ON products 
  FOR DELETE 
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));