import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Heart, Calendar, Droplet, AlertCircle, FileText } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../context/AuthContext';
import { FormField } from '../UI/FormField';
import { FormActions } from '../UI/FormActions';

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientFormProps {
  patient?: Patient;
  onClose: () => void;
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

export function PatientForm({ patient, onClose, onSave }: PatientFormProps) {
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
    console.log('🔍 PatientForm.handleSubmit() - Soumission du formulaire patient avec les données:', formData);
    
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-glass rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-border/50 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-subtle">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">
              {patient ? 
                (user?.role === 'secretary' ? 'Modifier les informations de contact' : 'Modifier le Patient') 
                : 'Nouveau Patient'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {patient ? 'Mettre à jour les informations du patient' : 'Ajouter un nouveau patient au système'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all hover-lift disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section: Informations Personnelles */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Informations Personnelles</h3>
            </div>
            
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

          {/* Section: Contact */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <Phone className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-bold text-foreground">Contact</h3>
            </div>
            
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
              rows={2}
              icon={MapPin}
              validate={validateRequired}
              disabled={isSaving}
            />
          </div>

          {/* Section: Informations Médicales (conditionnelle) */}
          {canEditMedicalInfo && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
                <Heart className="h-5 w-5 text-error" />
                <h3 className="text-lg font-bold text-foreground">Informations Médicales</h3>
              </div>
              
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
                type="text"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="Pénicilline, Aspirine, Latex... (séparées par des virgules)"
                icon={AlertCircle}
                disabled={isSaving}
              />

              <FormField
                label="Antécédents Médicaux"
                name="medical_history"
                type="textarea"
                value={formData.medical_history}
                onChange={handleChange}
                placeholder="Diabète, Hypertension, Chirurgie cardiaque 2020... (séparés par des virgules)"
                icon={FileText}
                rows={3}
                disabled={isSaving}
              />
            </div>
          )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t border-border/50 bg-gradient-subtle">
            <FormActions
              onCancel={onClose}
              isSubmitting={isSaving}
              submitLabel={patient ? 'Mettre à jour' : 'Créer le patient'}
              disabled={isSaving}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
