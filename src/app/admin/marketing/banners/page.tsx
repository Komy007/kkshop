'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Image, MoveUp, MoveDown, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl: string;
    linkText: string;
    bgColor: string;
    active: boolean;
    order: number;
}

const DEFAULT_BANNER = (): Banner => ({
    id:       crypto.randomUUID(),
    title:    '',
    subtitle: '',
    imageUrl: '',
    linkUrl:  '',
    linkText: 'Shop Now',
    bgColor:  '#1e293b',
    active:   true,
    order:    0,
});

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [saving,  setSaving]  = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings?keys=homepage_banners')
            .then(r => r.json())
            .then(data => {
                if (data.homepage_banners) {
                    const parsed = JSON.parse(data.homepage_banners);
                    setBanners(Array.isArray(parsed) ? parsed : []);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'homepage_banners', value: JSON.stringify(banners) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const addBanner = () => {
        setBanners(bs => [...bs, { ...DEFAULT_BANNER(), order: bs.length }]);
    };

    const updateBanner = (id: string, patch: Partial<Banner>) => {
        setBanners(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
    };

    const removeBanner = (id: string) => {
        setBanners(bs => bs.filter(b => b.id !== id));
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        setBanners(bs => {
            const copy = [...bs];
            const a = copy[idx - 1];
            const b = copy[idx];
            if (!a || !b) return bs;
            copy[idx - 1] = b;
            copy[idx] = a;
            return copy;
        });
    };

    const moveDown = (idx: number) => {
        setBanners(bs => {
            if (idx >= bs.length - 1) return bs;
            const copy = [...bs];
            const a = copy[idx];
            const b = copy[idx + 1];
            if (!a || !b) return bs;
            copy[idx] = b;
            copy[idx + 1] = a;
            return copy;
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banners &amp; Ads</h1>
                    <p className="text-sm text-gray-500 mt-0.5">홈페이지 배너 / 광고 관리</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={addBanner}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Banner
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                Banners are shown on the homepage hero section. Use GCS image URLs or external HTTPS links. Recommended size: <strong>1200 × 500 px</strong>.
            </div>

            {/* Banner List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 text-sm">Loading...</div>
            ) : banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Image className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No banners yet. Click &quot;Add Banner&quot; to create one.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {banners.map((banner, idx) => (
                        <div key={banner.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${banner.active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                            {/* Banner header */}
                            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                                <div
                                    className="w-8 h-8 rounded-lg flex-shrink-0 border border-slate-200"
                                    style={{ backgroundColor: banner.bgColor }}
                                />
                                <span className="text-sm font-semibold text-slate-700 flex-1 truncate">
                                    {banner.title || `Banner ${idx + 1}`}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all">
                                        <MoveUp className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                    <button onClick={() => moveDown(idx)} disabled={idx === banners.length - 1} className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-all">
                                        <MoveDown className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                    <button onClick={() => updateBanner(banner.id, { active: !banner.active })} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                                        {banner.active ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                    <button onClick={() => removeBanner(banner.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Banner preview */}
                            {banner.imageUrl && (
                                <div className="relative h-28 overflow-hidden" style={{ backgroundColor: banner.bgColor }}>
                                    <img src={banner.imageUrl} alt="preview" className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
                                        <div className="text-lg font-bold drop-shadow">{banner.title}</div>
                                        <div className="text-sm opacity-80 drop-shadow">{banner.subtitle}</div>
                                    </div>
                                </div>
                            )}

                            {/* Fields */}
                            <div className="p-5 grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={banner.title}
                                        onChange={e => updateBanner(banner.id, { title: e.target.value })}
                                        placeholder="e.g. Summer K-Beauty Sale"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subtitle</label>
                                    <input
                                        type="text"
                                        value={banner.subtitle}
                                        onChange={e => updateBanner(banner.id, { subtitle: e.target.value })}
                                        placeholder="e.g. Up to 40% OFF on selected items"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Image URL</label>
                                    <input
                                        type="url"
                                        value={banner.imageUrl}
                                        onChange={e => updateBanner(banner.id, { imageUrl: e.target.value })}
                                        placeholder="https://storage.googleapis.com/kkshop/banner.jpg"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Link URL</label>
                                    <input
                                        type="url"
                                        value={banner.linkUrl}
                                        onChange={e => updateBanner(banner.id, { linkUrl: e.target.value })}
                                        placeholder="/products?tag=sale"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Button Text</label>
                                    <input
                                        type="text"
                                        value={banner.linkText}
                                        onChange={e => updateBanner(banner.id, { linkText: e.target.value })}
                                        placeholder="Shop Now"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={banner.bgColor}
                                            onChange={e => updateBanner(banner.id, { bgColor: e.target.value })}
                                            className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={banner.bgColor}
                                            onChange={e => updateBanner(banner.id, { bgColor: e.target.value })}
                                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={banner.active}
                                            onChange={e => updateBanner(banner.id, { active: e.target.checked })}
                                            className="w-4 h-4 rounded"
                                        />
                                        <span className="text-sm text-slate-700">Active (visible on site)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
