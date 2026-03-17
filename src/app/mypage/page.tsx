'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Heart, Clock, LogOut, ChevronRight, ShoppingBag, Loader2, Truck, MapPin, Gift, UserPlus, Share2, Plus, Pencil, Trash2, Check, X, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from '@/i18n/useTranslations';
import { useCartStore } from '@/store/useCartStore';
import Footer from '@/components/Footer';
import type { Translations } from '@/i18n';

type TabKey = 'orders' | 'wishlist' | 'recent' | 'addresses' | 'referral' | 'password';

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
    t,
}: {
    id: string;
    imageUrl: string | null;
    name: string;
    priceUsd: number;
    stockQty: number;
    onRemove?: (id: string) => void;
    t: Translations;
}) {
    const formatUsd = (p: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (stockQty <= 0) return;
        addItem({ productId: id, name, priceUsd, imageUrl: imageUrl || '' }, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

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
                        <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">{t.mypage.soldOutLabel}</span>
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
                        onClick={handleAddToCart}
                        className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            added ? 'bg-green-500 text-white' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white'
                        }`}
                        disabled={stockQty <= 0}
                    >
                        {added ? '✓' : t.mypage.addToCart}
                    </button>
                    {onRemove && (
                        <button
                            onClick={() => onRemove(id)}
                            className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title={t.mypage.removeWishlist}
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
    const t = useTranslations();
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
                    <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.addressLabel}</label>
                    <input
                        type="text"
                        placeholder={t.mypage.addressLabelPlaceholder}
                        value={form.label}
                        onChange={e => handle('label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.recipientName}</label>
                    <input
                        type="text"
                        placeholder={t.mypage.namePlaceholder}
                        value={form.recipientName}
                        onChange={e => handle('recipientName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.phoneNumber}</label>
                    <input
                        type="tel"
                        placeholder="+855 XX XXX XXXX"
                        value={form.phone}
                        onChange={e => handle('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.province}</label>
                    <select
                        value={form.province}
                        onChange={e => handle('province', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-primary bg-white"
                    >
                        <option value="">{t.mypage.selectProvince}</option>
                        {cambodianProvinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.detailAddress}</label>
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
                <span className="text-sm font-medium text-gray-700">{t.mypage.setAsDefault}</span>
            </label>
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onSave(form)}
                    className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Check className="w-4 h-4" /> {t.common.save}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                >
                    <X className="w-4 h-4" /> {t.common.cancel}
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
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
    // Return request
    const [returnConfirmId, setReturnConfirmId] = useState<string | null>(null);
    const [returnReason, setReturnReason] = useState('');
    const [returningOrderId, setReturningOrderId] = useState<string | null>(null);

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

    // Change Password
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);

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

    // Cancel order handler
    const handleCancelOrder = async (orderId: string) => {
        setCancellingOrderId(orderId);
        try {
            const res = await fetch(`/api/user/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update order status locally
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
                setCancelConfirmId(null);
            } else {
                alert(data.error || '주문 취소 중 오류가 발생했습니다.');
            }
        } catch (e) {
            alert('주문 취소 중 오류가 발생했습니다.');
        } finally {
            setCancellingOrderId(null);
        }
    };

    const handleReturnRequest = async (orderId: string) => {
        if (returnReason.trim().length < 10) {
            alert('반품 사유를 10자 이상 입력해 주세요.');
            return;
        }
        setReturningOrderId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: returnReason.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'RETURN_REQUESTED' } : o));
                setReturnConfirmId(null);
                setReturnReason('');
                alert('반품 요청이 접수되었습니다. 1~3 영업일 내에 처리됩니다.');
            } else {
                alert(data.error || '반품 요청 중 오류가 발생했습니다.');
            }
        } catch {
            alert('반품 요청 중 오류가 발생했습니다.');
        } finally {
            setReturningOrderId(null);
        }
    };

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
        if (!confirm(t.mypage.deleteAddressConfirm)) return;
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

    // Change password
    const handleChangePassword = async () => {
        setPwError('');
        if (pwForm.next.length < 8) { setPwError(t.mypage.passwordMinLength); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError(t.mypage.passwordMismatch); return; }
        setPwLoading(true);
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === 'wrong_password') setPwError(t.mypage.passwordWrong);
                else if (data.error === 'no_password') setPwError(t.mypage.passwordNoAccount);
                else setPwError(t.common.error);
            } else {
                setPwSuccess(true);
                setPwForm({ current: '', next: '', confirm: '' });
                setTimeout(() => setPwSuccess(false), 4000);
            }
        } catch {
            setPwError(t.common.error);
        } finally {
            setPwLoading(false);
        }
    };

    // Logout
    const handleLogout = () => {
        signOut({ callbackUrl: window.location.origin + '/' });
    };

    const statusColors: Record<string, string> = {
        PENDING:          'bg-amber-50 text-amber-600 border-amber-200',
        CONFIRMED:        'bg-cyan-50 text-cyan-600 border-cyan-200',
        SHIPPING:         'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        DELIVERED:        'bg-green-50 text-green-600 border-green-200',
        COMPLETED:        'bg-emerald-50 text-emerald-600 border-emerald-200',
        CANCELLED:        'bg-red-50 text-red-600 border-red-200',
        RETURN_REQUESTED: 'bg-orange-50 text-orange-600 border-orange-200',
    };

    const statusLabels: Record<string, string> = {
        PENDING:          t.mypage.orderStatus.pending,
        CONFIRMED:        t.mypage.orderStatus.confirmed,
        SHIPPING:         t.mypage.orderStatus.shipping,
        DELIVERED:        t.mypage.orderStatus.delivered,
        COMPLETED:        t.mypage.orderStatus.completed,
        CANCELLED:        t.mypage.orderStatus.cancelled,
        RETURN_REQUESTED: '반품 요청 중',
    };

    const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
        { key: 'orders', icon: Package, label: t.mypage.orders },
        { key: 'wishlist', icon: Heart, label: t.mypage.wishlist },
        { key: 'recent', icon: Clock, label: t.mypage.recentlyViewed },
        { key: 'addresses', icon: MapPin, label: t.mypage.addresses },
        { key: 'referral', icon: Gift, label: t.mypage.referral },
        { key: 'password', icon: KeyRound, label: t.mypage.changePassword },
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
                                {t.mypage.emailVerifyTitle || 'Please verify your email address'}
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                {(t.mypage.emailVerifyDesc || 'A verification email was sent to {email}. Please check your inbox.').replace('{email}', user.email)}
                            </p>
                        </div>
                        <button
                            onClick={handleResendVerification}
                            disabled={resendLoading || resendDone}
                            className="flex-shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {resendLoading ? '...' : resendDone ? '✓' : (t.mypage.emailVerifyResend || 'Resend')}
                        </button>
                    </div>
                )}


                {/* Profile Header */}
                <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-inner">
                            <span className="text-white font-black text-2xl">
                                {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
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
                                            <div key={order.id}>
                                            <Link
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
                                                    <span className="text-sm text-gray-600 font-bold">{t.mypage.orderItems.replace('{n}', String(order.items.reduce((acc, it) => acc + it.quantity, 0)))}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-[#E52528] text-lg">{formatUsd(order.totalUsd)}</span>
                                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Cancel button — PENDING orders only */}
                                            {order.status === 'PENDING' && (
                                                <div className="mt-1.5">
                                                    {cancelConfirmId === order.id ? (
                                                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                                            <span className="text-xs text-red-600 font-semibold flex-1">주문을 취소하시겠습니까?</span>
                                                            <button
                                                                onClick={() => handleCancelOrder(order.id)}
                                                                disabled={cancellingOrderId === order.id}
                                                                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
                                                            >
                                                                {cancellingOrderId === order.id ? '취소 중...' : '확인'}
                                                            </button>
                                                            <button
                                                                onClick={() => setCancelConfirmId(null)}
                                                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
                                                            >
                                                                닫기
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setCancelConfirmId(order.id); }}
                                                            className="w-full text-xs text-red-400 hover:text-red-600 font-semibold py-1.5 border border-red-100 hover:border-red-300 rounded-xl transition-colors hover:bg-red-50"
                                                        >
                                                            주문 취소
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Return button — DELIVERED orders only */}
                                            {order.status === 'DELIVERED' && (
                                                <div className="mt-1.5">
                                                    {returnConfirmId === order.id ? (
                                                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-3 space-y-2">
                                                            <p className="text-xs text-orange-700 font-semibold">반품 사유를 입력해 주세요 (최소 10자)</p>
                                                            <textarea
                                                                value={returnReason}
                                                                onChange={(e) => setReturnReason(e.target.value)}
                                                                placeholder="반품 사유를 상세히 입력해 주세요..."
                                                                rows={3}
                                                                className="w-full text-xs border border-orange-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleReturnRequest(order.id)}
                                                                    disabled={returningOrderId === order.id || returnReason.trim().length < 10}
                                                                    className="flex-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50"
                                                                >
                                                                    {returningOrderId === order.id ? '처리 중...' : '반품 신청'}
                                                                </button>
                                                                <button
                                                                    onClick={() => { setReturnConfirmId(null); setReturnReason(''); }}
                                                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
                                                                >
                                                                    닫기
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setReturnConfirmId(order.id); setReturnReason(''); }}
                                                            className="w-full text-xs text-orange-400 hover:text-orange-600 font-semibold py-1.5 border border-orange-100 hover:border-orange-300 rounded-xl transition-colors hover:bg-orange-50"
                                                        >
                                                            반품 요청
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Return in progress badge */}
                                            {order.status === 'RETURN_REQUESTED' && (
                                                <div className="mt-1.5 text-center text-xs text-orange-500 font-semibold py-1.5 border border-orange-100 rounded-xl bg-orange-50">
                                                    ⏳ 반품 처리 중 (1~3 영업일 소요)
                                                </div>
                                            )}
                                            </div>
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
                                                    t={t}
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
                                                t={t}
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
                                    <h3 className="font-extrabold text-black text-base">{t.mypage.addressBook}</h3>
                                    {!showAddressForm && (
                                        <button
                                            onClick={() => { setShowAddressForm(true); setEditingAddress(null); }}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t.mypage.addNewAddress}
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
                                        <p className="text-gray-500 font-bold">{t.mypage.noAddresses}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {addresses.map(addr => (
                                            <div key={addr.id}>
                                                {editingAddress?.id === addr.id ? (
                                                    <AddressForm
                                                        initial={addr as any}
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
                                                                            {t.mypage.defaultAddress}
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
                                                                    title={t.common.edit}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                    title={t.common.delete}
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
                                    <h3 className="font-extrabold text-xl text-black mb-1">{t.mypage.referralTitle}</h3>
                                    <p className="text-gray-500 text-sm font-medium">
                                        {t.mypage.referralDesc}
                                    </p>
                                </div>

                                {/* Referral Code Box */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.mypage.myReferralCode}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-black text-xl text-brand-primary tracking-widest text-center select-all">
                                            {user?.referralCode || 'KK------'}
                                        </div>
                                        <button
                                            onClick={copyReferralCode}
                                            className="px-4 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            {referralCopied ? (
                                                <><Check className="w-4 h-4" /> {t.mypage.codeCopied}</>
                                            ) : (
                                                <><Share2 className="w-4 h-4" /> {t.mypage.copyCode}</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Share Link */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.mypage.inviteLink}</p>
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
                                            <><Check className="w-4 h-4" /> {t.mypage.linkCopied}</>
                                        ) : (
                                            <><Share2 className="w-4 h-4" /> {t.mypage.copyLink}</>
                                        )}
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.mypage.inviteStats}</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-brand-primary">{user?.referralCount ?? 0}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">{t.mypage.invitedFriends}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                                    <p className="text-xs font-extrabold text-gray-700 mb-2">{t.mypage.howToUse}</p>
                                    <ol className="space-y-1.5 text-xs text-gray-600 font-medium list-decimal list-inside">
                                        <li>{t.mypage.referralStep1}</li>
                                        <li>{t.mypage.referralStep2}</li>
                                        <li>{t.mypage.referralStep3}</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                        {/* ── Change Password Tab ── */}
                        {activeTab === 'password' && (
                            <div className="animate-fade-in max-w-md mx-auto space-y-5">
                                <div className="text-center mb-2">
                                    <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-3">
                                        <KeyRound className="w-8 h-8 text-brand-primary" />
                                    </div>
                                    <h3 className="font-extrabold text-xl text-black">{t.mypage.changePassword}</h3>
                                </div>

                                {pwSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold">
                                        <Check className="w-4 h-4 flex-shrink-0" />
                                        {t.mypage.passwordChanged}
                                    </div>
                                )}

                                {pwError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                                        {pwError}
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                                    {/* Current Password */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.currentPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={pwShow.current ? 'text' : 'password'}
                                                value={pwForm.current}
                                                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPwShow(p => ({ ...p, current: !p.current }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {pwShow.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.newPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={pwShow.next ? 'text' : 'password'}
                                                value={pwForm.next}
                                                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPwShow(p => ({ ...p, next: !p.next }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {pwShow.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {pwForm.next.length > 0 && pwForm.next.length < 8 && (
                                            <p className="text-xs text-orange-500 mt-1">{t.mypage.passwordMinLength}</p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 block mb-1">{t.mypage.confirmPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={pwShow.confirm ? 'text' : 'password'}
                                                value={pwForm.confirm}
                                                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPwShow(p => ({ ...p, confirm: !p.confirm }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {pwShow.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && (
                                            <p className="text-xs text-red-500 mt-1">{t.mypage.passwordMismatch}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleChangePassword}
                                        disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                                        className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {pwLoading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {t.mypage.passwordChanging}</>
                                        ) : (
                                            <><KeyRound className="w-4 h-4" /> {t.mypage.changePassword}</>
                                        )}
                                    </button>
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
