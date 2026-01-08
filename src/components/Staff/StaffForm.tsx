import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { StaffService } from '../../services/staff';
import { FormActions } from '../UI/FormActions';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface StaffFormProps {
  staff?: Profile;
  onClose: () => void;
  onSave: (staff: Profile) => void;
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'doctor' | 'secretary' | 'nurse';
  speciality?: string;
  department: string;
  hireDate: string;
  salary: number;
  workSchedule: string;
  emergencyContact: string;
  address: string;
}

export function StaffForm({ staff, onClose, onSave }: StaffFormProps) {
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: staff?.first_name || '',
    lastName: staff?.last_name || '',
    email: staff?.email || '',
    password: '',
    phone: staff?.phone || '',
    role: staff?.role || 'secretary',
    speciality: staff?.speciality || '',
    department: staff?.department || '',
    hireDate: staff?.hire_date || new Date().toISOString().split('T')[0],
    salary: staff?.salary || 0,
    workSchedule: staff?.work_schedule || 'Temps plein',
    emergencyContact: staff?.emergency_contact || '',
    address: staff?.address || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Administration',
    'Médecine',
    'Soins infirmiers',
    'Accueil',
    'Pharmacie',
    'Laboratoire',
    'Radiologie',
    'Maintenance',
    'Comptabilité'
  ];

  const workSchedules = [
    'Temps plein',
    'Temps partiel',
    'Garde de nuit',
    'Week-end',
    'Sur appel'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Empêcher les soumissions multiples
    
    setIsSubmitting(true);
    setErrors({});
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Vérifier si l'email existe déjà (seulement pour les nouveaux utilisateurs)
    if (!staff) {
      try {
        const exists = await StaffService.checkEmailExists(formData.email);
        if (exists) {
          newErrors.email = 'Cet email est déjà utilisé par un autre membre du personnel';
        }
      } catch (emailCheckError) {
        console.error('Erreur lors de la vérification d\'email:', emailCheckError);
        newErrors.email = 'Impossible de vérifier la disponibilité de l\'email';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }
    
    if (!formData.department) {
      newErrors.department = 'Le département est requis';
    }
    
    if (formData.role === 'doctor' && !formData.speciality?.trim()) {
      newErrors.speciality = 'La spécialité est requise pour les médecins';
    }
    
    if (!staff && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis pour les nouveaux utilisateurs';
    }
    
    if (!formData.hireDate) {
      newErrors.hireDate = 'La date d\'embauche est requise';
    }
    
    if (formData.salary <= 0) {
      newErrors.salary = 'Le salaire doit être supérieur à 0';
    }
    
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Le contact d\'urgence est requis';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        if (staff) {
          // Mise à jour d'un utilisateur existant
          console.log('🔍 StaffForm.handleSubmit() - Mise à jour du personnel existant');
          // Pour la mise à jour, on utilise le service profiles existant
          // Cette partie sera gérée par le parent component
          onSave({
            ...staff,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            speciality: formData.speciality || null,
            department: formData.department || null,
            hire_date: formData.hireDate,
            salary: formData.salary || null,
            work_schedule: formData.workSchedule,
            emergency_contact: formData.emergencyContact || null,
            address: formData.address || null
          });
        } else {
          // Création d'un nouvel utilisateur
          console.log('🔍 StaffForm.handleSubmit() - Création d\'un nouveau personnel');
          try {
            const newStaff = await StaffService.createStaff(formData);
            console.log('✅ StaffForm.handleSubmit() - Personnel créé avec succès:', newStaff.id);
          onSave({
            ...newStaff,
            is_active: newStaff.is_active ?? true,
            created_at: newStaff.created_at || new Date().toISOString(),
            updated_at: newStaff.updated_at || new Date().toISOString()
          });
          } catch (createError) {
            console.error('❌ StaffForm.handleSubmit() - Erreur détaillée lors de la création:', createError);
            
            // Analyser le type d'erreur pour donner un message plus précis
            let errorMessage = 'Erreur lors de la création du personnel';
            
            if (createError instanceof Error) {
              if (createError.message.includes('Failed to fetch')) {
                errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
              } else if (createError.message.includes('Email déjà utilisé')) {
                errorMessage = 'Cet email est déjà utilisé par un autre membre du personnel.';
              } else if (createError.message.includes('Données manquantes')) {
                errorMessage = 'Veuillez remplir tous les champs obligatoires.';
              } else {
                errorMessage = createError.message;
              }
            }
            
            setErrors({ general: errorMessage });
            throw createError; // Re-throw pour que le finally soit exécuté
          }
        }
      } catch (error) {
        console.error('❌ StaffForm.handleSubmit() - Erreur lors de la sauvegarde:', error);
        // L'erreur a déjà été gérée dans le try/catch spécifique ci-dessus
      }
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Vérifier l'email en temps réel pour les nouveaux utilisateurs
    if (name === 'email' && !staff && value.includes('@')) {
      // Débounce la vérification d'email pour éviter trop d'appels
      setTimeout(() => checkEmailAvailability(value), 500);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const checkEmailAvailability = async (email: string) => {
    try {
      if (!email || !email.includes('@')) return;
      
      const exists = await StaffService.checkEmailExists(email);
      if (exists) {
        setErrors(prev => ({ 
          ...prev, 
          email: 'Cet email est déjà utilisé par un autre membre du personnel' 
        }));
      } else {
        // Nettoyer l'erreur d'email si l'email est disponible
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const generateEmail = () => {
    if (formData.firstName && formData.lastName) {
      const email = StaffService.generateEmail(formData.firstName, formData.lastName);
      setFormData({ ...formData, email });
      if (!staff) {
        checkEmailAvailability(email);
      }
    }
  };

  const generatePassword = () => {
    const password = StaffService.generateTemporaryPassword();
    setFormData({ ...formData, password });
  };

  const getSalaryRange = (role: string) => {
    const ranges = {
      admin: { min: 2000000, max: 4000000 },
      doctor: { min: 2500000, max: 5000000 },
      secretary: { min: 600000, max: 1500000 }
    };
    return ranges[role as keyof typeof ranges] || { min: 500000, max: 2000000 };
  };

  const salaryRange = getSalaryRange(formData.role);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-glass rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-subtle">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">
              {staff ? 'Modifier le Personnel' : 'Nouveau Personnel'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {staff ? 'Mettre à jour les informations du membre du personnel' : 'Ajouter un nouveau membre du personnel'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all hover-lift disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">{errors.general}</span>
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {staff ? 'Mise à jour en cours...' : 'Création du compte en cours...'}
                  </p>
                  <p className="text-xs text-blue-600">Veuillez patienter, ne fermez pas cette fenêtre.</p>
                </div>
              </div>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-4">Informations Personnelles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.lastName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.firstName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting || !!staff} // Désactiver pour les modifications
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {!staff && (
                    <button
                    type="button"
                    onClick={generateEmail}
                      disabled={isSubmitting}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Générer
                  </button>
                  )}
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="+229 01 00 00 00 00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact d'urgence *
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="+229 01 00 00 00 00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.emergencyContact ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.emergencyContact && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.emergencyContact}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.address && (
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mot de passe (seulement pour les nouveaux utilisateurs) */}
          {!staff && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-4">Authentification</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe temporaire *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Mot de passe temporaire"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Générer
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.password}</span>
                  </div>
                )}
                <p className="text-xs text-red-600 mt-1">
                  L'utilisateur devra changer ce mot de passe lors de sa première connexion
                </p>
              </div>
            </div>
          )}

          {/* Informations professionnelles */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-4">Informations Professionnelles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="secretary">Personnel soignant</option>
                  <option value="doctor">Médecin</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Département *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.department}</span>
                  </div>
                )}
              </div>

              {formData.role === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité *
                  </label>
                  <input
                    type="text"
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Ex: Cardiologie, Médecine générale..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.speciality ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.speciality && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">{errors.speciality}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horaire de travail
                </label>
                <select
                  name="workSchedule"
                  value={formData.workSchedule}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {workSchedules.map(schedule => (
                    <option key={schedule} value={schedule}>{schedule}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'embauche *
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.hireDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.hireDate && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.hireDate}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Informations salariales */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-4">Informations Salariales</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire mensuel (FCFA) *
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                disabled={isSubmitting}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.salary ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.salary && (
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.salary}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Fourchette recommandée pour ce rôle: {salaryRange.min.toLocaleString()} - {salaryRange.max.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          {/* Résumé */}
          {formData.firstName && formData.lastName && formData.department && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Résumé</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Employé:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Poste:</strong> {formData.role === 'admin' ? 'Administrateur' : formData.role === 'doctor' ? 'Médecin' : 'Personnel soignant'} - {formData.department}</p>
                <p><strong>Salaire:</strong> {formData.salary.toLocaleString()} FCFA/mois</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {!staff && formData.password && (
                  <p><strong>Mot de passe:</strong> {formData.password} (temporaire)</p>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t border-border/50 bg-gradient-subtle">
            <FormActions
              onCancel={onClose}
              isSubmitting={isSubmitting}
              submitLabel={staff ? 'Mettre à jour' : 'Créer le personnel'}
              disabled={isSubmitting}
              showPrevious={false}
              showNext={false}
            />
          </div>
        </form>
      </div>
    </div>
  );
}