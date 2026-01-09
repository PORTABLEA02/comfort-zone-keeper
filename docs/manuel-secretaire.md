# Manuel d'Utilisation - Secrétaire

## Introduction

Bienvenue dans le manuel d'utilisation du profil **Secrétaire** de cmf. En tant que secrétaire, vous êtes le premier point de contact des patients et vous gérez les aspects administratifs de la clinique.

---

## Accès au Système

### Connexion
1. Accédez à l'application via votre navigateur
2. Entrez votre adresse email
3. Entrez votre mot de passe
4. Cliquez sur **Se connecter**

### Déconnexion
- Cliquez sur le bouton **Déconnexion** en bas de la barre latérale gauche

---

## Menu Principal

### 1. Patients
Gestion des dossiers patients :

#### Consulter la liste des patients
- Visualisez tous les patients enregistrés
- Utilisez la barre de recherche pour trouver un patient par :
  - Nom ou prénom
  - Numéro de téléphone
- Filtrez par critères (genre, groupe sanguin, etc.)

#### Ajouter un nouveau patient
Lorsqu'un nouveau patient arrive :

1. Cliquez sur **Nouveau Patient**
2. Remplissez les informations obligatoires :
   - **Prénom** : prénom du patient
   - **Nom** : nom de famille
   - **Date de naissance** : format JJ/MM/AAAA
   - **Genre** : Masculin ou Féminin
   - **Téléphone** : numéro de contact principal
   - **Adresse** : adresse complète
   - **Contact d'urgence** : nom et téléphone d'un proche
3. Ajoutez les informations optionnelles :
   - **Email** : adresse électronique
   - **Groupe sanguin** : si connu
   - **Allergies** : allergies connues (important pour les médecins)
4. Cliquez sur **Enregistrer**

#### Modifier les informations d'un patient
1. Recherchez et cliquez sur le patient
2. Cliquez sur **Modifier**
3. Mettez à jour les informations nécessaires
4. Cliquez sur **Enregistrer**

#### Consulter le dossier d'un patient
En cliquant sur un patient, vous pouvez voir :
- Ses informations personnelles
- Son historique de consultations
- Ses rendez-vous passés et à venir
- Ses factures

### 2. Rendez-vous
Gestion du calendrier de la clinique :

#### Voir le calendrier
- **Vue jour** : détails de tous les rendez-vous du jour
- **Vue semaine** : aperçu de la semaine
- **Vue mois** : planification mensuelle
- Filtrez par médecin pour voir uniquement ses rendez-vous

#### Statuts des rendez-vous
- **Programmé** (bleu) : rendez-vous créé
- **Confirmé** (vert) : confirmé par le patient ou la clinique
- **Terminé** (gris) : consultation effectuée
- **Annulé** (rouge) : rendez-vous annulé
- **Non présenté** (orange) : patient absent

#### Créer un rendez-vous
1. Cliquez sur **Nouveau Rendez-vous**
2. Remplissez les informations :
   - **Patient** : sélectionnez dans la liste ou créez-en un nouveau
   - **Médecin** : choisissez le médecin concerné
   - **Date** : sélectionnez la date souhaitée
   - **Heure** : choisissez l'heure du rendez-vous
   - **Durée** : durée prévue (par défaut 30 minutes)
   - **Motif** : raison de la consultation
   - **Notes** : informations supplémentaires (optionnel)
3. Cliquez sur **Enregistrer**

#### Gérer un rendez-vous existant
- **Confirmer** : après confirmation téléphonique du patient
- **Modifier** : changer la date, l'heure ou le médecin
- **Annuler** : en cas d'annulation
- **Marquer non présenté** : si le patient ne vient pas

---

## Menu Médical

### 3. Consultations en Attente (Workflow)
Suivi du parcours patient dans la clinique :

#### Comprendre le workflow
Le workflow représente le parcours du patient depuis son arrivée jusqu'à la fin de sa consultation :

```
Arrivée patient → Création facture → Paiement → Signes vitaux → Assignation médecin → Consultation
```

