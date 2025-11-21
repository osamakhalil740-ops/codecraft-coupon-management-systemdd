import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
    return (
        <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
            <div className="flex items-center space-x-2">
                <HomeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Home</span>
            </div>
            
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center space-x-1">
                        {item.icon && <span className="text-gray-400">{item.icon}</span>}
                        {item.path ? (
                            <a 
                                href={item.path} 
                                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                            >
                                {item.label}
                            </a>
                        ) : (
                            <span className="text-gray-900 font-semibold">{item.label}</span>
                        )}
                    </div>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumb;