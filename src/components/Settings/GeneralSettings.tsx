import React, { useState } from 'react';
import { Building, MapPin, Phone, Mail, Clock, Globe, Save } from 'lucide-react';
import { ClinicSettingsService, ClinicSettings } from '../../services/clinic-settings';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

interface GeneralSettingsProps {
  onSettingsChange: () => void;
}

export function GeneralSettings({ onSettingsChange }: GeneralSettingsProps) {
  const [settings, setSettings] = useState<ClinicSettings>({
    clinic_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'Africa/Porto-Novo',
    language: 'fr',
    currency: 'FCFA',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    lunch_start: '12:00',
    lunch_end: '14:00',
    working_days: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Charger les paramètres au montage du composant
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔍 GeneralSettings.loadSettings() - Chargement des paramètres de la clinique');
      setLoading(true);
      const clinicSettings = await ClinicSettingsService.getSettings();
      
      if (clinicSettings) {
        console.log('✅ GeneralSettings.loadSettings() - Paramètres chargés avec succès');
        setSettings(clinicSettings);
      }
    } catch (error) {
      console.error('❌ GeneralSettings.loadSettings() - Erreur lors du chargement des paramètres:', error);
      setSaveMessage('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ClinicSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
    setSaveMessage(''); // Clear save message when user makes changes
  };

  const handleWorkingHoursChange = (field: 'working_hours_start' | 'working_hours_end' | 'lunch_start' | 'lunch_end', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
    setSaveMessage('');
  };

  const handleWorkingDaysChange = (day: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      working_days: checked 
        ? [...prev.working_days, day]
        : prev.working_days.filter(d => d !== day)
    }));
    onSettingsChange();
    setSaveMessage('');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      console.log('🔍 GeneralSettings.handleSaveSettings() - Sauvegarde des paramètres de la clinique');
      await ClinicSettingsService.updateSettings(settings);
      
      console.log('✅ GeneralSettings.handleSaveSettings() - Paramètres sauvegardés avec succès');
      setSaveMessage('Paramètres sauvegardés avec succès !');
      
      // Clear the message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('❌ GeneralSettings.handleSaveSettings() - Erreur lors de la sauvegarde:', error);
      setSaveMessage('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    const confirmed = await confirm({
      title: 'Réinitialiser les paramètres',
      message: 'Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ? Cette action remplacera tous vos paramètres personnalisés.',
      type: 'warning',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      try {
        console.log('🔍 GeneralSettings.handleResetToDefaults() - Réinitialisation aux paramètres par défaut');
        setIsSaving(true);
        const defaultSettings = await ClinicSettingsService.resetToDefaults();
        setSettings(defaultSettings);
        setSaveMessage('Paramètres réinitialisés aux valeurs par défaut !');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('❌ GeneralSettings.handleResetToDefaults() - Erreur lors de la réinitialisation:', error);
        setSaveMessage('Erreur lors de la réinitialisation');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const dayLabels = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations de la Clinique</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline h-4 w-4 mr-1" />
              Nom de la clinique
            </label>
            <input
              type="text"
              value={settings.clinic_name}
              onChange={(e) => handleChange('clinic_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Téléphone principal
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email de contact
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              Site web
            </label>
            <input
              type="url"
                value={settings.website || ''}
                onChange={(e) => handleChange('website', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Adresse complète
          </label>
          <textarea
            value={settings.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
        {/* Bouton Enregistrer pour les informations de la clinique */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            {saveMessage && (
              <div className={`text-sm font-medium ${
                saveMessage.includes('succès') ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
          <button
            onClick={handleResetToDefaults}
            disabled={isSaving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les informations'}</span>
          </button>
        </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration Régionale</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Africa/Porto-Novo">Afrique/Porto-Novo (GMT+1)</option>
              <option value="Africa/Lagos">Afrique/Lagos (GMT+1)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="FCFA">FCFA</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar US ($)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <Clock className="inline h-5 w-5 mr-2" />
          Horaires de Travail
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure d'ouverture
            </label>
            <input
              type="time"
              value={settings.working_hours_start}
              onChange={(e) => handleWorkingHoursChange('working_hours_start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure de fermeture
            </label>
            <input
              type="time"
              value={settings.working_hours_end}
              onChange={(e) => handleWorkingHoursChange('working_hours_end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Début pause déjeuner
            </label>
            <input
              type="time"
              value={settings.lunch_start}
              onChange={(e) => handleWorkingHoursChange('lunch_start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fin pause déjeuner
            </label>
            <input
              type="time"
              value={settings.lunch_end}
              onChange={(e) => handleWorkingHoursChange('lunch_end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Jours d'ouverture
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(dayLabels).map(([day, label]) => (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.working_days.includes(day)}
                  onChange={(e) => handleWorkingDaysChange(day, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Aperçu des paramètres</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Clinique:</strong> {settings.clinic_name}</p>
          <p><strong>Horaires:</strong> {settings.working_hours_start} - {settings.working_hours_end}</p>
          <p><strong>Jours ouverts:</strong> {settings.working_days.length} jours/semaine</p>
          <p><strong>Langue:</strong> {settings.language === 'fr' ? 'Français' : 'English'}</p>
          <p><strong>Dernière mise à jour:</strong> {settings.updated_at ? new Date(settings.updated_at).toLocaleDateString('fr-FR') : 'Jamais'}</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
}