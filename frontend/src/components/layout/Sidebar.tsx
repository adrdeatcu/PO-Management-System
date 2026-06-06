'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FileText, CheckSquare, Archive,
  Users, Building2, Shield, Settings, LogOut,
} from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '../../types/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // undefined = visible to all
}

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard',         icon: <LayoutDashboard size={18} /> },
  { label: 'My POs',           href: '/purchase-orders',   icon: <FileText size={18} /> },
  { label: 'Approvals',        href: '/approvals',         icon: <CheckSquare size={18} />, roles: ['manager', 'it', 'finance'] },
  { label: 'Completed',        href: '/completed',         icon: <Archive size={18} /> },
];

const adminNavItems: NavItem[] = [
  { label: 'Users',            href: '/admin/users',             icon: <Users size={18} /> },
  { label: 'Departments',      href: '/admin/departments',       icon: <Building2 size={18} /> },
  { label: 'Role Assignments', href: '/admin/roles',             icon: <Shield size={18} /> },
  { label: 'All POs',          href: '/admin/purchase-orders',   icon: <Settings size={18} /> },
];

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => user.roles.includes(r)),
  );

  const isAdmin = user.roles.includes('admin');

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-700 rounded-md flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">PO Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-teal-50 text-teal-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.roles.join(', ')}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}