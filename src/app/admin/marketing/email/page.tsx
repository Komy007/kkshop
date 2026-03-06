'use client';

import React, { useState } from 'react';
import { Send, Users, Mail, Loader2, Info } from 'lucide-react';

export default function AdminMarketingEmailPage() {
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({
        to: '',
        subject: '',
        html: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm('이메일을 발송하시겠습니까? (SMTP 설정이 올바르지 않으면 실패할 수 있습니다.)')) {
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/admin/marketing/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (res.ok) {
                alert('이메일 발송에 성공했습니다!');
                setForm({ to: '', subject: '', html: '' });
            } else {
                alert(`발송 실패: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Send className="w-6 h-6 text-brand-primary" /> 이메일 발송 (Email Marketing)
                </h1>
                <p className="text-sm text-gray-500 mt-1">고객에게 마케팅 이벤트 공지, 쿠폰 발급 알림, 개별 안내 메일을 발송합니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-700" />
                            <h2 className="text-lg font-bold text-gray-900">새 메일 작성</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    받는 사람 (To)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.to}
                                    onChange={e => setForm({ ...form, to: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="고객 이메일 입력 (예: user@example.com)"
                                />
                                <p className="text-xs text-gray-400 mt-1">※ 현재는 1건씩 개별 발송만 지원됩니다.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    제목 (Subject)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="[KKShop] 화이트데이 전품목 20% 할인 이벤트 안내!"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    내용 (HTML 본문)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={10}
                                    value={form.html}
                                    onChange={e => setForm({ ...form, html: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm leading-relaxed"
                                    placeholder="<div style='padding: 20px;'><p>안녕하세요 고객님!</p></div>"
                                />
                                <p className="text-xs text-brand-primary mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    <span>HTML 태그를 지원합니다. (예: &lt;br&gt;, &lt;strong&gt;, &lt;img src=... /&gt;)</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button type="submit" disabled={sending} className="flex items-center gap-2 px-8 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                메일 보내기
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right sidebar info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h3 className="text-blue-800 font-bold flex items-center gap-2 mb-3">
                            <Info className="w-5 h-5" />
                            이용 안내
                        </h3>
                        <ul className="text-sm text-blue-900 space-y-2 list-disc pl-5">
                            <li>시스템 메일이 아닌 마케팅 용도의 수동 발송 페이지입니다.</li>
                            <li>실제 발송하기 전 <strong>[설정] &gt; [이메일 설정]</strong>에서 SMTP 연동 및 [테스트 메일] 확인을 먼저 진행하세요.</li>
                            <li>다량의 메일을 짧은 시간에 발송할 경우 Google/메일 서버 등급에 따라 스팸으로 분류될 수 있습니다.</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <h3 className="text-gray-900 font-bold flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-gray-500" />
                            최근 발송 이력
                        </h3>
                        <p className="text-sm text-gray-500 text-center py-6">
                            아직 기록이 없습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
