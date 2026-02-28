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

    // Password Reset Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            // We can reuse the customers API since it returns users, 
            // but we'll filter it on the client for simplicity (or create a new specialized API).
            // Reusing /api/admin/customers is perfectly fine.
            const res = await fetch('/api/admin/customers');
            if (!res.ok) throw new Error('목록을 불러오는데 실패했습니다.');

            const data: AdminUser[] = await res.json();
            // Filter only ADMIN and SUPERADMIN roles
            const adminUsers = data.filter(user => user.role === 'ADMIN' || user.role === 'SUPERADMIN');
            setAdmins(adminUsers);
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const openPasswordModal = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setNewPassword('');
        setErrorMsg('');
        setSuccessMsg('');
        setIsModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsModalOpen(false);
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
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${admin.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
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

            {/* Password Reset Modal */}
            {isModalOpen && selectedAdmin && (
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
