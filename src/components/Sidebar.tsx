'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, CheckSquare, BarChart2, Hash, Target, Download, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Time tracking', icon: Clock, href: '/' },
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'Tags', icon: Hash, href: '/tags' },
  { label: 'Focus sessions', icon: Target, href: '/focus' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#1a1a1a] flex flex-col border-r border-[#262626]">
      {/* App Logo/Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FlowForge</span>
        </div>
        <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center border border-blue-400/30">
          <div className="w-3 h-3 bg-blue-500 rounded-full blur-[2px] animate-pulse"></div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 mt-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#262626] text-white" 
                  : "text-[#a3a3a3] hover:text-white hover:bg-[#262626]/50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#a3a3a3]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-4 border-t border-[#262626]">
        <button className="flex items-center gap-2 text-[#3b82f6] text-sm font-medium hover:underline px-4">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </aside>
  );
}
