import * as React from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const [counts, setCounts] = React.useState({
    patients: 0,
    appointments: 0,
    labTests: 0,
    revenue: 0
  });
  const [recentPatients, setRecentPatients] = React.useState<any[]>([]);

  React.useEffect(() => {
    // 1. Total Patients
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snap) => {
      setCounts(prev => ({ ...prev, patients: snap.size }));
    });

    // 2. Today's Appointments
    const today = new Date().toISOString().split('T')[0];
    const qApts = query(collection(db, 'appointments'), where('date', '==', today));
    const unsubApts = onSnapshot(qApts, (snap) => {
      setCounts(prev => ({ ...prev, appointments: snap.size }));
    });

    // 3. Lab Tests
    const unsubLabs = onSnapshot(collection(db, 'labRequests'), (snap) => {
      setCounts(prev => ({ ...prev, labTests: snap.size }));
    });

    // 4. Revenue (Simplified - sum of paid bills)
    const unsubRevenue = onSnapshot(query(collection(db, 'bills'), where('status', 'in', ['paid', 'Paid'])), (snap) => {
        const total = snap.docs.reduce((sum, doc) => sum + (Number(doc.data().total) || 0), 0);
        setCounts(prev => ({ ...prev, revenue: total }));
    });

    // 5. Recent Activity (Latest Patients)
    const qRecent = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecent = onSnapshot(qRecent, (snap) => {
        setRecentPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPatients();
      unsubApts();
      unsubLabs();
      unsubRevenue();
      unsubRecent();
    };
  }, []);

  const stats = [
    { label: 'Total Patients', value: counts.patients.toLocaleString(), icon: Users },
    { label: 'Today Apps', value: counts.appointments.toString(), icon: Calendar },
    { label: 'Pending Lab', value: counts.labTests.toString(), icon: Activity },
    { label: 'Revenue', value: `$${counts.revenue.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-0 min-h-full">
      {/* Dynamic Stats Row - Brutalist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-black">
        {stats.map((stat, i) => (
          <div key={i} className="p-10 border-r border-black last:border-r-0 bg-white group hover:bg-black transition-colors">
            <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white/40">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-black group-hover:text-white" />
            </div>
            <div className="text-5xl font-black tabular-nums group-hover:text-white transition-colors">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Recent Influx Section */}
        <div className="lg:col-span-2 p-10 border-r border-black">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-4xl font-black uppercase tracking-tighter">Recent Influx</h3>
              <p className="text-slate-500 text-sm mt-2 font-medium">Monitoring real-time patient registration flow.</p>
            </div>
            <Button variant="outline" className="border-black font-black uppercase text-[10px] tracking-widest px-6 h-10 hover:bg-black hover:text-white">
                View Directory
            </Button>
          </div>

          <div className="border border-black bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-black">
                    <TableRow className="hover:bg-black border-transparent">
                        <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-12">Patient ID</TableHead>
                        <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-12">Name</TableHead>
                        <TableHead className="text-white font-black uppercase text-[10px] tracking-widest h-12">Time</TableHead>
                        <TableHead className="text-white text-right font-black uppercase text-[10px] tracking-widest h-12">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentPatients.map((patient) => (
                    <TableRow key={patient.id} className="border-black hover:bg-slate-50">
                        <TableCell className="font-black text-[11px] uppercase tracking-tighter">PT-{patient.id.slice(-6)}</TableCell>
                        <TableCell className="font-bold text-slate-900">{patient.name}</TableCell>
                        <TableCell className="text-slate-400 text-[10px] font-bold uppercase">
                             {patient.createdAt?.seconds ? new Date(patient.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </TableCell>
                        <TableCell className="text-right">
                             <button className="text-[10px] font-black uppercase tracking-widest hover:underline">Process</button>
                        </TableCell>
                    </TableRow>
                    ))}
                    {recentPatients.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">No historical data in segment.</TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar Status Column */}
        <div className="bg-white p-10 space-y-12">
            <section>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Staff Notices</h4>
                <div className="space-y-4">
                    <div className="p-6 border border-black bg-[#FDE047] relative">
                        <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                             <AlertCircle className="w-3 h-3" /> Mandatory
                        </div>
                        <p className="text-sm font-bold leading-snug">Clinic operational meeting scheduled for Friday at 4:30 PM.</p>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">System Health</h4>
                <div className="space-y-px border border-black bg-black">
                     {[
                        { label: 'Database', status: 'Online' },
                        { label: 'Cloud Auth', status: 'Active' },
                        { label: 'Lab Link', status: 'Healthy' }
                     ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-white">
                             <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                             <span className="text-[10px] font-bold uppercase text-emerald-600 italic">● {item.status}</span>
                        </div>
                     ))}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
}
