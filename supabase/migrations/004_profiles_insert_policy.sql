-- =============================================
-- Allow users to insert their own profile
-- This is needed for the upsert when the trigger fails or for manual creation
-- =============================================

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure users can do upsert (update existing)
-- The update policy already exists, but let's make sure it uses WITH CHECK for safety
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
