import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Pill, Save, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { MedicalRecordService } from '../../services/medical-records';
import { useMedicines } from '../../hooks/queries/useMedicines';
import { Tables } from '../../integrations/supabase/types';

type Medicine = Tables<'medicines'>;

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  medicineId?: string;
}

interface PrescriptionFormProps {
  medicalRecordId: string;
  patientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PrescriptionForm({ medicalRecordId, patientName, onClose, onSuccess }: PrescriptionFormProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>(['']);
  const searchRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { data: medicines = [] } = useMedicines();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSearchIndex !== null) {
        const ref = searchRefs.current[activeSearchIndex];
        if (ref && !ref.contains(event.target as Node)) {
          setActiveSearchIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSearchIndex]);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    setSearchQueries([...searchQueries, '']);
  };

  const removePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
      setSearchQueries(searchQueries.filter((_, i) => i !== index));
    }
  };

  const updatePrescription = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const handleSearchChange = (index: number, value: string) => {
    const newQueries = [...searchQueries];
    newQueries[index] = value;
    setSearchQueries(newQueries);
    updatePrescription(index, 'medication', value);
    setActiveSearchIndex(index);
  };

  const selectMedicine = (index: number, medicine: Medicine) => {
    const updated = [...prescriptions];
    updated[index] = {
      ...updated[index],
      medication: `${medicine.name} (${medicine.unit})`,
      medicineId: medicine.id
    };
    setPrescriptions(updated);
    
    const newQueries = [...searchQueries];
    newQueries[index] = medicine.name;
    setSearchQueries(newQueries);
    
    setActiveSearchIndex(null);
  };

  const getFilteredMedicines = (query: string): Medicine[] => {
    if (!query.trim()) return medicines.slice(0, 10);
    
    const lowerQuery = query.toLowerCase();
    return medicines
      .filter(m => 
        m.name.toLowerCase().includes(lowerQuery) ||
        m.manufacturer.toLowerCase().includes(lowerQuery) ||
        (m.description?.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPrescriptions = prescriptions.filter(
      p => p.medication.trim() && p.dosage.trim() && p.frequency.trim() && p.duration.trim()
    );

    if (validPrescriptions.length === 0) {
      toast.error('Veuillez remplir au moins une prescription complète');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const prescription of validPrescriptions) {
        await MedicalRecordService.addPrescription(medicalRecordId, {
          medication: prescription.medication.trim(),
          dosage: prescription.dosage.trim(),
          frequency: prescription.frequency.trim(),
          duration: prescription.duration.trim(),
          instructions: prescription.instructions.trim() || null
        });
      }

      toast.success(`${validPrescriptions.length} prescription(s) ajoutée(s) avec succès`);
      onSuccess();
    } catch (error) {
      console.error('Error adding prescriptions:', error);
      toast.error('Erreur lors de l\'ajout des prescriptions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Pill className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Créer une Ordonnance</h2>
              <p className="text-sm text-gray-600">Patient: {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {prescriptions.map((prescription, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-medium text-gray-800">Médicament #{index + 1}</h3>
                </div>
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrescription(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medication Search Field */}
                <div 
                  className="md:col-span-2 relative"
                  ref={el => searchRefs.current[index] = el}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médicament *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQueries[index] || prescription.medication}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      onFocus={() => setActiveSearchIndex(index)}
                      placeholder="Rechercher un médicament..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  {/* Dropdown */}
                  {activeSearchIndex === index && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredMedicines(searchQueries[index] || '').length > 0 ? (
                        <>
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                            Médicaments de l'inventaire
                          </div>
                          {getFilteredMedicines(searchQueries[index] || '').map((medicine) => (
                            <button
                              key={medicine.id}
                              type="button"
                              onClick={() => selectMedicine(index, medicine)}
                              className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{medicine.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {medicine.manufacturer} • {medicine.unit} • Stock: {medicine.current_stock}
                                  </p>
                                </div>
                              </div>
                              {medicine.current_stock <= medicine.min_stock && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                  Stock bas
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Aucun médicament trouvé</p>
                          <p className="text-xs">Vous pouvez saisir un nom manuellement</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={prescription.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                    placeholder="Ex: 1 comprimé"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fréquence *
                  </label>
                  <input
                    type="text"
                    value={prescription.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                    placeholder="Ex: 3 fois par jour"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée *
                  </label>
                  <input
                    type="text"
                    value={prescription.duration}
                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                    placeholder="Ex: 7 jours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions particulières
                  </label>
                  <textarea
                    value={prescription.instructions}
                    onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                    placeholder="Ex: À prendre pendant les repas, éviter l'alcool..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPrescription}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un médicament</span>
          </button>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'ordonnance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
