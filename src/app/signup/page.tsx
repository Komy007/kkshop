'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2, AlertCircle, Home, CheckCircle2, MailCheck } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import TaegukgiIcon from '@/components/TaegukgiIcon';

const signupT: Record<string, any> = {
    en: {
        badge: 'Cambodia\'s No.1 Korean Shop',
        title: 'Create Account',
        subtitle: 'Join KKShop — Korean beauty delivered to your door in Cambodia',
        sectionBasic: 'Account Information',
        sectionShipping: 'Delivery Address',
        shippingNote: 'Detail & postal code are optional',
        name: 'Full Name',
        namePH: 'Your full name',
        email: 'Email Address',
        emailPH: 'yourname@email.com',
        password: 'Password',
        passwordPH: 'At least 6 characters',
        phone: 'Phone Number',
        phonePH: '+855 xx xxx xxxx or 010-1234-5678',
        address: 'City / Province / Street',
        addressPH: 'e.g. Phnom Penh, BKK1, Street 63',
        detailAddress: 'Apt / Unit / House No.',
        detailPH: 'e.g. House 12, Unit 3B',
        postalCode: 'Postal Code',
        postalPH: 'Optional',
        submit: 'Create Account',
        successTitle: 'Account created! 🎉',
        successMsg: 'A verification email has been sent to your inbox. Please verify your email before logging in.',
        alreadyHave: 'Already have an account?',
        login: 'Login',
        perks: ['Free delivery over $30', '100% Authentic Korean', 'Points reward on every order'],
        required: 'Required',
    },
    ko: {
        badge: '캄보디아 No.1 한국 쇼핑몰',
        title: '회원가입',
        subtitle: 'KKShop 회원이 되어 프놈펜 최고의 한국 상품을 만나보세요',
        sectionBasic: '기본 정보 (필수)',
        sectionShipping: '배송 주소',
        shippingNote: '상세주소·우편번호 선택 사항',
        name: '이름',
        namePH: '성함을 입력하세요',
        email: '이메일 주소',
        emailPH: '이메일로 로그인합니다',
        password: '비밀번호',
        passwordPH: '6자리 이상 입력하세요',
        phone: '연락처 (전화번호)',
        phonePH: '+855-xx-xxx-xxxx 또는 010-1234-5678',
        address: '기본 배송지 주소',
        addressPH: 'City / Province / Street',
        detailAddress: '상세 주소',
        detailPH: 'Apt / Suite / Unit',
        postalCode: '우편번호',
        postalPH: '선택 사항',
        submit: '가입 완료하기',
        successTitle: '가입 완료! 🎉',
        successMsg: '인증 이메일이 발송되었습니다. 이메일을 확인하고 인증을 완료한 후 로그인해 주세요.',
        alreadyHave: '이미 계정이 있으신가요?',
        login: '로그인',
        perks: ['$30 이상 무료배송', '한국정품 100%', '주문마다 포인트 적립'],
        required: '필수',
    },
    km: {
        badge: 'ហាងកូរ៉េ លេខ១ នៅកម្ពុជា',
        title: 'បង្កើតគណនី',
        subtitle: 'ចូលរួម KKShop ដើម្បីទទួលបានផលិតផលកូរ៉េ នៅភ្នំពេញ',
        sectionBasic: 'ព័ត៌មានគណនី (ចាំបាច់)',
        sectionShipping: 'អាសយដ្ឋានដឹកជញ្ជូន',
        shippingNote: 'លម្អិត និងលេខប្រៃសណីយ ស្រេចចិត្ត',
        name: 'ឈ្មោះពេញ',
        namePH: 'ឈ្មោះរបស់អ្នក',
        email: 'អ៊ីមែល',
        emailPH: 'yourname@email.com',
        password: 'ពាក្យសម្ងាត់',
        passwordPH: 'យ៉ាងហោចណាស់ ៦ តួអក្សរ',
        phone: 'លេខទូរស័ព្ទ',
        phonePH: '+855 xx xxx xxxx',
        address: 'ក្រុង / ខេត្ត / ផ្លូវ',
        addressPH: 'ភ្នំពេញ, BKK1, ផ្លូវ ៦៣',
        detailAddress: 'ផ្ទះ / ឯកតា',
        detailPH: 'ផ្ទះ ១២, ឯកតា ៣B',
        postalCode: 'លេខប្រៃសណីយ',
        postalPH: 'ស្រេចចិត្ត',
        submit: 'បង្កើតគណនី',
        successTitle: 'គណនីត្រូវបានបង្កើត! 🎉',
        successMsg: 'អ៊ីមែលផ្ទៀងផ្ទាត់ត្រូវបានផ្ញើ។ សូមពិនិត្យអ៊ីមែលរបស់អ្នក មុនពេលចូល។',
        alreadyHave: 'មានគណនីរួចហើយ?',
        login: 'ចូល',
        perks: ['ដឹកជញ្ជូនឥតគិតថ្លៃ $30+', 'ផលិតផលកូរ៉េ 100%', 'ពិន្ទុរង្វាន់រាល់ការបញ្ជាទិញ'],
        required: 'ចាំបាច់',
    },
    zh: {
        badge: '柬埔寨第一韩国购物平台',
        title: '创建账号',
        subtitle: '加入KKShop，享受正宗韩国商品送货上门服务',
        sectionBasic: '账号信息（必填）',
        sectionShipping: '收货地址',
        shippingNote: '详细地址和邮编为选填',
        name: '姓名',
        namePH: '请输入您的姓名',
        email: '电子邮件',
        emailPH: 'yourname@email.com',
        password: '密码',
        passwordPH: '至少6位字符',
        phone: '手机号码',
        phonePH: '+855-xx-xxx-xxxx 或 010-...',
        address: '城市 / 省份 / 街道',
        addressPH: '金边, BKK1, 街道63',
        detailAddress: '详细地址',
        detailPH: '门牌号 / 公寓单元',
        postalCode: '邮政编码',
        postalPH: '选填',
        submit: '完成注册',
        successTitle: '注册成功！🎉',
        successMsg: '验证邮件已发送，请查收邮箱并完成验证后再登录。',
        alreadyHave: '已有账号？',
        login: '登录',
        perks: ['$30以上免运费', '100%韩国正品', '每单赚取积分'],
        required: '必填',
    },
};

