'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Loader2, RefreshCw, Plus, Pencil, Trash2, X, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface FlashSale {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  originalPriceUsd: number;
  salePriceUsd: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  labelKo?: string;
  labelEn?: string;
}

interface ProductOption {
  id: string;
  name: string;
  priceUsd: number;
  imageUrl?: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

const EMPTY_FORM = {
  productId: '',
  productName: '',
  salePriceUsd: '',
  startAt: '',
  endAt: '',
  isActive: true,
  labelKo: '',
  labelEn: '',
};

function getSaleStatus(item: FlashSale): { label: string; className: string } {
  const now = Date.now();
  const start = new Date(item.startAt).getTime();
  const end = new Date(item.endAt).getTime();
  if (!item.isActive) return { label: '비활성', className: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (now < start) return { label: '예정', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (now >= start && now <= end) return { label: '진행중', className: 'bg-green-100 text-green-700 border-green-200' };
  return { label: '종료', className: 'bg-gray-100 text-gray-500 border-gray-200' };
}

function toLocalDatetimeInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FlashSalePage() {
  const [items, setItems] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Product search
  const [productQuery, setProductQuery] = useState('');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/flash-sale');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', '플래시 세일 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Debounced product search
  useEffect(() => {
    if (!productQuery || productQuery.length < 2) {
      setProductOptions([]);
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(productQuery)}&limit=10`);
        const data = await res.json();
        const list: ProductOption[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setProductOptions(list);
        setShowDropdown(true);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [productQuery]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setProductQuery('');
    setProductOptions([]);
    setShowModal(true);
  };

  const openEdit = (item: FlashSale) => {
    setEditingId(item.id);
    setForm({
      productId: item.productId,
      productName: item.productName,
      salePriceUsd: String(item.salePriceUsd),
      startAt: toLocalDatetimeInput(item.startAt),
      endAt: toLocalDatetimeInput(item.endAt),
      isActive: item.isActive,
      labelKo: item.labelKo || '',
      labelEn: item.labelEn || '',
    });
    setProductQuery(item.productName);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) { showToast('error', '상품을 선택해주세요.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        productId: form.productId,
        salePriceUsd: parseFloat(form.salePriceUsd),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        isActive: form.isActive,
        labelKo: form.labelKo || null,
        labelEn: form.labelEn || null,
      };
      const res = editingId
        ? await fetch(`/api/admin/marketing/flash-sale/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/marketing/flash-sale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        showToast('success', editingId ? '수정되었습니다.' : '플래시 세일이 등록되었습니다.');
        setShowModal(false);
        await fetchItems();
      } else {
        const err = await res.json();
        showToast('error', err.error || '저장 실패');
      }
    } catch {
      showToast('error', '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 플래시 세일을 삭제하시겠습니까?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/marketing/flash-sale/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', '삭제되었습니다.');
        await fetchItems();
      } else {
        showToast('error', '삭제 실패');
      }
    } catch {
      showToast('error', '오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" /> 플래시 세일 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">한정 시간 특가 세일을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> 새 플래시 세일 추가
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-4" />
          <p className="text-gray-500 font-medium">목록을 불러오는 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">등록된 플래시 세일이 없습니다.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
            <Plus className="w-4 h-4" /> 첫 플래시 세일 등록
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-800 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">상품</th>
                  <th className="py-3.5 px-4">원가 / 세일가</th>
                  <th className="py-3.5 px-4">할인율</th>
                  <th className="py-3.5 px-4">시작</th>
                  <th className="py-3.5 px-4">종료</th>
                  <th className="py-3.5 px-4">상태</th>
                  <th className="py-3.5 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const status = getSaleStatus(item);
                  const discount = item.originalPriceUsd > 0
                    ? Math.round((1 - item.salePriceUsd / item.originalPriceUsd) * 100)
                    : 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img src={item.productImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Zap className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm line-clamp-1">{item.productName}</div>
                            {item.labelKo && <div className="text-xs text-yellow-600 font-medium mt-0.5">{item.labelKo}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-400 line-through">${item.originalPriceUsd.toFixed(2)}</div>
                        <div className="font-bold text-red-600">${item.salePriceUsd.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4">
                        {discount > 0 && (
                          <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            -{discount}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{fmt(item.startAt)}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{fmt(item.endAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.productName)}
                            disabled={deletingId === item.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {editingId ? '플래시 세일 수정' : '새 플래시 세일 추가'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">상품 선택 *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      if (!e.target.value) {
                        setForm((f) => ({ ...f, productId: '', productName: '' }));
                      }
                    }}
                    onFocus={() => productOptions.length > 0 && setShowDropdown(true)}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="상품명 또는 SKU 검색..."
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {showDropdown && productOptions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {productOptions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, productId: p.id, productName: p.name, salePriceUsd: f.salePriceUsd || String(p.priceUsd) }));
                            setProductQuery(p.name);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-yellow-50 transition-colors"
                        >
                          {p.imageUrl && <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">{p.name}</div>
                            <div className="text-xs text-gray-500">${p.priceUsd?.toFixed(2)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.productId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 선택됨: {form.productName}
                  </p>
                )}
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">세일 가격 (USD) *</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.salePriceUsd}
                    onChange={(e) => setForm((f) => ({ ...f, salePriceUsd: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="예: 9.99"
                  />
                </div>
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">시작 일시 *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">종료 일시 *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Labels */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">라벨 (한국어)</label>
                  <input
                    type="text"
                    value={form.labelKo}
                    onChange={(e) => setForm((f) => ({ ...f, labelKo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="예: 오늘만 특가!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">라벨 (영어)</label>
                  <input
                    type="text"
                    value={form.labelEn}
                    onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g. Today Only!"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-yellow-500 border-gray-300 focus:ring-yellow-400"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">활성화</label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? '저장' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