#### Statuts du workflow
1. **En attente de paiement** : facture créée, patient doit payer
2. **En attente de signes vitaux** : paiement effectué, en attente des constantes
3. **En attente d'assignation** : signes vitaux pris, doit être assigné à un médecin
4. **En attente de consultation** : assigné, attend le médecin
5. **En consultation** : le médecin a pris en charge le patient
6. **Terminé** : consultation terminée

#### Vos actions dans le workflow
- **Voir les détails** : consulter les informations de la consultation
- **Assigner un médecin** : assigner le patient à un médecin disponible
- **Suivre l'avancement** : voir où en est chaque patient

### 4. Traitements
Visualisation des traitements programmés :
- Liste des sessions de traitement planifiées
- État de chaque session (programmé, en cours, terminé)
- Historique des traitements

---

## Menu Gestion

### 5. Facturation
Gestion des factures et paiements :

#### Créer une facture
1. Cliquez sur **Nouvelle Facture**
2. Sélectionnez le patient
3. Choisissez le type de facture :
   - **Ordinaire** : pour les achats de médicaments ou services divers
   - **Consultation générale** : pour une consultation standard
   - **Consultation gynécologique** : pour une consultation spécialisée
4. Ajoutez les éléments :
   - **Services médicaux** : sélectionnez dans la liste
   - **Médicaments** : si le patient achète des médicaments
5. Vérifiez le sous-total, les taxes et le total
6. Cliquez sur **Enregistrer**

> **Important** : Pour les factures de type "Consultation", le système crée automatiquement une entrée dans le workflow une fois le paiement effectué.

#### Enregistrer un paiement
1. Ouvrez la facture concernée
2. Cliquez sur **Enregistrer un paiement**
3. Sélectionnez le mode de paiement :
   - **Espèces** : paiement en liquide
   - **Carte bancaire** : paiement par carte
   - **Mobile Money** : Orange Money, MTN Money, etc.
   - **Virement bancaire** : transfert bancaire
   - **Chèque** : paiement par chèque
4. Entrez le montant payé
5. Ajoutez une référence si nécessaire (numéro de transaction)
6. Cliquez sur **Confirmer le paiement**

#### Paiements partiels
- Il est possible d'enregistrer des paiements partiels
- La facture reste en statut "En attente" jusqu'au paiement complet
- L'historique des paiements est conservé

#### Consulter les factures
- **Toutes les factures** : liste complète
- **En attente** : factures non payées
- **Payées** : factures soldées
- **En retard** : factures non payées après la date d'échéance

#### Statistiques
- Total des revenus du jour
- Montant en attente de paiement
- Nombre de factures par statut

### 6. Inventaire
Consultation du stock de médicaments et fournitures :

#### Consulter le stock
- Liste de tous les produits disponibles
- Quantités en stock
- Alertes pour les stocks bas
- Produits proches de l'expiration

#### Informations affichées
- Nom du produit
- Catégorie
- Stock actuel
- Stock minimum
- Prix unitaire
- Date d'expiration
- Emplacement

---

## Processus Quotidiens

### Accueil d'un patient pour consultation

#### Cas 1 : Nouveau patient
1. Créez le dossier patient (**Patients** → **Nouveau Patient**)
2. Créez la facture de consultation (**Facturation** → **Nouvelle Facture**)
3. Sélectionnez le type de consultation approprié
4. Encaissez le paiement
5. Le patient apparaît dans le workflow
6. Dirigez le patient vers l'infirmier pour les signes vitaux

#### Cas 2 : Patient existant
1. Recherchez le patient dans la liste
2. Vérifiez/mettez à jour ses informations si nécessaire
3. Créez la facture de consultation
4. Encaissez le paiement
5. Le patient apparaît dans le workflow
6. Dirigez le patient vers l'infirmier

### Accueil d'un patient pour achat de médicaments
1. Recherchez ou créez le dossier patient
2. Créez une facture de type **Ordinaire**
3. Ajoutez les médicaments demandés
4. Encaissez le paiement
5. Remettez les médicaments au patient

