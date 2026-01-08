import { useState } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Package, Calendar, Stethoscope, Activity, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useMedicalServices, useCreateMedicalService, useUpdateMedicalService, useDeleteMedicalService } from '../../hooks/queries/useMedicalServices';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

import { Tables } from '../../integrations/supabase/types';

type MedicalService = Tables<'medical_services'>;

const SERVICE_CATEGORY_LABELS = {
  consultation: 'Consultations',
  examination: 'Examens',
  analysis: 'Analyses',
  procedure: 'Procédures',
  emergency: 'Urgences',
  preventive: 'Préventif',
  other: 'Autres'
};

const DEPARTMENTS = [
  'Médecine',
  'Cardiologie',
  'Pédiatrie',
  'Gynécologie',
  'Imagerie',
  'Laboratoire',
  'Soins infirmiers',
  'Urgences',
  'Chirurgie'
];

interface MedicalServicesSettingsProps {
  onServicesChange: () => void;
}

export function MedicalServicesSettings({ onServicesChange }: MedicalServicesSettingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<MedicalService | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  const { data: services = [], isLoading: loading } = useMedicalServices();
  const createService = useCreateMedicalService();
  const updateService = useUpdateMedicalService();
  const deleteService = useDeleteMedicalService();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'consultation' as const,
    base_price: 0,
    duration: 30,
    department: '',
    requires_doctor: true,
    doctor_speciality: '',
    is_active: true
  });

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'consultation',
      base_price: 0,
      duration: 30,
      department: '',
      requires_doctor: true,
      doctor_speciality: '',
      is_active: true
    });
    setShowServiceForm(true);
  };

  const handleEditService = (service: MedicalService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category as any,
      base_price: service.base_price,
      duration: service.duration || 30,
      department: service.department || '',
      requires_doctor: service.requires_doctor ?? true,
      doctor_speciality: service.doctor_speciality || '',
      is_active: service.is_active ?? true
    });
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data: formData });
      } else {
        await createService.mutateAsync(formData);
      }
      
      setShowServiceForm(false);
      setEditingService(null);
      onServicesChange();
    } catch (error) {
      console.error('Error saving medical service:', error);
      alert('Erreur lors de la sauvegarde du service médical');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const confirmed = await confirm({
      title: 'Désactiver le service',
      message: `Êtes-vous sûr de vouloir désactiver "${service?.name}" ? Ce service ne sera plus disponible pour la facturation.`,
      type: 'warning',
      confirmText: 'Désactiver',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      try {
        await deleteService.mutateAsync(serviceId);
        onServicesChange();
      } catch (error) {
        console.error('Error deleting medical service:', error);
        alert('Erreur lors de la suppression du service médical');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
               name === 'base_price' || name === 'duration' ? Number(value) : value
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      consultation: Stethoscope,
      examination: Activity,
      analysis: Package,
      procedure: Calendar,
      emergency: AlertTriangle,
      preventive: CheckCircle,
      other: Package
    };
    return icons[category as keyof typeof icons] || Package;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      consultation: 'bg-blue-100 text-blue-800',
      examination: 'bg-green-100 text-green-800',
      analysis: 'bg-purple-100 text-purple-800',
      procedure: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800',
      preventive: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Chargement des services médicaux...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Services Médicaux</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gérer les services proposés par la clinique
          </p>
        </div>
        <button
          onClick={handleAddService}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Service</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Services</p>
              <p className="text-2xl font-bold text-blue-900">{services.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Actifs</p>
              <p className="text-2xl font-bold text-green-900">
                {services.filter(s => s.is_active).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Prix Moyen</p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(services.reduce((sum, s) => sum + s.base_price, 0) / Math.max(1, services.length) / 1000)}K
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Consultations</p>
              <p className="text-2xl font-bold text-yellow-900">
                {services.filter(s => s.category === 'consultation').length}
              </p>
            </div>
            <Stethoscope className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Liste des services */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredServices.map((service) => {
            const CategoryIcon = getCategoryIcon(service.category);
            
            return (
              <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <CategoryIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                          {SERVICE_CATEGORY_LABELS[service.category as keyof typeof SERVICE_CATEGORY_LABELS] || service.category}
                        </span>
                        {!service.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Département: {service.department || 'Général'}</span>
                        <span>Durée: {service.duration} min</span>
                        {service.requires_doctor && (
                          <span className="text-blue-600">Médecin requis</span>
                        )}
                        {service.doctor_speciality && (
                          <span className="text-purple-600">Spécialité: {service.doctor_speciality}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {service.base_price.toLocaleString()} FCFA
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Désactiver"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun service trouvé</p>
          </div>
        )}
      </div>

      {/* Formulaire de service */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingService ? 'Modifier le Service' : 'Nouveau Service Médical'}
              </h3>
              <button
                onClick={() => setShowServiceForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de base (FCFA) *
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="5"
                    step="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Département
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un département</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité requise
                  </label>
                  <input
                    type="text"
                    name="doctor_speciality"
                    value={formData.doctor_speciality}
                    onChange={handleChange}
                    placeholder="Ex: Cardiologie, Gynécologie..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="requires_doctor"
                    checked={formData.requires_doctor}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Nécessite un médecin</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Service actif</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowServiceForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveService}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingService ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

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