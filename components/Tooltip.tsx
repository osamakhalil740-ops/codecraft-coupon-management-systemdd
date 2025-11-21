import React, { useState, useRef, useEffect } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click' | 'focus';
    className?: string;
    maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    trigger = 'hover',
    className = '',
    maxWidth = '200px'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState(position);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && tooltipRef.current && triggerRef.current) {
            const tooltip = tooltipRef.current;
            const trigger = triggerRef.current;
            const rect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            let newPosition = position;

            // Check if tooltip fits in the desired position
            switch (position) {
                case 'top':
                    if (rect.top - tooltipRect.height < 10) {
                        newPosition = 'bottom';
                    }
                    break;
                case 'bottom':
                    if (rect.bottom + tooltipRect.height > viewport.height - 10) {
                        newPosition = 'top';
                    }
                    break;
                case 'left':
                    if (rect.left - tooltipRect.width < 10) {
                        newPosition = 'right';
                    }
                    break;
                case 'right':
                    if (rect.right + tooltipRect.width > viewport.width - 10) {
                        newPosition = 'left';
                    }
                    break;
            }

            setActualPosition(newPosition);
        }
    }, [isVisible, position]);

    const handleMouseEnter = () => {
        if (trigger === 'hover') {
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        if (trigger === 'hover') {
            setIsVisible(false);
        }
    };

    const handleClick = () => {
        if (trigger === 'click') {
            setIsVisible(!isVisible);
        }
    };

    const handleFocus = () => {
        if (trigger === 'focus') {
            setIsVisible(true);
        }
    };

    const handleBlur = () => {
        if (trigger === 'focus') {
            setIsVisible(false);
        }
    };

    const getTooltipClasses = () => {
        const baseClasses = `
            absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
            transition-opacity duration-200 pointer-events-none
            ${isVisible ? 'opacity-100' : 'opacity-0'}
        `;

        const positionClasses = {
            top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
            left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
            right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
        };

        return `${baseClasses} ${positionClasses[actualPosition]}`;
    };

    const getArrowClasses = () => {
        const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
        
        const arrowClasses = {
            top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
            bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
            left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
            right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1'
        };

        return `${baseClasses} ${arrowClasses[actualPosition]}`;
    };

    return (
        <div 
            ref={triggerRef}
            className={`tooltip-container relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {children}
            
            {content && (
                <div
                    ref={tooltipRef}
                    className={getTooltipClasses()}
                    style={{ maxWidth }}
                    role="tooltip"
                    aria-hidden={!isVisible}
                >
                    {content}
                    <div className={getArrowClasses()} />
                </div>
            )}
        </div>
    );
};

// Helper component for common help tooltips
export const HelpTooltip: React.FC<{ content: string; className?: string }> = ({ 
    content, 
    className = '' 
}) => (
    <Tooltip content={content} className={className}>
        <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
    </Tooltip>
);

export default Tooltip;