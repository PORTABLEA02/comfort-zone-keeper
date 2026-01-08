import { useRouter } from '../../hooks/useRouter';
import { ConsultationList } from './ConsultationList';
import { Database } from '../../lib/database.types';

export { ConsultationFormPage } from './ConsultationFormPage';
export { ConsultationDetailPage } from './ConsultationDetailPage';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

export function ConsultationsManager() {
  const { navigate } = useRouter();

  const handleSelectConsultation = (consultation: MedicalRecord) => {
    navigate(`consultation-detail?consultationId=${consultation.id}`);
  };

  const handleNewConsultation = () => {
    navigate('consultation-form');
  };

  return (
    <div className="space-y-6">
      <ConsultationList
        onSelectConsultation={handleSelectConsultation}
        onNewConsultation={handleNewConsultation}
      />
    </div>
  );
}
