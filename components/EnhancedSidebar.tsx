import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Icons } from './IconLibrary';

interface SidebarItem {
    id: string;
    label: string;
    path: string;
    icon: React.ComponentType<any>;
    badge?: string | number;
    children?: SidebarItem[];
}

interface EnhancedSidebarProps {
    items: SidebarItem[];
    collapsed?: boolean;
    onToggle?: (collapsed: boolean) => void;
    className?: string;
    userRole?: string[];
    showToggle?: boolean;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
    items,
    collapsed: controlledCollapsed,
    onToggle,
    className = '',
    userRole = [],
    showToggle = true
}) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const location = useLocation();
    
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
    
    const handleToggle = () => {
        const newState = !isCollapsed;
        if (onToggle) {
            onToggle(newState);
        } else {
            setInternalCollapsed(newState);
        }
    };

    const toggleExpanded = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const isItemActive = (item: SidebarItem): boolean => {
        if (location.pathname === item.path) return true;
        return item.children?.some(child => location.pathname === child.path) || false;
    };

    const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = isItemActive(item);
        const isExpanded = expandedItems.has(item.id);

        return (
            <div key={item.id} className="sidebar-item">
                {hasChildren ? (
                    <button
                        onClick={() => toggleExpanded(item.id)}
                        className={`
                            sidebar-button w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200
                            ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                            ${level > 0 ? 'ml-6' : ''}
                            ${isCollapsed ? 'justify-center px-2' : ''}
                        `}
                    >
                        <div className="flex items-center space-x-3">
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            {!isCollapsed && (
                                <>
                                    <span className="font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="sidebar-badge bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        {!isCollapsed && hasChildren && (
                            <ChevronRightIcon 
                                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-90' : ''
                                }`}
                            />
                        )}
                    </button>
                ) : (
                    <NavLink
                        to={item.path}
                        className={({ isActive }) => `
                            sidebar-link flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group
                            ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                            ${level > 0 ? 'ml-6' : ''}
                            ${isCollapsed ? 'justify-center px-2' : ''}
                        `}
                    >
                        <div className="flex items-center space-x-3">
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            {!isCollapsed && (
                                <>
                                    <span className="font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="sidebar-badge bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </NavLink>
                )}
                
                {/* Children */}
                {hasChildren && isExpanded && !isCollapsed && (
                    <div className="mt-1 space-y-1">
                        {item.children!.map(child => renderSidebarItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`enhanced-sidebar ${className}`}>
            <div className={`
                sidebar-container bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300
                ${isCollapsed ? 'w-16' : 'w-64'}
            `}>
                {/* Header */}
                <div className="sidebar-header flex items-center justify-between p-4 border-b border-gray-200">
                    {!isCollapsed && (
                        <div className="flex items-center space-x-2">
                            <Icons.Rocket size="lg" color="primary" />
                            <h1 className="text-xl font-bold text-gray-900">CodeCraft</h1>
                        </div>
                    )}
                    {isCollapsed && (
                        <Icons.Rocket size="lg" color="primary" className="mx-auto" />
                    )}
                    {showToggle && (
                        <button
                            onClick={handleToggle}
                            className="sidebar-toggle p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? (
                                <ChevronRightIcon className="h-4 w-4" />
                            ) : (
                                <ChevronLeftIcon className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {items.map(item => renderSidebarItem(item))}
                </nav>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="sidebar-footer p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <Icons.Info size="sm" />
                            <span>v2.1.0</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Predefined sidebar configurations
export const getAdminSidebarItems = (): SidebarItem[] => [
    {
        id: 'overview',
        label: 'Overview',
        path: '/admin',
        icon: Icons.Home
    },
    {
        id: 'users',
        label: 'User Management',
        path: '/admin/users',
        icon: Icons.Users,
        children: [
            { id: 'shops', label: 'Shop Owners', path: '/admin/shops', icon: Icons.Shop },
            { id: 'affiliates', label: 'Affiliates', path: '/admin/affiliates', icon: Icons.Users },
            { id: 'customers', label: 'Customers', path: '/admin/customers', icon: Icons.User }
        ]
    },
    {
        id: 'coupons',
        label: 'Coupon Management',
        path: '/admin/coupons',
        icon: Icons.Ticket
    },
    {
        id: 'analytics',
        label: 'Data Intelligence',
        path: '/admin/intelligence',
        icon: Icons.Analytics,
        badge: 'Live'
    },
    {
        id: 'settings',
        label: 'Settings',
        path: '/admin/settings',
        icon: Icons.Settings
    }
];

export default EnhancedSidebar;