-- Drop the existing nurse-only policy
DROP POLICY IF EXISTS "Nurses can create control medical records" ON public.medical_records;

-- Create a new policy that includes both nurses and secretaries
CREATE POLICY "Nurses and secretaries can create control medical records" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('nurse', 'secretary')
  )
  AND is_control = true
);