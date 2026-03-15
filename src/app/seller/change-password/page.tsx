'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle } from 'lucide-react';

export default function SellerChangePasswordPage() {
    const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
    const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; en: string; ko: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPw !== form.confirm) {
            setMsg({ type: 'err', en: 'New passwords do not match.', ko: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }
        if (form.newPw.length < 8) {
            setMsg({ type: 'err', en: 'Password must be at least 8 characters.', ko: '비밀번호는 최소 8자 이상이어야 합니다.' });
            return;
        }
        setLoading(true); setMsg(null);
        const res = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
            setMsg({ type: 'ok', en: 'Password changed successfully.', ko: '비밀번호가 성공적으로 변경되었습니다.' });
            setForm({ current: '', newPw: '', confirm: '' });
        } else {
            const errMap: Record<string, { en: string; ko: string }> = {
                wrong_password:   { en: 'Current password is incorrect.',           ko: '현재 비밀번호가 올바르지 않습니다.' },
                password_too_short: { en: 'Password must be at least 8 characters.', ko: '비밀번호는 최소 8자 이상이어야 합니다.' },
                missing_fields:   { en: 'Please fill in all fields.',               ko: '모든 항목을 입력해주세요.' },
            };
            const err = errMap[data.error] ?? { en: 'Failed to change password.', ko: '변경에 실패했습니다.' };
            setMsg({ type: 'err', ...err });
        }
    };

    const Input = ({
        en, ko, name, placeholder, placeholderKo,
    }: { en: string; ko: string; name: 'current' | 'newPw' | 'confirm'; placeholder: string; placeholderKo?: string }) => (
        <div>
            <label className="block mb-1.5">
                <span className="text-sm font-semibold text-gray-800">{en}</span>
                <span className="text-[11px] text-gray-400 ml-1.5">{ko}</span>
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type={show[name] ? 'text' : 'password'}
                    value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    placeholder={placeholderKo ? `${placeholder} · ${placeholderKo}` : placeholder}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    <div className="p-3 bg-teal-50 rounded-xl"><Lock className="w-6 h-6 text-teal-600" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
                        <p className="text-xs text-gray-400 mt-0.5">비밀번호 변경 — verify current password first · 현재 비밀번호 확인 후 변경</p>
                    </div>
                </div>

                {msg && (
                    <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {msg.type === 'ok' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                        <div>
                            <div>{msg.en}</div>
                            <div className="text-xs opacity-75 mt-0.5">{msg.ko}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        en="Current Password" ko="현재 비밀번호"
                        name="current"
                        placeholder="Enter current password"
                        placeholderKo="현재 비밀번호 입력"
                    />
                    <Input
                        en="New Password" ko="새 비밀번호"
                        name="newPw"
                        placeholder="New password (min. 8 characters)"
                        placeholderKo="새 비밀번호 (최소 8자)"
                    />
                    <Input
                        en="Confirm New Password" ko="새 비밀번호 확인"
                        name="confirm"
                        placeholder="Re-enter new password"
                        placeholderKo="새 비밀번호 재입력"
                    />
                    <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-70 text-sm mt-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading
                            ? <span>Changing… <span className="text-[11px] opacity-70">· 변경 중…</span></span>
                            : <span>Change Password <span className="text-[11px] opacity-70">· 비밀번호 변경</span></span>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
