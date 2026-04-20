import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  History, 
  Users, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Image as ImageIcon, 
  CreditCard, 
  LayoutDashboard,
  LogOut,
  Settings,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigation = [
  { id: '01', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: '02', name: 'Reception', href: '/reception', icon: History },
  { id: '03', name: 'Patients', href: '/patients', icon: Users },
  { id: '04', name: 'Consultation', href: '/consultation', icon: Stethoscope },
  { id: '05', name: 'Pharmacy', href: '/pharmacy', icon: Pill },
  { id: '06', name: 'Laboratory', href: '/lab', icon: FlaskConical },
  { id: '07', name: 'Radiology', href: '/radiology', icon: ImageIcon },
  { id: '08', name: 'Billing', href: '/billing', icon: CreditCard },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Brutalist Style */}
      <aside className="w-64 border-r border-black flex flex-col justify-between shrink-0">
        <div>
          <div className="p-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-12">
              MedFlow<br />Clinical
            </h1>

            <nav className="space-y-0 -mx-8 px-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-[11px] font-black uppercase tracking-widest border-b border-black transition-colors cursor-pointer",
                      isActive 
                        ? "bg-black text-white" 
                        : "text-black hover:bg-black hover:text-white"
                    )}
                  >
                    <span className="opacity-40 tabular-nums">{item.id}</span>
                     {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dynamic Alert Section */}
        <div className="p-8 border-t border-black bg-[#FDE047]">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-black" />
                <span className="text-[10px] font-black uppercase tracking-widest">Alert</span>
            </div>
            <div className="font-bold text-sm leading-tight text-black">
                PHARMACY STOCK LOW:<br />
                AMOXICILLIN 250MG
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        {/* Massive Hero Header */}
        <header className="h-48 border-b border-black flex shrink-0 bg-white">
          <div className="flex-1 p-10 border-r border-black flex flex-col justify-end">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Current Clinic Load
            </div>
            <div className="text-mega tabular-nums">18</div>
          </div>
          <div className="w-80 p-10 flex flex-col justify-end">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Avg Waiting Time
            </div>
             <div className="text-5xl font-black italic tabular-nums tracking-tighter">
                12<span className="text-2xl not-italic ml-1 opacity-40">m</span>
             </div>
          </div>
        </header>

        {/* User Status Bar */}
        <div className="h-14 border-b border-black bg-white flex items-center justify-between px-10 shrink-0">
             <div className="text-[10px] font-black uppercase tracking-[0.1em]">
                System: <span className="text-emerald-600">Operational</span> • Secure Database v2.4
             </div>
             <div className="flex items-center gap-6">
                <button className="text-[10px] font-black uppercase tracking-widest hover:underline">Support</button>
                <div className="w-px h-6 bg-black opacity-10"></div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-tight">Dr. Sarah Smith</span>
                    <div className="w-8 h-8 border border-black overflow-hidden bg-slate-100">
                        <img src="https://picsum.photos/seed/doc/100" className="w-full h-full object-cover" />
                    </div>
                </div>
             </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
