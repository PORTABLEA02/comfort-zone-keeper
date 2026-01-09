# Manuel d'Utilisation - Infirmier(e)

## Introduction

Bienvenue dans le manuel d'utilisation du profil **Infirmier** de cmf. En tant qu'infirmier(e), vous jouez un rôle essentiel dans la prise en charge des patients, notamment pour la prise des signes vitaux et l'administration des traitements.

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

### 1. Mon Tableau de Bord
Votre espace de travail principal :

#### Vue d'ensemble
- **Patients en attente de signes vitaux** : patients ayant payé et attendant la prise des constantes
- **Traitements du jour** : sessions de traitement programmées pour aujourd'hui
- **Statistiques** : nombre de patients traités, signes vitaux pris

#### Actions rapides
- Accès direct aux patients en attente
- Lien vers les traitements du jour
- Notifications importantes

---

## Menu Médical

### 2. Prise des Signes Vitaux
Votre mission principale : enregistrer les constantes des patients avant la consultation.

#### Accéder aux patients en attente
1. Dans votre tableau de bord, section **Patients en attente de signes vitaux**
2. Ou via **Consultations en attente** puis filtrer par statut "En attente de signes vitaux"

#### Prendre les signes vitaux
1. Cliquez sur le patient concerné
2. Cliquez sur **Prendre les signes vitaux**
3. Remplissez les mesures :

   | Mesure | Description | Unité | Valeurs normales |
   |--------|-------------|-------|------------------|
   | **Tension artérielle** | Pression systolique et diastolique | mmHg | 120/80 |
   | **Fréquence cardiaque** | Pouls | bpm | 60-100 |
   | **Température** | Température corporelle | °C | 36.5-37.5 |
   | **Fréquence respiratoire** | Respirations par minute | /min | 12-20 |
   | **Saturation en oxygène** | SpO2 | % | 95-100 |
   | **Poids** | Poids du patient | kg | - |
   | **Taille** | Taille du patient | cm | - |

4. Ajoutez des **notes** si vous observez quelque chose de particulier
5. Cliquez sur **Enregistrer**

#### Après l'enregistrement
- Le patient passe automatiquement au statut "En attente d'assignation"
- Le médecin pourra voir les signes vitaux lors de la consultation
- Les données sont conservées dans l'historique du patient

### 3. Tous les Traitements
Gestion des sessions de traitement :

#### Types de traitements
- Injections
- Perfusions
- Pansements
- Nébulisations
- Kinésithérapie
- Autres soins infirmiers

#### Liste des traitements
- **Programmés** : sessions à venir
- **En cours** : traitements actuellement administrés
- **Terminés** : sessions complétées
- **Annulés** : sessions annulées

#### Administrer un traitement
1. Accédez à **Tous les Traitements**
2. Trouvez la session programmée pour aujourd'hui
3. Cliquez sur la session
4. Vérifiez les informations :
   - Nom du patient
   - Type de traitement
   - Prescription du médecin
   - Numéro de session (ex: 3/10)
5. Cliquez sur **Commencer le traitement**

#### Pendant le traitement
1. Prenez les signes vitaux si nécessaire
2. Administrez le traitement selon la prescription
3. Notez vos observations
4. En cas de réaction anormale, alertez le médecin

#### Terminer un traitement
1. Complétez les observations
2. Notez tout événement particulier
3. Cliquez sur **Terminer la session**
4. Le système enregistre automatiquement l'heure de fin

#### Créer une nouvelle session de traitement
Si prescrit par le médecin :
1. Cliquez sur **Nouvelle Session**
2. Sélectionnez le patient
3. Liez au dossier médical concerné
4. Indiquez :
   - Type de traitement
   - Date programmée
   - Numéro de session
   - Nombre total de sessions
   - Notes du médecin
5. Cliquez sur **Enregistrer**

---

## Menu Gestion

### 4. Facturation
Accès en consultation :

#### Vos droits
- Consulter les factures
- Voir l'historique des paiements
- Vérifier si un patient a payé sa consultation

#### Ce que vous ne pouvez pas faire
- Créer des factures
- Enregistrer des paiements
- Modifier des factures

> **Note** : La facturation est gérée par la secrétaire. Si un patient n'a pas payé, redirigez-le vers l'accueil.

---

## Workflow de Consultation - Rôle de l'Infirmier(e)

