'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, CheckCircle, XCircle, FileText, RotateCcw } from 'lucide-react';

interface ImportRow {
    sku:          string;
    name:         string;
    priceUsd:     number;
    stockQty:     number;
    categorySlug: string;
    brand:        string;
    imageUrl:     string;
    shortDesc:    string;
    isActive:     boolean;
    _status?:     'ok' | 'error' | 'pending';
    _error?:      string;
}

interface Category {
    id:   string;
    slug: string;
    name: string;
}

const CSV_TEMPLATE = `sku,name,priceUsd,stockQty,categorySlug,brand,imageUrl,shortDesc,isActive
COSRX-SM-001,"COSRX Snail Mucin Essence",18.50,100,skincare,COSRX,https://example.com/img.jpg,"Best seller essence",true
LNG-WSM-001,"Laneige Water Sleeping Mask",25.00,50,skincare,Laneige,https://example.com/img2.jpg,"Overnight moisturizer",true`;

function parseCsv(text: string): ImportRow[] {
    const lines  = text.trim().split('\n');
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current  = '';
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
            else current += ch;
        }
        values.push(current.trim());

        const obj: Record<string, string> = {};
        header.forEach((h, i) => { obj[h] = values[i] ?? ''; });

        return {
            sku:          obj['sku'] ?? '',
            name:         obj['name'] ?? '',
            priceUsd:     parseFloat(obj['priceUsd'] ?? '0') || 0,
            stockQty:     parseInt(obj['stockQty'] ?? '0') || 0,
            categorySlug: obj['categorySlug'] ?? '',
            brand:        obj['brand'] ?? '',
            imageUrl:     obj['imageUrl'] ?? '',
            shortDesc:    obj['shortDesc'] ?? '',
            isActive:     obj['isActive'] !== 'false',
            _status:      'pending',
        } as ImportRow;
    }).filter(r => r.name.length > 0);
}

