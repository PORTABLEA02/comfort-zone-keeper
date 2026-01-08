-- Ajouter les nouveaux champs à la table medical_records
ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS previous_treatment text,
ADD COLUMN IF NOT EXISTS physical_examination text,
ADD COLUMN IF NOT EXISTS lab_orders text;