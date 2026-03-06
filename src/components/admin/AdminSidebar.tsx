import React from 'react';
import Link from 'next/link';
import { auth } from '@/auth';

// Icon placeholders (using simple emoji or text for now, can be replaced with Lucide/Heroicons later)
const icons = {
  dashboard: '📊',
  revenue: '💵',
  traffic: '📈',
  alert: '⚠️',
  product: '📦',
  add: '📝',
  list: '📋',
  translate: '🔄',
  inventory: '📊',
  order: '🛒',
  receipt: '🧾',
  shipping: '🚚',
  return: '🔄',
  localLogistics: '🇰🇭',
  customer: '👥',
  user: '👤',
  cs: '💬',
  setting: '⚙️',
  globe: '🌐',
  key: '🔑',
  coupon: '🎫'
};

export default async function AdminSidebar() {
  const session = await auth();
  const role = session?.user?.role || "USER";
  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A";
  const isSuperAdmin = role === 'SUPERADMIN';

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-300 flex flex-col font-sans mb-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 bg-gray-950 font-bold text-xl text-white tracking-wider flex-shrink-0">
        <span className="text-blue-500 mr-2">KK</span>shop.cc Admin
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">

        {/* Dashboard Section (SUPERADMIN Only) */}
        {isSuperAdmin && (
          <div className="px-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
              {icons.dashboard} 대시보드 (Dashboard)
            </h3>
            <ul className="space-y-1">
              <SidebarItem href="/admin" icon={icons.revenue} label="일간 USD 매출 요약" />
              <SidebarItem href="/admin/traffic" icon={icons.traffic} label="트래픽 통계" />
              <SidebarItem href="/admin/alerts" icon={icons.alert} label="긴급 알림" />
            </ul>
          </div>
        )}

        {/* Products Section */}
        <div className="px-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
            {icons.product} 상품 관리 (Products)
          </h3>
          <ul className="space-y-1">
            <SidebarItem href="/admin/products/new" icon={icons.add} label="상품 등록 (자동 번역)" active />
            <SidebarItem href="/admin/products" icon={icons.list} label="상품 목록" />
            <SidebarItem href="/admin/products/translations" icon={icons.translate} label="다국어 번역 검수" />
            <SidebarItem href="/admin/inventory" icon={icons.inventory} label="실시간 재고 추적" />
          </ul>
        </div>

        {/* Orders & Shipping Section */}
        <div className="px-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
            {icons.order} 주문 및 배송 관리
          </h3>
          <ul className="space-y-1">
            <SidebarItem href="/admin/orders" icon={icons.receipt} label="전체 주문 내역" />
            <SidebarItem href="/admin/shipping" icon={icons.shipping} label="배송 상태 변경" />
            <SidebarItem href="/admin/returns" icon={icons.return} label="취소/교환/반품" />
            <SidebarItem href="/admin/logistics" icon={icons.localLogistics} label="현지 물류 연동" />
          </ul>
        </div>

        {/* Customers Section */}
        <div className="px-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
            {icons.customer} 고객 및 CS 관리
          </h3>
          <ul className="space-y-1">
            <SidebarItem href="/admin/customers" icon={icons.user} label="회원 목록" />
            <SidebarItem href="/admin/reviews" icon="⭐" label="리뷰 관리" />
            <SidebarItem href="/admin/coupons" icon={icons.coupon} label="쿠폰 관리" />
            <SidebarItem href="/admin/cs" icon={icons.cs} label="1:1 다국어 문의 답변" />
            <SidebarItem href="/admin/marketing/email" icon="📧" label="이메일 발송 (마케팅)" />
          </ul>
        </div>

        {/* Settings Section (SUPERADMIN Only) */}
        {isSuperAdmin && (
          <div className="px-4 pb-6">
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">
              {icons.setting} 시스템 설정 (Settings)
            </h3>
            <ul className="space-y-1">
              <SidebarItem href="/admin/landing-settings" icon="✨" label="랜딩 페이지 셋팅" isHighlighted={true} />
              <SidebarItem href="/admin/settings/localization" icon={icons.globe} label="언어 및 국가 설정" />
              <SidebarItem href="/admin/settings/roles" icon={icons.key} label="관리자 권한" />
              <SidebarItem href="/admin/settings/email" icon="⚙️" label="이메일(SMTP) 연동 설정" />
            </ul>
          </div>
        )}

      </nav>

      {/* User Info Footer Component */}
      <div className="p-4 bg-gray-950 flex items-center space-x-3 border-t border-gray-800">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {userInitial}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{session?.user?.name || "Admin User"}</p>
          <p className="text-xs text-gray-500">{isSuperAdmin ? 'Super Administrator' : 'Administrator'}</p>
        </div>
      </div>
    </aside>
  );
}

// Helper component for styled menu items
function SidebarItem({ href, icon, label, active = false, isHighlighted = false }: { href: string; icon: string; label: string; active?: boolean, isHighlighted?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${active
          ? 'bg-blue-600/10 text-blue-400 font-medium'
          : isHighlighted
            ? 'text-red-500 font-bold hover:bg-gray-800 hover:text-red-400 bg-red-500/10'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
      >
        <span className="mr-3 text-lg opacity-75">{icon}</span>
        <span className="text-sm">{label}</span>
      </Link>
    </li>
  );
}
