
-- Fix: Drop restrictive policies and recreate as permissive

-- cv_data
DROP POLICY "Users can view own CV" ON public.cv_data;
DROP POLICY "HR and admin can view all CVs" ON public.cv_data;
DROP POLICY "Users can insert own CV" ON public.cv_data;
DROP POLICY "Users can update own CV" ON public.cv_data;
DROP POLICY "Users can delete own CV" ON public.cv_data;

CREATE POLICY "Users can view own CV" ON public.cv_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR and admin can view all CVs" ON public.cv_data FOR SELECT USING (public.has_role(auth.uid(), 'hr'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own CV" ON public.cv_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CV" ON public.cv_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CV" ON public.cv_data FOR DELETE USING (auth.uid() = user_id);

-- profiles
DROP POLICY "Users can view own profile" ON public.profiles;
DROP POLICY "HR and admin can view all profiles" ON public.profiles;
DROP POLICY "Users can insert own profile" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR and admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'hr'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- user_roles
DROP POLICY "Users can view own roles" ON public.user_roles;
DROP POLICY "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
