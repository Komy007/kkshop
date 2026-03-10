'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Loader2, RefreshCw, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

type QAStatus = 'PENDING' | 'ANSWERED' | 'REJECTED';

interface QAItem {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userEmail?: string;
  question: string;
  answer?: string | null;
  status: QAStatus;
  isPrivate: boolean;
  answeredBy?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

const STATUS_LABELS: Record<QAStatus, { label: string; className: string }> = {
  PENDING:  { label: '대기중',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ANSWERED: { label: '답변완료', className: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED: { label: '거절됨',  className: 'bg-red-100 text-red-800 border-red-200' },
};

export default function AdminQAPage() {
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<QAStatus | 'ALL'>('PENDING');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/products/qa?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAnswer = async (id: string) => {
    const answer = answerText[id]?.trim();
    if (!answer) { showToast('error', '답변 내용을 입력하세요.'); return; }
    setSubmitting(id);
    try {
      const res = await fetch('/api/admin/products/qa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'ANSWER', answer }),
      });
      if (!res.ok) throw new Error();
      showToast('success', '답변이 등록되었습니다.');
      setAnswerText(prev => { const n = { ...prev }; delete n[id]; return n; });
      setExpandedId(null);
      fetchItems();
    } catch {
      showToast('error', '답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('이 질문을 거절하시겠습니까?')) return;
    setSubmitting(id);
    try {
      const res = await fetch('/api/admin/products/qa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'REJECT' }),
      });
      if (!res.ok) throw new Error();
      showToast('success', '질문이 거절되었습니다.');
      fetchItems();
    } catch {
      showToast('error', '거절 처리에 실패했습니다.');
    } finally {
      setSubmitting(null);
    }
  };

  const counts = {
    ALL: items.length,
    PENDING: 0,
    ANSWERED: 0,
    REJECTED: 0,
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all
          ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
          <button onClick={() => setToast(null)}><X className="w-4 h-4 ml-1" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-brand-primary" />
          <h1 className="text-xl font-extrabold text-gray-900">상품 Q&A 관리</h1>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['PENDING', 'ANSWERED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all
              ${statusFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
            {s === 'PENDING' ? '대기중' : s === 'ANSWERED' ? '답변완료' : s === 'REJECTED' ? '거절됨' : '전체'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">해당 상태의 Q&A가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const status = STATUS_LABELS[item.status];
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Q header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Product Image */}
                  {item.productImage ? (
                    <img src={item.productImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
                      {item.isPrivate && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">비공개</span>
                      )}
                      {item.productName && (
                        <span className="text-[11px] text-gray-400 truncate max-w-[200px]">{item.productName}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">Q. {item.question}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {item.userEmail && <span>{item.userEmail}</span>}
                      <span>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
                    {/* Full question */}
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 mb-1">질문 내용</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">{item.question}</p>
                    </div>

                    {/* Existing answer */}
                    {item.answer && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-green-600 mb-1">기존 답변</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-green-50 rounded-lg p-3 border border-green-100">{item.answer}</p>
                        {item.answeredAt && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.answeredBy} · {new Date(item.answeredAt).toLocaleString('ko-KR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Answer form (for PENDING or re-answer) */}
                    {item.status !== 'REJECTED' && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500">{item.status === 'ANSWERED' ? '답변 수정' : '답변 작성'}</p>
                        <textarea
                          value={answerText[item.id] || ''}
                          onChange={e => setAnswerText(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="답변을 입력하세요..."
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary outline-none resize-y"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswer(item.id)}
                            disabled={submitting === item.id || !answerText[item.id]?.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                          >
                            {submitting === item.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            답변 등록
                          </button>
                          {item.status === 'PENDING' && (
                            <button
                              onClick={() => handleReject(item.id)}
                              disabled={submitting === item.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              거절
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
