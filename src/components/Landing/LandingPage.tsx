import { useState } from 'react';
import { 
  Heart, 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  CreditCard, 
  Package, 
  Shield,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { AnimateOnScroll } from '../../hooks/useScrollAnimation';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { 
      icon: Users, 
      title: 'Gestion des Patients', 
      description: 'Dossiers médicaux complets avec historique, allergies et antécédents.'
    },
    { 
      icon: Calendar, 
      title: 'Rendez-vous Intelligents', 
      description: 'Calendrier interactif avec rappels automatiques et gestion des créneaux.'
    },
    { 
      icon: Stethoscope, 
      title: 'Workflow Consultation', 
      description: "File d'attente en temps réel, prise des constantes et attribution médecin."
    },
    { 
      icon: FileText, 
      title: 'Dossiers Médicaux', 
      description: 'Consultations détaillées, diagnostics, traitements et pièces jointes.'
    },
    { 
      icon: CreditCard, 
      title: 'Facturation Complète', 
      description: 'Factures automatiques, multi-mode paiement et statistiques financières.'
    },
    { 
      icon: Package, 
      title: 'Gestion de Stock', 
      description: 'Inventaire médicaments, alertes de rupture et suivi des expirations.'
    },
  ];

  const benefits = [
    { icon: Zap, title: 'Rapidité', description: 'Interface optimisée pour une productivité maximale' },
    { icon: Shield, title: 'Sécurité', description: 'Données chiffrées et conformes aux normes médicales' },
    { icon: Clock, title: 'Gain de temps', description: 'Automatisation des tâches répétitives' },
    { icon: TrendingUp, title: 'Croissance', description: 'Statistiques et rapports pour piloter votre activité' },
  ];

  const testimonials = [
    { 
      name: 'Dr. Aminata Diallo', 
      role: 'Médecin Généraliste',
      content: "CliniCare a révolutionné notre pratique. La gestion des rendez-vous et des dossiers patients n'a jamais été aussi simple.",
      rating: 5
    },
    { 
      name: 'Marie Kouadio', 
      role: 'Secrétaire Médicale',
      content: "L'interface est intuitive et le workflow de consultation nous fait gagner un temps précieux chaque jour.",
      rating: 5
    },
    { 
      name: 'Dr. Ibrahim Touré', 
      role: 'Directeur de Clinique',
      content: 'Les statistiques et rapports nous permettent de prendre des décisions éclairées pour notre établissement.',
      rating: 5
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">CliniCare</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">Avantages</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Témoignages</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <button
                onClick={onLogin}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Se connecter
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors py-2">Fonctionnalités</a>
              <a href="#benefits" className="block text-muted-foreground hover:text-foreground transition-colors py-2">Avantages</a>
              <a href="#testimonials" className="block text-muted-foreground hover:text-foreground transition-colors py-2">Témoignages</a>
              <a href="#contact" className="block text-muted-foreground hover:text-foreground transition-colors py-2">Contact</a>
              <button
                onClick={onLogin}
                className="w-full px-5 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AnimateOnScroll animation="fade-down" duration={500}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Solution complète de gestion clinique</span>
              </div>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Gérez votre clinique
                <span className="block text-gradient-primary">en toute simplicité</span>
              </h1>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="fade-up" delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                CliniCare centralise toutes vos opérations médicales : patients, rendez-vous, consultations, 
                prescriptions et facturation. Une interface moderne adaptée aux professionnels de santé africains.
              </p>
            </AnimateOnScroll>
            
            <AnimateOnScroll animation="scale" delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onLogin}
                  className="w-full sm:w-auto px-8 py-4 btn-gradient rounded-xl text-lg font-semibold flex items-center justify-center gap-2 group"
                >
                  Commencer maintenant
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 border-2 border-border rounded-xl text-lg font-semibold text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center"
                >
                  Découvrir les fonctionnalités
                </a>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Hero Visual */}
          <AnimateOnScroll animation="fade-up" delay={400} className="mt-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl"></div>
              <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="ml-4 text-sm text-muted-foreground">CliniCare Dashboard</span>
                </div>
                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Patients', value: '1,234', color: 'bg-primary' },
                    { label: "RDV Aujourd'hui", value: '28', color: 'bg-secondary' },
                    { label: 'Consultations', value: '156', color: 'bg-accent' },
                    { label: 'Revenus (FCFA)', value: '2.4M', color: 'bg-success' },
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-muted/30 rounded-xl">
                      <div className={`w-3 h-3 ${stat.color} rounded-full mx-auto mb-3`}></div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d outils pour gérer efficacement votre établissement de santé
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimateOnScroll 
                key={index} 
                animation="fade-up" 
                delay={index * 100}
              >
                <div className="bg-card p-6 rounded-2xl border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Pourquoi choisir CliniCare ?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Conçu spécifiquement pour les cliniques africaines, CliniCare combine puissance et simplicité 
                  pour vous permettre de vous concentrer sur l essentiel : vos patients.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  {benefits.map((benefit, index) => (
                    <AnimateOnScroll key={index} animation="fade-up" delay={index * 100}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    </AnimateOnScroll>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={200}>
              <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-8 rounded-3xl">
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Adapté à votre contexte
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Devise locale (FCFA) intégrée',
                      'Interface entièrement en français',
                      'Support Mobile Money (Orange, MTN, Wave)',
                      'Fonctionne sur mobile et tablette',
                      'Synchronisation temps réel',
                      'Sauvegarde automatique des données'
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des professionnels de santé nous font confiance au quotidien
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimateOnScroll 
                key={index} 
                animation="scale" 
                delay={index * 150}
              >
                <div className="bg-card p-6 rounded-2xl border border-border h-full">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="scale" className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary to-secondary p-12 rounded-3xl text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prêt à transformer votre clinique ?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Rejoignez les cliniques qui ont déjà adopté CliniCare pour optimiser leur gestion quotidienne.
            </p>
            <button
              onClick={onLogin}
              className="px-8 py-4 bg-white text-primary rounded-xl text-lg font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-2 group"
            >
              Accéder à l application
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Contactez-nous
            </h2>
            <p className="text-lg text-muted-foreground">
              Une question ? Notre équipe est là pour vous aider.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: Phone, title: 'Téléphone', value: '+225 07 XX XX XX XX' },
              { icon: Mail, title: 'Email', value: 'contact@clinicare.com' },
              { icon: MapPin, title: 'Adresse', value: "Abidjan, Côte d'Ivoire" },
            ].map((contact, index) => (
              <AnimateOnScroll key={index} animation="fade-up" delay={index * 100}>
                <div className="text-center p-6 bg-card rounded-2xl border border-border">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <contact.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{contact.title}</h4>
                  <p className="text-muted-foreground">{contact.value}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-foreground">CliniCare</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} CliniCare. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mentions légales
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
