import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, User, Calendar, DollarSign, Package, Search, CheckCircle, Stethoscope } from 'lucide-react';
import { Database } from '../../integrations/supabase/types';
import { usePatients } from '../../hooks/queries/usePatients';
import { useMedicines } from '../../hooks/queries/useMedicines';
import { useMedicalServices } from '../../hooks/queries/useMedicalServices';
import { useCreateInvoice, useUpdateInvoice } from '../../hooks/queries/useInvoices';
import { PatientForm } from '../Patients/PatientForm';
import { useCreatePatient } from '../../hooks/queries/usePatients';
import { MedicalRecordService } from '../../services/medical-records';
import { Tables } from '../../integrations/supabase/types';

type MedicalRecord = Tables<'medical_records'> & {
  doctor?: { first_name: string; last_name: string; speciality: string | null } | null;
};

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  invoice_items?: Database['public']['Tables']['invoice_items']['Row'][];
};
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
type Medicine = Database['public']['Tables']['medicines']['Row'];

interface MedicalService {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string;
  is_active: boolean | null;
  duration: number | null;
  requires_doctor: boolean | null;
  doctor_speciality: string | null;
  department: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

const CATEGORY_LABELS = {
  medication: 'Médicaments',
  'medical-supply': 'Fournitures médicales',
  equipment: 'Équipements',
  consumable: 'Consommables',
  diagnostic: 'Matériel diagnostic'
};

const SERVICE_CATEGORY_LABELS = {
  consultation: 'Consultations',
  examination: 'Examens',
  analysis: 'Analyses',
  procedure: 'Procédures',
  emergency: 'Urgences',
  preventive: 'Préventif',
  other: 'Autres'
};

interface InvoiceFormPageProps {
  invoice?: Invoice;
  onBack: () => void;
}

export function InvoiceFormPage({ invoice, onBack }: InvoiceFormPageProps) {
  const { data: patients = [] } = usePatients();
  const { data: medicines = [] } = useMedicines();
  const { data: medicalServices = [] } = useMedicalServices();
  
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const createPatient = useCreatePatient();

  const typedMedicines = medicines as Medicine[];
  const typedServices = medicalServices as MedicalService[];

  const [formData, setFormData] = useState({
    patient_id: invoice?.patient_id || '',
    date: invoice?.date || new Date().toISOString().split('T')[0],
    status: invoice?.status || 'paid',
    tax: invoice?.tax || 0,
    invoice_type: invoice?.invoice_type || 'ordinary'
  });

  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]>(
    invoice?.invoice_items || []
  );

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    total: 0,
    medicine_id: null as string | null,
    medical_service_id: null as string | null
  });

  const [activeTab, setActiveTab] = useState<'services' | 'products'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  
  // États pour le type de facture "treatment"
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState<string>('');
  const [loadingRecords, setLoadingRecords] = useState(false);

  React.useEffect(() => {
    if (invoice && invoice.status === 'paid') {
      alert('Cette facture ne peut pas être modifiée car elle a déjà été payée.');
      onBack();
    }
  }, [invoice?.status]);

  useEffect(() => {
    if (formData.patient_id && patients.length > 0) {
      const patient = patients.find(p => p.id === formData.patient_id);
      if (patient) {
        setPatientSearchTerm(`${patient.first_name} ${patient.last_name}`);
      }
    }
  }, [formData.patient_id, patients]);

  // Charger les consultations du patient lorsque le type est "treatment"
  useEffect(() => {
    const loadMedicalRecords = async () => {
      if (formData.patient_id && formData.invoice_type === 'treatment') {
        setLoadingRecords(true);
        try {
          const records = await MedicalRecordService.getByPatient(formData.patient_id);
          setPatientMedicalRecords(records as MedicalRecord[]);
        } catch (error) {
          console.error('Error loading medical records:', error);
        } finally {
          setLoadingRecords(false);
        }
      } else {
        setPatientMedicalRecords([]);
        setSelectedMedicalRecordId('');
      }
    };
    loadMedicalRecords();
  }, [formData.patient_id, formData.invoice_type]);

  const filteredMedicines = typedMedicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredServices = typedServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedServiceCategory === 'all' || service.category === selectedServiceCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createInvoice.isPending || updateInvoice.isPending) return;
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + (formData.tax || 0);

    try {
      // Cast temporaire en attendant la synchronisation des types Supabase
      const invoiceType = formData.invoice_type as 'ordinary' | 'general-consultation' | 'gynecological-consultation' | null;
      
      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          data: {
            patient_id: formData.patient_id,
            date: formData.date,
            status: formData.status,
            tax: formData.tax,
            subtotal,
            total,
            invoice_type: invoiceType
          }
        });
      } else {
        await createInvoice.mutateAsync({
          invoice: {
            patient_id: formData.patient_id,
            date: formData.date,
            status: formData.status,
            tax: formData.tax,
            subtotal,
            total,
            invoice_type: invoiceType
          } as InvoiceInsert,
          items
        });
      }
      onBack();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'tax' ? (parseFloat(value) || 0) : value 
    });
  };

  const handleItemChange = (field: keyof InvoiceItem, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
    }
    
    setNewItem(updatedItem);
  };

  const addItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.unit_price > 0) {
      setItems([...items, { 
        ...newItem, 
        total: newItem.quantity * newItem.unit_price 
      }]);
      setNewItem({
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        medicine_id: null,
        medical_service_id: null
      });
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const selectMedicalService = (service: MedicalService) => {
    setNewItem({
      ...newItem,
      description: service.name,
      unit_price: service.base_price,
      total: newItem.quantity * service.base_price,
      medical_service_id: service.id,
      medicine_id: null
    });
  };

  const selectMedicalProduct = (product: Medicine) => {
    setNewItem({
      ...newItem,
      description: `${product.name} (${product.unit})`,
      unit_price: product.unit_price,
      total: newItem.quantity * product.unit_price,
      medicine_id: product.id,
      medical_service_id: null
    });
  };

  const getPatientInfo = (patient_id: string) => {
    return patients.find(p => p.id === patient_id);
  };

  const selectedPatient = getPatientInfo(formData.patient_id);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + formData.tax;

  const filteredPatients = patients.filter(patient => {
    const searchLower = patientSearchTerm.toLowerCase();
    return patient.first_name.toLowerCase().includes(searchLower) ||
           patient.last_name.toLowerCase().includes(searchLower);
  });

  const handlePatientSelect = (patientId: string) => {
    setFormData({ ...formData, patient_id: patientId });
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setPatientSearchTerm(`${patient.first_name} ${patient.last_name}`);
    }
    setShowPatientDropdown(false);
  };


  const getInvoiceTypes = () => [
    { value: 'ordinary', label: 'Ordinaire' },
    { value: 'general-consultation', label: 'Consultation générale' },
    { value: 'gynecological-consultation', label: 'Consultation gynécologique' },
    { value: 'treatment', label: 'Traitement' }
  ];

  const selectedMedicalRecord = patientMedicalRecords.find(r => r.id === selectedMedicalRecordId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header - Compact */}
      <div className="card-glass rounded-xl shadow-card border border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-success-light p-1.5 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <h1 className="text-lg font-semibold text-card-foreground">
                {invoice ? 'Modifier la Facture' : 'Nouvelle Facture'}
              </h1>
            </div>
          </div>
          {invoice?.status === 'paid' && (
            <div className="bg-error-light border border-error rounded-lg px-2 py-1">
              <span className="text-xs font-medium text-error">
                ⚠️ Facture payée
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Catalogue */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informations générales - Compact */}
            <div className="card-glass rounded-xl shadow-card border border-border/50 p-4 relative z-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Type de facture
                  </label>
                  <select
                    name="invoice_type"
                    value={formData.invoice_type}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {getInvoiceTypes().map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 relative z-30">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Patient
                  </label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPatientForm(true)}
                      className="flex-shrink-0 btn-primary p-1.5 rounded-lg"
                      title="Ajouter un patient"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          setShowPatientDropdown(true);
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder="Rechercher..."
                        className="w-full pl-7 pr-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required={!formData.patient_id}
                      />
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {filteredPatients.map(patient => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handlePatientSelect(patient.id)}
                              className="w-full px-3 py-1.5 text-left hover:bg-muted transition-colors flex items-center space-x-2"
                            >
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {patient.phone}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {selectedPatient && (
                <div className="mt-3 px-3 py-2 bg-info-light rounded-lg border border-info/30 flex items-center gap-3 text-xs">
                  <User className="h-4 w-4 text-info flex-shrink-0" />
                  <span className="font-medium text-foreground">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground">{selectedPatient.phone}</span>
                  {selectedPatient.email && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground">{selectedPatient.email}</span>
                    </>
                  )}
                </div>
              )}

              {/* Sélection de consultation pour le type "treatment" */}
              {formData.invoice_type === 'treatment' && formData.patient_id && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Consultation</span>
                  </div>
                  
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-xs text-muted-foreground">Chargement...</span>
                    </div>
                  ) : patientMedicalRecords.length === 0 ? (
                    <div className="px-3 py-2 bg-warning-light border border-warning/30 rounded-lg text-center">
                      <p className="text-xs text-foreground">Aucune consultation trouvée.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedMedicalRecordId}
                        onChange={(e) => setSelectedMedicalRecordId(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="">-- Sélectionner --</option>
                        {patientMedicalRecords.map(record => (
                          <option key={record.id} value={record.id}>
                            {formatDate(record.date)} - {record.reason}
                          </option>
                        ))}
                      </select>

                      {selectedMedicalRecord && (
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                Traitement recommandé
                              </h4>
                              <p className={`text-sm leading-snug ${selectedMedicalRecord.treatment ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                                {selectedMedicalRecord.treatment || 'Non renseigné'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                Notes du médecin
                              </h4>
                              <p className={`text-sm leading-snug ${selectedMedicalRecord.notes ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                                {selectedMedicalRecord.notes || 'Non renseigné'}
                              </p>
                            </div>
                          </div>
                          {selectedMedicalRecord.doctor && (
                            <div className="pt-2 border-t border-primary/20 text-xs text-muted-foreground">
                              Dr. {selectedMedicalRecord.doctor.first_name} {selectedMedicalRecord.doctor.last_name}
                              {selectedMedicalRecord.doctor.speciality && ` • ${selectedMedicalRecord.doctor.speciality}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Catalogue de services et produits */}
            <div className="card-glass rounded-xl shadow-card border border-border/50 p-4 relative z-10">
              {/* Onglets */}
              <div className="flex space-x-1 mb-3 bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-sm transition-all duration-200 ${
                    activeTab === 'services'
                      ? 'bg-card text-primary font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md text-sm transition-all duration-200 ${
                    activeTab === 'products'
                      ? 'bg-card text-primary font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Produits</span>
                </button>
              </div>

              {activeTab === 'services' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <select
                      value={selectedServiceCategory}
                      onChange={(e) => setSelectedServiceCategory(e.target.value)}
                      className="px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="all">Toutes</option>
                      {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-card rounded-lg border border-border max-h-48 overflow-y-auto">
                    {filteredServices.length > 0 ? (
                      <div className="divide-y divide-border">
                        {filteredServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => selectMedicalService(service)}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {SERVICE_CATEGORY_LABELS[service.category as keyof typeof SERVICE_CATEGORY_LABELS] || service.category}
                                  {service.duration && ` • ${service.duration} min`}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-foreground ml-2">
                                {service.base_price.toLocaleString()} F
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Aucun service trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="all">Toutes</option>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-card rounded-lg border border-border max-h-48 overflow-y-auto">
                    {filteredMedicines.length > 0 ? (
                      <div className="divide-y divide-border">
                        {filteredMedicines.map((product) => {
                          const isLowStock = product.current_stock <= product.min_stock;
                          
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => selectMedicalProduct(product)}
                              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {CATEGORY_LABELS[product.category]}
                                    {isLowStock && (
                                      <span className="text-warning ml-1">• Stock faible</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-foreground ml-2">
                                  {product.unit_price.toLocaleString()} F
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Aucun produit trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulaire d'ajout manuel */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => handleItemChange('description', e.target.value)}
                    className="flex-1 min-w-[150px] px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Qté"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Prix"
                    min="0"
                    value={newItem.unit_price}
                    onChange={(e) => handleItemChange('unit_price', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0}
                    className="btn-primary px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Cart & Summary */}
          <div>
            <div className="card-glass rounded-xl shadow-card border border-border/50 p-4 sticky top-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-1.5 text-success" />
                Articles ({items.length})
              </h3>

              {items.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-muted rounded-lg px-2.5 py-2 relative group">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-1.5 right-1.5 text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="pr-5">
                        <div className="text-sm font-medium text-foreground truncate">{item.description}</div>
                        <div className="flex justify-between text-xs mt-0.5">
                          <span className="text-muted-foreground">{item.quantity} × {item.unit_price.toLocaleString()} F</span>
                          <span className="font-medium text-success">{item.total.toLocaleString()} F</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground mb-3">
                  <Package className="h-8 w-8 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Aucun article</p>
                </div>
              )}

              {/* Calculs */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Taxes</label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payée</option>
                      <option value="overdue">En retard</option>
                    </select>
                  </div>
                </div>

                {formData.status === 'paid' && (
                  <div className="px-2 py-1.5 bg-success-light border border-success rounded-lg text-xs text-success flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Paiement auto en espèces</span>
                  </div>
                )}

                <div className="bg-card rounded-lg p-2.5 border border-border">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total:</span>
                      <span className="font-medium text-foreground">{subtotal.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes:</span>
                      <span className="font-medium">{formData.tax.toLocaleString()} F</span>
                    </div>
                    <div className="border-t border-border pt-1.5 mt-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">Total:</span>
                        <span className="text-success">{total.toLocaleString()} F</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-3">
                <button
                  type="submit"
                  disabled={!formData.patient_id || items.length === 0 || createInvoice.isPending || updateInvoice.isPending}
                  className="w-full px-4 py-2 btn-primary rounded-lg flex items-center justify-center space-x-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>
                    {createInvoice.isPending || updateInvoice.isPending 
                      ? 'Enregistrement...' 
                      : (invoice ? 'Mettre à jour' : 'Créer la facture')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full px-4 py-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal pour ajouter un nouveau patient */}
      {showPatientForm && (
        <PatientForm
          onClose={() => setShowPatientForm(false)}
          onSave={async (patientData) => {
            try {
              const newPatient = await createPatient.mutateAsync(patientData);
              setFormData({ ...formData, patient_id: newPatient.id });
              setPatientSearchTerm(`${newPatient.first_name} ${newPatient.last_name}`);
              setShowPatientForm(false);
            } catch (error) {
              console.error('Error creating patient:', error);
            }
          }}
        />
      )}
    </div>
  );
}
