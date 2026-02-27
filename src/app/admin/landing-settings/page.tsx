'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getSiteSetting, updateSiteSetting } from '@/actions/settingActions';
import { Save, Image as ImageIcon, Type, Sparkles, Upload } from 'lucide-react';

// Inline defaults (hero/bento exports were removed during landing page redesign)
const defaultHeroKo = {
    topText: "100% 한국 정품 · 프놈펜 직배송",
    badge: "오늘의 특가",
    title: "K-뷰티의 진심,\n지금 바로 경험하세요",
};
const defaultBentoKo = {
    title: "한국인 추천 생활용품관",
    desc: "프놈펜 라이프를 한 단계 업그레이드할 필수 리빙 아이템",
};

export default function LandingSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Hero Section Settings State
    const [heroData, setHeroData] = useState({
        topTextParams: { text: defaultHeroKo.topText, fontSize: "1.125rem" },
        badgeParams: { text: defaultHeroKo.badge, fontSize: "0.875rem" },
        titleParams: { text: defaultHeroKo.title, fontSize: "3.75rem" },
        images: [
            { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", title: "Luminous Serum", label: "K-Premium" },
            { url: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=400" },
            { url: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500" }
        ]
    });

    // Bento Grid Section Settings State
    const [bentoData, setBentoData] = useState({
        sectionTitle: defaultBentoKo.title,
        sectionDesc: defaultBentoKo.desc,
        items: [
            { title: "오가닉 코튼 샤워 타월", desc: "부드럽고 빠른 흡수력", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800" },
            { title: "스마트 공기청정 미니", desc: "건기에도 탁월한 상쾌함", image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=600" },
            { title: "프리미엄 디퓨저", desc: "호텔 라운지의 향기", image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&q=80&w=500" },
            { title: "인체공학 숙면 베개", desc: "더운 밤에도 시원하게", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=600" },
        ]
    });

    // Load initial data from database
    useEffect(() => {
        async function loadSettings() {
            const dbHero = await getSiteSetting('landing_hero');
            const dbBento = await getSiteSetting('landing_bento');

            if (dbHero) {
                setHeroData(prev => ({
                    ...prev,
                    ...dbHero,
                    topTextParams: { ...prev.topTextParams, ...(dbHero.topTextParams || {}) },
                    badgeParams: { ...prev.badgeParams, ...(dbHero.badgeParams || {}) },
                    titleParams: { ...prev.titleParams, ...(dbHero.titleParams || {}) },
                    images: dbHero.images || prev.images
                }));
            }
            if (dbBento) {
                setBentoData(prev => ({
                    ...prev,
                    ...dbBento,
                    items: dbBento.items || prev.items
                }));
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsSaving(true);
        setMessage({ type: '', text: '이미지 업로드 중...' });

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                callback(data.url);
                setMessage({ type: 'success', text: '이미지가 성공적으로 업로드되었습니다.' });
            } else {
                setMessage({ type: 'error', text: '이미지 업로드에 실패했습니다.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '이미지 업로드 중 오류가 발생했습니다.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        const heroRes = await updateSiteSetting('landing_hero', heroData);
        const bentoRes = await updateSiteSetting('landing_bento', bentoData);

        if (heroRes.success && bentoRes.success) {
            setMessage({ type: 'success', text: '설정이 성공적으로 저장되었습니다. 메인 홈페이지에 즉시 반영됩니다.' });
        } else {
            setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
        }

        setIsSaving(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    if (isLoading) return <div className="p-10 text-center">설정 데이터를 불러오는 중...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">랜딩 페이지 설정</h1>
                            <p className="text-gray-500 text-sm mt-1">홈페이지 메인 카피 문구 및 이미지, 추천 상품관 이미지를 동적으로 변경합니다.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? '저장 중...' : '모든 설정 저장'}
                        </button>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* HERO SECTION SETTINGS */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Type className="w-5 h-5 text-purple-500" />
                            <h2 className="text-xl font-bold text-gray-900">메인 히어로 컨텐츠 설정 (최상단)</h2>
                        </div>

                        {/* Area A: Top Text (New) */}
                        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">A 영역</span> 최상단 안내 텍스트
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs text-gray-500 mb-1">표시 텍스트</label>
                                    <input
                                        type="text"
                                        value={heroData.topTextParams?.text || ''}
                                        onChange={(e) => setHeroData({ ...heroData, topTextParams: { ...heroData.topTextParams, text: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="예: 이제는 좋은 상품을 구할 수 있습니다."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">폰트 사이즈</label>
                                    <input
                                        type="text"
                                        value={heroData.topTextParams?.fontSize || ''}
                                        onChange={(e) => setHeroData({ ...heroData, topTextParams: { ...heroData.topTextParams, fontSize: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="예: 1.125rem (또는 18px)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Badge Area */}
                        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">배지 영역</span> 반짝이는 배지 문구
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs text-gray-500 mb-1">표시 텍스트</label>
                                    <input
                                        type="text"
                                        value={heroData.badgeParams.text}
                                        onChange={(e) => setHeroData({ ...heroData, badgeParams: { ...heroData.badgeParams, text: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="예: 이제는 믿을 수 있는곳"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">폰트 사이즈</label>
                                    <input
                                        type="text"
                                        value={heroData.badgeParams.fontSize}
                                        onChange={(e) => setHeroData({ ...heroData, badgeParams: { ...heroData.badgeParams, fontSize: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="예: 0.875rem"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Area B: Main Title */}
                        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">B 영역</span> 메인 대형 타이틀
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs text-gray-500 mb-1">표시 텍스트 (줄바꿈 허용)</label>
                                    <textarea
                                        rows={2}
                                        value={heroData.titleParams.text}
                                        onChange={(e) => setHeroData({ ...heroData, titleParams: { ...heroData.titleParams, text: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="줄바꿈이 필요한 곳에 엔터를 치세요."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">폰트 사이즈</label>
                                    <input
                                        type="text"
                                        value={heroData.titleParams.fontSize}
                                        onChange={(e) => setHeroData({ ...heroData, titleParams: { ...heroData.titleParams, fontSize: e.target.value } })}
                                        className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                        placeholder="예: 3.75rem (또는 60px)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Area C: Hero Images */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">C 영역</span> 우측 메인 상품 이미지 3장
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {/* Image 1 (Main Big Float) */}
                                <div className="p-4 border border-gray-200 rounded-lg flex gap-4 bg-gray-50 items-center">
                                    <img src={heroData.images?.[0]?.url || ''} className="w-20 h-24 object-cover rounded shadow" alt="Preview 1" />
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">이미지 1 URL (직접 입력 또는 파일 업로드)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text" value={heroData.images?.[0]?.url || ''}
                                                    onChange={(e) => {
                                                        const newImgs = [...(heroData.images || [])];
                                                        if (!newImgs[0]) newImgs[0] = { url: '' };
                                                        newImgs[0].url = e.target.value;
                                                        setHeroData({ ...heroData, images: newImgs });
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded p-2 flex items-center justify-center min-w-[40px]">
                                                    <Upload className="w-4 h-4 text-gray-600" />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url: string) => {
                                                        const newImgs = [...(heroData.images || [])];
                                                        if (!newImgs[0]) newImgs[0] = { url: '' };
                                                        newImgs[0].url = url;
                                                        setHeroData({ ...heroData, images: newImgs });
                                                    })} />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">라벨 1 (예: 상품명)</label>
                                                <input
                                                    type="text" value={heroData.images?.[0]?.title || ''}
                                                    onChange={(e) => {
                                                        const newImgs = [...(heroData.images || [])];
                                                        if (!newImgs[0]) newImgs[0] = { url: '' };
                                                        newImgs[0].title = e.target.value;
                                                        setHeroData({ ...heroData, images: newImgs });
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">라벨 2 (예: 브랜드/카테고리)</label>
                                                <input
                                                    type="text" value={heroData.images?.[0]?.label || ''}
                                                    onChange={(e) => {
                                                        const newImgs = [...(heroData.images || [])];
                                                        if (!newImgs[0]) newImgs[0] = { url: '' };
                                                        newImgs[0].label = e.target.value;
                                                        setHeroData({ ...heroData, images: newImgs });
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image 2 (Small Float Top) */}
                                <div className="p-4 border border-gray-200 rounded-lg flex gap-4 bg-gray-50 items-center">
                                    <img src={heroData.images?.[1]?.url || ''} className="w-16 h-16 object-cover rounded-full shadow" alt="Preview 2" />
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">이미지 2 URL (동그란 작은 부유 이미지)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text" value={heroData.images?.[1]?.url || ''}
                                                onChange={(e) => {
                                                    const newImgs = [...(heroData.images || [])];
                                                    if (!newImgs[1]) newImgs[1] = { url: '' };
                                                    newImgs[1].url = e.target.value;
                                                    setHeroData({ ...heroData, images: newImgs });
                                                }}
                                                className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded p-2 flex items-center justify-center min-w-[40px]">
                                                <Upload className="w-4 h-4 text-gray-600" />
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url: string) => {
                                                    const newImgs = [...(heroData.images || [])];
                                                    if (!newImgs[1]) newImgs[1] = { url: '' };
                                                    newImgs[1].url = url;
                                                    setHeroData({ ...heroData, images: newImgs });
                                                })} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Image 3 (Medium Float Bottom) */}
                                <div className="p-4 border border-gray-200 rounded-lg flex gap-4 bg-gray-50 items-center">
                                    <img src={heroData.images?.[2]?.url || ''} className="w-20 h-16 object-cover rounded shadow" alt="Preview 3" />
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">이미지 3 URL (하단 상품 이미지)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text" value={heroData.images?.[2]?.url || ''}
                                                onChange={(e) => {
                                                    const newImgs = [...(heroData.images || [])];
                                                    if (!newImgs[2]) newImgs[2] = { url: '' };
                                                    newImgs[2].url = e.target.value;
                                                    setHeroData({ ...heroData, images: newImgs });
                                                }}
                                                className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded p-2 flex items-center justify-center min-w-[40px]">
                                                <Upload className="w-4 h-4 text-gray-600" />
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url: string) => {
                                                    const newImgs = [...(heroData.images || [])];
                                                    if (!newImgs[2]) newImgs[2] = { url: '' };
                                                    newImgs[2].url = url;
                                                    setHeroData({ ...heroData, images: newImgs });
                                                })} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* BENTO GRID SETTINGS */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                        <div className="flex items-center gap-2 border-b pb-4">
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-gray-900">한국인 추천 생활용품관 (하단 그리드 영역)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">섹션 메인 타이틀</label>
                                <input
                                    type="text"
                                    value={bentoData.sectionTitle}
                                    onChange={(e) => setBentoData({ ...bentoData, sectionTitle: e.target.value })}
                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">섹션 설명 (서브 타이틀)</label>
                                <input
                                    type="text"
                                    value={bentoData.sectionDesc}
                                    onChange={(e) => setBentoData({ ...bentoData, sectionDesc: e.target.value })}
                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md p-2.5 border text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bentoData.items.map((item, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <div className="h-32 w-full bg-gray-200 relative">
                                        <img src={item.image} className="w-full h-full object-cover" alt={`Bento ${idx}`} />
                                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold">
                                            {idx === 0 ? '가장 큰 배너' : `추천상품 ${idx + 1}`}
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">이미지 URL 변경 (직접 입력 또는 파일 업로드)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.image}
                                                    onChange={(e) => {
                                                        const newItems = [...bentoData.items];
                                                        if (newItems[idx]) {
                                                            newItems[idx].image = e.target.value;
                                                            setBentoData({ ...bentoData, items: newItems });
                                                        }
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-xs focus:ring-2 focus:ring-blue-500"
                                                />
                                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded p-2 flex items-center justify-center min-w-[36px]">
                                                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url: string) => {
                                                        const newItems = [...bentoData.items];
                                                        if (newItems[idx]) {
                                                            newItems[idx].image = url;
                                                            setBentoData({ ...bentoData, items: newItems });
                                                        }
                                                    })} />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">화면 제목</label>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => {
                                                        const newItems = [...bentoData.items];
                                                        if (newItems[idx]) {
                                                            newItems[idx].title = e.target.value;
                                                            setBentoData({ ...bentoData, items: newItems });
                                                        }
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">짧은 설명</label>
                                                <input
                                                    type="text"
                                                    value={item.desc}
                                                    onChange={(e) => {
                                                        const newItems = [...bentoData.items];
                                                        if (newItems[idx]) {
                                                            newItems[idx].desc = e.target.value;
                                                            setBentoData({ ...bentoData, items: newItems });
                                                        }
                                                    }}
                                                    className="w-full border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded p-2 border text-xs focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
