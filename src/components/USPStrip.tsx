'use client';

import Link from 'next/link';
import { ShieldCheck, Star, Store } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';

const content = {
    en: [
        {
            Icon: ShieldCheck,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            title: '100% Korean Cosmetics',
            sub: 'Authentic · Certified',
            href: null,
        },
        {
            Icon: Star,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            title: 'Korean-Curated Quality',
            sub: 'Every item hand-picked',
            href: null,
        },
        {
            Icon: Store,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            title: 'Sell With Us',
            sub: 'Open your store →',
            href: '/seller/register',
        },
    ],
    ko: [
        {
            Icon: ShieldCheck,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            title: '화장품 한국산 100%',
            sub: '정품 인증 · 직접 수입',
            href: null,
        },
        {
            Icon: Star,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            title: '한국인이 직접 큐레이션',
            sub: '엄선된 품질 보장',
            href: null,
        },
        {
            Icon: Store,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            title: '셀러 입점 모집',
            sub: '지금 신청하기 →',
            href: '/seller/register',
        },
    ],
    km: [
        {
            Icon: ShieldCheck,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            title: 'គ្រឿងសំអាងកូរ៉េ 100%',
            sub: 'ពិតប្រាកដ · បញ្ជាក់',
            href: null,
        },
        {
            Icon: Star,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            title: 'ជ្រើសរើសដោយជំនាញ',
            sub: 'គ្រប់ទំនិញ',
            href: null,
        },
        {
            Icon: Store,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            title: 'ចូលជាអ្នកលក់',
            sub: 'ចុះឈ្មោះឥឡូវ →',
            href: '/seller/register',
        },
    ],
    zh: [
        {
            Icon: ShieldCheck,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            title: '化妆品100%韩国正品',
            sub: '正品认证 · 直接进口',
            href: null,
        },
        {
            Icon: Star,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            title: '韩国人精选品质',
            sub: '每件商品精挑细选',
            href: null,
        },
        {
            Icon: Store,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            title: '欢迎入驻开店',
            sub: '立即申请 →',
            href: '/seller/register',
        },
    ],
} as const;

type Lang = keyof typeof content;

export default function USPStrip() {
    const store = useSafeAppStore();
    const lang = (store?.language as Lang) || 'en';
    const items = content[lang] ?? content.en;

    return (
        <div className="flex bg-white border-b border-gray-100">
            {items.map((item, i) => {
                const inner = (
                    <>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                            <item.Icon className={`w-4 h-4 ${item.iconColor}`} strokeWidth={2} />
                        </div>
                        <div className="text-center min-w-0">
                            <p className="text-[10px] font-extrabold text-gray-900 leading-tight line-clamp-1">
                                {item.title}
                            </p>
                            <p className={`text-[9px] leading-tight mt-0.5 ${item.href ? 'text-violet-600 font-semibold' : 'text-gray-400'}`}>
                                {item.sub}
                            </p>
                        </div>
                    </>
                );

                const cls = `flex-1 flex flex-col items-center gap-1.5 py-3 px-2 ${i < items.length - 1 ? 'border-r border-gray-100' : ''} ${item.href ? 'active:bg-gray-50 transition-colors' : ''}`;

                return item.href ? (
                    <Link key={i} href={item.href} className={cls}>
                        {inner}
                    </Link>
                ) : (
                    <div key={i} className={cls}>
                        {inner}
                    </div>
                );
            })}
        </div>
    );
}
