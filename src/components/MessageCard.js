import React, { useEffect } from 'react';

/**
 * Reusable Message Card Component
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of message: 'success', 'error', 'info', 'warning'
 * @param {function} props.onClose - Function to call when closing the message
 * @param {number} props.autoCloseTime - Time in ms after which the message should auto-close (default: 3000)
 * @param {boolean} props.showIcon - Whether to show the icon (default: true)
 */
const MessageCard = ({ 
  message, 
  type = 'success', 
  onClose, 
  autoCloseTime = 3000,
  showIcon = true
}) => {
  useEffect(() => {
    if (autoCloseTime > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoCloseTime, onClose]);

  // Define colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-l-4 border-green-500',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          border: 'border-l-4 border-red-500',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          border: 'border-l-4 border-yellow-500',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-blue-500',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl ${styles.border} p-4 w-96 animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showIcon && (
            <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2`}>
              <svg className={`w-5 h-5 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {type === 'error' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : type === 'warning' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                )}
              </svg>
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        </div>
        <button 
          type="button" 
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageCard;