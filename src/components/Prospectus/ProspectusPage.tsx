import { useRef, useState } from 'react';
import { 
  Download, 
  Heart, 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Pill, 
  CreditCard, 
  Package, 
  UserCog, 
  Shield, 
  Smartphone,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

export function ProspectusPage() {
  const { navigate } = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: 'CliniCare-Prospectus.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true 
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(options).from(contentRef.current).save();
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const features = [
    { 
      icon: Users, 
      title: 'Gestion des Patients', 
      items: ['Dossiers médicaux complets', 'Historique des consultations', 'Informations d\'urgence', 'Allergies et antécédents']
    },
    { 
      icon: Calendar, 
      title: 'Rendez-vous', 
      items: ['Calendrier interactif', 'Rappels automatiques', 'Gestion des créneaux', 'Suivi des statuts']
    },
    { 
      icon: Stethoscope, 
      title: 'Workflow Consultation', 
      items: ['File d\'attente intelligente', 'Prise des constantes', 'Attribution médecin', 'Suivi en temps réel']
    },
    { 
      icon: FileText, 
      title: 'Dossiers Médicaux', 
      items: ['Consultations détaillées', 'Diagnostics et traitements', 'Examens physiques', 'Pièces jointes']
    },
    { 
      icon: Pill, 
      title: 'Prescriptions', 
      items: ['Ordonnances numériques', 'Posologie détaillée', 'Historique complet', 'Export et impression']
    },
    { 
      icon: CreditCard, 
      title: 'Facturation', 
      items: ['Factures automatiques', 'Multi-mode paiement', 'Suivi des impayés', 'Statistiques financières']
    },
    { 
      icon: Package, 
      title: 'Inventaire', 
      items: ['Stock médicaments', 'Alertes de rupture', 'Mouvements de stock', 'Dates d\'expiration']
    },
    { 
      icon: UserCog, 
      title: 'Personnel', 
      items: ['Profils employés', 'Planning horaires', 'Rôles et permissions', 'Suivi des présences']
    }
  ];

  const userProfiles = [
    { role: 'Administrateur', color: 'bg-red-500', permissions: 'Accès complet à tous les modules, gestion des utilisateurs et paramètres' },
    { role: 'Médecin', color: 'bg-blue-500', permissions: 'Consultations, prescriptions, dossiers médicaux, rendez-vous' },
    { role: 'Secrétaire', color: 'bg-green-500', permissions: 'Accueil patients, rendez-vous, facturation, workflow consultation' },
    { role: 'Infirmier(ère)', color: 'bg-purple-500', permissions: 'Constantes vitales, soins infirmiers, suivi traitements' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            <span>{isExporting ? 'Export en cours...' : 'Télécharger PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-8 py-8 bg-white text-gray-900">
        {/* Hero Section */}
        <div className="text-center mb-12 pb-8 border-b-2 border-primary/20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary p-3 rounded-xl">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary">CliniCare</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Solution Complète de Gestion Clinique</p>
          <p className="text-gray-500">Optimisez votre pratique médicale avec une plateforme moderne et intuitive</p>
        </div>

        {/* Presentation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Présentation
          </h2>
          <p className="text-gray-700 leading-relaxed">
            <strong>CliniCare</strong> est une solution logicielle complète conçue pour la gestion des cliniques médicales 
            et cabinets de santé. Elle permet de centraliser toutes les opérations quotidiennes : gestion des patients, 
            rendez-vous, consultations, prescriptions, facturation et inventaire des médicaments. Interface moderne, 
            sécurisée et adaptée aux besoins du personnel médical africain.
          </p>
        </section>

        {/* Features Grid */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Fonctionnalités Principales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <ul className="space-y-1">
                  {feature.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* User Profiles */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Profils Utilisateurs
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {userProfiles.map((profile, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                <div className={`${profile.color} w-3 h-3 rounded-full mt-1.5 flex-shrink-0`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{profile.role}</h3>
                  <p className="text-sm text-gray-600">{profile.permissions}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security & Tech */}
        <section className="mb-10 grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Authentification sécurisée
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Contrôle d'accès par rôle (RBAC)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Chiffrement des données sensibles
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Journalisation des actions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Sauvegarde automatique
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Caractéristiques Techniques
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">◆</span>
                Application web responsive
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">◆</span>
                React + TypeScript + Tailwind CSS
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">◆</span>
                Base de données Supabase (PostgreSQL)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">◆</span>
                Synchronisation temps réel
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">◆</span>
                Compatible mobile et tablette
              </li>
            </ul>
          </div>
        </section>

        {/* Local Adaptations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Adaptations Locales
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">FCFA</div>
              <p className="text-sm text-gray-600">Devise locale</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">🇫🇷</div>
              <p className="text-sm text-gray-600">Interface en français</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">📱</div>
              <p className="text-sm text-gray-600">Mobile Money supporté</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">CliniCare</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} CliniCare - Tous droits réservés
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Solution développée pour les professionnels de santé
          </p>
        </div>
      </div>
    </div>
  );
}
