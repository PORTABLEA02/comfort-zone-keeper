# CliniCare - Système de Gestion de Clinique Médicale

Un système complet de gestion de clinique médicale développé avec React, TypeScript, Tailwind CSS et Supabase.

## Fonctionnalités

### 🏥 Gestion des Patients
- Enregistrement et modification des informations patients
- Historique médical complet
- Gestion des allergies et groupes sanguins
- Recherche avancée

### 📅 Gestion des Rendez-vous
- Planification des consultations
- Calendrier interactif
- Gestion des statuts (planifié, confirmé, terminé, annulé)
- Vérification automatique des disponibilités

### 🩺 Dossiers Médicaux
- Consultations détaillées
- Prescriptions médicales
- Notes du médecin
- Types de consultation (générale, spécialisée, urgence, suivi)

### 💊 Gestion d'Inventaire
- Stock de médicaments et fournitures médicales
- Alertes de stock faible
- Suivi des dates d'expiration
- Mouvements de stock automatisés

### 💰 Facturation
- Création de factures détaillées
- Gestion des paiements
- Statistiques financières
- Impression des factures

### 👥 Gestion du Personnel
- Profils des employés
- Planning du personnel
- Gestion des rôles et permissions
- Statistiques de performance

### 🔐 Sécurité
- Authentification Supabase
- Contrôle d'accès basé sur les rôles (Admin, Médecin, Secrétaire)
- Politiques de sécurité au niveau base de données (RLS)

## Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd clinicare
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   - Créer un projet sur [Supabase](https://supabase.com)
   - Copier `.env.example` vers `.env`
   - Remplir les variables d'environnement Supabase

4. **Configurer la base de données**
   - Les migrations SQL sont dans le dossier `supabase/migrations/`
   - Exécuter les migrations dans l'ordre dans l'éditeur SQL de Supabase

5. **Démarrer l'application**
```bash
npm run dev
```

## Structure de la Base de Données

### Tables Principales

- **profiles** - Profils utilisateurs étendus
- **patients** - Informations des patients
- **appointments** - Rendez-vous médicaux
- **medical_records** - Dossiers médicaux
- **prescriptions** - Ordonnances
- **medicines** - Inventaire médical
- **stock_movements** - Mouvements de stock
- **invoices** - Factures
- **invoice_items** - Éléments de facturation
- **payments** - Paiements
- **staff_schedules** - Planning du personnel

### Rôles Utilisateur

1. **Administrateur** - Accès complet à toutes les fonctionnalités
2. **Médecin** - Gestion des consultations, prescriptions, accès aux dossiers patients
3. **Secrétaire** - Gestion des patients, rendez-vous, facturation

## Technologies Utilisées

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Première Utilisation

1. **Créer un compte administrateur**
   - Utiliser l'interface d'authentification Supabase
   - Créer le premier utilisateur avec le rôle 'admin'

2. **Configurer la clinique**
   - Aller dans Paramètres > Général
   - Renseigner les informations de la clinique

3. **Ajouter du personnel**
   - Créer des comptes pour les médecins et secrétaires
   - Configurer les départements et spécialités

4. **Initialiser l'inventaire**
   - Ajouter les médicaments et fournitures
   - Configurer les stocks minimums

## Sécurité

Le système utilise Row Level Security (RLS) de Supabase pour garantir que :
- Les utilisateurs ne peuvent accéder qu'aux données autorisées par leur rôle
- Les médecins ne voient que leurs patients et consultations
- Les secrétaires gèrent l'administratif sans accès aux données médicales sensibles
- Les administrateurs ont un contrôle complet

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.