'use client';

import React, { useState } from 'react';
import { Globe, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PerUrlResult {
    url: string;
    ok: boolean;
    gcsUrl?: string;
    error?: string;
}

interface Props {
    /** Where to add the imported images — main gallery (1:1 crop) or detail (aspect-preserving) */
    target: 'main' | 'detail';
    /** Slots remaining for this gallery (max - current count). Component clamps input to this. */
    remaining: number;
    /** Tint accent — visually matches each gallery's color theme */
    accent?: 'blue' | 'purple' | 'teal';
    /** Called with the array of new GCS URLs after a successful batch */
    onImported: (gcsUrls: string[]) => void;
}

/**
 * "Import from URLs" — paste any number of public image URLs (≤50) into a textarea
 * and the server downloads each one, validates, converts to WebP, and saves to GCS.
 * Designed to drop into either the Main or Detail image section of any product form.
 */
export default function ImportFromUrlsButton({ target, remaining, accent = 'blue', onImported }: Props) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [results, setResults] = useState<PerUrlResult[] | null>(null);

    const colorMap: Record<string, { btnBg: string; btnHover: string; ring: string; bar: string }> = {
        blue:   { btnBg: 'bg-blue-50 text-blue-700',   btnHover: 'hover:bg-blue-100',   ring: 'focus:ring-blue-500',   bar: 'bg-blue-500' },
        purple: { btnBg: 'bg-purple-50 text-purple-700', btnHover: 'hover:bg-purple-100', ring: 'focus:ring-purple-500', bar: 'bg-purple-500' },
        teal:   { btnBg: 'bg-teal-50 text-teal-700',   btnHover: 'hover:bg-teal-100',   ring: 'focus:ring-teal-500',   bar: 'bg-teal-500' },
    };
    const c = colorMap[accent]!;

    // Parse + sanity check the textarea content
    const parseUrls = (): string[] => {
        const lines = text.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
        // De-duplicate, then clamp to MIN(50, remaining)
        const unique = Array.from(new Set(lines));
        return unique.slice(0, Math.min(50, Math.max(0, remaining)));
    };
    const candidateUrls = parseUrls();

    async function submit() {
        if (candidateUrls.length === 0) return;
        setBusy(true);
        setResults(null);
        try {
            const res = await fetch('/api/upload/from-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urls: candidateUrls,
                    crop: target === 'main' ? 'square' : undefined,
                }),
            });
            const data = await res.json();
            const perUrl: PerUrlResult[] = Array.isArray(data?.results) ? data.results : [];
            setResults(perUrl);
            const goodUrls = perUrl.filter(r => r.ok && r.gcsUrl).map(r => r.gcsUrl as string);
            if (goodUrls.length > 0) onImported(goodUrls);
        } catch (err: any) {
            setResults([{ url: '(request)', ok: false, error: 'Network error' }]);
        } finally {
            setBusy(false);
        }
    }

    function close() {
        setOpen(false);
        setText('');
        setResults(null);
        setBusy(false);
    }

    if (!open) {
        return (
            <button
                type="button"
                disabled={remaining <= 0}
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${c.btnBg} ${c.btnHover} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Import images from a list of URLs"
            >
                <Globe className="w-3.5 h-3.5" />
                Import from URLs
            </button>
        );
    }

    const success = results?.filter(r => r.ok) ?? [];
    const failed  = results?.filter(r => !r.ok) ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={close}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            Import from URLs — {target === 'main' ? 'Main Gallery' : 'Detail Images'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            한 줄에 하나씩 붙여넣기 · 최대 {Math.min(50, remaining)}개 · 자동 WebP 변환
                            {target === 'main' && ' · 1:1 정사각형 크롭'}
                        </p>
                    </div>
                    <button onClick={close} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {!results ? (
                        <>
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={`https://supplier.example.com/img-1.jpg\nhttps://supplier.example.com/img-2.jpg\n...`}
                                rows={10}
                                disabled={busy}
                                className={`w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 ${c.ring} disabled:bg-gray-50`}
                            />
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                    {candidateUrls.length} URL{candidateUrls.length === 1 ? '' : 's'} ready
                                    {candidateUrls.length > 0 && ` · ${Math.min(candidateUrls.length, remaining)} will be imported`}
                                </span>
                                {remaining < 50 && (
                                    <span className="text-amber-600">갤러리에 {remaining}자리 남음</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="flex gap-3">
                                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <p className="text-sm font-bold text-green-800">{success.length} succeeded</p>
                                    </div>
                                </div>
                                {failed.length > 0 && (
                                    <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                            <p className="text-sm font-bold text-red-800">{failed.length} failed</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Failed list */}
                            {failed.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-red-700 mb-2">Failed URLs:</p>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {failed.map((r, i) => (
                                            <div key={i} className="text-xs p-2 bg-red-50 border border-red-100 rounded-lg">
                                                <p className="font-mono text-red-900 break-all line-clamp-1">{r.url}</p>
                                                <p className="text-red-600 mt-0.5">→ {r.error}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={close}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        {results ? 'Done' : 'Cancel'}
                    </button>
                    {!results && (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={busy || candidateUrls.length === 0}
                            className={`px-4 py-2 text-sm font-bold text-white rounded-lg ${c.bar} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                        >
                            {busy ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                            ) : (
                                <>Import {candidateUrls.length || ''}</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
