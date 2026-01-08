-- Créer la table pour les séances de traitement
CREATE TABLE public.treatment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1,
  total_sessions INTEGER,
  scheduled_date DATE NOT NULL,
  performed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'missed')),
  treatment_type TEXT NOT NULL,
  treatment_notes TEXT,
  observations TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  vital_signs_id UUID REFERENCES public.vital_signs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- Activer RLS
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Staff can read treatment sessions"
ON public.treatment_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'doctor', 'nurse', 'secretary')
  )
);

CREATE POLICY "Staff can create treatment sessions"
ON public.treatment_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'doctor', 'nurse')
  )
);

CREATE POLICY "Staff can update treatment sessions"
ON public.treatment_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'doctor', 'nurse')
  )
);

CREATE POLICY "Admins can delete treatment sessions"
ON public.treatment_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_treatment_sessions_updated_at
BEFORE UPDATE ON public.treatment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_treatment_sessions_patient ON public.treatment_sessions(patient_id);
CREATE INDEX idx_treatment_sessions_medical_record ON public.treatment_sessions(medical_record_id);
CREATE INDEX idx_treatment_sessions_status ON public.treatment_sessions(status);
CREATE INDEX idx_treatment_sessions_scheduled_date ON public.treatment_sessions(scheduled_date);
CREATE INDEX idx_treatment_sessions_performed_by ON public.treatment_sessions(performed_by);