import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  height?: string; // Add custom height prop
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, onClose, title, children, footer, 
  maxWidth = 'max-w-md', height = 'sm:h-auto sm:max-h-[90vh]' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Content */}
      <div 
        className={`relative bg-white w-full sm:w-auto ${maxWidth} flex flex-col 
        h-[95vh] ${height}
        rounded-t-[2rem] sm:rounded-3xl shadow-2xl 
        animate-slide-up sm:animate-pop 
        overflow-hidden border-t sm:border border-white/50`}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1 shrink-0" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {title && (
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )}

        <div className="p-0 sm:p-0 overflow-hidden flex flex-col flex-1 bg-slate-50/50 sm:bg-white">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;