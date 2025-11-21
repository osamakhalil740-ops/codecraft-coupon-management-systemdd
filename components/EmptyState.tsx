import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    variant?: 'default' | 'search' | 'error' | 'loading';
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
    variant = 'default'
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'search':
                return {
                    container: 'bg-gradient-to-br from-blue-50 to-indigo-50',
                    iconColor: 'text-blue-400',
                    titleColor: 'text-blue-900',
                    descColor: 'text-blue-700',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700'
                };
            case 'error':
                return {
                    container: 'bg-gradient-to-br from-red-50 to-pink-50',
                    iconColor: 'text-red-400',
                    titleColor: 'text-red-900',
                    descColor: 'text-red-700',
                    buttonColor: 'bg-red-600 hover:bg-red-700'
                };
            case 'loading':
                return {
                    container: 'bg-gradient-to-br from-gray-50 to-slate-50',
                    iconColor: 'text-gray-400',
                    titleColor: 'text-gray-900',
                    descColor: 'text-gray-700',
                    buttonColor: 'bg-gray-600 hover:bg-gray-700'
                };
            default:
                return {
                    container: 'bg-gradient-to-br from-gray-50 to-blue-50',
                    iconColor: 'text-gray-400',
                    titleColor: 'text-gray-900',
                    descColor: 'text-gray-600',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const styles = getVariantStyles();

    const defaultIcons = {
        default: (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        ),
        search: (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        ),
        error: (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-pink-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
        ),
        loading: (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-slate-200 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
        )
    };

    return (
        <div className={`empty-state rounded-2xl p-12 text-center ${styles.container} ${className}`}>
            <div className="flex flex-col items-center space-y-4">
                {/* Icon */}
                <div className="mb-4">
                    {icon || defaultIcons[variant]}
                </div>
                
                {/* Title */}
                <h3 className={`heading-md ${styles.titleColor} mb-2`}>
                    {title}
                </h3>
                
                {/* Description */}
                <p className={`body-md ${styles.descColor} max-w-md mx-auto leading-relaxed`}>
                    {description}
                </p>
                
                {/* Action Button */}
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className={`interactive-button micro-interaction px-6 py-3 ${styles.buttonColor} text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl mt-6`}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;