export default function BulkImportPage() {
    const [rows,       setRows]       = useState<ImportRow[]>([]);
    const [importing,  setImporting]  = useState(false);
    const [done,       setDone]       = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [errors,     setErrors]     = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/admin/categories?page=1&limit=200')
            .then(r => r.json())
            .then(d => setCategories(d.categories ?? []))
            .catch(() => {});
    }, []);

    const categoryIdBySlug = (slug: string): string | null => {
        const cat = categories.find(c => c.slug === slug);
        return cat ? cat.id : null;
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target?.result as string;
            const parsed = parseCsv(text);
            // Validate duplicate SKUs
            const skus = parsed.map(r => r.sku).filter(Boolean);
            const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
            if (dupes.length > 0) {
                setErrors([`Duplicate SKUs found: ${[...new Set(dupes)].join(', ')}`]);
            } else {
                setErrors([]);
            }
            setRows(parsed);
            setDone(false);
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'kkshop-bulk-import-template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setRows([]);
        setDone(false);
        setErrors([]);
        if (fileRef.current) fileRef.current.value = '';
    };

    const runImport = async () => {
        if (errors.length > 0) return;
        setImporting(true);
        const updated = [...rows];

        for (let i = 0; i < updated.length; i++) {
            const row = updated[i];
            if (!row || row._status === 'ok') continue;

            try {
                const categoryId = categoryIdBySlug(row.categorySlug) ?? null;

                const body = {
                    sku:        row.sku,
                    name:       row.name,
                    baseLang:   'en',
                    priceUsd:   row.priceUsd,
                    stockQty:   row.stockQty,
                    categoryId,
                    brand:      row.brand,
                    imageUrls:  row.imageUrl ? [row.imageUrl] : [],
                    shortDesc:  row.shortDesc,
                    isActive:   row.isActive,
                    doTranslate: true,
                };

                const res = await fetch('/api/admin/products', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(body),
                });

                if (res.ok) {
                    updated[i] = { ...row, _status: 'ok' as const };
                } else {
                    const err = await res.json();
                    updated[i] = { ...row, _status: 'error' as const, _error: (err.error as string) ?? 'Failed' };
                }
            } catch (e: unknown) {
                updated[i] = { ...row, _status: 'error' as const, _error: e instanceof Error ? e.message : 'Unknown error' };
            }
            setRows([...updated]);
        }

        setImporting(false);
        setDone(true);
    };

    const successCount = rows.filter(r => r._status === 'ok').length;
    const errorCount   = rows.filter(r => r._status === 'error').length;

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bulk Product Import</h1>
                    <p className="text-sm text-gray-500 mt-0.5">대량 상품 등록 (CSV)</p>
                </div>
                <div className="flex items-center gap-2">
                    {rows.length > 0 && (
                        <button onClick={reset}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    )}
                    <button onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all">
                        <Download className="w-4 h-4" /> Download Template
                    </button>
                </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 space-y-1">
                    <div className="font-bold">Validation Errors</div>
                    {errors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
            )}

            {/* Drop zone */}
            {rows.length === 0 && (
                <div
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFile(file);
                    }}
                >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-slate-700">Drop your CSV file here or click to browse</div>
                        <div className="text-xs text-slate-500 mt-1">Supports .csv files · Max 1000 rows per import</div>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                    />
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
                <div className="font-bold">CSV Column Reference</div>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-0.5">
                    {[
                        ['sku',          'Unique product SKU (required)'],
                        ['name',         'Product name in English (required)'],
                        ['priceUsd',     'Price in USD e.g. 18.50'],
                        ['stockQty',     'Initial stock quantity'],
                        ['categorySlug', 'Category slug e.g. skincare'],
                        ['brand',        'Brand name'],
                        ['imageUrl',     'Full HTTPS image URL'],
                        ['shortDesc',    'Short description in English'],
                        ['isActive',     'true or false (default: true)'],
                    ].map(([col, desc]) => (
                        <div key={col}><strong>{col}</strong> — {desc}</div>
                    ))}
                </div>
                <div className="mt-2 text-blue-600">• Auto-translation to Korean, Khmer, and Chinese is enabled automatically.</div>
                {categories.length > 0 && (
                    <div className="mt-1">
                        <strong>Available category slugs:</strong>{' '}
                        {categories.map(c => c.slug).join(', ')}
                    </div>
                )}
            </div>

            {/* Preview Table */}
            {rows.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-slate-700">{rows.length} products ready to import</span>
                            {done && (
                                <span className="text-xs font-semibold">
                                    <span className="text-green-600">✓ {successCount} imported</span>
                                    {errorCount > 0 && <span className="text-red-500 ml-2">✗ {errorCount} failed</span>}
                                </span>
                            )}
                        </div>
                        {!done && (
                            <button
                                onClick={runImport}
                                disabled={importing || errors.length > 0}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {importing ? `Importing… (${successCount + errorCount}/${rows.length})` : 'Start Import'}
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase">
                                    <th className="px-4 py-2 text-left font-semibold w-8">Status</th>
                                    <th className="px-4 py-2 text-left font-semibold">SKU</th>
                                    <th className="px-4 py-2 text-left font-semibold">Name (EN)</th>
                                    <th className="px-4 py-2 text-right font-semibold">Price</th>
                                    <th className="px-4 py-2 text-right font-semibold">Stock</th>
                                    <th className="px-4 py-2 text-left font-semibold">Category</th>
                                    <th className="px-4 py-2 text-left font-semibold">Brand</th>
                                    <th className="px-4 py-2 text-left font-semibold">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, i) => (
                                    <tr key={i} className={row._status === 'error' ? 'bg-red-50' : row._status === 'ok' ? 'bg-green-50' : ''}>
                                        <td className="px-4 py-2">
                                            {row._status === 'ok'      && <CheckCircle className="w-4 h-4 text-green-600" />}
                                            {row._status === 'error'   && <XCircle className="w-4 h-4 text-red-500" />}
                                            {row._status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-slate-500">{row.sku}</td>
                                        <td className="px-4 py-2 font-medium text-gray-900 max-w-48 truncate">{row.name}</td>
                                        <td className="px-4 py-2 text-right">${row.priceUsd.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">{row.stockQty}</td>
                                        <td className="px-4 py-2">{row.categorySlug}</td>
                                        <td className="px-4 py-2">{row.brand}</td>
                                        <td className="px-4 py-2 text-red-500 max-w-48 truncate">{row._error ?? ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
