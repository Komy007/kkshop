'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Heart, Clock, LogOut, ChevronRight, ShoppingBag, Loader2, Truck, MapPin, Gift, UserPlus, Share2, Plus, Pencil, Trash2, Check, X, Mail } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import Footer from '@/components/Footer';

type TabKey = 'orders' | 'wishlist' | 'recent' | 'addresses' | 'referral';

interface OrderItem {
    id: string;
    quantity: number;
    priceUsd: number;
    product: { imageUrl: string | null; sku: string };
}
interface OrderShipment {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
}
interface Order {
    id: string;
    totalUsd: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
    shipment: OrderShipment | null;
}

interface WishlistItem {
    id: string;
    productId: string;
    product: {
        id: string;
        imageUrl: string | null;
        priceUsd: number;
        stockQty: number;
        translations?: { name: string }[];
        sku: string;
    };
}

interface RecentProduct {
    id: string;
    imageUrl: string | null;
    priceUsd: number;
    stockQty: number;
    name: string;
    sku: string;
}

interface Address {
    id: string;
    label: string | null;
    recipientName: string;
    phone: string;
    province: string;
    address: string;
    isDefault: boolean;
}

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    emailVerified: string | null;
    referralCode: string | null;
    referralCount?: number;
}

function getRecentlyViewed(): string[] {
    try {
        const raw = localStorage.getItem('recentlyViewed');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// ── Product Mini Card ─────────────────────────────────────────────────────────
function ProductMiniCard({
    id,
    imageUrl,
    name,
    priceUsd,
    stockQty,
    onRemove,
    removeLabel,
    addCartLabel,
}: {
    id: string;
    imageUrl: string | null;
    name: string;
    priceUsd: number;
    stockQty: number;
    onRemove?: (id: string) => void;
    removeLabel: string;
    addCartLabel: string;
}) {
    const formatUsd = (p: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
            <a href={`/products/${id}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Package className="w-8 h-8 text-gray-300" />
                    </div>
                )}
                {stockQty <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">품절</span>
                    </div>
                )}
            </a>
            <div className="p-3 flex flex-col flex-1">
                <a href={`/products/${id}`} className="text-[12px] font-bold text-gray-900 line-clamp-2 mb-2 hover:text-brand-primary transition-colors leading-tight flex-1">
                    {name}
                </a>
                <p className="font-black text-[#E52528] text-sm mb-2">{formatUsd(priceUsd)}</p>
                <div className="flex gap-1.5">
                    <button
                        className="flex-1 text-[11px] font-bold py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                        disabled={stockQty <= 0}
                    >
                        {addCartLabel}
                    </button>
                    {onRemove && (
                        <button
                            onClick={() => onRemove(id)}
                            className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title={removeLabel}
                        >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Address Form ──────────────────────────────────────────────────────────────
interface AddressFormData {
    label: string;
    recipientName: string;
    phone: string;
    province: string;
    address: string;
    isDefault: boolean;
}

function AddressForm({
    initial,
    onSave,
    onCancel,
}: {
    initial?: Partial<AddressFormData>;
    onSave: (data: AddressFormData) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<AddressFormData>({
        label: initial?.label || '',
        recipientName: initial?.recipientName || '',
        phone: initial?.phone || '',
        province: initial?.province || '',
        address: initial?.address || '',
        isDefault: initial?.isDefault || false,
    });

    const handle = (field: keyof AddressFormData, value: string | boolean) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const cambodianProvinces = [
        'Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kandal',
        'Kampong Speu', 'Kampong Chhnang', 'Kampong Thom', 'Kampot', 'Takeo',
        'Prey Veng', 'Svay Rieng', 'Pursat', 'Kratie', 'Stung Treng',
        'Mondulkiri', 'Ratanakiri', 'Preah Vihear', 'Koh Kong', 'Sihanoukville',
        'Kep', 'Pailin', 'Tboung Khmum', 'Oddar Meanchey',
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">라벨 (예: 집, 회사)</label>
                    <input
                        type="text"
                        placeholder="집"
                        value={form.label}
                        onChange={e => handle('label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">수령인 이름</label>
                    <input
                        type="text"
                        placeholder="이름"
                        value={form.recipientName}
                        onChange={e => handle('recipientName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">전화번호</label>
                    <input
                        type="tel"
                        placeholder="+855 XX XXX XXXX"
                        value={form.phone}
                        onChange={e => handle('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">주/도시</label>
                    <select
                        value={form.province}
                        onChange={e => handle('province', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary bg-white"
                    >
                        <option value="">선택하세요</option>
                        {cambodianProvinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">상세 주소</label>
                <input
                    type="text"
                    placeholder="Street, Village, Sangkat..."
                    value={form.address}
                    onChange={e => handle('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={e => handle('isDefault', e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                />
                <span className="text-sm font-medium text-gray-700">기본 주소로 설정</span>
            </label>
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onSave(form)}
                    className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Check className="w-4 h-4" /> 저장
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                >
                    <X className="w-4 h-4" /> 취소
                </button>
            </div>
        </div>
    );
}

export default function MyPage() {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<TabKey>('orders');

    // User profile
    const [user, setUser] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Orders
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Wishlist
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Recent
    const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    // Addresses
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressSaving, setAddressSaving] = useState(false);

    // Referral
    const [referralCopied, setReferralCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Email verification banner
    const [resendLoading, setResendLoading] = useState(false);
    const [resendDone, setResendDone] = useState(false);

    const handleResendVerification = async () => {
        if (!user?.email || resendLoading || resendDone) return;
        setResendLoading(true);
        await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email }),
        });
        setResendLoading(false);
        setResendDone(true);
        setTimeout(() => setResendDone(false), 30000);
    };

    // Fetch profile on mount
    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => {
                if (res.status === 401) { setIsLoggedIn(false); setProfileLoading(false); return null; }
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(data => {
                if (data) {
                    setUser(data);
                    setIsLoggedIn(true);
                }
                setProfileLoading(false);
            })
            .catch(() => {
                setIsLoggedIn(false);
                setProfileLoading(false);
            });
    }, []);

    // Fetch orders when tab active
    useEffect(() => {
        if (!isLoggedIn || activeTab !== 'orders') return;
        setOrdersLoading(true);
        fetch('/api/user/orders')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setOrders(data); })
            .catch(console.error)
            .finally(() => setOrdersLoading(false));
    }, [isLoggedIn, activeTab]);

    // Fetch wishlist when tab active
    const fetchWishlist = useCallback(() => {
        if (!isLoggedIn) return;
        setWishlistLoading(true);
        fetch('/api/user/wishlist')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setWishlist(data); })
            .catch(console.error)
            .finally(() => setWishlistLoading(false));
    }, [isLoggedIn]);

    useEffect(() => {
        if (activeTab === 'wishlist') fetchWishlist();
    }, [activeTab, fetchWishlist]);

    // Fetch recently viewed when tab active
    useEffect(() => {
        if (activeTab !== 'recent') return;
        const ids = getRecentlyViewed();
        if (ids.length === 0) { setRecentProducts([]); return; }
        setRecentLoading(true);
        fetch(`/api/user/recently-viewed?ids=${ids.join(',')}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setRecentProducts(data); })
            .catch(console.error)
            .finally(() => setRecentLoading(false));
    }, [activeTab]);

    // Fetch addresses when tab active
    const fetchAddresses = useCallback(() => {
        if (!isLoggedIn) return;
        setAddressesLoading(true);
        fetch('/api/user/addresses')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setAddresses(data); })
            .catch(console.error)
            .finally(() => setAddressesLoading(false));
    }, [isLoggedIn]);

    useEffect(() => {
        if (activeTab === 'addresses') fetchAddresses();
    }, [activeTab, fetchAddresses]);

    // Remove from wishlist
    const removeFromWishlist = async (productId: string) => {
        try {
            await fetch('/api/user/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            });
            setWishlist(prev => prev.filter(w => w.productId !== productId));
        } catch (e) {
            console.error(e);
        }
    };

    // Save address (create or update)
    const handleSaveAddress = async (data: { label: string; recipientName: string; phone: string; province: string; address: string; isDefault: boolean }) => {
        setAddressSaving(true);
        try {
            const method = editingAddress ? 'PUT' : 'POST';
            const body = editingAddress ? { id: editingAddress.id, ...data } : data;
            const res = await fetch('/api/user/addresses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setShowAddressForm(false);
                setEditingAddress(null);
                fetchAddresses();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddressSaving(false);
        }
    };

    // Delete address
    const handleDeleteAddress = async (id: string) => {
        if (!confirm('이 주소를 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/user/addresses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    // Copy referral code
    const copyReferralCode = () => {
        if (!user?.referralCode) return;
        navigator.clipboard.writeText(user.referralCode).then(() => {
            setReferralCopied(true);
            setTimeout(() => setReferralCopied(false), 2000);
        });
    };

    // Copy referral link
    const copyReferralLink = () => {
        if (!user?.referralCode) return;
        const link = `${window.location.origin}/signup?ref=${user.referralCode}`;
        navigator.clipboard.writeText(link).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    // Logout
    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.href = '/login';
    };

    const statusColors: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
        CONFIRMED: 'bg-cyan-50 text-cyan-600 border-cyan-200',
        SHIPPING: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        DELIVERED: 'bg-green-50 text-green-600 border-green-200',
        COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        CANCELLED: 'bg-red-50 text-red-600 border-red-200',
    };

    const statusLabels: Record<string, string> = {
        PENDING: t.mypage.orderStatus.pending,
        CONFIRMED: t.mypage.orderStatus.confirmed,
        SHIPPING: t.mypage.orderStatus.shipping,
        DELIVERED: t.mypage.orderStatus.delivered,
        COMPLETED: t.mypage.orderStatus.completed,
        CANCELLED: t.mypage.orderStatus.cancelled,
    };

    const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
        { key: 'orders', icon: Package, label: t.mypage.orders },
        { key: 'wishlist', icon: Heart, label: t.mypage.wishlist },
        { key: 'recent', icon: Clock, label: t.mypage.recentlyViewed },
        { key: 'addresses', icon: MapPin, label: (t.mypage as any).addresses || 'Addresses' },
        { key: 'referral', icon: Gift, label: (t.mypage as any).referral || 'Referral' },
    ];

    const formatUsd = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 px-4">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <h1 className="text-xl font-extrabold text-black">{t.mypage.loginRequired}</h1>
                <p className="text-gray-500 text-sm text-center font-medium max-w-xs">{t.mypage.loginDesc}</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <a
                        href="/login"
                        className="w-full text-center px-6 py-3.5 rounded-xl bg-brand-primary text-white font-bold text-base hover:bg-brand-primary/90 transition-colors shadow-sm"
                    >
                        {t.auth.loginButton}
                    </a>
                    <a
                        href="/signup"
                        className="w-full text-center px-6 py-3.5 rounded-xl bg-white border-2 border-brand-primary text-brand-primary font-bold text-base hover:bg-brand-primary/5 transition-colors"
                    >
                        {t.auth.signUp}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Email Verification Banner ───────────────────────────── */}
                {user && !user.emailVerified && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <Mail className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-800">
                                {t.auth.loginButton === '로그인'
                                    ? '이메일 인증이 필요합니다'
                                    : t.auth.loginButton === 'ចូល'
                                    ? 'សូមផ្ទៀងផ្ទាត់អ៊ីមែលរបស់អ្នក'
                                    : t.auth.loginButton === '登录'
                                    ? '请验证您的邮箱'
                                    : 'Please verify your email address'}
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                {t.auth.loginButton === '로그인'
                                    ? `인증 이메일이 ${user.email}로 발송되었습니다. 이메일을 확인해 주세요.`
                                    : t.auth.loginButton === 'ចូល'
                                    ? `អ៊ីមែលផ្ទៀងផ្ទាត់ត្រូវបានផ្ញើទៅ ${user.email}`
                                    : t.auth.loginButton === '登录'
                                    ? `验证邮件已发送至 ${user.email}`
                                    : `A verification email was sent to ${user.email}`}
                            </p>
                        </div>
                        <button
                            onClick={handleResendVerification}
                            disabled={resendLoading || resendDone}
                            className="flex-shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {resendLoading ? '...' : resendDone ? '✓ Sent' : 'Resend'}
                        </button>
                    </div>
                )}

                {/* Profile Header */}
                <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-inner">
                            <span className="text-white font-black text-2xl">
                                {(user?.name || user?.email || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-black tracking-tight">
                                {user?.name || 'Member'}
                            </h1>
                            <p className="text-gray-500 font-medium text-sm mt-0.5">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-bold bg-white shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.mypage.logout}</span>
                    </button>
                </div>

                {/* Order Status Summary (Quick Glance) */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'] as const).map((status) => {
                        const count = orders.filter((o) => o.status === status).length;
                        return (
                            <button
                                key={status}
                                onClick={() => setActiveTab('orders')}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-200 hover:border-brand-primary/50 hover:shadow-md transition-all shadow-sm"
                            >
                                <span className={`text-2xl font-black ${count > 0 ? (statusColors[status]?.split(' ')[1] ?? 'text-black') : 'text-gray-300'}`}>
                                    {count}
                                </span>
                                <span className="text-[12px] text-gray-600 font-bold text-center leading-tight">
                                    {statusLabels[status] || status}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <nav className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab.key
                                        ? 'border-brand-primary text-black bg-gray-50/50'
                                        : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-brand-primary' : ''}`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Tab Content */}
                    <div className="min-h-[300px] p-4 sm:p-6 bg-gray-50/30">

                        {/* ── Orders Tab ── */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4 animate-fade-in">
                                {ordersLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-16">
                                        <p className="text-gray-500 font-bold">{t.mypage.emptyOrders}</p>
                                    </div>
                                ) : (
                                    orders.map((order) => {
                                        const dateStr = new Date(order.createdAt).toLocaleDateString();
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/orders/${order.id}`}
                                                className="block p-5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white shadow-sm cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                                    <div>
                                                        <p className="text-sm font-extrabold text-black group-hover:text-brand-primary transition-colors">{order.id}</p>
                                                        <p className="text-xs text-gray-500 font-medium mt-1">{dateStr}</p>
                                                    </div>
                                                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${statusColors[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {statusLabels[order.status] || order.status}
                                                    </span>
                                                </div>

                                                {order.shipment && (
                                                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="w-4 h-4 text-blue-500" />
                                                            <span className="text-xs font-bold text-gray-700">{order.shipment.carrier}</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-blue-600 font-medium select-all">
                                                            {order.shipment.trackingNumber}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 font-bold">{order.items.reduce((acc, it) => acc + it.quantity, 0)} items</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-[#E52528] text-lg">{formatUsd(order.totalUsd)}</span>
                                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* ── Wishlist Tab ── */}
                        {activeTab === 'wishlist' && (
                            <div className="animate-fade-in">
                                {wishlistLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                                ) : wishlist.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                        <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-bold">{t.mypage.emptyWishlist}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {wishlist.map(item => {
                                            const product = item.product;
                                            const name = product.translations?.[0]?.name || product.sku;
                                            return (
                                                <ProductMiniCard
                                                    key={item.id}
                                                    id={product.id}
                                                    imageUrl={product.imageUrl}
                                                    name={name}
                                                    priceUsd={product.priceUsd}
                                                    stockQty={product.stockQty}
                                                    onRemove={() => removeFromWishlist(product.id)}
                                                    removeLabel="찜 해제"
                                                    addCartLabel="장바구니 담기"
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Recently Viewed Tab ── */}
                        {activeTab === 'recent' && (
                            <div className="animate-fade-in">
                                {recentLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                                ) : recentProducts.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-bold">{t.common.noResults}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {recentProducts.map(product => (
                                            <ProductMiniCard
                                                key={product.id}
                                                id={product.id}
                                                imageUrl={product.imageUrl}
                                                name={product.name}
                                                priceUsd={product.priceUsd}
                                                stockQty={product.stockQty}
                                                removeLabel=""
                                                addCartLabel="장바구니 담기"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Addresses Tab ── */}
                        {activeTab === 'addresses' && (
                            <div className="animate-fade-in space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-extrabold text-black text-base">주소록</h3>
                                    {!showAddressForm && (
                                        <button
                                            onClick={() => { setShowAddressForm(true); setEditingAddress(null); }}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            새 주소 추가
                                        </button>
                                    )}
                                </div>

                                {showAddressForm && !editingAddress && (
                                    <AddressForm
                                        onSave={handleSaveAddress}
                                        onCancel={() => setShowAddressForm(false)}
                                    />
                                )}

                                {addressesLoading ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                                ) : addresses.length === 0 && !showAddressForm ? (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                        <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-bold">저장된 주소가 없습니다</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {addresses.map(addr => (
                                            <div key={addr.id}>
                                                {editingAddress?.id === addr.id ? (
                                                    <AddressForm
                                                        initial={addr}
                                                        onSave={handleSaveAddress}
                                                        onCancel={() => setEditingAddress(null)}
                                                    />
                                                ) : (
                                                    <div className={`bg-white rounded-xl border p-4 shadow-sm ${addr.isDefault ? 'border-brand-primary/40' : 'border-gray-200'}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {addr.label && (
                                                                        <span className="text-xs font-extrabold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                            {addr.label}
                                                                        </span>
                                                                    )}
                                                                    {addr.isDefault && (
                                                                        <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                                                                            기본 주소
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-sm text-gray-900">{addr.recipientName}</p>
                                                                <p className="text-sm text-gray-600 font-medium">{addr.phone}</p>
                                                                <p className="text-sm text-gray-600 font-medium">{addr.province}</p>
                                                                <p className="text-sm text-gray-500">{addr.address}</p>
                                                            </div>
                                                            <div className="flex gap-1.5 ml-3">
                                                                <button
                                                                    onClick={() => { setEditingAddress(addr); setShowAddressForm(false); }}
                                                                    className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                                    title="수정"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                    title="삭제"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Referral Tab ── */}
                        {activeTab === 'referral' && (
                            <div className="animate-fade-in space-y-5">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-3">
                                        <UserPlus className="w-8 h-8 text-brand-primary" />
                                    </div>
                                    <h3 className="font-extrabold text-xl text-black mb-1">친구 초대</h3>
                                    <p className="text-gray-500 text-sm font-medium">
                                        친구에게 이 코드를 공유하면 가입시 보상 포인트를 받습니다
                                    </p>
                                </div>

                                {/* Referral Code Box */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">내 추천 코드</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-black text-xl text-brand-primary tracking-widest text-center select-all">
                                            {user?.referralCode || 'KK------'}
                                        </div>
                                        <button
                                            onClick={copyReferralCode}
                                            className="px-4 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            {referralCopied ? (
                                                <><Check className="w-4 h-4" /> 복사됨!</>
                                            ) : (
                                                <><Share2 className="w-4 h-4" /> 코드 복사</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Share Link */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">초대 링크</p>
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
                                        <span className="flex-1 text-xs text-gray-600 font-medium truncate">
                                            {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user?.referralCode || ''}` : '/signup?ref=...'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={copyReferralLink}
                                        className="w-full py-3 rounded-xl border-2 border-brand-primary text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        {linkCopied ? (
                                            <><Check className="w-4 h-4" /> 링크 복사됨!</>
                                        ) : (
                                            <><Share2 className="w-4 h-4" /> 링크 복사</>
                                        )}
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">초대 현황</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-brand-primary">{user?.referralCount ?? 0}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">초대한 친구</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                                    <p className="text-xs font-extrabold text-gray-700 mb-2">이용 방법</p>
                                    <ol className="space-y-1.5 text-xs text-gray-600 font-medium list-decimal list-inside">
                                        <li>위의 추천 코드 또는 링크를 친구에게 공유하세요</li>
                                        <li>친구가 코드로 가입하면 보너스 포인트를 받습니다</li>
                                        <li>친구의 첫 구매 시 추가 포인트 적립</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