export default function SignupPage() {
    const router = useRouter();
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = signupT[language] || signupT.en;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        detailAddress: '',
        postalCode: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed.');
            setSuccess(true);
            // Redirect to login after 4 seconds
            setTimeout(() => router.push('/login'), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Success screen
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
                <div className="w-full max-w-sm text-center">
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-xl">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <MailCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{t.successTitle}</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">{t.successMsg}</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{t.login} →</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8">
            <div className="fixed top-0 left-1/4 w-[60vw] h-[40vw] bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-30" />

            <div className="w-full max-w-md relative z-10">
                {/* Brand Header */}
                <div className="text-center mb-5">
                    <Link href="/" className="inline-block">
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm mb-3 hover:shadow-md transition-shadow">
                            <span className="text-sm font-extrabold text-blue-600">KK</span>
                            <span className="text-sm font-extrabold text-gray-900">Shop</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                                <TaegukgiIcon className="w-4 h-[11px] flex-shrink-0" />
                                {t.badge}
                            </span>
                        </div>
                    </Link>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {t.perks.map((perk: string, i: number) => (
                            <span key={i} className="text-[11px] text-gray-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />{perk}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-extrabold text-gray-900">{t.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-600">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── Section 1: Account Info ─────────────────── */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                {t.sectionBasic}
                            </p>
                            <div className="space-y-3">

                                {/* Name */}
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t.namePH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                                    />
                                </div>

                                {/* Email */}
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder={t.emailPH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        required
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={t.passwordPH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                                    />
                                </div>

                                {/* Phone — required */}
                                <div className="relative group">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        required
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder={t.phonePH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Delivery Address ─────────────── */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.sectionShipping}</p>
                                <span className="text-[10px] text-gray-400">{t.shippingNote}</span>
                            </div>
                            <div className="space-y-3">

                                {/* Address — required */}
                                <div className="relative group">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder={t.addressPH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                                    />
                                </div>

                                {/* Detail + Postal */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2 relative group">
                                        <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            name="detailAddress"
                                            value={formData.detailAddress}
                                            onChange={handleChange}
                                            placeholder={t.detailPH}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        placeholder={t.postalPH}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email verification notice */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                {language === 'ko' ? '가입 후 인증 이메일이 발송됩니다. 이메일 인증 후 로그인하세요.'
                                    : language === 'km' ? 'អ៊ីមែលផ្ទៀងផ្ទាត់នឹងត្រូវផ្ញើបន្ទាប់ពីការចុះឈ្មោះ។'
                                    : language === 'zh' ? '注册后将发送验证邮件，请验证后再登录。'
                                    : 'A verification email will be sent after signup. Please verify before logging in.'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 px-4 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                            {isLoading
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <><UserPlus className="w-4 h-4" />{t.submit}</>
                            }
                        </button>
                    </form>

                    <div className="mt-5 text-center border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500">
                            {t.alreadyHave}{' '}
                            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                {t.login}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
