'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
    const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
    const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPw !== form.confirm) { setMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다.' }); return; }
        if (form.newPw.length < 8) { setMsg({ type: 'err', text: '비밀번호는 최소 8자 이상이어야 합니다.' }); return; }
        setLoading(true); setMsg(null);
        const res = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
            setMsg({ type: 'ok', text: '✅ 비밀번호가 성공적으로 변경되었습니다.' });
            setForm({ current: '', newPw: '', confirm: '' });
        } else {
            setMsg({ type: 'err', text: data.error || '변경에 실패했습니다.' });
        }
    };

    const Input = ({ label, name, placeholder }: { label: string; name: 'current' | 'newPw' | 'confirm'; placeholder?: string }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type={show[name] ? 'text' : 'password'}
                    value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [name]: !p[name] }))}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-50 rounded-xl"><Lock className="w-6 h-6 text-red-600" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">비밀번호 변경</h1>
                        <p className="text-xs text-gray-500">현재 비밀번호를 확인 후 변경합니다</p>
                    </div>
                </div>

                {msg && (
                    <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {msg.type === 'ok' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="현재 비밀번호" name="current" placeholder="현재 비밀번호 입력" />
                    <Input label="새 비밀번호" name="newPw" placeholder="새 비밀번호 (최소 8자)" />
                    <Input label="새 비밀번호 확인" name="confirm" placeholder="새 비밀번호 재입력" />
                    <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-70 text-sm mt-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                </form>
            </div>
        </div>
    );
}
