import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface SimpleChartProps {
    data: ChartData[];
    type: 'bar' | 'line' | 'donut';
    title?: string;
    className?: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, type, title, className = '' }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    if (type === 'bar') {
        return (
            <div className={`bg-white rounded-xl p-6 shadow-lg border ${className}`}>
                {title && <h3 className="heading-sm text-gray-800 mb-4">{title}</h3>}
                <div className="space-y-3">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <span className="body-sm text-gray-600 w-20 text-right">{item.label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                        item.color || 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`}
                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                />
                            </div>
                            <span className="body-sm font-semibold text-gray-800 w-12">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'donut') {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulativePercentage = 0;
        
        return (
            <div className={`bg-white rounded-xl p-6 shadow-lg border ${className}`}>
                {title && <h3 className="heading-sm text-gray-800 mb-4">{title}</h3>}
                <div className="flex items-center space-x-6">
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                            <circle
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="transparent"
                                stroke="#f3f4f6"
                                strokeWidth="3"
                            />
                            {data.map((item, index) => {
                                const percentage = (item.value / total) * 100;
                                const strokeDasharray = `${percentage} ${100 - percentage}`;
                                const strokeDashoffset = -cumulativePercentage;
                                cumulativePercentage += percentage;
                                
                                return (
                                    <circle
                                        key={index}
                                        cx="21"
                                        cy="21"
                                        r="15.915"
                                        fill="transparent"
                                        stroke={item.color || `hsl(${index * 120}, 70%, 50%)`}
                                        strokeWidth="3"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="heading-sm text-gray-800">{total}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color || `hsl(${index * 120}, 70%, 50%)` }}
                                />
                                <span className="body-sm text-gray-600">{item.label}</span>
                                <span className="body-sm font-semibold text-gray-800">({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SimpleChart;