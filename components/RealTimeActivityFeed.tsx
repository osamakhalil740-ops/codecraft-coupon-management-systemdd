import React, { useState, useEffect } from 'react';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import {
    UserIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    ClockIcon,
    EyeIcon,
    ArrowPathIcon,
    SignalIcon
} from '@heroicons/react/24/outline';

interface RealTimeActivityFeedProps {
    userRole: string[];
    userId?: string;
    maxItems?: number;
    showFilters?: boolean;
}

const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({
    userRole,
    userId,
    maxItems = 50,
    showFilters = true
}) => {
    // Ensure safe access to tracking data with fallbacks
    const { trackingData } = useRealTimeTracking(userRole || [], userId);
    const [filter, setFilter] = useState<'all' | 'redemption' | 'user_action' | 'system_activity'>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Get filtered activities with safe defaults
    const allActivities = trackingData?.allActivities || [];
    const filteredActivities = allActivities
        .filter((activity: any) => filter === 'all' || activity.type === filter)
        .slice(0, maxItems);

    // Activity icon mapping
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'redemption':
                return <ShoppingCartIcon className="h-5 w-5 text-green-500" />;
            case 'user_action':
                return <UserIcon className="h-5 w-5 text-blue-500" />;
            case 'system_activity':
                return <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />;
            case 'customer_interaction':
                return <EyeIcon className="h-5 w-5 text-orange-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    // Format activity display
    const formatActivity = (activity: any) => {
        switch (activity.type) {
            case 'redemption':
                return {
                    title: `Coupon Redeemed: ${activity.couponTitle || activity.title}`,
                    subtitle: `Customer: ${activity.customerName || 'Unknown'} • Shop: ${activity.shopOwnerName || 'Unknown'}`,
                    details: `${activity.discountType === 'percentage' ? activity.discountValue + '%' : '$' + activity.discountValue} discount`
                };
            case 'user_action':
                return {
                    title: `User Action: ${activity.action?.replace('_', ' ')?.toUpperCase() || 'Unknown'}`,
                    subtitle: `User: ${activity.userName} • Page: ${activity.page || 'Unknown'}`,
                    details: activity.details ? JSON.stringify(activity.details).substring(0, 100) + '...' : 'No details'
                };
            case 'system_activity':
                return {
                    title: activity.summary || `System Activity: ${activity.action || 'Unknown'}`,
                    subtitle: `Type: ${activity.type} • User: ${activity.userName || 'System'}`,
                    details: activity.importance || 'Standard'
                };
            case 'customer_interaction':
                return {
                    title: `Customer Interaction: ${activity.action || 'Unknown'}`,
                    subtitle: `Customer: ${activity.customerName} • Shop: ${activity.shopOwnerName || 'Unknown'}`,
                    details: activity.source || 'Direct interaction'
                };
            default:
                return {
                    title: 'Unknown Activity',
                    subtitle: 'No details available',
                    details: ''
                };
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <SignalIcon className="h-6 w-6 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Real-Time Activity Feed
                    </h3>
                    {trackingData.lastUpdate && (
                        <span className="text-xs text-green-500 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Live
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                        {trackingData.totalActivities} activities
                    </span>
                    {autoRefresh && (
                        <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { key: 'all', label: 'All Activities', count: trackingData?.totalActivities || 0 },
                        { key: 'redemption', label: 'Redemptions', count: trackingData?.redemptions?.length || 0 },
                        { key: 'user_action', label: 'User Actions', count: trackingData?.userActions?.length || 0 },
                        { key: 'system_activity', label: 'System', count: trackingData?.systemActivity?.length || 0 }
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as any)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                filter === key
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {label} ({count})
                        </button>
                    ))}
                </div>
            )}

            {/* Real-time stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {trackingData.realtimeStats?.redemptionsToday || 0}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-500">
                        Redemptions Today
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {trackingData.realtimeStats?.activeUsers || 0}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-500">
                        Active Users (30m)
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatTimestamp(trackingData.realtimeStats?.lastActivity)}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-500">
                        Last Activity
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="max-h-96 overflow-y-auto space-y-3">
                {trackingData?.loading ? (
                    <div className="text-center py-8">
                        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Loading real-time data...</p>
                    </div>
                ) : filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => {
                        const formatted = formatActivity(activity);
                        return (
                            <div
                                key={activity.id || index}
                                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {formatted.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                        {formatted.subtitle}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {formatted.details}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 text-xs text-gray-500">
                                    {formatTimestamp(activity.timestamp)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No activities found for the selected filter.
                    </div>
                )}
            </div>

            {/* Footer */}
            {trackingData.lastUpdate && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500">
                        Last updated: {formatTimestamp(trackingData.lastUpdate)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default RealTimeActivityFeed;