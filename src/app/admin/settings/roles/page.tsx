'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, Loader2, AlertCircle } from 'lucide-react';

interface AdminUser {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
}

export default function RolesSecurityPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        name: '',
        role: 'ADMIN',
        companyName: ''
    });

    // Password Reset Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admin/customers');
            if (!res.ok) throw new Error('목록을 불러오는데 실패했습니다.');

            const data: AdminUser[] = await res.json();
            // Filter only ADMIN, SUPERADMIN, and SUPPLIER roles
            const adminUsers = data.filter(user => ['ADMIN', 'SUPERADMIN', 'SUPPLIER'].includes(user.role));
            setAdmins(adminUsers);
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '계정 생성 실패');

            setSuccessMsg(`${createForm.email} 계정이 성공적으로 생성되었습니다.`);
            setIsCreateModalOpen(false);
            setCreateForm({ email: '', password: '', name: '', role: 'ADMIN', companyName: '' });
            fetchAdmins(); // Refresh list

            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openPasswordModal = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setNewPassword('');
        setErrorMsg('');
        setSuccessMsg('');
        setIsPasswordModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setSelectedAdmin(null);
        setNewPassword('');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdmin) return;

        if (newPassword.length < 6) {
            setErrorMsg('비밀번호는 최소 6자리 이상이어야 합니다.');
            return;
        }

        setIsSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/admin/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: selectedAdmin.id,
                    newPassword: newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '비밀번호 변경 실패');

            setSuccessMsg(`${selectedAdmin.name || selectedAdmin.email}님의 비밀번호가 성공적으로 변경되었습니다.`);
            closePasswordModal();

            // Clear success message after 4 seconds
            setTimeout(() => setSuccessMsg(''), 4000);

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="text-blue-500 w-6 h-6" />
                        통합 관리자 및 보안 설정
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        시스템에 등록된 최고 관리자(SUPERADMIN) 및 일반 관리자(ADMIN)의 권한과 암호를 관리합니다.
                    </p>
                </div>
            </div>

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md text-sm font-bold animate-fade-in-up">
                    {successMsg}
                </div>
            )}

            {errorMsg && !isModalOpen && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm font-bold flex gap-2 items-center">
                    <AlertCircle className="w-5 h-5" /> {errorMsg}
                </div>
            )}

            <div className="mb-8 flex justify-end">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all"
                >
                    <ShieldCheck className="w-5 h-5" />
                    새 관리자/공급자 추가
                </button>
            </div>

            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">이름 / 이메일</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">권한 (Role)</th>
                            <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-right">보안 작업</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{admin.name || '미설정'}</div>
                                    <div className="text-gray-500">{admin.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-[10px] leading-5 font-bold rounded-full border 
                                        ${admin.role === 'SUPERADMIN' ? 'bg-red-50 text-red-700 border-red-200' : 
                                          admin.role === 'SUPPLIER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                          'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {admin.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => openPasswordModal(admin)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        비밀번호 변경
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">새 계정 생성</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">이름</label>
                                    <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})}
                                        className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="홍길동" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">이메일 (아이디)</label>
                                    <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})}
                                        className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="staff@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">초기 비밀번호</label>
                                <input required type="text" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})}
                                    className="w-full border p-2.5 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500" placeholder="최소 6자" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">권한 설정</label>
                                <div className="flex gap-4">
                                    {(['ADMIN', 'SUPPLIER'] as const).map(role => (
                                        <label key={role} className={`flex-1 flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${createForm.role === role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" value={role} checked={createForm.role === role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="hidden" />
                                            <span className="font-bold text-sm">{role === 'ADMIN' ? '일반 직원' : '공급자 (Supplier)'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {createForm.role === 'SUPPLIER' && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">업체명 (Company Name)</label>
                                    <input required type="text" value={createForm.companyName} onChange={e => setCreateForm({...createForm, companyName: e.target.value})}
                                        className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-purple-50/30" placeholder="예: KK Trading Co." />
                                </div>
                            )}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                                <p className="text-xs text-gray-500">생성된 계정 정보는 즉시 활성화되며, 해당 직원이 첫 로그인 시 비밀번호를 변경하도록 안내해 주세요.</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {isSaving ? '생성 중...' : '계정 발급'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {isPasswordModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">새 비밀번호 설정</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold text-blue-600">{selectedAdmin.email}</span> 계정의 암호를 변경합니다.
                            </p>
                        </div>

                        <form onSubmit={handlePasswordChange}>
                            <div className="p-6 space-y-4">
                                {errorMsg && isModalOpen && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                                    <input
                                        type="text" // Show text briefly for admin ease of use since they are superadmin managing it
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 py-2.5 px-3 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="새로운 비밀번호 입력 (최소 6자리 이상)"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        * 안전한 해시(Bcrypt) 알고리즘으로 즉시 암호화되어 저장됩니다.
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closePasswordModal}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                    저장 및 암호화
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
