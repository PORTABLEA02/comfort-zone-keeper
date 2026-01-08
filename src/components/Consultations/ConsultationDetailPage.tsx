import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, FileText, Pill, Printer, Edit, Tag, Plus, Stethoscope, CheckCircle, Clock, XCircle, ClipboardList, Activity, FlaskConical, CornerDownRight, ExternalLink } from 'lucide-react';
import { Tables } from '../../integrations/supabase/types';
import { PatientService } from '../../services/patients';
import { MedicalRecordService } from '../../services/medical-records';
import { ClinicSettingsService, ClinicSettings } from '../../services/clinic-settings';
import { TreatmentSessionsService, TreatmentSession } from '../../services/treatment-sessions';
import { useRouter } from '../../hooks/useRouter';
import { PrescriptionForm } from '../Prescriptions/PrescriptionForm';
import { useControlsForConsultation } from '../../hooks/queries/useConsultations';
import { toast } from 'sonner';

type MedicalRecord = Tables<'medical_records'> & {
  prescriptions?: Tables<'prescriptions'>[];
  parent_consultation_id?: string | null;
  is_control?: boolean;
};
type Patient = Tables<'patients'>;

export function ConsultationDetailPage() {
  const { navigate, queryParams } = useRouter();
  const consultationId = queryParams.consultationId;
  
  const [consultation, setConsultation] = useState<MedicalRecord | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [parentConsultation, setParentConsultation] = useState<MedicalRecord | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [treatmentSessions, setTreatmentSessions] = useState<TreatmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  // Charger les contrôles liés à cette consultation
  const { data: controls = [] } = useControlsForConsultation(
    consultation && !consultation.is_control ? consultationId : null
  );

  useEffect(() => {
    if (consultationId) {
      loadData();
    }
  }, [consultationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const consultationData = await MedicalRecordService.getById(consultationId!);
      
      if (!consultationData) {
        toast.error('Consultation non trouvée');
        navigate('consultations');
        return;
      }
      
      setConsultation(consultationData as MedicalRecord);
      
      const [patientData, settings, sessions] = await Promise.all([
        PatientService.getById(consultationData.patient_id),
        ClinicSettingsService.getSettings(),
        TreatmentSessionsService.getByMedicalRecord(consultationData.id)
      ]);
      
      setPatient(patientData as Patient);
      setClinicSettings(settings);
      setTreatmentSessions(sessions);

      // Si c'est un contrôle, charger la consultation parente
      if ((consultationData as any).is_control && (consultationData as any).parent_consultation_id) {
        const parentData = await MedicalRecordService.getById((consultationData as any).parent_consultation_id);
        setParentConsultation(parentData as MedicalRecord);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPrescription = (prescription: Tables<'prescriptions'>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !consultation) return;

    const consultationDate = new Date(consultation.date).toLocaleDateString('fr-FR');
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';
    const patientAge = patient ? calculateAge(patient.date_of_birth) : 'N/A';

    const clinicName = clinicSettings?.clinic_name || 'Clinique';
    const clinicAddress = clinicSettings?.address || '';
    const clinicPhone = clinicSettings?.phone || '';
    const clinicEmail = clinicSettings?.email || '';
    const clinicWebsite = clinicSettings?.website || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordonnance - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-name { font-size: 28px; font-weight: bold; color: #16a34a; margin-bottom: 5px; }
          .clinic-info { font-size: 12px; color: #666; }
          .prescription-title { text-align: center; font-size: 22px; font-weight: bold; margin: 20px 0; color: #333; text-transform: uppercase; letter-spacing: 2px; }
          .patient-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .patient-info h3 { font-size: 14px; color: #16a34a; margin-bottom: 10px; text-transform: uppercase; }
          .patient-info p { font-size: 14px; margin: 5px 0; color: #333; }
          .prescription-content { border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px; }
          .medication-name { font-size: 20px; font-weight: bold; color: #16a34a; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #d1d5db; }
          .prescription-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px; }
          .detail-item { background: #f0fdf4; padding: 12px; border-radius: 6px; }
          .detail-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .detail-value { font-size: 14px; font-weight: 600; color: #333; }
          .instructions { background: #fefce8; padding: 15px; border-radius: 6px; border-left: 4px solid #eab308; }
          .instructions-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 6px; }
          .instructions-text { font-size: 14px; color: #333; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature { text-align: right; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 10px; }
          .date { font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinicName}</div>
          <div class="clinic-info">${clinicAddress}</div>
          <div class="clinic-info">Tél: ${clinicPhone}${clinicEmail ? ` | Email: ${clinicEmail}` : ''}${clinicWebsite ? ` | ${clinicWebsite}` : ''}</div>
        </div>

        <div class="prescription-title">Ordonnance Médicale</div>

        <div class="patient-info">
          <h3>Informations Patient</h3>
          <p><strong>Nom:</strong> ${patientName}</p>
          <p><strong>Âge:</strong> ${patientAge} ans</p>
          <p><strong>Date de consultation:</strong> ${consultationDate}</p>
        </div>

        <div class="prescription-content">
          <div class="medication-name">${prescription.medication}</div>
          <div class="prescription-details">
            <div class="detail-item">
              <div class="detail-label">Dosage</div>
              <div class="detail-value">${prescription.dosage}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Fréquence</div>
              <div class="detail-value">${prescription.frequency}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Durée</div>
              <div class="detail-value">${prescription.duration}</div>
            </div>
          </div>
          ${prescription.instructions ? `
            <div class="instructions">
              <div class="instructions-label">Instructions particulières</div>
              <div class="instructions-text">${prescription.instructions}</div>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="date">
            <p>Fait à ${clinicAddress.split(',')[0] || ''}, le ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div class="signature">
            <div class="signature-line">Signature du Médecin</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrintLabOrders = () => {
    if (!consultation || !(consultation as any).lab_orders) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const consultationDate = new Date(consultation.date).toLocaleDateString('fr-FR');
    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';
    const patientAge = patient ? calculateAge(patient.date_of_birth) : 'N/A';

    const clinicName = clinicSettings?.clinic_name || 'Clinique';
    const clinicAddress = clinicSettings?.address || '';
    const clinicPhone = clinicSettings?.phone || '';
    const clinicEmail = clinicSettings?.email || '';
    const clinicWebsite = clinicSettings?.website || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bon d'Examen - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-name { font-size: 28px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
          .clinic-info { font-size: 12px; color: #666; }
          .document-title { text-align: center; font-size: 22px; font-weight: bold; margin: 20px 0; color: #333; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #4f46e5; padding: 10px; background: #eef2ff; }
          .patient-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
          .patient-info h3 { font-size: 14px; color: #4f46e5; margin-bottom: 10px; text-transform: uppercase; }
          .patient-info p { font-size: 14px; margin: 5px 0; color: #333; }
          .lab-content { border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px; min-height: 200px; }
          .lab-content h4 { font-size: 16px; font-weight: bold; color: #4f46e5; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #d1d5db; }
          .lab-orders { font-size: 14px; line-height: 2; white-space: pre-wrap; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature { text-align: right; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 10px; }
          .date { font-size: 12px; color: #666; }
          .stamp-area { border: 1px dashed #999; width: 150px; height: 80px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${clinicName}</div>
          <div class="clinic-info">${clinicAddress}</div>
          <div class="clinic-info">Tél: ${clinicPhone}${clinicEmail ? ` | Email: ${clinicEmail}` : ''}${clinicWebsite ? ` | ${clinicWebsite}` : ''}</div>
        </div>

        <div class="document-title">Bon d'Examen</div>

        <div class="patient-info">
          <h3>Informations Patient</h3>
          <p><strong>Nom:</strong> ${patientName}</p>
          <p><strong>Âge:</strong> ${patientAge} ans</p>
          <p><strong>Date de consultation:</strong> ${consultationDate}</p>
        </div>

        <div class="lab-content">
          <h4>Examens demandés</h4>
          <div class="lab-orders">${(consultation as any).lab_orders}</div>
        </div>

        <div class="footer">
          <div>
            <div class="stamp-area">Cachet</div>
            <div class="date" style="margin-top: 10px;">
              <p>Fait à ${clinicAddress.split(',')[0] || ''}, le ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div class="signature">
            <div class="signature-line">Signature du Médecin</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrescriptionSuccess = () => {
    setShowPrescriptionForm(false);
    loadData();
  };

  const getConsultationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: 'Consultation générale',
      specialist: 'Consultation spécialisée',
      emergency: 'Consultation d\'urgence',
      followup: 'Consultation de suivi',
      preventive: 'Consultation préventive',
      other: 'Autre consultation'
    };
    return types[type] || 'Type non défini';
  };

  const getConsultationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      specialist: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      followup: 'bg-green-100 text-green-800',
      preventive: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSessionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!consultation) {
    return null;
  }

  const isControl = consultation.is_control;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('consultations')}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {isControl ? 'Détail du Contrôle' : 'Détail de la Consultation'}
                </h1>
                {isControl && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Gratuit
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {patient ? `${patient.first_name} ${patient.last_name}` : 'Patient'} - {new Date(consultation.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isControl && (
              <button
                onClick={() => navigate(`consultation-form?parentConsultationId=${consultation.id}`)}
                className="bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                title="Planifier un contrôle"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Contrôle</span>
              </button>
            )}
            <button
              onClick={() => setShowPrescriptionForm(true)}
              className="bg-green-600 text-white px-3 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              title="Créer une ordonnance"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Ordonnance</span>
            </button>
            <button
              onClick={handlePrint}
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
              title="Imprimer"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(`consultation-form?consultationId=${consultation.id}`)}
              className="text-primary hover:text-primary/80 p-2 rounded-xl hover:bg-primary/10 transition-colors"
              title="Modifier"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Alerte contrôle avec lien vers parent */}
        {isControl && parentConsultation && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CornerDownRight className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Contrôle lié à une consultation</span>
              </div>
              <button
                onClick={() => navigate(`consultation-detail?consultationId=${parentConsultation.id}`)}
                className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 text-sm font-medium"
              >
                <span>Voir la consultation parente</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Consultation du{' '}
              <span className="font-medium">
                {new Date(parentConsultation.date).toLocaleDateString('fr-FR')}
              </span>
              {' '}- {parentConsultation.diagnosis}
            </p>
          </div>
        )}

        {/* Alerte consultation auto-créée */}
        {consultation.notes?.includes('Consultation créée automatiquement depuis le workflow') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Consultation créée automatiquement</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Cette consultation a été créée automatiquement depuis le workflow de prise en charge 
              avec intégration des constantes vitales.
            </p>
          </div>
        )}

        {/* Patient Information */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Informations Patient</h3>
          </div>
          
          {patient && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Nom complet:</span>
                <p className="text-foreground">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Âge:</span>
                <p className="text-foreground">{calculateAge(patient.date_of_birth)} ans</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Groupe sanguin:</span>
                <p className="text-foreground">{patient.blood_type || 'Non défini'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Téléphone:</span>
                <p className="text-foreground">{patient.phone}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-destructive">Allergies:</span>
                <p className={patient.allergies && patient.allergies.length > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {patient.allergies && patient.allergies.length > 0 
                    ? patient.allergies.join(', ') 
                    : 'Aucune allergie connue'}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-amber-600">Antécédents médicaux:</span>
                <p className={patient.medical_history && patient.medical_history.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                  {patient.medical_history && patient.medical_history.length > 0 
                    ? patient.medical_history.join(', ') 
                    : 'Aucun antécédent connu'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Consultation Information */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              {isControl ? 'Informations du Contrôle' : 'Informations de Consultation'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Date:</span>
              <p className="text-foreground">{new Date(consultation.date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Type:</span>
              <div className="mt-1 flex items-center space-x-2">
                {isControl ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Contrôle
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConsultationTypeColor(consultation.type)}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {getConsultationTypeLabel(consultation.type)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Motif:</span>
              <p className="text-foreground">{consultation.reason}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Symptômes observés:</span>
              <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-xl border border-border">
                {consultation.symptoms || 'Aucun symptôme particulier noté'}
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ClipboardList className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Traitement antérieur:</span>
              </div>
              <p className={`p-3 rounded-xl border ${(consultation as any).previous_treatment ? 'text-foreground bg-orange-50 border-orange-200' : 'text-muted-foreground bg-muted/50 border-border italic'}`}>
                {(consultation as any).previous_treatment || 'Non renseigné'}
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Examen physique:</span>
              </div>
              <p className={`p-3 rounded-xl border ${(consultation as any).physical_examination ? 'text-foreground bg-blue-50 border-blue-200' : 'text-muted-foreground bg-muted/50 border-border italic'}`}>
                {(consultation as any).physical_examination || 'Non renseigné'}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">Diagnostic:</span>
              <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-xl border border-border font-medium">
                {consultation.diagnosis}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">Traitement recommandé:</span>
              <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-xl border border-border">
                {consultation.treatment || 'Aucun traitement spécifique prescrit'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Contrôles (uniquement pour les consultations parentes) */}
        {!isControl && controls.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Contrôles effectués</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {controls.length}
                </span>
              </div>
              <button
                onClick={() => navigate(`consultation-form?parentConsultationId=${consultation.id}`)}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau contrôle</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {controls.map((control: any) => (
                <div
                  key={control.id}
                  className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200 hover:bg-emerald-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`consultation-detail?consultationId=${control.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CornerDownRight className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-foreground">
                          {new Date(control.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Contrôle gratuit
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Motif:</span>
                          <span className="text-foreground ml-1">{control.reason}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Diagnostic:</span>
                          <span className="text-foreground ml-1">{control.diagnosis || 'Non spécifié'}</span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescription */}
        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Pill className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Ordonnance</h3>
            </div>
            
            <div className="space-y-3">
              {consultation.prescriptions.map((prescription, index) => (
                <div key={index} className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground text-lg">{prescription.medication}</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePrintPrescription(prescription)}
                        className="text-green-600 hover:text-green-800 p-1.5 rounded-xl hover:bg-green-100 transition-colors"
                        title="Imprimer cette ordonnance"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Dosage:</span>
                      <p className="text-foreground">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Fréquence:</span>
                      <p className="text-foreground">{prescription.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Durée:</span>
                      <p className="text-foreground">{prescription.duration}</p>
                    </div>
                    {prescription.instructions && (
                      <div className="md:col-span-3">
                        <span className="font-medium text-muted-foreground">Instructions:</span>
                        <p className="text-foreground">{prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bilan (Bon d'examen) */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FlaskConical className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-foreground">Bilan (Bon d'examen)</h3>
            </div>
            {(consultation as any).lab_orders && (
              <button
                onClick={() => handlePrintLabOrders()}
                className="text-indigo-600 hover:text-indigo-800 p-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center space-x-1"
                title="Imprimer le bon d'examen"
              >
                <Printer className="h-4 w-4" />
                <span className="text-sm">Imprimer</span>
              </button>
            )}
          </div>
          <div className={`p-4 rounded-xl border ${(consultation as any).lab_orders ? 'bg-indigo-50 border-indigo-200' : 'bg-muted/50 border-border'}`}>
            <p className={`whitespace-pre-wrap ${(consultation as any).lab_orders ? 'text-foreground' : 'text-muted-foreground italic'}`}>
              {(consultation as any).lab_orders || 'Non renseigné'}
            </p>
          </div>
        </div>

        {treatmentSessions.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-foreground">Séances de traitement</h3>
            </div>
            
            <div className="space-y-3">
              {treatmentSessions.map((session) => (
                <div key={session.id} className="bg-muted/50 rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSessionStatusIcon(session.status)}
                        <span className="font-medium text-foreground">
                          Séance {session.session_number}{session.total_sessions ? ` / ${session.total_sessions}` : ''}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getSessionStatusLabel(session.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Type:</span>
                          <span className="text-foreground ml-1">{session.treatment_type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Date prévue:</span>
                          <span className="text-foreground ml-1">
                            {new Date(session.scheduled_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {session.performed_date && (
                          <div>
                            <span className="font-medium text-muted-foreground">Date réalisée:</span>
                            <span className="text-foreground ml-1">
                              {new Date(session.performed_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {session.observations && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-muted-foreground">Observations:</span>
                            <span className="text-foreground ml-1">{session.observations}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {consultation.notes && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Notes du médecin</h3>
            </div>
            <p className="text-foreground whitespace-pre-wrap">{consultation.notes}</p>
          </div>
        )}
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && patient && (
        <PrescriptionForm
          medicalRecordId={consultation.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          onClose={() => setShowPrescriptionForm(false)}
          onSuccess={handlePrescriptionSuccess}
        />
      )}
    </>
  );
}
