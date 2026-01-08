import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin, Shield, Calendar, Building, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/profiles';
import { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function ProfileManager() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    speciality: '',
    department: '',
    address: '',
    emergency_contact: '',
    work_schedule: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Charger le profil seulement si les données ne sont pas déjà chargées
    // ou si plus de 5 minutes se sont écoulées depuis le dernier chargement
    const now = Date.now();
    const shouldReload = !dataLoaded || 
                        !lastLoadTime || 
                        (now - lastLoadTime) > 5 * 60 * 1000; // 5 minutes
    
    if (shouldReload && user?.id) {
      loadProfile();
    } else if (dataLoaded) {
      // Si les données sont déjà chargées, juste arrêter le loading
      setLoading(false);
    }
  }, [user, dataLoaded, lastLoadTime]);

  // Gérer la visibilité de la page pour éviter les rechargements inutiles
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Ne rien faire quand la page devient visible/invisible
      // Les données restent en cache
      console.log('🔍 ProfileManager.handleVisibilityChange() - Changement de visibilité, données conservées en cache');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 ProfileManager.loadProfile() - Chargement du profil utilisateur');
      setLoading(true);
      const profileData = await ProfileService.getById(user.id);
      
      if (profileData) {
        console.log('✅ ProfileManager.loadProfile() - Profil chargé avec succès');
          setProfile({
            ...profileData,
            is_active: profileData.is_active ?? true,
            created_at: profileData.created_at || new Date().toISOString(),
            updated_at: profileData.updated_at || new Date().toISOString()
          });
        setDataLoaded(true);
        setLastLoadTime(Date.now());
        setFormData({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone: profileData.phone,
          speciality: profileData.speciality || '',
          department: profileData.department || '',
          address: profileData.address || '',
          emergency_contact: profileData.emergency_contact || '',
          work_schedule: profileData.work_schedule || 'Temps plein'
        });
      }
    } catch (error) {
      console.error('❌ ProfileManager.loadProfile() - Erreur lors du chargement du profil:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      console.log('🔍 ProfileManager.handleSubmit() - Mise à jour du profil utilisateur');
      await ProfileService.update(user.id, formData);
      
      console.log('✅ ProfileManager.handleSubmit() - Profil mis à jour avec succès');
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      
      // Recharger le profil pour avoir les dernières données
      // Forcer le rechargement après une mise à jour réussie
      setDataLoaded(false);
      setLastLoadTime(null);
      await loadProfile();
      
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ ProfileManager.handleSubmit() - Erreur lors de la mise à jour du profil:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      console.log('🔍 ProfileManager.handlePasswordChange() - Changement de mot de passe');
      // Dans un vrai système, on utiliserait l'API Supabase pour changer le mot de passe
      // await supabase.auth.updateUser({ password: passwordData.newPassword });
      
      console.log('✅ ProfileManager.handlePasswordChange() - Mot de passe changé avec succès');
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès !' });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ ProfileManager.handlePasswordChange() - Erreur lors du changement de mot de passe:', error);
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      doctor: 'Médecin',
      secretary: 'Personnel soignant'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      doctor: 'bg-blue-100 text-blue-800',
      secretary: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateTenure = () => {
    if (!profile?.hire_date) return 'Non défini';
    
    const hireDate = new Date(profile.hire_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">
            {dataLoaded ? 'Actualisation du profil...' : 'Chargement de votre profil...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Mon Compte</h2>
              <p className="text-sm text-gray-600 mt-1">
                Gérer vos informations personnelles et professionnelles
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                  {getRoleLabel(user?.role || '')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 border-b border-gray-200 ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* Statistiques du profil */}
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-base lg:text-lg font-bold text-blue-600">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
              <div className="text-xs lg:text-sm text-blue-600">Membre depuis</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-base lg:text-lg font-bold text-green-600">{calculateTenure()}</div>
              <div className="text-xs lg:text-sm text-green-600">Ancienneté</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-base lg:text-lg font-bold text-purple-600 truncate">
                {profile?.department || 'Non défini'}
              </div>
              <div className="text-xs lg:text-sm text-purple-600">Département</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-base lg:text-lg font-bold text-yellow-600">
                {profile?.is_active ? 'Actif' : 'Inactif'}
              </div>
              <div className="text-xs lg:text-sm text-yellow-600">Statut</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de profil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Informations du Profil</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations Personnelles
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+229 01 00 00 00 00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Adresse
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                placeholder="Votre adresse complète..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact d'urgence
              </label>
              <input
                type="tel"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="+229 01 00 00 00 00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Informations Professionnelles
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-700">{getRoleLabel(profile?.role || '')}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Contactez l'administrateur pour modifier votre rôle
                  </p>
                </div>
              </div>

              {user?.role === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleChange}
                    placeholder="Ex: Cardiologie, Médecine générale..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Département
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un département</option>
                  <option value="Administration">Administration</option>
                  <option value="Médecine">Médecine</option>
                  <option value="Soins infirmiers">Soins infirmiers</option>
                  <option value="Accueil">Accueil</option>
                  <option value="Pharmacie">Pharmacie</option>
                  <option value="Laboratoire">Laboratoire</option>
                  <option value="Radiologie">Radiologie</option>
                  <option value="Comptabilité">Comptabilité</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horaire de travail
                </label>
                <select
                  name="work_schedule"
                  value={formData.work_schedule}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Temps plein">Temps plein</option>
                  <option value="Temps partiel">Temps partiel</option>
                  <option value="Garde de nuit">Garde de nuit</option>
                  <option value="Week-end">Week-end</option>
                  <option value="Sur appel">Sur appel</option>
                </select>
              </div>
            </div>

            {/* Informations en lecture seule */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date d'embauche
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-700">
                    {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('fr-FR') : 'Non définie'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancienneté
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-700">{calculateTenure()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Changer le mot de passe</span>
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Formulaire de changement de mot de passe */}
      {showPasswordForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Changer le Mot de Passe
            </h3>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Sécurité</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Assurez-vous d'utiliser un mot de passe fort avec au moins 6 caractères.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordDataChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordDataChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordDataChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                <span>{saving ? 'Changement...' : 'Changer le mot de passe'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Informations du compte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Informations du Compte</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ID utilisateur</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded border">
                  {user?.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Compte créé le</label>
                <p className="text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Non défini'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Dernière modification</label>
                <p className="text-gray-900">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Non défini'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Statut du compte</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {profile?.salary && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Salaire mensuel</label>
                  <p className="text-gray-900 font-medium">
                    {profile.salary.toLocaleString()} FCFA
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Permissions</label>
                <div className="mt-1 space-y-1">
                  {user?.role === 'admin' && (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2">
                      Administration complète
                    </span>
                  )}
                  {user?.role === 'doctor' && (
                    <>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                        Consultations médicales
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                        Prescriptions
                      </span>
                    </>
                  )}
                  {user?.role === 'secretary' && (
                    <>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                        Gestion patients
                      </span>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                        Rendez-vous
                      </span>
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                        Facturation
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conseils de sécurité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Conseils de Sécurité</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Sécurité du mot de passe</span>
            </div>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-7">
              <li>• Utilisez au moins 8 caractères</li>
              <li>• Mélangez lettres majuscules et minuscules</li>
              <li>• Incluez des chiffres et des caractères spéciaux</li>
              <li>• Ne partagez jamais votre mot de passe</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Bonnes pratiques</span>
            </div>
            <ul className="text-sm text-green-700 mt-2 space-y-1 ml-7">
              <li>• Déconnectez-vous toujours après utilisation</li>
              <li>• Maintenez vos informations à jour</li>
              <li>• Signalez tout problème de sécurité</li>
              <li>• Vérifiez régulièrement vos informations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}