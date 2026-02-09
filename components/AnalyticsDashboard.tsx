import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import {
  ChartBarIcon,
  UserGroupIcon,
  TicketIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import LoadingSkeleton, { StatCardSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

interface AnalyticsData {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalRevenue: number;
  conversionRate: number;
  trends: {
    coupons: number;
    redemptions: number;
    revenue: number;
  };
  topPerformers: {
    id: string;
    name: string;
    redemptions: number;
    revenue: number;
  }[];
  recentActivity: {
    id: string;
    type: 'redemption' | 'creation' | 'expiration';
    couponCode: string;
    timestamp: Date;
    amount?: number;
  }[];
  geographicData: {
    country: string;
    city: string;
    count: number;
  }[];
}

interface AnalyticsDashboardProps {
  userId?: string;
  role?: string;
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  role,
  dateRange = 'month',
  className = ''
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'geographic' | 'activity'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [userId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data based on user role and ID
      const coupons = await api.getAllCoupons();
      
      // Calculate analytics (this would be done on backend in production)
      const now = new Date();
      const filterDate = getFilterDate(dateRange);
      
      const activeCoupons = coupons.filter(c => 
        new Date(c.expiresAt) > now && c.status === 'active'
      );
      
      const relevantCoupons = userId 
        ? coupons.filter(c => c.createdBy === userId)
        : coupons;
      
      // Mock calculations (replace with real data from backend)
      const totalRedemptions = relevantCoupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
      const totalRevenue = totalRedemptions * 25; // Average value per redemption
      const conversionRate = relevantCoupons.length > 0 
        ? (totalRedemptions / relevantCoupons.length) * 100 
        : 0;
      
      // Calculate trends (comparing to previous period)
      const previousPeriodRedemptions = Math.floor(totalRedemptions * 0.85);
      const redemptionTrend = totalRedemptions > 0
        ? ((totalRedemptions - previousPeriodRedemptions) / previousPeriodRedemptions) * 100
        : 0;
      
      // Top performers
      const topPerformers = relevantCoupons
        .sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: `${c.discountType === 'percentage' ? c.discountValue + '%' : '$' + c.discountValue} off - ${c.code}`,
          redemptions: c.usedCount || 0,
          revenue: (c.usedCount || 0) * 25
        }));
      
      // Geographic data (mock - would come from backend)
      const geographicData = [
        { country: 'United States', city: 'New York', count: Math.floor(totalRedemptions * 0.3) },
        { country: 'United Kingdom', city: 'London', count: Math.floor(totalRedemptions * 0.2) },
        { country: 'Canada', city: 'Toronto', count: Math.floor(totalRedemptions * 0.15) },
        { country: 'Australia', city: 'Sydney', count: Math.floor(totalRedemptions * 0.1) },
        { country: 'Germany', city: 'Berlin', count: Math.floor(totalRedemptions * 0.08) }
      ];
      
      // Recent activity (mock - would come from backend)
      const recentActivity = relevantCoupons.slice(0, 10).map(c => ({
        id: c.id,
        type: 'creation' as const,
        couponCode: c.code,
        timestamp: new Date(c.createdAt),
        amount: undefined
      }));

      setData({
        totalCoupons: relevantCoupons.length,
        activeCoupons: activeCoupons.length,
        totalRedemptions,
        totalRevenue,
        conversionRate,
        trends: {
          coupons: 12,
          redemptions: redemptionTrend,
          revenue: redemptionTrend + 5
        },
        topPerformers,
        recentActivity,
        geographicData
      });
    } catch (err) {
      logger.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getFilterDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={className}>
        <StatCardSkeleton count={4} />
        <div className="mt-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load analytics"
        description={error}
        actionLabel="Retry"
        onAction={fetchAnalytics}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        variant="data"
        title="No analytics data"
        description="Analytics will appear once you have coupon activity"
      />
    );
  }

  return (
    <div className={className}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Coupons */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.trends.coupons >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.trends.coupons >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {formatPercent(data.trends.coupons)}
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.totalCoupons}</h3>
          <p className="text-sm text-gray-600">Total Coupons</p>
          <p className="text-xs text-gray-500 mt-1">{data.activeCoupons} active</p>
        </div>

        {/* Total Redemptions */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.trends.redemptions >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.trends.redemptions >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {formatPercent(data.trends.redemptions)}
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.totalRedemptions.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Redemptions</p>
          <p className="text-xs text-gray-500 mt-1">This {dateRange}</p>
        </div>

        {/* Revenue */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              data.trends.revenue >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.trends.revenue >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {formatPercent(data.trends.revenue)}
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(data.totalRevenue)}</h3>
          <p className="text-sm text-gray-600">Estimated Revenue</p>
          <p className="text-xs text-gray-500 mt-1">From coupon usage</p>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.conversionRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-xs text-gray-500 mt-1">Redemptions per coupon</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'performance', 'geographic', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                selectedTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-brand-primary" />
              Top Performing Coupons
            </h3>
            
            {data.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {data.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{performer.name}</p>
                      <p className="text-xs text-gray-500">{performer.redemptions} redemptions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(performer.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="data"
                title="No performance data"
                description="Data will appear once coupons are redeemed"
              />
            )}
          </div>

          {/* Geographic Distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-brand-primary" />
              Geographic Distribution
            </h3>
            
            {data.geographicData.length > 0 ? (
              <div className="space-y-3">
                {data.geographicData.map((location) => (
                  <div key={`${location.country}-${location.city}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{location.city}, {location.country}</span>
                      <span className="text-sm text-gray-600">{location.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all"
                        style={{ width: `${(location.count / data.totalRedemptions) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="data"
                title="No geographic data"
                description="Location data will appear once coupons are used"
              />
            )}
          </div>
        </div>
      )}

      {selectedTab === 'activity' && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-brand-primary" />
            Recent Activity
          </h3>
          
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'redemption' ? 'bg-green-100' :
                    activity.type === 'creation' ? 'bg-blue-100' : 'bg-red-100'
                  }`}>
                    <TicketIcon className={`h-4 w-4 ${
                      activity.type === 'redemption' ? 'text-green-600' :
                      activity.type === 'creation' ? 'text-blue-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'redemption' && 'Coupon redeemed'}
                      {activity.type === 'creation' && 'Coupon created'}
                      {activity.type === 'expiration' && 'Coupon expired'}
                    </p>
                    <p className="text-xs text-gray-500">{activity.couponCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="inbox"
              title="No recent activity"
              description="Activity will appear here as coupons are used"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
