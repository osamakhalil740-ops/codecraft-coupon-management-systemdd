import React, { useState, useRef } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface EnhancedInputProps {
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    success?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    helpText?: string;
    icon?: React.ReactNode;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    success,
    required = false,
    disabled = false,
    className = '',
    helpText,
    icon
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const inputClasses = `
        w-full px-4 py-3 pr-12 
        border-2 rounded-xl 
        font-medium text-gray-900 
        placeholder-gray-400
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-0
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : success 
                ? 'border-green-300 focus:border-green-500 bg-green-50'
                : isFocused 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${icon ? 'pl-12' : 'pl-4'}
    `;

    return (
        <div className={`form-group ${className}`}>
            <label className="form-label block mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                
                <input
                    ref={inputRef}
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={inputClasses}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${label}-error` : helpText ? `${label}-help` : undefined}
                />
                
                {/* Password visibility toggle */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                )}
                
                {/* Status icons */}
                {(error || success) && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {error && <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
                        {success && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    </div>
                )}
            </div>
            
            {/* Help text or error message */}
            {error && (
                <p id={`${label}-error`} className="form-error mt-2 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    {error}
                </p>
            )}
            
            {success && (
                <p className="form-success mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" />
                    {success}
                </p>
            )}
            
            {helpText && !error && !success && (
                <p id={`${label}-help`} className="form-help mt-2 text-sm text-gray-500">
                    {helpText}
                </p>
            )}
        </div>
    );
};

export default EnhancedInput;