'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2, AlertCircle, Home, CheckCircle2 } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const signupT: Record<string, any> = {
    en: {
        badge: '🇰🇷 Cambodia\'s No.1 Korean Shop',
        title: 'Create Account',
        subtitle: 'Join KKshop for exclusive Korean products delivered in Phnom Penh',
        sectionBasic: 'Account Information',
        sectionShipping: 'Delivery Address',
        shippingNote: 'You can edit this later in My Page',
        name: 'Full Name',
        namePH: 'Your full name',
        email: 'Email Address',
        emailPH: 'yourname@email.com',
        password: 'Password',
        passwordPH: 'At least 6 characters',
        phone: 'Phone Number',
        phonePH: 'e.g. 010-1234-5678 or +855-...',
        address: 'City / Province / Street',
        addressPH: 'e.g. Phnom Penh, BKK1, Street 63',
        detailAddress: 'Apt / Unit / House No.',
        detailPH: 'e.g. House 12, Unit 3B',
        postalCode: 'Postal Code',
        postalPH: 'Optional',
        submit: 'Create Account',
        successMsg: 'Welcome to KKshop! Redirecting to login...',
        alreadyHave: 'Already have an account?',
        login: 'Login',
        perks: ['Free delivery over $30', '100% Authentic Korean', 'Points reward on every order'],
    },
    ko: {
        badge: '🇰🇷 캄보디아 No.1 한국 쇼핑몰',
        title: '회원가입',
        subtitle: 'KKshop 회원이 되어 프놈펜 최고의 한국 상품을 만나보세요',
        sectionBasic: '기본 정보 (필수)',
        sectionShipping: '배송 정보 (선택)',
        shippingNote: '추후 마이페이지에서 수정 가능',
        name: '이름 (Full Name)',
        namePH: '성함을 입력하세요',
        email: '이메일 주소',
        emailPH: '이메일로 로그인합니다',
        password: '비밀번호',
        passwordPH: '6자리 이상 입력하세요',
        phone: '연락처',
        phonePH: 'Phone Number (예: 010-1234-5678)',
        address: '기본 배송지 주소',
        addressPH: 'City/Province/Street',
        detailAddress: '상세 주소',
        detailPH: 'Apt/Suite/Unit',
        postalCode: '우편번호',
        postalPH: '선택 사항',
        submit: '가입 완료하기',
        successMsg: 'KKshop 회원이 되신 것을 환영합니다! 로그인 페이지로 이동합니다.',
        alreadyHave: '이미 계정이 있으신가요?',
        login: '로그인',
        perks: ['$30 이상 무료배송', '한국정품 100%', '주문마다 포인트 적립'],
    },
    km: {
        badge: '🇰🇷 ហាងកូរ៉េ លេខ១ នៅកម្ពុជា',
        title: 'បង្កើតគណនី',
        subtitle: 'ចូលរួម KKshop ដើម្បីទទួលបានផលិតផលកូរ៉េ នៅភ្នំពេញ',
        sectionBasic: 'ព័ត៌មានគណនី',
        sectionShipping: 'អាសយដ្ឋានដឹកជញ្ជូន',
        shippingNote: 'អ្នកអាចកែប្រែនៅក្នុង My Page ពេលក្រោយ',
        name: 'ឈ្មោះពេញ',
        namePH: 'ឈ្មោះរបស់អ្នក',
        email: 'អ៊ីមែល',
        emailPH: 'yourname@email.com',
        password: 'ពាក្យសម្ងាត់',
        passwordPH: 'យ៉ាងហោចណាស់ ៦ តួអក្សរ',
        phone: 'លេខទូរស័ព្ទ',
        phonePH: '+855-...',
        address: 'ក្រុង / ខេត្ត / ផ្លូវ',
        addressPH: 'ភ្នំពេញ, BKK1, ...',
        detailAddress: 'ផ្ទះ / ឯកតា',
        detailPH: 'ផ្ទះ ១២, ឯកតា ៣B',
        postalCode: 'លេខប្រៃសណីយ',
        postalPH: 'ស្រេចចិត្ត',
        submit: 'បង្កើតគណនី',
        successMsg: 'ស្វាគមន៍មកកាន់ KKshop! ...',
        alreadyHave: 'មានគណនីរួចហើយ?',
        login: 'ចូល',
        perks: ['ដឹកជញ្ជូនឥតគិតថ្លៃ $30+', 'ផលិតផលកូរ៉េ 100%', 'ពិន្ទុរង្វាន់រាល់ការបញ្ជាទិញ'],
    },
    zh: {
        badge: '🇰🇷 柬埔寨第一韩国购物平台',
        title: '创建账号',
        subtitle: '加入KKshop，享受正宗韩国商品送货上门服务',
        sectionBasic: '账号信息',
        sectionShipping: '收货地址',
        shippingNote: '可在我的主页中修改',
        name: '姓名',
        namePH: '请输入您的姓名',
        email: '电子邮件',
        emailPH: 'yourname@email.com',
        password: '密码',
        passwordPH: '至少6位字符',
        phone: '手机号码',
        phonePH: '+855-... 或 010-...',
        address: '城市 / 省份 / 街道',
        addressPH: '金边, BKK1, ...',
        detailAddress: '详细地址',
        detailPH: '门牌号 / 公寓单元',
        postalCode: '邮政编码',
        postalPH: '选填',
        submit: '完成注册',
        successMsg: '欢迎加入KKshop！正在跳转到登录页...',
        alreadyHave: '已有账号？',
        login: '登录',
        perks: ['$30以上免运费', '100%韩国正品', '每单赚取积分'],
    },
};

