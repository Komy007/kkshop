'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Mail, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEmailSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [form, setForm] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: 'KKShop Admin'
    });

    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetch('/api/admin/settings?keys=email_smtp_settings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const setting = data.find(s => s.key === 'email_smtp_settings');
                    if (setting && setting.value) {
                        setForm({
                            host: setting.value.host || '',
                            port: setting.value.port || '587',
                            secure: setting.value.secure || false,
                            user: setting.value.user || '',
                            pass: setting.value.pass || '',
                            fromEmail: setting.value.fromEmail || '',
                            fromName: setting.value.fromName || ''
                        });
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'email_smtp_settings', value: form })
            });
            if (res.ok) {
                alert('이메일(SMTP) 설정이 저장되었습니다.');
                router.refresh();
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            alert('테스트 수신 이메일 주소를 입력하세요.');
            return;
        }
        setTesting(true);
        try {
            const res = await fetch('/api/admin/marketing/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testEmail,
                    subject: '[KKShop] SMTP 설정 테스트 메일입니다.',
                    html: '<div style="padding: 20px; font-family: sans-serif; border: 1px solid #eaeaea; border-radius: 8px;"><h2>KKShop 발송 테스트</h2><p>이 메일이 정상적으로 도착했다면 이메일 설정이 올바르게 구성된 것입니다.</p></div>'
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert('테스트 메일이 성공적으로 발송되었습니다. 메일함을 확인하세요.');
            } else {
                alert(`발송 실패: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류로 인해 메일 발송에 실패했습니다.');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-brand-primary" /> 이메일/SMTP 설정
                </h1>
                <p className="text-sm text-gray-500 mt-1">쇼핑몰에서 발송되는 모든 자동/수동 이메일의 서버 계정 연동을 관리합니다.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">SMTP Host</label>
                            <input type="text" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="smtp.gmail.com" required />
                            <p className="text-xs text-gray-400 mt-1">예: smtp.gmail.com, smtp.sendgrid.net</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">SMTP Port</label>
                            <input type="number" value={form.port} onChange={e => setForm({ ...form, port: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="587" required />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="secure" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="secure" className="text-sm font-bold text-gray-700">SSL/TLS 보안 강제 (포트 465인 경우 체크)</label>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">계정 (아이디/이메일)</label>
                            <input type="text" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required placeholder="example@gmail.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호 (App Password)</label>
                            <input type="password" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono" required placeholder="••••••••" />
                            <p className="text-xs text-gray-400 mt-1">Gmail의 경우 2단계 인증 후 "앱 비밀번호"를 생성하여 입력.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">보내는 사람 이메일 (From)</label>
                            <input type="email" value={form.fromEmail} onChange={e => setForm({ ...form, fromEmail: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="no-reply@kkshop.com (선택)" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">보내는 사람 이름 (Name)</label>
                            <input type="text" value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="KKShop Customer Service" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        저장하기
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-brand-primary/20 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">설정 검증 (Test Email)</h2>
                    <p className="text-sm text-gray-500 mb-4">입력한 SMTP 정보가 올바르게 작동하는지 테스트 메일을 전송해 봅니다. (먼저 설정을 **저장**한 후 진행하세요.)</p>
                    <div className="flex gap-2">
                        <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="테스트 수신할 이메일 입력" className="flex-1 border border-gray-300 rounded-lg px-4 py-2" />
                        <button type="button" onClick={handleTestEmail} disabled={testing || !testEmail} className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            발송 테스트
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
