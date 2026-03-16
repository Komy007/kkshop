'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Tag, Loader2, RefreshCw, Edit3, Save, X,
    Plus, ChevronDown, ChevronRight, FolderOpen, Folder, Trash2, AlertTriangle,
} from 'lucide-react';
import TaegukgiIcon from '@/components/TaegukgiIcon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
    id: string; slug: string; nameKo: string; nameEn: string;
    nameKm: string; nameZh: string; sortOrder: number;
    isSystem: boolean; productCount: number; parentId?: string | null;
    children?: Category[];
}

interface NewForm {
    slug: string; nameKo: string; nameEn: string;
    nameKm: string; nameZh: string; sortOrder: number; parentId: string;
}

interface EditForm {
    nameKo?: string; nameEn?: string; nameKm?: string; nameZh?: string; sortOrder?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inp = "w-full border border-gray-200 rounded-lg py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
const EMPTY_FORM: NewForm = { slug: '', nameKo: '', nameEn: '', nameKm: '', nameZh: '', sortOrder: 0, parentId: '' };

function buildTree(flat: Category[]): Category[] {
    const map: Record<string, Category> = {};
    const roots: Category[] = [];
    flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
    flat.forEach(c => {
        if (c.parentId && map[c.parentId]) {
            map[c.parentId]!.children!.push(map[c.id]!);
        } else {
            roots.push(map[c.id]!);
        }
    });
    return roots;
}

// ─── Inline Add-Form Row (OUTSIDE parent — prevents remount on every keystroke) ──
interface AddFormRowProps {
    depth: number;
    parentName?: string;
    newForm: NewForm;
    setNewForm: React.Dispatch<React.SetStateAction<NewForm>>;
    addError: string;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}

function AddFormRow({ depth, parentName, newForm, setNewForm, addError, saving, onSave, onCancel }: AddFormRowProps) {
    return (
        <>
            {addError && (
                <tr><td colSpan={7} className="px-4 pb-1">
                    <div className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{addError}</div>
                </td></tr>
            )}
            <tr className="bg-green-50/60 border-y border-green-100">
                <td className="py-3 px-4" colSpan={7}>
                    <div className="flex flex-col gap-3" style={{ paddingLeft: `${depth * 20}px` }}>
                        {parentName && (
                            <p className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                Adding sub-category under &quot;{parentName}&quot;
                                <span className="opacity-60 font-normal">· 서브카테고리 추가</span>
                            </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Slug *</label>
                                <input
                                    placeholder="e.g. toner"
                                    value={newForm.slug}
                                    onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                    className={`${inp} font-mono`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Korean 한국어 *</label>
                                <input
                                    placeholder="토너·에센스"
                                    value={newForm.nameKo}
                                    onChange={e => setNewForm(p => ({ ...p, nameKo: e.target.value }))}
                                    className={inp}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">English *</label>
                                <input
                                    placeholder="Toner & Essence"
                                    value={newForm.nameEn}
                                    onChange={e => setNewForm(p => ({ ...p, nameEn: e.target.value }))}
                                    className={inp}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">中文</label>
                                <input
                                    placeholder="爽肤水"
                                    value={newForm.nameZh}
                                    onChange={e => setNewForm(p => ({ ...p, nameZh: e.target.value }))}
                                    className={inp}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">ភាសាខ្មែរ</label>
                                <input
                                    placeholder="ក្រែម"
                                    value={newForm.nameKm}
                                    onChange={e => setNewForm(p => ({ ...p, nameKm: e.target.value }))}
                                    className={inp}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Sort # 정렬</label>
                                <input
                                    type="number"
                                    value={newForm.sortOrder}
                                    onChange={e => setNewForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                                    className={inp}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={onSave} disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save <span className="opacity-70 font-normal">· 저장</span>
                            </button>
                            <button type="button" onClick={onCancel}
                                className="px-4 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50">
                                Cancel <span className="opacity-60">· 취소</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}

// ─── Category Row (OUTSIDE parent — prevents remount on every keystroke) ───────
interface CategoryRowProps {
    c: Category;
    depth: number;
    editing: string | null;
    setEditing: (id: string | null) => void;
    editForm: EditForm;
    setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
    saving: boolean;
    onSave: (id: string) => void;
    addingParentId: string | null | undefined;
    onStartAdd: (parentId: string) => void;
    expanded: Set<string>;
    onToggleExpand: (id: string) => void;
    // Sub-form props (passed down so form stays alive when sub-row renders)
    newForm: NewForm;
    setNewForm: React.Dispatch<React.SetStateAction<NewForm>>;
    addError: string;
    onAddSave: () => void;
    onAddCancel: () => void;
    // Delete props
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    onDelete: (id: string) => void;
    deleting: boolean;
}

function CategoryRow({
    c, depth,
    editing, setEditing, editForm, setEditForm, saving, onSave,
    addingParentId, onStartAdd, expanded, onToggleExpand,
    newForm, setNewForm, addError, onAddSave, onAddCancel,
    confirmDeleteId, setConfirmDeleteId, onDelete, deleting,
}: CategoryRowProps) {
    const isEdit      = editing === c.id;
    const hasChildren = (c.children?.length ?? 0) > 0;
    const isExp       = expanded.has(c.id);
    const isAddingHere = addingParentId === c.id;
    const isConfirming = confirmDeleteId === c.id;
    // 삭제 가능 조건: 시스템 카테고리 아님 + 연결 상품 없음 + 서브카테고리 없음
    const canDelete   = !c.isSystem && (c.productCount ?? 0) === 0 && !hasChildren;

    return (
        <>
            <tr className={`group hover:bg-gray-50/70 transition-colors ${isEdit ? 'bg-blue-50' : ''}`}>
                {/* Name (KO) with indent */}
                <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
                        {hasChildren ? (
                            <button type="button" onClick={() => onToggleExpand(c.id)}
                                className="p-0.5 text-gray-400 hover:text-blue-600 rounded transition-colors flex-shrink-0">
                                {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        ) : depth > 0 ? (
                            <span className="w-4 h-4 flex-shrink-0 text-gray-300 ml-0.5">└</span>
                        ) : <span className="w-4 flex-shrink-0" />}

                        {depth === 0
                            ? <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            : <Folder className="w-3 h-3 text-teal-400 flex-shrink-0" />}

                        {isEdit ? (
                            <input
                                value={editForm.nameKo ?? ''}
                                onChange={e => setEditForm(p => ({ ...p, nameKo: e.target.value }))}
                                className="border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-28"
                            />
                        ) : (
                            <span className={`text-sm font-${depth === 0 ? 'bold' : 'medium'} text-gray-900`}>{c.nameKo}</span>
                        )}
                    </div>
                </td>

                {/* Slug */}
                <td className="py-2.5 px-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {c.slug}{c.isSystem ? ' ✦' : ''}
                    </span>
                </td>

                {/* EN */}
                <td className="py-2.5 px-3 hidden md:table-cell">
                    {isEdit ? (
                        <input
                            value={editForm.nameEn ?? ''}
                            onChange={e => setEditForm(p => ({ ...p, nameEn: e.target.value }))}
                            className="border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-28"
                        />
                    ) : <span className="text-sm text-gray-600">{c.nameEn}</span>}
                </td>

                {/* ZH */}
                <td className="py-2.5 px-3 hidden lg:table-cell">
                    {isEdit ? (
                        <input
                            value={editForm.nameZh ?? ''}
                            onChange={e => setEditForm(p => ({ ...p, nameZh: e.target.value }))}
                            className="border border-blue-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                        />
                    ) : <span className="text-sm text-gray-500">{c.nameZh}</span>}
                </td>

                {/* Sort */}
                <td className="py-2.5 px-3 text-center hidden sm:table-cell">
                    {isEdit ? (
                        <input
                            type="number"
                            value={editForm.sortOrder ?? c.sortOrder}
                            onChange={e => setEditForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                            className="w-14 border border-blue-300 rounded-lg py-1 px-2 text-sm text-center focus:outline-none"
                        />
                    ) : <span className="text-xs text-gray-400">{c.sortOrder}</span>}
                </td>

                {/* Product count */}
                <td className="py-2.5 px-3 text-center">
                    <span className="text-xs font-bold text-gray-600">{c.productCount ?? 0}</span>
                </td>

                {/* Actions */}
                <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">

                        {isEdit ? (
                            /* ── 편집 저장/취소 ── */
                            <>
                                <button onClick={() => onSave(c.id)} disabled={saving}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => setEditing(null)}
                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : isConfirming ? (
                            /* ── 삭제 인라인 확인 ── */
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span className="text-xs text-red-600 font-semibold whitespace-nowrap">삭제?</span>
                                <button
                                    onClick={() => onDelete(c.id)}
                                    disabled={deleting}
                                    className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">
                                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : '확인'}
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200">
                                    취소
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* + 서브 추가 버튼: hover 시에만 표시 */}
                                {!c.isSystem && depth === 0 && (
                                    <button
                                        onClick={() => onStartAdd(c.id)}
                                        title="Add sub-category · 서브카테고리 추가"
                                        className="p-1.5 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {/* ✏️ 편집 버튼: hover 시에만 표시 */}
                                <button
                                    onClick={() => { setEditing(c.id); setEditForm({ nameKo: c.nameKo, nameEn: c.nameEn, nameKm: c.nameKm, nameZh: c.nameZh, sortOrder: c.sortOrder }); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {/* 🗑️ 삭제 버튼: 항상 표시 — 가능(빨강)/불가(회색+잠금 아이콘) */}
                                <button
                                    onClick={() => canDelete ? setConfirmDeleteId(c.id) : undefined}
                                    title={
                                        c.isSystem ? '🔒 시스템 카테고리는 삭제 불가' :
                                        (c.productCount ?? 0) > 0 ? `🔒 상품 ${c.productCount}개 연결됨 — 상품 이동 후 삭제 가능` :
                                        hasChildren ? '🔒 서브카테고리를 먼저 삭제하세요' :
                                        '🗑️ 카테고리 삭제'
                                    }
                                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-0.5 ${
                                        canDelete
                                            ? 'text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed opacity-50'
                                    }`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}

                    </div>
                </td>
            </tr>

            {/* Sub-category add form row */}
            {isAddingHere && (
                <AddFormRow
                    depth={depth + 1}
                    parentName={c.nameEn || c.nameKo}
                    newForm={newForm}
                    setNewForm={setNewForm}
                    addError={addError}
                    saving={saving}
                    onSave={onAddSave}
                    onCancel={onAddCancel}
                />
            )}

            {/* Children (if expanded) */}
            {hasChildren && isExp && c.children!.map(child => (
                <CategoryRow
                    key={child.id}
                    c={child}
                    depth={depth + 1}
                    editing={editing}
                    setEditing={setEditing}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    onSave={onSave}
                    addingParentId={addingParentId}
                    onStartAdd={onStartAdd}
                    expanded={expanded}
                    onToggleExpand={onToggleExpand}
                    newForm={newForm}
                    setNewForm={setNewForm}
                    addError={addError}
                    onAddSave={onAddSave}
                    onAddCancel={onAddCancel}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onDelete={onDelete}
                    deleting={deleting}
                />
            ))}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
    const [cats,    setCats]    = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');

    // Edit state
    const [editing,  setEditing]  = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({});

    // Add state
    const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
    const [newForm, setNewForm] = useState<NewForm>({ ...EMPTY_FORM });
    const [addError, setAddError] = useState('');

    // Delete state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Expanded rows
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const fetchCats = useCallback(async () => {
        setLoading(true);
        const res  = await fetch('/api/admin/categories');
        const data = await res.json();
        setCats(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCats(); }, [fetchCats]);

    const tree = buildTree(cats);

    const startAdd = useCallback((parentId: string | null) => {
        setAddingParentId(parentId);
        setNewForm({ ...EMPTY_FORM, parentId: parentId ?? '' });
        setAddError('');
        if (parentId) setExpanded(p => new Set([...p, parentId]));
    }, []);

    const handleAdd = useCallback(async () => {
        setAddError('');
        if (!newForm.slug || !newForm.nameKo || !newForm.nameEn) {
            setAddError('Slug, Korean name, and English name are required. · 슬러그, 한국어, 영어명은 필수입니다.');
            return;
        }
        setSaving(true);
        const res  = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newForm, parentId: newForm.parentId || null }),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) { setAddError(data.error || 'Failed to create'); return; }
        setAddingParentId(undefined);
        setNewForm({ ...EMPTY_FORM });
        fetchCats();
    }, [newForm, fetchCats]);

    const handleAddCancel = useCallback(() => {
        setAddingParentId(undefined);
        setNewForm({ ...EMPTY_FORM });
        setAddError('');
    }, []);

    const handleSave = useCallback(async (id: string) => {
        setSaving(true);
        setError('');
        const res = await fetch(`/api/admin/categories?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setSaving(false);
        if (!res.ok) { setError('Failed to save. · 저장 실패'); return; }
        setEditing(null);
        fetchCats();
    }, [editForm, fetchCats]);

    const handleDelete = useCallback(async (id: string) => {
        setDeleting(true);
        setError('');
        const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        setDeleting(false);
        setConfirmDeleteId(null);
        if (!res.ok) {
            setError(data.errorKo || data.error || '삭제 실패');
            return;
        }
        fetchCats();
    }, [fetchCats]);

    const toggleExpand = useCallback((id: string) =>
        setExpanded(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; }), []);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">

            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-blue-500" />
                        Category Management
                        <span className="text-base font-normal text-gray-400 ml-1">카테고리 관리</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create top-level categories and sub-categories. Sellers select these when registering products.
                        <span className="block text-xs opacity-70">
                            상위·서브 카테고리 관리. 셀러가 상품 등록 시 선택합니다. ✦ = 시스템 카테고리 (수정 불가)
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchCats} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => startAdd(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        New Top-Level Category
                        <span className="opacity-70 font-normal text-xs">· 상위 카테고리</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
            )}

            {/* Root-level add form */}
            {addingParentId === null && (
                <div className="mb-5 p-5 bg-white rounded-2xl border border-blue-100 shadow-md">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        New Top-Level Category <span className="text-gray-400 font-normal">· 새 상위 카테고리</span>
                    </h3>
                    {addError && (
                        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 mb-3">{addError}</div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Slug *</label>
                            <input
                                placeholder="e.g. skincare"
                                value={newForm.slug}
                                onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                className={`${inp} font-mono`}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Korean 한국어 *</label>
                            <input
                                placeholder="스킨케어"
                                value={newForm.nameKo}
                                onChange={e => setNewForm(p => ({ ...p, nameKo: e.target.value }))}
                                className={inp}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">English *</label>
                            <input
                                placeholder="Skincare"
                                value={newForm.nameEn}
                                onChange={e => setNewForm(p => ({ ...p, nameEn: e.target.value }))}
                                className={inp}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">中文</label>
                            <input
                                placeholder="护肤品"
                                value={newForm.nameZh}
                                onChange={e => setNewForm(p => ({ ...p, nameZh: e.target.value }))}
                                className={inp}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">ភាសាខ្មែរ</label>
                            <input
                                placeholder="ថែទាំស្បែក"
                                value={newForm.nameKm}
                                onChange={e => setNewForm(p => ({ ...p, nameKm: e.target.value }))}
                                className={inp}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">Sort # 정렬</label>
                            <input
                                type="number"
                                value={newForm.sortOrder}
                                onChange={e => setNewForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                                className={inp}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleAdd} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Category <span className="opacity-70 font-normal">· 저장</span>
                        </button>
                        <button onClick={handleAddCancel}
                            className="px-4 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50">
                            Cancel <span className="opacity-60">· 취소</span>
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold">
                                <th className="py-3 px-4 text-left">
                                    <TaegukgiIcon className="inline-block w-3.5 h-[10px] align-middle mr-1" />
                                    Name <span className="opacity-60">이름</span>
                                </th>
                                <th className="py-3 px-3 text-left hidden sm:table-cell">Slug</th>
                                <th className="py-3 px-3 text-left hidden md:table-cell">🇺🇸 English</th>
                                <th className="py-3 px-3 text-left hidden lg:table-cell">🇨🇳 中文</th>
                                <th className="py-3 px-3 text-center hidden sm:table-cell">Sort 정렬</th>
                                <th className="py-3 px-3 text-center">상품수</th>
                                <th className="py-3 px-3 text-right">Actions 편집</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tree.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                                    No categories yet. Click &quot;New Top-Level Category&quot; to add one.
                                    <span className="block text-xs mt-1">카테고리가 없습니다.</span>
                                </td></tr>
                            ) : tree.map(c => (
                                <CategoryRow
                                    key={c.id}
                                    c={c}
                                    depth={0}
                                    editing={editing}
                                    setEditing={setEditing}
                                    editForm={editForm}
                                    setEditForm={setEditForm}
                                    saving={saving}
                                    onSave={handleSave}
                                    addingParentId={addingParentId}
                                    onStartAdd={startAdd}
                                    expanded={expanded}
                                    onToggleExpand={toggleExpand}
                                    newForm={newForm}
                                    setNewForm={setNewForm}
                                    addError={addError}
                                    onAddSave={handleAdd}
                                    onAddCancel={handleAddCancel}
                                    confirmDeleteId={confirmDeleteId}
                                    setConfirmDeleteId={setConfirmDeleteId}
                                    onDelete={handleDelete}
                                    deleting={deleting}
                                />
                            ))}
                        </tbody>
                    </table>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-4">
                        <span>
                            <span className="font-semibold text-gray-600">{cats.filter(c => !c.parentId).length}</span> top-level
                            <span className="opacity-60"> 상위</span>
                        </span>
                        <span>
                            <span className="font-semibold text-gray-600">{cats.filter(c => !!c.parentId).length}</span> sub-categories
                            <span className="opacity-60"> 서브</span>
                        </span>
                        <span>
                            <span className="font-semibold text-teal-600">+</span> button on row = add sub-category
                            <span className="opacity-60"> · 서브카테고리 추가</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
