import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  revenue: number;
  conversionRate: number;
  averageDiscount: number;
  topCategories: { name: string; value: number }[];
  redemptionTrend: { date: string; redemptions: number }[];
  geographicData: { location: string; count: number }[];
}

interface AdvancedAnalyticsProps {
  userId?: string;
  userRole?: string;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ userId, userRole }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, userId]);

  const loadAnalytics = async () => {
    setLoading(true);
    // Simulate API call - replace with actual API
    setTimeout(() => {
      setData({
        totalCoupons: 245,
        activeCoupons: 187,
        totalRedemptions: 1543,
        revenue: 45678,
        conversionRate: 23.5,
        averageDiscount: 18.3,
        topCategories: [
          { name: 'Food & Dining', value: 450 },
          { name: 'Shopping', value: 320 },
          { name: 'Services', value: 280 },
          { name: 'Entertainment', value: 210 },
          { name: 'Travel', value: 180 },
        ],
        redemptionTrend: [
          { date: 'Mon', redemptions: 45 },
          { date: 'Tue', redemptions: 52 },
          { date: 'Wed', redemptions: 48 },
          { date: 'Thu', redemptions: 61 },
          { date: 'Fri', redemptions: 78 },
          { date: 'Sat', redemptions: 85 },
          { date: 'Sun', redemptions: 72 },
        ],
        geographicData: [
          { location: 'Cairo', count: 456 },
          { location: 'Alexandria', count: 312 },
          { location: 'Giza', count: 278 },
          { location: 'Riyadh', count: 234 },
          { location: 'Dubai', count: 198 },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-end">
        {['7d', '30d', '90d', '1y'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === range
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' :
             range === '30d' ? 'Last 30 Days' :
             range === '90d' ? 'Last 90 Days' : 'Last Year'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Coupons"
          value={data.totalCoupons}
          icon={<ChartBarIcon className="w-6 h-6" />}
          trend="+12%"
          trendUp={true}
          color="purple"
        />
        <MetricCard
          title="Active Coupons"
          value={data.activeCoupons}
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          trend="+8%"
          trendUp={true}
          color="blue"
        />
        <MetricCard
          title="Total Redemptions"
          value={data.totalRedemptions}
          icon={<UsersIcon className="w-6 h-6" />}
          trend="+23%"
          trendUp={true}
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={`$${data.revenue.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          trend="+15%"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redemption Trend */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Redemption Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.redemptionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="redemptions" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.topCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Geographic Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.geographicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-purple-600">{data.conversionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full"
                  style={{ width: `${data.conversionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Average Discount</span>
                <span className="font-semibold text-blue-600">{data.averageDiscount}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-full rounded-full"
                  style={{ width: `${data.averageDiscount}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {((data.totalRedemptions / data.totalCoupons) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Utilization Rate</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${(data.revenue / data.totalRedemptions).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Avg. Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  color: 'purple' | 'blue' | 'green' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendUp, color }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

export default AdvancedAnalytics;