```
┌─────────────────────────────────────────────────────────────┐
│  1. ACCUEIL ET PAIEMENT (Secrétaire)                        │
│     - Création du dossier patient                           │
│     - Création et paiement de la facture                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. PRISE DES SIGNES VITAUX (Infirmier) ← VOTRE RÔLE        │
│     - Appelez le patient                                    │
│     - Mesurez les constantes                                │
│     - Enregistrez dans le système                           │
│     - Notez les observations                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ASSIGNATION AU MÉDECIN (Secrétaire ou Infirmier)        │
│     - Choisir le médecin disponible                         │
│     - Informer le patient du temps d'attente                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. CONSULTATION (Médecin)                                  │
│     - Le médecin voit les signes vitaux que vous avez pris  │
│     - Consultation et diagnostic                            │
│     - Prescription si nécessaire                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. SOINS POST-CONSULTATION (Infirmier) ← SI NÉCESSAIRE     │
│     - Administration de traitements                         │
│     - Injections, perfusions, etc.                          │
│     - Suivi des sessions de traitement                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Mon Compte

### Accéder à votre profil
- Cliquez sur **Mon compte** dans le menu système

### Informations modifiables
- Téléphone
- Adresse
- Contact d'urgence

### Informations non modifiables
(Contactez l'administrateur pour les modifier)
- Nom et prénom
- Email
- Département

---

## Procédures Standards

### Prise des signes vitaux - Étapes détaillées

#### 1. Préparation
- Vérifiez que le matériel est propre et fonctionnel
- Lavez-vous les mains
- Accueillez le patient et vérifiez son identité
- Installez le patient confortablement

#### 2. Tension artérielle
- Faites asseoir le patient 5 minutes au repos
- Placez le brassard au niveau du cœur
- Prenez la mesure
- Notez systolique/diastolique (ex: 120/80)

#### 3. Fréquence cardiaque
- Palpez le pouls radial ou utilisez l'oxymètre
- Comptez pendant 1 minute
- Notez le rythme et la régularité

#### 4. Température
- Utilisez le thermomètre approprié
- Attendez le signal
- Notez la valeur

#### 5. Saturation en oxygène
- Placez l'oxymètre au doigt
- Attendez une lecture stable
- Notez le pourcentage

#### 6. Poids et taille
- Faites monter le patient sur la balance
- Mesurez la taille si non connue
- Notez les valeurs

#### 7. Fréquence respiratoire
- Observez les mouvements thoraciques
- Comptez pendant 1 minute
- Notez si respiration normale ou difficile

#### 8. Observations
- Notez l'état général du patient
- Signalez tout signe anormal
- Demandez si douleurs ou symptômes particuliers

### Administration d'un traitement

#### Avant le traitement
1. Vérifiez l'identité du patient
2. Vérifiez la prescription médicale
3. Contrôlez le médicament (nom, dosage, péremption)
4. Préparez le matériel nécessaire
5. Lavez-vous les mains

#### Pendant le traitement
1. Expliquez le soin au patient
2. Installez-le confortablement
3. Administrez le traitement
4. Surveillez les réactions
5. Restez attentif aux signes d'alerte

#### Après le traitement
1. Vérifiez l'état du patient
2. Éliminez le matériel de manière appropriée
3. Lavez-vous les mains
4. Documentez dans le système
5. Informez de la prochaine session si applicable

---

## Valeurs Normales de Référence

| Paramètre | Adulte Normal | Alerte Basse | Alerte Haute |
|-----------|---------------|--------------|--------------|
| **Tension systolique** | 90-140 mmHg | < 90 | > 180 |
| **Tension diastolique** | 60-90 mmHg | < 60 | > 110 |
| **Fréquence cardiaque** | 60-100 bpm | < 50 | > 120 |
| **Température** | 36.5-37.5 °C | < 35 | > 38.5 |
| **SpO2** | 95-100 % | < 92 | - |
| **Fréquence respiratoire** | 12-20 /min | < 10 | > 25 |

> **Important** : En cas de valeurs anormales, informez immédiatement le médecin de garde.

---

## Bonnes Pratiques

### Hygiène
- Lavez-vous les mains avant et après chaque patient
- Désinfectez le matériel entre chaque utilisation
- Portez des gants si nécessaire
- Respectez les protocoles d'hygiène

### Communication
- Présentez-vous au patient
- Expliquez chaque geste
- Soyez à l'écoute des inquiétudes
- Rassurez le patient anxieux

### Documentation
- Enregistrez les données immédiatement
- Soyez précis dans vos mesures
- Notez toute observation anormale
- N'oubliez pas les notes et commentaires

### Vigilance
- Surveillez les signes d'alerte
- Réagissez rapidement aux urgences
- Signalez les anomalies au médecin
- Documentez tout incident

### Confidentialité
- Respectez le secret médical
- Ne discutez pas des patients en public
- Protégez les informations des patients
- Déconnectez-vous du système après utilisation

---

## Situations d'Urgence

### Valeurs critiques
Si vous observez :
- **Tension** > 180/110 ou < 90/60
- **Pouls** > 150 ou < 40
- **SpO2** < 90%
- **Température** > 40°C ou < 35°C

**Actions immédiates** :
1. Ne laissez pas le patient seul
2. Appelez le médecin immédiatement
3. Installez le patient en position de confort
4. Préparez le matériel d'urgence
5. Documentez les événements

### Réaction allergique pendant un traitement
1. Arrêtez immédiatement le traitement
2. Appelez le médecin
3. Surveillez les voies aériennes
4. Préparez l'adrénaline si prescrite
5. Restez avec le patient

---

## Questions Fréquentes

### Je ne trouve pas le patient dans la liste des signes vitaux à prendre ?
Vérifiez que le patient a bien payé sa consultation. Sinon, redirigez-le vers la secrétaire.

### Comment modifier des signes vitaux déjà enregistrés ?
Une fois enregistrés, les signes vitaux ne peuvent plus être modifiés pour des raisons de traçabilité. En cas d'erreur, contactez l'administrateur.

### Le patient refuse la prise de certaines mesures ?
Respectez le choix du patient, notez-le dans les observations, et informez le médecin.

### Comment savoir quels traitements je dois administrer aujourd'hui ?
Consultez votre tableau de bord, section "Traitements du jour", ou accédez à "Tous les Traitements" et filtrez par date.

### Un patient a une réaction pendant le traitement, que faire ?
Arrêtez le traitement, appelez le médecin, et suivez les protocoles d'urgence. Documentez tout dans le système.

---

## Support

En cas de problème technique, contactez l'administrateur du système.

En cas d'urgence médicale, suivez les protocoles de votre établissement.

---

*Document mis à jour le : Décembre 2025*
*Version de l'application : cmf v1.0*
