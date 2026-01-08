-- 1. Ajouter le rôle 'nurse' (infirmier) à l'enum user_role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'nurse';