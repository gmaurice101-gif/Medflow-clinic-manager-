import * as React from 'react';
import { FlaskConical, Search, Filter, CheckCircle2, FlaskConicalOff, Clock } from 'lucide-react';
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

export default function Laboratory() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'labRequests'), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
        console.error("Lab fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'labRequests', id), {
        status: status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Request marked as ${status}`);
    } catch (error) {
      handleFirestoreError(error, 'update', `labRequests/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Laboratory</h2>
          <p className="text-slate-500 mt-1">Manage diagnostic tests and results.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <Card key={req.id} className="border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Request #{req.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400">
                      {req.requestedAt?.seconds ? format(new Date(req.requestedAt.seconds * 1000), 'MMM dd, hh:mm a') : '...'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-bold uppercase text-[10px]",
                    req.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                  )}
                >
                  {req.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Requested Tests</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {req.tests?.map((test: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-medium">{test}</Badge>
                  ))}
                </div>
                {req.results && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold mb-1 text-slate-500">Preliminary Findings:</p>
                    <p className="text-xs text-slate-700 italic">{req.results}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-2">
                {req.status !== 'Completed' && (
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleUpdateStatus(req.id, 'Completed')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Record Results
                  </Button>
                )}
                <Button variant="outline" className="flex-1">View Full File</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed rounded-3xl border-slate-200">
            <FlaskConicalOff className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No Pending Requests</h3>
            <p className="text-slate-400 max-w-xs mx-auto">New diagnostic orders from the consultation room will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
