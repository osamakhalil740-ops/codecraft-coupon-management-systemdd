import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from './IconLibrary';
import { useNotifications } from './NotificationSystem';

interface HeaderNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface UserMenuProps {
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role: string[];
    };
    onSignOut: () => void;
}

interface EnhancedHeaderProps {
    user?: UserMenuProps['user'];
    onSignOut?: () => void;
    notifications?: HeaderNotification[];
    onNotificationRead?: (id: string) => void;
    onClearAllNotifications?: () => void;
    className?: string;
    showSearch?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
    user,
    onSignOut = () => {},
    notifications = [],
    onNotificationRead = () => {},
    onClearAllNotifications = () => {},
    className = '',
    showSearch = true,
    searchPlaceholder = 'Search...',
    onSearch = () => {}
}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { showSuccess } = useNotifications();

    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleSignOut = () => {
        onSignOut();
        showSuccess('Signed out successfully');
        navigate('/');
    };

    return (
        <header className={`enhanced-header bg-white border-b border-gray-200 ${className}`}>
            <div className="header-container px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center space-x-6">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2 group">
                            <Icons.Rocket size="lg" color="primary" className="group-hover:scale-110 transition-transform" />
                            <span className="text-xl font-bold text-gray-900">CodeCraft</span>
                        </Link>

                        {/* Search */}
                        {showSearch && (
                            <form onSubmit={handleSearch} className="hidden md:block">
                                <div className="relative">
                                    <Icons.Search 
                                        size="sm" 
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="header-search pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-4">
                        {/* Quick Actions */}
                        <div className="hidden lg:flex items-center space-x-2">
                            <button
                                onClick={() => navigate('/create-coupon')}
                                className="header-action-btn bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Icons.Plus size="sm" className="inline mr-1" />
                                Create Coupon
                            </button>
                        </div>

                        {/* Notifications */}
                        <div ref={notificationRef} className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="header-icon-btn relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Icons.Notifications size="md" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={onClearAllNotifications}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500">
                                                <Icons.Bell size="lg" className="mx-auto mb-2 opacity-50" />
                                                <p>No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`notification-item p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                                        !notification.read ? 'bg-blue-50' : ''
                                                    }`}
                                                    onClick={() => onNotificationRead(notification.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {notification.type === 'success' && <Icons.CheckCircle size="sm" color="success" />}
                                                            {notification.type === 'warning' && <Icons.Warning size="sm" color="warning" />}
                                                            {notification.type === 'error' && <Icons.Error size="sm" color="error" />}
                                                            {notification.type === 'info' && <Icons.Info size="sm" color="info" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                            <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                                                            {notification.action && (
                                                                <button
                                                                    onClick={notification.action.onClick}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                                                >
                                                                    {notification.action.label}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        {user && (
                            <div ref={userMenuRef} className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="user-menu-btn flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{user.role.join(', ')}</p>
                                    </div>
                                    <Icons.ChevronDown size="sm" className="text-gray-400" />
                                </button>

                                {/* User Dropdown */}
                                {showUserMenu && (
                                    <div className="user-dropdown absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <div className="py-2">
                                            <Link
                                                to="/profile"
                                                className="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <Icons.UserCircle size="sm" className="mr-3" />
                                                Profile Settings
                                            </Link>
                                            <Link
                                                to="/dashboard"
                                                className="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <Icons.Analytics size="sm" className="mr-3" />
                                                Dashboard
                                            </Link>
                                            <hr className="my-2" />
                                            <button
                                                onClick={handleSignOut}
                                                className="user-menu-item w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Icons.ArrowRight size="sm" className="mr-3" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                            <Icons.Settings size="md" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default EnhancedHeader;