export default function SignupPage() {
    const router = useRouter();
    const store = useSafeAppStore();
    const language = store?.language || 'en';
    const t = signupT[language] || signupT.en;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        postalCode: '',
        address: '',
        detailAddress: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed.');
            setSuccess(t.successMsg);
            setTimeout(() => router.push('/login'), 2500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const InputField = ({
        icon: Icon, type = 'text', name, placeholder, required = false, colSpan = 'col-span-full', readOnly = false
    }: any) => (
        <div className={colSpan}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
                <input
                    required={required}
                    type={type}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8">
            {/* Decorative blobs */}
            <div className="fixed top-0 left-1/4 w-[60vw] h-[40vw] bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-30" />

            <div className="w-full max-w-md relative z-10">
                {/* Top Brand Section */}
                <div className="text-center mb-5">
                    <Link href="/" className="inline-block">
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm mb-3 hover:shadow-md transition-shadow">
                            <span className="text-sm font-extrabold text-blue-600">KK</span>
                            <span className="text-sm font-extrabold text-gray-900">Shop</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500 font-medium">{t.badge}</span>
                        </div>
                    </Link>
                    {/* Perks */}
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
                    {success && (
                        <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2.5 text-green-700">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Account Info */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.sectionBasic}</p>
                            <div className="grid grid-cols-1 gap-3">
                                <InputField icon={User} name="name" placeholder={t.namePH} required />
                                <InputField icon={Mail} type="email" name="email" placeholder={t.emailPH} required />
                                <InputField icon={Lock} type="password" name="password" placeholder={t.passwordPH} required />
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.sectionShipping}</p>
                                <span className="text-[10px] text-gray-400">{t.shippingNote}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <InputField icon={Phone} type="tel" name="phone" placeholder={t.phonePH} />
                                <InputField icon={MapPin} name="address" placeholder={t.addressPH} />
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <div className="relative group">
                                            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                                            <input type="text" name="detailAddress" value={formData.detailAddress} onChange={handleChange}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                                placeholder={t.detailPH} />
                                        </div>
                                    </div>
                                    <div>
                                        <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                            placeholder={t.postalPH} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !!success}
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
