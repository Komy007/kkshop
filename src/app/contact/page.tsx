'use client';

import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, Send, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import Footer from '@/components/Footer';

const t: Record<string, any> = {
    en: {
        title: 'Contact Us',
        subtitle: 'We\'re here to help. Reach out to us anytime.',
        name: 'Your Name',
        email: 'Email Address',
        subject: 'Subject',
        subjectPlaceholder: 'Select a topic',
        message: 'Message',
        messagePlaceholder: 'How can we help you?',
        send: 'Send Message',
        sending: 'Sending...',
        success: 'Message sent successfully! We\'ll respond within 24 hours.',
        error: 'Failed to send. Please try again or email us directly.',
        subjects: ['Order Issue', 'Product Inquiry', 'Shipping Question', 'Account Help', 'Seller Inquiry', 'Other'],
        infoTitle: 'Other Ways to Reach Us',
        emailLabel: 'Email',
        phoneLabel: 'Phone / Telegram',
        addressLabel: 'Address',
        address: 'Phnom Penh, Cambodia',
        hours: 'Mon–Sat, 9:00 AM – 6:00 PM (ICT)',
    },
    ko: {
        title: '문의하기',
        subtitle: '언제든지 연락해 주세요. 도움을 드리겠습니다.',
        name: '이름',
        email: '이메일',
        subject: '문의 유형',
        subjectPlaceholder: '주제를 선택하세요',
        message: '내용',
        messagePlaceholder: '무엇을 도와드릴까요?',
        send: '보내기',
        sending: '전송 중...',
        success: '메시지가 전송되었습니다! 24시간 이내에 답변드리겠습니다.',
        error: '전송 실패. 다시 시도하거나 이메일로 직접 연락해 주세요.',
        subjects: ['주문 문제', '상품 문의', '배송 문의', '계정 도움', '셀러 문의', '기타'],
        infoTitle: '다른 연락 방법',
        emailLabel: '이메일',
        phoneLabel: '전화 / 텔레그램',
        addressLabel: '주소',
        address: '캄보디아 프놈펜',
        hours: '월~토, 오전 9시 – 오후 6시 (캄보디아 시간)',
    },
    km: {
        title: 'ទាក់ទងយើង',
        subtitle: 'យើងនៅទីនេះដើម្បីជួយ។ ទាក់ទងយើងគ្រប់ពេល។',
        name: 'ឈ្មោះរបស់អ្នក',
        email: 'អ៊ីមែល',
        subject: 'ប្រធានបទ',
        subjectPlaceholder: 'ជ្រើសរើសប្រធានបទ',
        message: 'សារ',
        messagePlaceholder: 'តើយើងអាចជួយអ្នកដោយរបៀបណា?',
        send: 'ផ្ញើសារ',
        sending: 'កំពុងផ្ញើ...',
        success: 'សារត្រូវបានផ្ញើដោយជោគជ័យ! យើងនឹងឆ្លើយតបក្នុងរយៈពេល ២៤ ម៉ោង។',
        error: 'ការផ្ញើបរាជ័យ។ សូមព្យាយាមម្តងទៀត។',
        subjects: ['បញ្ហាការបញ្ជាទិញ', 'សំណួរផលិតផល', 'សំណួរដឹកជញ្ជូន', 'ជំនួយគណនី', 'សំណួរអ្នកលក់', 'ផ្សេងៗ'],
        infoTitle: 'វិធីផ្សេងក្នុងការទាក់ទងយើង',
        emailLabel: 'អ៊ីមែល',
        phoneLabel: 'ទូរស័ព្ទ / Telegram',
        addressLabel: 'អាសយដ្ឋាន',
        address: 'រាជធានីភ្នំពេញ កម្ពុជា',
        hours: 'ច័ន្ទ–សៅរ៍ ០៩:០០ – ១៨:០០',
    },
    zh: {
        title: '联系我们',
        subtitle: '我们随时为您提供帮助。',
        name: '您的姓名',
        email: '电子邮件',
        subject: '主题',
        subjectPlaceholder: '选择主题',
        message: '留言',
        messagePlaceholder: '我们能为您做什么？',
        send: '发送消息',
        sending: '发送中...',
        success: '消息已成功发送！我们将在24小时内回复。',
        error: '发送失败。请重试或直接发邮件联系我们。',
        subjects: ['订单问题', '产品咨询', '配送问题', '账户帮助', '卖家咨询', '其他'],
        infoTitle: '其他联系方式',
        emailLabel: '邮箱',
        phoneLabel: '电话 / Telegram',
        addressLabel: '地址',
        address: '柬埔寨金边',
        hours: '周一至周六 09:00–18:00',
    },
};

export default function ContactPage() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const tx = t[lang] || t.en;

    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setResult(null);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setResult({ ok: true, msg: tx.success });
                setForm({ name: '', email: '', subject: '', message: '' });
            } else {
                const data = await res.json();
                setResult({ ok: false, msg: data.error || tx.error });
            }
        } catch {
            setResult({ ok: false, msg: tx.error });
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24 pt-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <Mail className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{tx.title}</h1>
                    <p className="text-sm text-gray-500">{tx.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{tx.name}</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{tx.email}</label>
                                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">{tx.subject}</label>
                                <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none appearance-none bg-white">
                                    <option value="">{tx.subjectPlaceholder}</option>
                                    {tx.subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">{tx.message}</label>
                                <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                    placeholder={tx.messagePlaceholder}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none resize-none" />
                            </div>

                            {result && (
                                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {result.ok && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                    {result.msg}
                                </div>
                            )}

                            <button type="submit" disabled={sending}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-bold text-sm rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> {tx.sending}</> : <><Send className="w-4 h-4" /> {tx.send}</>}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-5">{tx.infoTitle}</h3>
                            <div className="space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">{tx.emailLabel}</p>
                                        <a href="mailto:support@kkshop.cc" className="text-sm font-bold text-gray-900 hover:text-brand-primary transition-colors">support@kkshop.cc</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">{tx.phoneLabel}</p>
                                        <p className="text-sm font-bold text-gray-900">+855 12 345 678</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{tx.hours}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">{tx.addressLabel}</p>
                                        <p className="text-sm font-bold text-gray-900">{tx.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
