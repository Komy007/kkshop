'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Loader2, RefreshCw, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface Province {
  id: string;
  nameEn: string;
  nameKm: string;
  shippingFee: number;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function ShippingSettingsPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [fees, setFees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProvinces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/shipping');
      const data = await res.json();
      const list: Province[] = Array.isArray(data) ? data : [];
      setProvinces(list);
      const initialFees: Record<string, string> = {};
      list.forEach((p) => {
        initialFees[p.id] = String(p.shippingFee ?? 0);
      });
      setFees(initialFees);
    } catch {
      showToast('error', '배송비 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProvinces(); }, [fetchProvinces]);

  const handleSaveOne = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, shippingFee: parseFloat(fees[id] ?? '0') }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast('error', err.error || '저장 실패');
      } else {
        showToast('success', '배송비가 저장되었습니다.');
        await fetchProvinces();
      }
    } catch {
      showToast('error', '오류가 발생했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const results = await Promise.allSettled(
        provinces.map((p) =>
          fetch('/api/admin/settings/shipping', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, shippingFee: parseFloat(fees[p.id] ?? '0') }),
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        showToast('error', `${failed}개 항목 저장 실패`);
      } else {
        showToast('success', `전체 ${provinces.length}개 지역 배송비 저장 완료`);
        await fetchProvinces();
      }
    } catch {
      showToast('error', '오류가 발생했습니다.');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            배송비 설정
            <span className="text-base font-normal text-gray-400 ml-1">Shipping Fee Settings</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">캄보디아 각 지역별 배송비를 설정합니다. (단위: USD)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchProvinces}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveAll}
            disabled={savingAll || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            전체 저장
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5 mb-6 text-sm text-blue-700">
        각 행의 <strong>저장</strong> 버튼으로 개별 저장하거나, 우측 상단 <strong>전체 저장</strong>으로 한번에 저장할 수 있습니다.
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 font-medium">지역 목록을 불러오는 중...</p>
        </div>
      ) : provinces.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">등록된 지역이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">API에서 지역 데이터를 확인해주세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-800 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">#</th>
                  <th className="py-3.5 px-5">지역 (영문)</th>
                  <th className="py-3.5 px-5">지역 (크메르어)</th>
                  <th className="py-3.5 px-5">배송비 (USD)</th>
                  <th className="py-3.5 px-5 text-right">저장</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {provinces.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-5">
                      <span className="font-medium text-gray-900 text-sm">{p.nameEn}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-sm text-gray-600">{p.nameKm}</span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium text-sm">$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={fees[p.id] ?? '0'}
                          onChange={(e) => setFees((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleSaveOne(p.id)}
                        disabled={savingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        저장
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            총 {provinces.length}개 지역
          </div>
        </div>
      )}
    </div>
  );
}
