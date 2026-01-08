-- Ajouter les colonnes pour le système de contrôle
ALTER TABLE public.medical_records
ADD COLUMN parent_consultation_id uuid REFERENCES public.medical_records(id) ON DELETE SET NULL,
ADD COLUMN is_control boolean NOT NULL DEFAULT false;

-- Index pour améliorer les performances des requêtes sur les contrôles
CREATE INDEX idx_medical_records_parent_consultation ON public.medical_records(parent_consultation_id) WHERE parent_consultation_id IS NOT NULL;

-- Index pour filtrer rapidement les contrôles
CREATE INDEX idx_medical_records_is_control ON public.medical_records(is_control) WHERE is_control = true;

-- Commentaires pour documentation
COMMENT ON COLUMN public.medical_records.parent_consultation_id IS 'Référence vers la consultation parente si ceci est un contrôle';
COMMENT ON COLUMN public.medical_records.is_control IS 'Indique si cette entrée est un contrôle gratuit lié à une consultation parente';