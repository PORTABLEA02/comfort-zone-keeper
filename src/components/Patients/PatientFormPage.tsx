import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Heart, Calendar, Droplet, AlertCircle, Save, ClipboardList } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../UI/FormField';

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientFormPageProps {
  patient?: Patient;
  onBack: () => void;
  onSave: (patient: Partial<Patient>) => void;
}

// Validation functions
const validatePhone = (phone: string | number): string | null => {
  const phoneStr = String(phone);
  if (!phoneStr) return 'Le numéro de téléphone est requis';
  if (phoneStr.length < 8) return 'Le numéro doit contenir au moins 8 chiffres';
  return null;
};

const validateEmail = (email: string | number): string | null => {
  const emailStr = String(email);
  if (!emailStr) return null; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) return 'Email invalide';
  return null;
};

const validateRequired = (value: string | number): string | null => {
  if (!value) return 'Ce champ est requis';
  return null;
};

export function PatientFormPage({ patient, onBack, onSave }: PatientFormPageProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    date_of_birth: patient?.date_of_birth || '',
    gender: patient?.gender || 'M',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    emergency_contact: patient?.emergency_contact || '',
    blood_type: patient?.blood_type || '',
    allergies: patient?.allergies?.join(', ') || '',
    medical_history: patient?.medical_history?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSaving) return;
    
    setIsSaving(true);
    console.log('🔍 PatientFormPage.handleSubmit() - Soumission du formulaire patient avec les données:', formData);
    
    try {
      onSave({
        ...formData,
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a),
        medical_history: formData.medical_history.split(',').map(a => a.trim()).filter(a => a)
      });
    } catch (error) {
      console.error('Error saving patient:', error);
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const canEditMedicalInfo = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 bg-gradient-subtle flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              disabled={isSaving}
              className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-6 w-6 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">
                {patient ? 
                  (user?.role === 'secretary' ? 'Modifier les informations de contact' : 'Modifier le Patient') 
                  : 'Nouveau Patient'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {patient ? 'Mettre à jour les informations du patient' : 'Ajouter un nouveau patient au système'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{patient ? 'Mettre à jour' : 'Créer le patient'}</span>
          </button>
        </div>
      </div>

      {/* Form Content - Two Column Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal & Contact Info */}
          <div className="space-y-6">
            {/* Section: Informations Personnelles */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Informations Personnelles</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Nom"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    icon={User}
                    validate={validateRequired}
                    disabled={isSaving}
                  />

                  <FormField
                    label="Prénom"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    icon={User}
                    validate={validateRequired}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Date de Naissance"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    icon={Calendar}
                    validate={validateRequired}
                    disabled={isSaving}
                  />

                  <FormField
                    label="Genre"
                    name="gender"
                    type="select"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Section: Contact */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Phone className="h-5 w-5 text-secondary" />
                <h3 className="text-lg font-bold text-foreground">Contact</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+229 01 00 00 00 00"
                    icon={Phone}
                    validate={validatePhone}
                    disabled={isSaving}
                  />

                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemple.com"
                    icon={Mail}
                    validate={validateEmail}
                    disabled={isSaving}
                  />
                </div>

                <FormField
                  label="Adresse"
                  name="address"
                  type="textarea"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  icon={MapPin}
                  validate={validateRequired}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Medical Info */}
          <div className="space-y-6">
            {/* Section: Informations Médicales */}
            {canEditMedicalInfo ? (
              <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
                <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                  <Heart className="h-5 w-5 text-error" />
                  <h3 className="text-lg font-bold text-foreground">Informations Médicales</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Contact d'urgence"
                      name="emergency_contact"
                      type="tel"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      required
                      placeholder="+229 01 00 00 00 00"
                      icon={Phone}
                      validate={validatePhone}
                      disabled={isSaving}
                    />

                    <FormField
                      label="Groupe Sanguin"
                      name="blood_type"
                      type="select"
                      value={formData.blood_type}
                      onChange={handleChange}
                      icon={Droplet}
                      disabled={isSaving}
                    >
                      <option value="">Sélectionner</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </FormField>
                  </div>

                  <FormField
                    label="Allergies"
                    name="allergies"
                    type="textarea"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Pénicilline, Aspirine, Latex... (séparées par des virgules)"
                    icon={AlertCircle}
                    disabled={isSaving}
                    rows={3}
                  />

                  <FormField
                    label="Antécédents Médicaux"
                    name="medical_history"
                    type="textarea"
                    value={formData.medical_history}
                    onChange={handleChange}
                    placeholder="Diabète, Hypertension, Chirurgies passées... (séparées par des virgules)"
                    icon={ClipboardList}
                    disabled={isSaving}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
                <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-bold text-muted-foreground">Informations Médicales</h3>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Accès restreint</p>
                  <p className="text-sm mt-2">Seuls les médecins et administrateurs peuvent modifier les informations médicales.</p>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Actions Rapides</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-xl border-2 border-border text-foreground font-medium
                           hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Annuler et retourner à la liste
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full btn-gradient py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover-lift shadow-glow disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{isSaving ? 'Enregistrement...' : (patient ? 'Mettre à jour' : 'Créer le patient')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
