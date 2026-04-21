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
  AlertTriangle,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';

const navigation = [
  { id: '01', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: '02', name: 'Reception', href: '/reception', icon: History },
  { id: '03', name: 'Patients', href: '/patients', icon: Users },
  { id: '04', name: 'Consultation', href: '/consultation', icon: Stethoscope },
  { id: '05', name: 'Pharmacy', href: '/pharmacy', icon: Pill },
  { id: '06', name: 'Laboratory', href: '/lab', icon: FlaskConical },
  { id: '07', name: 'Radiology', href: '/radiology', icon: ImageIcon },
  { id: '08', name: 'Billing', href: '/billing', icon: CreditCard },
  { id: '09', name: 'Admin', href: '/admin', icon: ShieldAlert, adminOnly: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const user = auth.currentUser;

  // Real admin check
  const isAdmin = user?.email === 'gmaurice101@gmail.com' || user?.email === 'gmaurice@gmail.com';

  // Close sidebar on navigation
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-white relative">
      {/* Sidebar - Brutalist Style */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-black flex flex-col justify-between shrink-0 bg-white transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div>
          <div className="p-8">
            <div className="flex justify-between items-start mb-12">
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                Medflow<br />Clinic Manager
              </h1>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 border border-black hover:bg-black hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-0 -mx-8 px-4">
              {navigation.filter(item => !item.adminOnly || isAdmin).map((item) => {
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

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden h-14 border-b border-black bg-white flex items-center justify-between px-6 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-black uppercase tracking-tighter">Medflow</div>
          <div className="w-8 h-8 border border-black overflow-hidden bg-slate-100">
            <img src="https://picsum.photos/seed/doc/100" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* User Status Bar - Hidden on small mobile or reduced */}
        <div className="hidden sm:flex h-14 border-b border-black bg-white items-center justify-between px-6 md:px-10 shrink-0">
             <div className="text-[10px] font-black uppercase tracking-[0.1em] truncate mr-4">
                System: <span className="text-emerald-600">Operational</span> • Secure Database v2.4
             </div>
             <div className="flex items-center gap-4 md:gap-6">
                <button className="text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap">Support</button>
                <div className="hidden md:block w-px h-6 bg-black opacity-10"></div>
                <div className="hidden md:flex items-center gap-3">
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
