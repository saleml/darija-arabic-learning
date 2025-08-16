import { useEffect, useState } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface Props {
  notification: Notification | null;
  onDismiss: () => void;
}

export default function NotificationToast({ notification, onDismiss }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, notification.duration || 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="h-5 w-5 text-white" />;
      case 'error':
        return <X className="h-5 w-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      default:
        return <Info className="h-5 w-5 text-white" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${getStyles()} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px]`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-medium">{notification.message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}