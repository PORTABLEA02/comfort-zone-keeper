import { X, User, Mail, Phone, MapPin, Calendar, DollarSign, Shield, Clock, Building } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface StaffDetailProps {
  staff: Profile;
  onClose: () => void;
  onEdit: () => void;
}

export function StaffDetail({ staff, onClose, onEdit }: StaffDetailProps) {
  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      doctor: 'Médecin',
      secretary: 'Personnel soignant'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {staff.first_name} {staff.last_name}
              </h2>
              <p className="text-gray-600">Profil du Personnel - ID: {staff.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom complet</label>
                  <p className="text-gray-900 font-medium">{staff.first_name} {staff.last_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <p className="text-gray-900">{staff.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {staff.address && (
                  <>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Adresse</label>
                        <p className="text-gray-900">{staff.address}</p>
                      </div>
                    </div>
                  </>
                )}
                {staff.emergency_contact && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact d'urgence</label>
                      <p className="text-gray-900">{staff.emergency_contact}</p>
                    </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Inscrit le</label>
                  <p className="text-gray-900">{new Date(staff.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dernière modification</label>
                  <p className="text-gray-900">{new Date(staff.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Informations Professionnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Rôle</label>
                  <p className="text-gray-900 font-medium">{getRoleLabel(staff.role)}</p>
                </div>
                {staff.speciality && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Spécialité</label>
                    <p className="text-gray-900">{staff.speciality}</p>
                  </div>
                )}
                {staff.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Département</label>
                      <p className="text-gray-900">{staff.department}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Informations Professionnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Rôle</label>
                  <p className="text-gray-900 font-medium">{getRoleLabel(staff.role)}</p>
                </div>
                {staff.speciality && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Spécialité</label>
                    <p className="text-gray-900">{staff.speciality}</p>
                  </div>
                )}
                {staff.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Département</label>
                      <p className="text-gray-900">{staff.department}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {staff.hire_date && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date d'embauche</label>
                        <p className="text-gray-900">{new Date(staff.hire_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ancienneté</label>
                      <p className="text-gray-900">{calculateTenure(staff.hire_date)}</p>
                    </div>
                  </>
                )}
                {staff.work_schedule && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Horaire</label>
                      <p className="text-gray-900">{staff.work_schedule}</p>
                    </div>
                )}
              </div>

              <div className="space-y-4">
                {staff.salary && (
                  <>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Salaire mensuel</label>
                        <p className="text-gray-900 font-medium">{staff.salary.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Informations Système
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Compte créé le</label>
                <p className="text-gray-900">{new Date(staff.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ID utilisateur</label>
                <p className="text-gray-900 font-mono">{staff.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Compte actif</label>
                <p className="text-gray-900">{staff.is_active ? 'Oui' : 'Non'}</p>
              </div>
              {staff.salary && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Salaire annuel</label>
                  <p className="text-gray-900 font-medium">{(staff.salary * 12).toLocaleString()} FCFA</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}