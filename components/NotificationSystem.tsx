import React, { useState, useEffect, createContext, useContext } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    actions?: Array<{
        label: string;
        action: () => void;
        variant?: 'primary' | 'secondary';
    }>;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
    maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
    position = 'top-right',
    maxNotifications = 5
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            return updated.slice(0, maxNotifications);
        });

        // Auto remove after duration
        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getPositionClasses = () => {
        const positions = {
            'top-right': 'top-6 right-6',
            'top-left': 'top-6 left-6',
            'bottom-right': 'bottom-6 right-6',
            'bottom-left': 'bottom-6 left-6',
            'top-center': 'top-6 left-1/2 transform -translate-x-1/2'
        };
        return positions[position];
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
            {children}
            
            {/* Notification Container */}
            <div className={`fixed z-50 ${getPositionClasses()} space-y-3 pointer-events-none`}>
                {notifications.map((notification) => (
                    <NotificationToast
                        key={notification.id}
                        notification={notification}
                        onRemove={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

interface NotificationToastProps {
    notification: Notification;
    onRemove: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onRemove();
        }, 300);
    };

    const getTypeStyles = () => {
        const styles = {
            success: {
                bg: 'bg-green-50 border-green-200',
                icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                titleColor: 'text-green-800',
                messageColor: 'text-green-700'
            },
            error: {
                bg: 'bg-red-50 border-red-200',
                icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
                titleColor: 'text-red-800',
                messageColor: 'text-red-700'
            },
            warning: {
                bg: 'bg-yellow-50 border-yellow-200',
                icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
                titleColor: 'text-yellow-800',
                messageColor: 'text-yellow-700'
            },
            info: {
                bg: 'bg-blue-50 border-blue-200',
                icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
                titleColor: 'text-blue-800',
                messageColor: 'text-blue-700'
            }
        };
        return styles[notification.type];
    };

    const typeStyles = getTypeStyles();

    return (
        <div
            className={`
                notification-toast pointer-events-auto
                max-w-sm w-full ${typeStyles.bg} border rounded-xl shadow-lg
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving 
                    ? 'translate-x-0 opacity-100 scale-100' 
                    : 'translate-x-full opacity-0 scale-95'
                }
            `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {typeStyles.icon}
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className={`text-sm font-medium ${typeStyles.titleColor}`}>
                            {notification.title}
                        </p>
                        {notification.message && (
                            <p className={`mt-1 text-sm ${typeStyles.messageColor}`}>
                                {notification.message}
                            </p>
                        )}
                        {notification.actions && (
                            <div className="mt-3 flex space-x-2">
                                {notification.actions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.action}
                                        className={`
                                            text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                                            ${action.variant === 'primary' 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                            }
                                        `}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleRemove}
                            className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper hooks for common notifications
export const useNotificationHelpers = () => {
    const { addNotification } = useNotifications();

    return {
        showSuccess: (title: string, message?: string) => 
            addNotification({ type: 'success', title, message }),
        
        showError: (title: string, message?: string) => 
            addNotification({ type: 'error', title, message }),
        
        showWarning: (title: string, message?: string) => 
            addNotification({ type: 'warning', title, message }),
        
        showInfo: (title: string, message?: string) => 
            addNotification({ type: 'info', title, message }),
    };
};

export default NotificationToast;