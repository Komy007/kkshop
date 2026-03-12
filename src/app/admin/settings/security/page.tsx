'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, QrCode, CheckCircle, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function SecuritySettingsPage() {
    const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled' | 'setup'>('loading');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showDisable, setShowDisable] = useState(false);

    useEffect(() => {
        fetch('/api/admin/2fa/setup')
            .then(r => r.json())
            .then(data => {
                if (data.enabled) {
                    setStatus('enabled');
                } else if (data.qrDataUrl) {
                    setQrDataUrl(data.qrDataUrl);
                    setSecret(data.secret);
                    setStatus('setup');
                } else {
                    setStatus('disabled');
                }
            })
            .catch(() => setStatus('disabled'));
    }, []);

    async function startSetup() {
        setStatus('loading');
        const res = await fetch('/api/admin/2fa/setup');
        const data = await res.json();
        setQrDataUrl(data.qrDataUrl);
        setSecret(data.secret);
        setStatus('setup');
    }

    async function confirmEnable(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        const res = await fetch('/api/admin/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); return; }
        setSuccess('2FA가 활성화되었습니다!');
        setStatus('enabled');
        setSaving(false);
    }

    async function handleDisable(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        const res = await fetch('/api/admin/2fa/setup', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: disableCode }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setSaving(false); return; }
        setSuccess('2FA가 비활성화되었습니다.');
        setStatus('disabled');
        setShowDisable(false);
        setDisableCode('');
        setSaving(false);
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                    <h1 className="text-xl font-bold text-gray-900">보안 설정 / Security</h1>
                    <p className="text-sm text-gray-500">2단계 인증으로 계정을 보호하세요.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-6">
                {/* 현재 상태 */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <div>
                            <p className="font-semibold text-gray-900">2단계 인증 (TOTP)</p>
                            <p className="text-xs text-gray-500">Google Authenticator 앱 사용</p>
                        </div>
                    </div>
                    {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    {status === 'enabled' && (
                        <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                            <CheckCircle className="w-4 h-4" /> 활성화됨
                        </span>
                    )}
                    {(status === 'disabled' || status === 'setup') && (
                        <span className="text-gray-400 text-sm">비활성화됨</span>
                    )}
                </div>

                {/* 알림 메시지 */}
                {error && <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5 flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}</div>}
                {success && <div className="text-green-600 text-sm bg-green-50 rounded-xl px-4 py-2.5 flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

                {/* 비활성화 상태 — 설정 시작 */}
                {status === 'disabled' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">2FA를 활성화하면 로그인 시 인증 앱 코드가 추가로 필요합니다.</p>
                        <button onClick={startSetup} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all">
                            2FA 설정 시작
                        </button>
                    </div>
                )}

                {/* 설정 중 — QR 코드 표시 */}
                {status === 'setup' && qrDataUrl && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                            <QrCode className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Google Authenticator 앱을 열고 아래 QR 코드를 스캔하세요. 앱에 표시되는 6자리 코드를 입력해 확인합니다.</span>
                        </div>
                        <div className="flex justify-center">
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                <Image src={qrDataUrl} alt="2FA QR Code" width={200} height={200} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">QR 코드 스캔이 안 될 경우 아래 코드를 직접 입력하세요:</p>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                                <code className="text-xs font-mono flex-1 break-all text-gray-700">
                                    {showSecret ? secret : '•'.repeat(secret.length)}
                                </code>
                                <button onClick={() => setShowSecret(v => !v)} className="text-gray-400 hover:text-gray-600">
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <form onSubmit={confirmEnable} className="space-y-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="앱의 6자리 코드 입력"
                                className="w-full text-center text-xl font-mono tracking-widest py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <button type="submit" disabled={saving || code.length !== 6}
                                className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                확인 및 활성화
                            </button>
                        </form>
                    </div>
                )}

                {/* 활성화 상태 — 비활성화 옵션 */}
                {status === 'enabled' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">2FA가 활성화되어 있습니다. 로그인마다 인증 코드가 필요합니다.</p>
                        {!showDisable ? (
                            <button onClick={() => setShowDisable(true)}
                                className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all">
                                2FA 비활성화
                            </button>
                        ) : (
                            <form onSubmit={handleDisable} className="space-y-3 border border-red-200 rounded-xl p-4 bg-red-50">
                                <p className="text-sm text-red-700 font-medium">정말 2FA를 비활성화하시겠습니까?</p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={disableCode}
                                    onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="현재 인증 코드 입력"
                                    className="w-full text-center text-xl font-mono tracking-widest py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setShowDisable(false); setDisableCode(''); }}
                                        className="flex-1 py-2 rounded-lg border text-gray-600 hover:bg-white text-sm">
                                        취소
                                    </button>
                                    <button type="submit" disabled={saving || disableCode.length !== 6}
                                        className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 text-sm disabled:opacity-50">
                                        {saving ? '처리 중...' : '비활성화'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
