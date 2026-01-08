import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  isLoading: boolean;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    type: 'warning'
  });
  
  // Utiliser une ref pour stocker le resolver - évite les problèmes de dépendances stale
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({
        ...options,
        isOpen: true,
        isLoading: false
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (resolveRef.current) {
      setConfirmState(prev => ({ ...prev, isLoading: true }));
      
      // Petit délai pour montrer l'état de chargement
      await new Promise(resolve => setTimeout(resolve, 300));
      
      resolveRef.current(true);
      resolveRef.current = null;
      setConfirmState(prev => ({ 
        ...prev, 
        isOpen: false, 
        isLoading: false
      }));
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
      setConfirmState(prev => ({ 
        ...prev, 
        isOpen: false, 
        isLoading: false
      }));
    }
  }, []);

  return {
    confirm,
    confirmState,
    handleConfirm,
    handleCancel
  };
}