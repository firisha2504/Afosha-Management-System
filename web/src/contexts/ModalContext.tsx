import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal, { ModalType } from '../components/Modal';

interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

interface ModalContextType {
  showModal: (config: ModalConfig) => Promise<boolean>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    type: 'info',
    title: '',
    message: '',
  });
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const showModal = useCallback((newConfig: ModalConfig) => {
    return new Promise<boolean>((resolve) => {
      setConfig(newConfig);
      setResolveCallback(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback?.(false);
  };

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <Modal
        isOpen={isOpen}
        type={config.type}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        isDangerous={config.isDangerous}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
