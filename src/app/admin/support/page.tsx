'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, ChevronDown, ChevronUp, Send, RefreshCcw, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Ticket {
    id: string;
    createdAt: string;
    status: 'PENDING' | 'ANSWERED' | 'REJECTED';
    question: string;
    answer:   string | null;
    isPrivate: boolean;
    product: { nameEn: string; imageUrl: string | null } | null;
    user:    { email: string; name: string | null } | null;
}

const STATUS_CONFIG = {
    PENDING:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',  icon: Clock },
    ANSWERED: { label: 'Answered', color: 'bg-green-100 text-green-700',  icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

export default function SupportPage() {
    const [tickets,    setTickets]    = useState<Ticket[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState<string>('PENDING');
    const [expanded,   setExpanded]   = useState<string | null>(null);
    const [answer,     setAnswer]     = useState('');
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [total,      setTotal]      = useState(0);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(filter !== 'ALL' ? { status: filter } : {}),
                ...(search ? { search } : {}),
            });
            const res  = await fetch(`/api/admin/support?${params}`);
            const data = await res.json();
            setTickets(data.tickets ?? []);
            setTotal(data.total ?? 0);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const respond = async (ticketId: string, status: 'ANSWERED' | 'REJECTED') => {
        setSubmitting(ticketId);
        try {
            await fetch('/api/admin/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, answer: status === 'ANSWERED' ? answer : null, status }),
            });
            setAnswer('');
            setExpanded(null);
            await fetchTickets();
        } finally {
            setSubmitting(null);
        }
    };

    const pendingCount = tickets.filter(t => t.status === 'PENDING').length;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        CS Support
                        {pendingCount > 0 && (
                            <span className="text-sm font-bold px-2 py-0.5 bg-red-500 text-white rounded-full">{pendingCount}</span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">고객 지원 / 문의 관리</p>
                </div>
                <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {(['PENDING', 'ANSWERED', 'REJECTED'] as const).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`bg-white rounded-2xl p-4 shadow-sm border text-left transition-all ${filter === s ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-500 font-medium">{cfg.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {tickets.filter(t => t.status === s).length}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by question or customer email..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'ANSWERED', 'REJECTED'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {s === 'ALL' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading...</div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <MessageSquare className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No support tickets found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tickets.map(ticket => {
                            const cfg  = STATUS_CONFIG[ticket.status];
                            const Icon = cfg.icon;
                            return (
                                <div key={ticket.id}>
                                    <div
                                        className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setExpanded(expanded === ticket.id ? null : ticket.id);
                                            setAnswer(ticket.answer ?? '');
                                        }}
                                    >
                                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ticket.status === 'PENDING' ? 'text-amber-500' : ticket.status === 'ANSWERED' ? 'text-green-500' : 'text-red-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-900 truncate">{ticket.question.slice(0, 100)}{ticket.question.length > 100 ? '…' : ''}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                                {ticket.isPrivate && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Private</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                                                <span>{ticket.user?.email ?? 'Anonymous'}</span>
                                                {ticket.product && <span>· {ticket.product.nameEn}</span>}
                                                <span>· {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {expanded === ticket.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>

                                    {expanded === ticket.id && (
                                        <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100 space-y-4 pt-4">
                                            {/* Question */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Customer Question</h4>
                                                <div className="bg-white rounded-xl p-4 text-sm text-gray-700 border border-slate-200">{ticket.question}</div>
                                            </div>

                                            {/* Existing answer */}
                                            {ticket.answer && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Previous Answer</h4>
                                                    <div className="bg-green-50 rounded-xl p-4 text-sm text-green-800 border border-green-200">{ticket.answer}</div>
                                                </div>
                                            )}

                                            {/* Reply form */}
                                            {ticket.status === 'PENDING' && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Your Reply</h4>
                                                    <textarea
                                                        value={answer}
                                                        onChange={e => setAnswer(e.target.value)}
                                                        rows={4}
                                                        placeholder="Type your answer here..."
                                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            disabled={!answer.trim() || !!submitting}
                                                            onClick={() => respond(ticket.id, 'ANSWERED')}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                            {submitting === ticket.id ? 'Sending...' : 'Send Answer'}
                                                        </button>
                                                        <button
                                                            disabled={!!submitting}
                                                            onClick={() => respond(ticket.id, 'REJECTED')}
                                                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
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
        </div>
    );
}
