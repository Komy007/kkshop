import React from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { LayoutDashboard, Package, ShoppingCart, Users, Store, Settings } from 'lucide-react';

const NAV = [
  { label: '대시보드', icon: LayoutDashboard, href: '/admin' },
  {
    label: '상품 관리', icon: Package,
    children: [
      { label: '전체 상품 목록', href: '/admin/products' },
      { label: '리뷰 관리', href: '/admin/reviews' },
      { label: '🟡 상품 검수', href: '/admin/products/review' },
      { label: '새 상품 등록', href: '/admin/products/new' },
      { label: '카테고리 관리', href: '/admin/categories' },
    ],
  },
  { label: '주문 관리', icon: ShoppingCart, href: '/admin/orders' },
  {
    label: '회원 관리', icon: Users,
    children: [
      { label: '전체 회원 목록', href: '/admin/customers' },
      { label: '관리자 권한 설정', href: '/admin/settings/roles' },
    ],
  },
  { label: '공급업체 관리', icon: Store, href: '/admin/suppliers' },
  {
    label: '설정', icon: Settings,
    children: [
      { label: '랜딩 페이지 설정', href: '/admin/landing-settings' },
      { label: '비밀번호 변경', href: '/admin/change-password' },
    ],
  },
];

export default async function AdminSidebar() {
  const session = await auth();
  const role = session?.user?.role || "USER";
  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A";
  const isSuperAdmin = role === 'SUPERADMIN';

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-300 flex flex-col font-sans mb-0">
      <div className="h-16 flex items-center px-6 bg-gray-950 font-bold text-xl text-white tracking-wider flex-shrink-0">
        <span className="text-blue-500 mr-2">KK</span>shop.cc Admin
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {NAV.map((item) => (
          <div key={item.label} className="px-4">
            <div className="flex items-center gap-2 text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
              <item.icon className="w-3.5 h-3.5" /> {item.label}
            </div>
            <ul className="space-y-1">
              {item.children ? item.children.map(child => (
                <SidebarItem key={child.href} href={child.href} label={child.label} />
              )) : (
                <SidebarItem href={item.href || '#'} label={item.label} />
              )}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 bg-gray-950 flex items-center space-x-3 border-t border-gray-800">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session?.user?.name || "Admin User"}</p>
          <p className="text-xs text-gray-500">{isSuperAdmin ? 'Super Administrator' : 'Administrator'}</p>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center px-3 py-2 rounded-md transition-colors duration-200 text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        <span className="text-sm">{label}</span>
      </Link>
    </li>
  );
}
