-- Allow HR to manage non-admin roles while keeping admin role protected.

DROP POLICY IF EXISTS "HR can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "HR can insert non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "HR can delete non-admin roles" ON public.user_roles;

CREATE POLICY "HR can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "HR can insert non-admin roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'hr'::app_role)
    AND role <> 'admin'::app_role
  );

CREATE POLICY "HR can delete non-admin roles"
  ON public.user_roles
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'hr'::app_role)
    AND role <> 'admin'::app_role
  );
