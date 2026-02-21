import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ArrowRight, Sparkles } from 'lucide-react';

const translations = {
    ko: {
        badge: 'Authentic Quality & Value',
        titlePart1: '대한민국 프리미엄 셀렉션',
        titlePart2: '스마트한 소비의 기준',
        subtitle: '한국에서 선택받은 상품 중 품질과 가성비가 검증된 제품만 취급합니다.',
        desc1: '거의 모든 제품은 한국 현지에서 사용되고 인정받은 프리미엄 라인업입니다. (품질 최우선주의)',
        desc2: '화장품 및 뷰티 카테고리는 100% 한국(Made in Korea) 정품만을 고집합니다.',
        cta: '베스트 상품 둘러보기'
    },
    en: {
        badge: 'Authentic Quality & Value',
        titlePart1: 'Korea Premium Selection',
        titlePart2: 'The Standard of Smart Shopping',
        subtitle: 'We curate only proven products with the best quality and value from Korea.',
        desc1: 'Almost all our products are recognized and widely used in the local Korean market. (Quality First)',
        desc2: 'For cosmetics and beauty, we exclusively handle 100% authentic Korean products.',
        cta: 'Shop Best Sellers'
    },
    km: {
        badge: 'គុណភាព និងតម្លៃពិតប្រាកដ',
        titlePart1: 'ជម្រើសពិសេសពីកូរ៉េ',
        titlePart2: 'ស្តង់ដារនៃការទិញទំនិញឆ្លាតវៃ',
        subtitle: 'យើងជ្រើសរើសតែផលិតផលដែលមានគុណភាព និងតម្លៃល្អបំផុតពីប្រទេសកូរ៉េ។',
        desc1: 'ស្ទើរតែគ្រប់ផលិតផលទាំងអស់ ត្រូវបានទទួលស្គាល់ និងប្រើប្រាស់យ៉ាងទូលំទូលាយនៅកូរ៉េ។ (គុណភាពជាចម្បង)',
        desc2: 'ចំពោះគ្រឿងសំអាង យើងនាំចូលផ្តាច់មុខ ផលិតផលកូរ៉េសុទ្ធ 100% ។',
        cta: 'ទិញទំនិញល្បីៗ'
    },
    zh: {
        badge: '真实品质与超值',
        titlePart1: '韩国高级甄选',
        titlePart2: '智慧消费的新标准',
        subtitle: '我们只甄选韩国出产、经过验证的高品质与超高性价比产品。',
        desc1: '绝大多数产品都在韩国本土受到广泛认可和使用。（品质至上）',
        desc2: '所有化妆品和美容护肤产品，我们坚持 100% 纯正韩国制造。',
        cta: '选购畅销产品'
    }
};

export default function HeroBanner() {
    const { language } = useAppStore();
    const t = translations[language] || translations.ko;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <section className="relative w-full min-h-[90vh] bg-white overflow-hidden flex items-center pt-24 pb-20">
            {/* Background ambient light - Very subtle for light mode */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-50 rounded-full blur-[100px] pointer-events-none opacity-80"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">

                    {/* Left Typography Column */}
                    <div className="flex flex-col items-start space-y-8 max-w-2xl">
                        {/* Shadcn style subtle badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50/80 backdrop-blur-sm shadow-sm">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-700 text-xs font-semibold tracking-wider uppercase">
                                {t.badge}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.2] tracking-tight">
                            <span className="block text-gray-900 pb-1">
                                {t.titlePart1}
                            </span>
                            <span className="block text-blue-600 mt-1 text-3xl md:text-5xl lg:text-5xl">
                                {t.titlePart2}
                            </span>
                        </h1>

                        <div className="space-y-4 border-l-4 border-blue-500 pl-4 py-1 break-keep lg:whitespace-nowrap">
                            <p className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                                {t.subtitle}
                            </p>
                            <p className="text-base text-gray-600 leading-relaxed font-medium">
                                <Sparkles className="inline-block w-4 h-4 text-amber-500 mr-1.5 -mt-0.5" />
                                {t.desc1}
                            </p>
                            <p className="text-base text-gray-600 leading-relaxed font-medium">
                                <Sparkles className="inline-block w-4 h-4 text-pink-500 mr-1.5 -mt-0.5" />
                                {t.desc2}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full sm:w-auto">
                            <button className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5">
                                <span>{t.cta}</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                            <button className="px-8 py-4 text-gray-700 font-medium rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                자세히 알아보기
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mt-12 pt-8 border-t border-gray-100">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col text-sm">
                                <span className="text-gray-900 font-bold">10,000+</span>
                                <span className="text-gray-500">누적 프리미엄 고객</span>
                            </div>
                        </div>
                    </div>

                    {/* Right 3D Interactive Column - Shadcn Premium Frame */}
                    <div className="relative w-full aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] bg-white group">
                        <iframe
                            src="https://my.spline.design/customkeyboardcmdcorv-r5YJbknCNozgHuMFOgxRfu0H/"
                            frameBorder="0"
                            width="100%"
                            height="100%"
                            loading="lazy"
                            title="Interactive 3D Keyboard"
                            className="w-full h-full object-cover opacity-95 transition-opacity duration-700 group-hover:opacity-100"
                        ></iframe>

                        {/* Drag to rotate hint */}
                        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-3 pointer-events-none">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </div>
                            <span className="text-gray-700 text-xs font-medium tracking-wide">Drag to rotate</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
