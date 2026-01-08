-- Ajouter la colonne antécédents médicaux à la table patients
ALTER TABLE patients 
ADD COLUMN medical_history text[] DEFAULT '{}';

COMMENT ON COLUMN patients.medical_history IS 'Antécédents médicaux du patient (maladies, chirurgies, conditions chroniques)';