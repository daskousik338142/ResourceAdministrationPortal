import React from 'react';
import '../styles/custom-modal.css';
const CustomModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'info', 'confirm', 'error', 'success'
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };
  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div className="custom-modal">
        <div className="custom-modal-header">
          <h3 className="custom-modal-title">{title}</h3>
          <button className="custom-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="custom-modal-body">
          <div className={`custom-modal-icon ${type}`}>
            {type === 'error' && '⚠️'}
            {type === 'success' && '✅'}
            {type === 'confirm' && '❓'}
            {type === 'info' && 'ℹ️'}
          </div>
          <p className="custom-modal-message">{message}</p>
        </div>
        <div className="custom-modal-footer">
          {type === 'confirm' && (
            <button className="custom-modal-btn cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className="custom-modal-btn confirm" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomModal;
