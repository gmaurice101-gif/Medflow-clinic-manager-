import * as React from 'react';
import { ImageIcon, Search, Filter, CheckCircle2, ImageOff, Scan } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Radiology() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Re-using the same conceptual collection as Radiology/Labs often shared or separate.
    // I'll use 'imagingRequests' for clarity
    const q = query(collection(db, 'imagingRequests'), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
        console.error("Radiology fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, findings?: string) => {
    try {
      const updateData: any = {
        status: status,
        updatedAt: serverTimestamp()
      };
      if (findings !== undefined) updateData.findings = findings;
      
      await updateDoc(doc(db, 'imagingRequests', id), updateData);
      toast.success(`Imaging updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, 'update', `imagingRequests/${id}`);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Radiology Portal</h2>
          <p className="text-slate-500 mt-2 font-medium">Diagnostic imaging queue and vault access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Active Imaging Queue
          </h3>
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id} className="border-black rounded-none shadow-none overflow-hidden group hover:bg-slate-50 transition-all">
                  <div className="flex">
                      <div className={cn(
                          "w-2",
                          req.status === 'Requested' ? "bg-amber-400" : 
                          req.status === 'In Progress' ? "bg-blue-600" : "bg-emerald-500"
                      )}></div>
                      <div className="p-8 flex-1">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">REQ #{req.id.slice(-6)}</span>
                                  <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">{req.patientName || 'Unknown Patient'}</h4>
                              </div>
                              <Badge className="rounded-none border-black font-black uppercase text-[10px] tracking-widest bg-white text-black">
                                  {req.status}
                              </Badge>
                          </div>

                          <div className="bg-white border border-black p-4 mb-6">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Exam Details</span>
                               <p className="text-lg font-black text-black uppercase italic tracking-tighter">
                                   {req.type || 'General Imaging Request'}
                               </p>
                          </div>

                          <div className="flex justify-between items-end">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                    Requested: {req.requestedAt?.seconds ? format(new Date(req.requestedAt.seconds * 1000), 'hh:mm a') : '...'}
                                </div>
                                <div className="flex gap-2">
                                     {req.status === 'Requested' && (
                                         <Button size="sm" className="bg-black text-white hover:bg-slate-800 uppercase text-[10px] font-black tracking-widest px-6 h-10" onClick={() => handleUpdateStatus(req.id, 'In Progress')}>
                                            Start Scan
                                         </Button>
                                     )}
                                     {req.status === 'In Progress' && (
                                         <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 uppercase text-[10px] font-black tracking-widest px-6 h-10" onClick={() => handleUpdateStatus(req.id, 'Completed')}>
                                            Complete
                                         </Button>
                                     )}
                                </div>
                          </div>
                      </div>
                  </div>
              </Card>
            ))}
          </div>
          {requests.length === 0 && !loading && (
             <div className="py-20 text-center bg-slate-50 border-2 border-dashed rounded-3xl border-slate-200">
                <ImageOff className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No Pending Scans</h3>
                <p className="text-slate-400 max-w-xs mx-auto">Real-time imaging requests will appear here as doctors prescribe them.</p>
             </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div>
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <ImageIcon className="text-blue-400 w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4">Radiology Quick Look</h3>
                 <p className="text-slate-400 leading-relaxed mb-8">
                     Quickly access historical patient images and scan history from the centralized imaging vault.
                 </p>
                 
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-medium">Digital Archive</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-sm font-medium">Dicom Viewer</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">Ready</span>
                    </div>
                 </div>
            </div>
            
            <Button className="w-full mt-12 bg-white text-slate-900 hover:bg-slate-100 h-12 font-bold rounded-2xl">
                Open Imaging Vault
            </Button>
        </div>
      </div>
    </div>
  );
}
