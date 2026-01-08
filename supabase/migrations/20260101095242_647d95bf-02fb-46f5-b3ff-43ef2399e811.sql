-- Allow nurses to create control medical records
CREATE POLICY "Nurses can create control medical records" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'nurse'
  )
  AND is_control = true
);