### Prise de rendez-vous téléphonique
1. Identifiez ou créez le dossier du patient
2. Vérifiez les disponibilités du médecin souhaité
3. Créez le rendez-vous
4. Confirmez les détails avec le patient
5. Envoyez un rappel si nécessaire

### Gestion des rendez-vous du jour
1. Consultez la liste des rendez-vous du jour
2. Appelez les patients pour confirmation (si pas déjà fait)
3. Mettez à jour les statuts (confirmé, annulé)
4. Préparez les dossiers des patients attendus

---

## Workflow de Consultation - Rôle de la Secrétaire

```
┌─────────────────────────────────────────────────────────────┐
│                    ARRIVÉE DU PATIENT                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. VÉRIFICATION/CRÉATION DOSSIER PATIENT (Secrétaire)     │
│     - Nouveau patient : créer le dossier                    │
│     - Patient existant : vérifier les informations          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CRÉATION DE LA FACTURE (Secrétaire)                     │
│     - Sélectionner le type de consultation                  │
│     - Ajouter les services                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ENCAISSEMENT DU PAIEMENT (Secrétaire)                   │
│     - Encaisser le montant                                  │
│     - Enregistrer le mode de paiement                       │
│     → Le workflow est automatiquement créé                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. PRISE DES SIGNES VITAUX (Infirmier)                     │
│     - Tension, température, poids, etc.                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. ASSIGNATION AU MÉDECIN (Secrétaire ou Infirmier)        │
│     - Choisir le médecin disponible                         │
│     - Selon la spécialité requise                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. CONSULTATION (Médecin)                                  │
│     - Examen du patient                                     │
│     - Création du dossier médical                           │
│     - Prescription si nécessaire                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Bonnes Pratiques

### À l'accueil
- Accueillez chaque patient avec le sourire
- Vérifiez l'identité du patient
- Confirmez le motif de la visite
- Informez sur le temps d'attente estimé

### Gestion des données
- Saisissez les informations avec précision
- Vérifiez les numéros de téléphone
- Mettez à jour les informations obsolètes
- Respectez la confidentialité des données médicales

### Facturation
- Vérifiez toujours le montant avant encaissement
- Donnez un reçu pour chaque paiement
- En cas de doute sur un tarif, consultez la liste des services
- Signalez les anomalies à l'administrateur

### Rendez-vous
- Confirmez les rendez-vous la veille
- Prévoyez des créneaux pour les urgences
- Évitez les chevauchements de rendez-vous
- Notez les préférences des patients (médecin, horaires)

### Sécurité
- Ne partagez jamais vos identifiants
- Déconnectez-vous lors de vos pauses
- Ne laissez pas l'écran visible aux patients
- Signalez tout comportement suspect

---

## Questions Fréquentes

### Comment retrouver un patient dont je ne connais que le prénom ?
Utilisez la barre de recherche et tapez le prénom. La recherche fonctionne sur le nom et le prénom.

### Que faire si le patient ne peut pas payer la totalité ?
Vous pouvez enregistrer un paiement partiel. La facture restera en statut "En attente" jusqu'au paiement complet.

### Comment annuler une facture ?
Contactez l'administrateur pour annuler une facture créée par erreur.

### Le patient souhaite changer de médecin, comment faire ?
Avant l'assignation, vous pouvez choisir n'importe quel médecin disponible. Après assignation, contactez l'administrateur.

### Comment gérer un patient qui arrive sans rendez-vous ?
Créez une consultation normale. Les rendez-vous ne sont pas obligatoires pour créer une facture de consultation.

### Où puis-je voir les patients actuellement en attente ?
Consultez la section **Consultations en attente** qui affiche tous les patients dans le workflow.

---

## Support

En cas de problème technique, contactez l'administrateur du système.

---

*Document mis à jour le : Décembre 2025*
*Version de l'application : cmf v1.0*
