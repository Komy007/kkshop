'use client';

import React, { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';

interface Customer {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        async function fetchCustomers() {
            try {
                const res = await fetch('/api/admin/customers');
                if (!res.ok) {
                    throw new Error('데이터를 불러오는데 실패했습니다.');
                }
                const data = await res.json();
                setCustomers(data);
            } catch (error: any) {
                setErrorMsg(error.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCustomers();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-500 w-6 h-6" />
                        회원 관리 (Customers)
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        플랫폼에 가입된 모든 회원의 목록 및 권한을 확인합니다.
                    </p>
                </div>
                <div className="text-sm text-gray-500">
                    총 회원 수: <span className="font-bold text-gray-900">{customers.length}</span>명
                </div>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                    {errorMsg}
                </div>
            )}

            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">이름 (Name)</th>
                                <th scope="col" className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">이메일 (Email)</th>
                                <th scope="col" className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">권한 (Role)</th>
                                <th scope="col" className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">가입일 (Joined)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{customer.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {customer.email || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${customer.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800' :
                                                customer.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {customer.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        가입된 회원이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
