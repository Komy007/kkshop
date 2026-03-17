"use client";

import { useAppStore, useSafeAppStore } from "@/store/useAppStore";

const trustTranslations: Record<string, any> = {
    ko: {
        authentic: "100% 한국 정품 화장품",
        koreanCertified: "한국 인증",
    },
    en: {
        authentic: "100% Authentic Korean Cosmetics",
        koreanCertified: "Korean Certified",
    },
    km: {
        authentic: "គ្រឿងសំអាងកូរ៉េ 100% ពិតប្រាកដ",
        koreanCertified: "បញ្ជាក់ដោយកូរ៉េ",
    },
    zh: {
        authentic: "100% 韩国正品化妆品",
        koreanCertified: "韩国认证",
    },
};

/* SVG icons inline for zero-dependency, instant rendering */
function AuthenticIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" className="text-vivid-cyan" stroke="currentColor" />
        </svg>
    );
}

function MohIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}

function ShippingIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    );
}

function SecureIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

interface TrustBadgesProps {
    variant?: 'horizontal' | 'vertical' | 'compact';
    className?: string;
    showAuthentic?: boolean;
    showKoreanCertified?: boolean;
}

export default function TrustBadges({ variant = 'horizontal', className = '', showAuthentic, showKoreanCertified }: TrustBadgesProps) {
    const store = useSafeAppStore();
    const { language } = store || { language: 'en' };
    const t = trustTranslations[language] || trustTranslations.en;

    // props가 명시되지 않으면 기존 동작(둘 다 표시) 유지
    const displayAuthentic = showAuthentic === undefined ? true : showAuthentic;
    const displayKorean    = showKoreanCertified === undefined ? true : showKoreanCertified;

    const allBadges = [
        { key: 'authentic', show: displayAuthentic,  icon: AuthenticIcon, label: t.authentic,       color: "from-vivid-pink to-brand-secondary" },
        { key: 'korean',    show: displayKorean,      icon: MohIcon,       label: t.koreanCertified, color: "from-vivid-cyan to-brand-accent" },
    ];
    const badges = allBadges.filter(b => b.show);

    if (badges.length === 0) return null;

    if (variant === 'compact') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                {badges.map((badge, idx) => (
                    <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center text-white flex-shrink-0`}>
                            <badge.icon />
                        </div>
                        <span>{badge.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'vertical') {
        return (
            <div className={`flex flex-col gap-3 ${className}`}>
                {badges.map((badge, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 glass-panel rounded-2xl px-4 py-3 hover:bg-white/10 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-white flex-shrink-0`}>
                            <badge.icon />
                        </div>
                        <span className="text-sm font-semibold text-white">{badge.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    // Default: horizontal
    return (
        <div className={`flex flex-wrap items-center gap-4 ${className}`}>
            {badges.map((badge, idx) => (
                <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-white flex-shrink-0`}>
                        <badge.icon />
                    </div>
                    <span className="text-sm font-bold text-white/90 whitespace-nowrap">{badge.label}</span>
                </div>
            ))}
        </div>
    );
}
