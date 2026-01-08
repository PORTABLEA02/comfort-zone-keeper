-- Update treatment_sessions INSERT policy to include secretary
DROP POLICY IF EXISTS "Staff can create treatment sessions" ON public.treatment_sessions;

CREATE POLICY "Staff can create treatment sessions" 
ON public.treatment_sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'nurse', 'secretary')
  )
);

-- Update treatment_sessions UPDATE policy to include secretary
DROP POLICY IF EXISTS "Staff can update treatment sessions" ON public.treatment_sessions;

CREATE POLICY "Staff can update treatment sessions" 
ON public.treatment_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'nurse', 'secretary')
  )
);