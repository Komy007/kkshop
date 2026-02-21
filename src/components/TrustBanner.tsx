'use client';

import React from 'react';
import { ShieldCheck, Truck, Clock, HeadphonesIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const translations = {
    ko: [
        { icon: ShieldCheck, title: '100% 정품 보장', desc: '한국 직수입 인증' },
        { icon: Truck, title: '프놈펜 24시간 배송', desc: '자체 물류망 운영' },
        { icon: Clock, title: '7일 무상 반품', desc: '신뢰할 수 있는 쇼핑' },
        { icon: HeadphonesIcon, title: '한국어 상담 지원', desc: '카카오톡 실시간 톡' },
    ],
    en: [
        { icon: ShieldCheck, title: '100% Authentic', desc: 'Directly imported' },
        { icon: Truck, title: '24h Delivery', desc: 'Phnom Penh local' },
        { icon: Clock, title: '7-Day Return', desc: 'Shop with confidence' },
        { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Always here to help' },
    ],
    km: [
        { icon: ShieldCheck, title: 'ធានាគុណភាព 100%', desc: 'នាំចូលផ្ទាល់' },
        { icon: Truck, title: 'ដឹកជញ្ជូនរហ័សទីក្រុងភ្នំពេញ', desc: 'ក្នុងរយៈពេល 24 ម៉ោង' },
        { icon: Clock, title: 'ប្តូរវិញក្នុងរយៈពេល 7 ថ្ងៃ', desc: 'ទិញដោយទំនុកចិត្ត' },
        { icon: HeadphonesIcon, title: 'សេវាកម្មអតិថិជន', desc: '24/7' },
    ],
    zh: [
        { icon: ShieldCheck, title: '100% 正品保证', desc: '韩国直邮认证' },
        { icon: Truck, title: '金边 24小时送达', desc: '自有物流系统' },
        { icon: Clock, title: '7天无理由退货', desc: '安心购物体验' },
        { icon: HeadphonesIcon, title: '专属客服', desc: '随时为您解答' },
    ]
};

export default function TrustBanner() {
    const { language } = useAppStore();
    const features = translations[language];

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <section className="bg-white border-b border-gray-100 relative z-10 pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Horizontal Scrollable container for mobile */}
                <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll-bar space-x-4 md:space-x-0 md:grid md:grid-cols-4 gap-4 md:gap-6">
                    {features.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex-shrink-0 w-72 md:w-auto flex items-center space-x-5 snap-start p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base leading-tight mb-1.5">{item.title}</h4>
                                    <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Custom CSS to hide scrollbar but keep functionality */}
            <style key="scroll-style">{`
        .hide-scroll-bar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
}
