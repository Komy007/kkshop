'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, Loader2, RefreshCw, TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface SummaryCard {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  newUsers: number;
  revenueChange?: number;
  ordersChange?: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  rank: number;
  productId: string;
  name: string;
  imageUrl?: string;
  qtySold: number;
  revenue: number;
}

interface CategoryRevenue {
  name: string;
  revenue: number;
}

interface AnalyticsData {
  summary: SummaryCard;
  dailyRevenue: DailyRevenue[];
  topProducts: TopProduct[];
  categoryRevenue: CategoryRevenue[];
}

const PIE_COLORS = ['#e91e8c', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const PERIODS = [
  { label: '7일', value: '7d' },
  { label: '30일', value: '30d' },
  { label: '90일', value: '90d' },
];

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-blue-600 font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-pink-600 font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch {
      setError('분석 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-500" /> 분석 대시보드
          </h1>
          <p className="text-sm text-gray-500 mt-1">매출, 주문, 회원 데이터를 한눈에 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.value
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-500 font-medium">데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-red-100 shadow-sm">
          <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            다시 시도
          </button>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<DollarSign className="w-6 h-6 text-pink-600" />}
              label="총 매출"
              value={`$${data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={data.summary.revenueChange !== undefined ? `전 기간 대비 ${data.summary.revenueChange > 0 ? '+' : ''}${data.summary.revenueChange}%` : undefined}
              color="bg-pink-50"
            />
            <StatCard
              icon={<ShoppingBag className="w-6 h-6 text-indigo-600" />}
              label="총 주문"
              value={`${data.summary.totalOrders.toLocaleString()}건`}
              sub={data.summary.ordersChange !== undefined ? `전 기간 대비 ${data.summary.ordersChange > 0 ? '+' : ''}${data.summary.ordersChange}%` : undefined}
              color="bg-indigo-50"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
              label="평균 주문액"
              value={`$${data.summary.avgOrderValue.toFixed(2)}`}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-sky-600" />}
              label="신규 회원"
              value={`${data.summary.newUsers.toLocaleString()}명`}
              color="bg-sky-50"
            />
          </div>

          {/* Daily Revenue Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> 일별 매출 (Daily Revenue)
            </h2>
            {data.dailyRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터 없음</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.dailyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={55}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bottom row: Top Products + Category Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Top 10 Products */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-pink-500" /> 판매 상위 10 상품
                </h2>
              </div>
              {data.topProducts.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.topProducts.slice(0, 10).map((p) => (
                    <div key={p.productId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        p.rank === 1 ? 'bg-yellow-400 text-white' :
                        p.rank === 2 ? 'bg-gray-400 text-white' :
                        p.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {p.rank}
                      </span>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.qtySold.toLocaleString()}개 판매</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">${p.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Revenue Pie */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-500" /> 카테고리별 매출
              </h2>
              {data.categoryRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.categoryRevenue}
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      dataKey="revenue"
                      nameKey="name"
                      label={false}
                    >
                      {data.categoryRevenue.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                      iconSize={10}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
