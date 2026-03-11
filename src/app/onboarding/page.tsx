'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Phone, MapPin, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const t: Record<string, any> = {
    en: {
        title: 'One Last Step',
        subtitle: 'Please add your contact info to complete your account setup.',
        phone: 'Phone Number',
        phonePH: '+855 xx xxx xxxx',
        address: 'City / Province / Street',
        addressPH: 'e.g. Phnom Penh, BKK1, Street 63',
        detailAddress: 'Apt / Unit / House No.',
        detailPH: 'Optional',
        submit: 'Complete Setup',
        required: 'Required',
        done: 'All set! Redirecting…',
        errRequired: 'Phone and address are required.',
        errFailed: 'Failed to save. Please try again.',
    },
    ko: {
        title: '마지막 한 단계',
        subtitle: '전화번호와 배송 주소를 입력해 주세요.',
        phone: '전화번호',
        phonePH: '+855 xx xxx xxxx 또는 010-1234-5678',
        address: '기본 배송지',
        addressPH: 'City / Province / Street',
        detailAddress: '상세 주소',
        detailPH: '선택 사항',
        submit: '완료',
        required: '필수',
        done: '완료되었습니다! 이동 중…',
        errRequired: '전화번호와 주소를 입력해 주세요.',
        errFailed: '저장에 실패했습니다. 다시 시도해 주세요.',
    },
    km: {
        title: 'ជំហានចុងក្រោយ',
        subtitle: 'សូមបន្ថែមព័ត៌មានទំនាក់ទំនងរបស់អ្នក។',
        phone: 'លេខទូរស័ព្ទ',
        phonePH: '+855 xx xxx xxxx',
        address: 'ក្រុង / ខេត្ត / ផ្លូវ',
        addressPH: 'ឧ. ភ្នំពេញ, BKK1, ផ្លូវ 63',
        detailAddress: 'ផ្ទះ / ខ្នាត',
        detailPH: 'ស្រេចចិត្ត',
        submit: 'បញ្ចប់',
        required: 'ចាំបាច់',
        done: 'រួចរាល់! កំពុងប្តូរ…',
        errRequired: 'ត្រូវការលេខទូរស័ព្ទ និងអាសយដ្ឋាន។',
        errFailed: 'បរាជ័យក្នុងការរក្សាទុក។ សូមព្យាយាមម្តងទៀត។',
    },
    zh: {
        title: '最后一步',
        subtitle: '请填写您的联系方式以完成账户设置。',
        phone: '电话号码',
        phonePH: '+855 xx xxx xxxx',
        address: '城市 / 省份 / 街道',
        addressPH: '例：金边, BKK1, 街道63',
        detailAddress: '详细地址',
        detailPH: '选填',
        submit: '完成设置',
        required: '必填',
        done: '完成！正在跳转…',
        errRequired: '电话号码和地址为必填项。',
        errFailed: '保存失败，请重试。',
    },
};

export default function OnboardingPage() {
    const router = useRouter();
    const { update } = useSession();
    const lang = useSafeAppStore((s) => s.language) || 'en';
    const tx = t[lang] || t.en;

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!phone.trim() || !address.trim()) {
            setError(tx.errRequired);
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), address: address.trim(), detailAddress: detailAddress.trim() || null }),
            });
            if (!res.ok) throw new Error();

            // Clear needsOnboarding from JWT by triggering session update
            await update();
            setDone(true);
            setTimeout(() => router.replace('/'), 1200);
        } catch {
            setError(tx.errFailed);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                {/* Logo / Badge */}
                <div className="flex justify-center mb-6">
                    <span className="bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full">KKShop</span>
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">{tx.title}</h1>
                <p className="text-sm text-gray-500 text-center mb-8">{tx.subtitle}</p>

                {done ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                        <p className="text-gray-700 font-medium">{tx.done}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {tx.phone} <span className="text-rose-500 text-xs">({tx.required})</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={tx.phonePH}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {tx.address} <span className="text-rose-500 text-xs">({tx.required})</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder={tx.addressPH}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                />
                            </div>
                        </div>

                        {/* Detail Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{tx.detailAddress}</label>
                            <input
                                type="text"
                                value={detailAddress}
                                onChange={(e) => setDetailAddress(e.target.value)}
                                placeholder={tx.detailPH}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            {tx.submit}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
