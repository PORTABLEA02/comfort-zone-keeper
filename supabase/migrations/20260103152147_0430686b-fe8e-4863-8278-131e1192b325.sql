-- Ajouter un nouveau type de facture 'treatment' pour les factures de traitement
ALTER TYPE type_facture ADD VALUE IF NOT EXISTS 'treatment';