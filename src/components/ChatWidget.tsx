'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

/**
 * Chat Widget — Ready-to-activate customer support chat.
 *
 * To enable: Set `chat_widget_enabled` to `true` in SiteSetting (admin panel)
 * or simply set NEXT_PUBLIC_CHAT_ENABLED=true in environment.
 *
 * Current implementation: Simple message form that sends to /api/contact.
 * Future: Replace with Telegram bot, Tawk.to, Crisp, or custom WebSocket chat.
 */

const t: Record<string, any> = {
    en: { title: 'Chat with us', placeholder: 'Type a message...', send: 'Send', offline: 'We\'re currently offline. Leave a message and we\'ll get back to you!', sent: 'Message sent! We\'ll reply soon.', name: 'Your name', email: 'Email' },
    ko: { title: '채팅 상담', placeholder: '메시지를 입력하세요...', send: '전송', offline: '현재 오프라인입니다. 메시지를 남겨주시면 답변드리겠습니다!', sent: '메시지가 전송되었습니다!', name: '이름', email: '이메일' },
    km: { title: 'ជជែកជាមួយយើង', placeholder: 'វាយសារ...', send: 'ផ្ញើ', offline: 'យើងមិននៅអនឡាញទេ។ ទុកសារហើយយើងនឹងឆ្លើយតប!', sent: 'សារត្រូវបានផ្ញើ!', name: 'ឈ្មោះ', email: 'អ៊ីមែល' },
    zh: { title: '在线客服', placeholder: '输入消息...', send: '发送', offline: '当前离线。请留言，我们会尽快回复！', sent: '消息已发送！', name: '姓名', email: '邮箱' },
};

export default function ChatWidget() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const tx = t[lang] || t.en;

    const [enabled, setEnabled] = useState(false);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    // Check if chat widget is enabled
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true') {
            setEnabled(true);
            return;
        }
        // Also check from DB setting
        fetch('/api/admin/settings?keys=chat_widget_enabled')
            .then(r => r.json())
            .then(data => {
                if (data.chat_widget_enabled === 'true' || data.chat_widget_enabled === true) {
                    setEnabled(true);
                }
            })
            .catch(() => {});
    }, []);

    if (!enabled) return null;

    const handleSend = async () => {
        if (!form.name || !form.email || !form.message) return;
        setSending(true);
        try {
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, subject: 'Chat Widget Message' }),
            });
            setSent(true);
            setForm({ name: '', email: '', message: '' });
        } catch { /* ignore */ }
        finally { setSending(false); }
    };

    return (
        <>
            {/* Floating Button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary/90 transition-all flex items-center justify-center group"
                    aria-label="Open chat"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
            )}

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
                    {/* Header */}
                    <div className="bg-brand-primary text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-bold text-sm">{tx.title}</span>
                        </div>
                        <button onClick={() => { setOpen(false); setSent(false); }} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {sent ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MessageCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">{tx.sent}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">{tx.offline}</p>
                                <input
                                    type="text" placeholder={tx.name} value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                                />
                                <input
                                    type="email" placeholder={tx.email} value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                                />
                                <textarea
                                    placeholder={tx.placeholder} rows={3} value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary resize-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !form.name || !form.email || !form.message}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" /> {tx.send}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
