'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Tag, Loader2, RefreshCw, Edit3, Save, X } from 'lucide-react';

interface Category {
    id: string; slug: string; nameKo: string; nameEn: string;
    nameKm: string; nameZh: string; sortOrder: number;
    isSystem: boolean; productCount: number;
}

export default function CategoriesPage() {
    const [cats, setCats] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Category>>({});
    const [saving, setSaving] = useState(false);

    const fetch_ = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        setCats(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    const [isAdding, setIsAdding] = useState(false);
    const [newForm, setNewForm] = useState<Partial<Category>>({
        slug: '', nameKo: '', nameEn: '', nameKm: '', nameZh: '', sortOrder: 0
    });
    const [addingError, setAddingError] = useState('');

    useEffect(() => { fetch_(); }, [fetch_]);

    const startEdit = (c: Category) => {
        setEditing(c.id);
        setEditForm({ nameKo: c.nameKo, nameEn: c.nameEn, nameKm: c.nameKm, nameZh: c.nameZh, sortOrder: c.sortOrder });
    };

    const save = async (id: string) => {
        setSaving(true);
        await fetch(`/api/admin/categories?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setSaving(false);
        setEditing(null);
        fetch_();
    };

    const handleAdd = async () => {
        setAddingError('');
        setSaving(true);
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newForm),
        });
        const data = await res.json();
        setSaving(false);

        if (!res.ok) {
            setAddingError(data.error || '생성 실패');
            return;
        }

        setIsAdding(false);
        setNewForm({ slug: '', nameKo: '', nameEn: '', nameKm: '', nameZh: '', sortOrder: 0 });
        fetch_();
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-500" /> 카테고리 관리
                </h1>
                <div className="flex gap-2">
                    <button onClick={fetch_} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
                        + 새 카테고리 추가
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-5">새로운 카테고리를 만들거나 기존 카테고리 이름(4개국어)과 정렬 순서를 수정할 수 있습니다. ✦ 표시는 삭제/슬러그 수정 불가능한 시스템 카테고리입니다.</p>

            {addingError && <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{addingError}</div>}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                                <th className="py-3 px-4">Slug</th>
                                <th className="py-3 px-4">🇰🇷 한국어</th>
                                <th className="py-3 px-4 hidden md:table-cell">🇺🇸 English</th>
                                <th className="py-3 px-4 hidden lg:table-cell">🇨🇳 中文</th>
                                <th className="py-3 px-4">정렬</th>
                                <th className="py-3 px-4">상품수</th>
                                <th className="py-3 px-4 text-right">편집</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {/* New Category Form Row */}
                            {isAdding && (
                                <tr className="bg-green-50/50">
                                    <td className="py-3 px-4">
                                        <input placeholder="slug-name" value={newForm.slug || ''} onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                            className="w-full border border-green-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 font-mono" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input placeholder="한국어 이름" value={newForm.nameKo || ''} onChange={e => setNewForm(p => ({ ...p, nameKo: e.target.value }))}
                                            className="w-full border border-green-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                                    </td>
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        <input placeholder="English Name" value={newForm.nameEn || ''} onChange={e => setNewForm(p => ({ ...p, nameEn: e.target.value }))}
                                            className="w-full border border-green-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                                    </td>
                                    <td className="py-3 px-4 hidden lg:table-cell">
                                        <input placeholder="ភាសាខ្មែរ (Khmer) / 中文" value={newForm.nameZh || ''} onChange={e => setNewForm(p => ({ ...p, nameZh: e.target.value, nameKm: e.target.value /* Fallback/merge for simplicity in UI if needed, but better to keep separate if they want full control */ }))}
                                            className="w-full border border-green-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input type="number" placeholder="0" value={newForm.sortOrder} onChange={e => setNewForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                                            className="w-16 border border-green-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-bold text-gray-400">0</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={handleAdd} disabled={saving}
                                                className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={() => setIsAdding(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {cats.map(c => {
                                const isEdit = editing === c.id;
                                return (
                                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isEdit ? 'bg-blue-50' : ''}`}>
                                        <td className="py-3 px-4">
                                            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                {c.slug}{c.isSystem ? ' ✦' : ''}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {isEdit ? (
                                                <input value={editForm.nameKo || ''} onChange={e => setEditForm(p => ({ ...p, nameKo: e.target.value }))}
                                                    className="w-full border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                            ) : <span className="text-sm font-medium text-gray-900">{c.nameKo}</span>}
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            {isEdit ? (
                                                <input value={editForm.nameEn || ''} onChange={e => setEditForm(p => ({ ...p, nameEn: e.target.value }))}
                                                    className="w-full border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                            ) : <span className="text-sm text-gray-600">{c.nameEn}</span>}
                                        </td>
                                        <td className="py-3 px-4 hidden lg:table-cell">
                                            {isEdit ? (
                                                <input value={editForm.nameZh || ''} onChange={e => setEditForm(p => ({ ...p, nameZh: e.target.value }))}
                                                    className="w-full border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                            ) : <span className="text-sm text-gray-600">{c.nameZh}</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            {isEdit ? (
                                                <input type="number" value={editForm.sortOrder ?? c.sortOrder} onChange={e => setEditForm(p => ({ ...p, sortOrder: parseInt(e.target.value) }))}
                                                    className="w-16 border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                            ) : <span className="text-sm text-gray-600">{c.sortOrder}</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-bold text-gray-700">{c.productCount ?? 0}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {isEdit ? (
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => save(c.id)} disabled={saving}
                                                        className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => setEditing(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
