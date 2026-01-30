import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmText = "ยืนยัน", cancelText = "ยกเลิก", isDanger = false 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onCancel} 
      title={title}
      footer={
        <>
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm
              ${isDanger ? 'bg-red-500 shadow-red-200 hover:bg-red-600' : 'bg-slate-800 shadow-slate-300 hover:bg-slate-700'}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
           {isDanger ? (
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           ) : (
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           )}
        </div>
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmModal;