
import React, { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        indigo: 'bg-indigo-100 text-indigo-600',
    };
    
    return (
        <div className="enhanced-card-subtle card-lift p-6 flex items-start gap-4 slide-up">
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <p className="caption text-gray-500">{title}</p>
                <p className="heading-sm text-gray-800">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;