import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const iconMap = {
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  confirm: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function Modal({
  isOpen,
  type,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}: ModalProps) {
  if (!isOpen) return null;

  const { icon: Icon, color, bg } = iconMap[type];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const confirmButtonClass = isDangerous
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-green-600 hover:bg-green-700 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden" style={{ animation: 'fadeInZoom 0.2s ease-in-out' }}>
        {/* Header */}
        <div className={`${bg} px-6 py-4 border-b border-gray-200 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`${color} w-5 h-5`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
