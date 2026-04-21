import * as React from 'react';
import { FlaskConical, Search, Filter, CheckCircle2, FlaskConicalOff, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Laboratory() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resultsModalOpen, setResultsModalOpen] = React.useState(false);
  const [selectedReq, setSelectedReq] = React.useState<any | null>(null);
  const [results, setResults] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

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

  const handleOpenResults = (req: any) => {
    setSelectedReq(req);
    setResults(req.results || '');
    setResultsModalOpen(true);
  };

  const handleSubmitResults = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'labRequests', selectedReq.id), {
        status: 'Completed',
        results: results,
        updatedAt: serverTimestamp()
      });
      toast.success(`Lab results submitted and request completed`);
      setResultsModalOpen(false);
      setSelectedReq(null);
      setResults('');
    } catch (error) {
      handleFirestoreError(error, 'update', `labRequests/${selectedReq.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Laboratory Portal</h2>
          <p className="text-slate-500 mt-2 font-medium">Diagnostic specimen analysis and tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <Card key={req.id} className="border-black rounded-none shadow-none flex flex-col bg-white">
            <div className="p-6 border-b border-black flex justify-between items-start">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">LAB #{req.id.slice(-6).toUpperCase()}</span>
                   <h4 className="text-xl font-black uppercase tracking-tight">{req.patientName || 'Anonymous'}</h4>
                </div>
                <Badge className="rounded-none border-black font-black uppercase text-[10px] tracking-widest bg-white text-black">
                    {req.status}
                </Badge>
            </div>
            
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Requested Test</span>
                <div className="p-4 bg-slate-900 text-white font-black uppercase tracking-tighter text-lg italic">
                    {req.testName || 'General Screening'}
                </div>
              </div>

              {req.results && (
                <div className="p-4 border-l-4 border-black bg-slate-50 mb-6 shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Results History</p>
                  <p className="text-sm font-bold leading-snug">{req.results}</p>
                </div>
              )}

              <div className="mt-auto pt-6 flex gap-2">
                {req.status !== 'Completed' && (
                  <Button className="flex-1 bg-black text-white hover:bg-slate-800 rounded-none uppercase text-[10px] font-black tracking-widest h-12" onClick={() => handleOpenResults(req)}>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Input Results
                  </Button>
                )}
                <Button variant="outline" className="flex-1 border-black rounded-none uppercase text-[10px] font-black tracking-widest h-12">Details</Button>
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

      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="max-w-xl border-2 border-black rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Lab Results Entry</DialogTitle>
            <p className="text-slate-500 text-sm">
                Patient: <span className="text-black font-bold uppercase">{selectedReq?.patientName}</span> • Test: <span className="text-black font-bold uppercase">{selectedReq?.testName}</span>
            </p>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostic Findings</Label>
              <Textarea 
                placeholder="Enter detailed test results and findings here..." 
                className="min-h-[200px] border-black rounded-none resize-none bg-slate-50 p-4 focus-visible:ring-0"
                value={results}
                onChange={(e) => setResults(e.target.value)}
              />
            </div>
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-900 text-xs italic">
                Note: Completing this step will notify the consulting physician and finalize the billing for this request.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-none border-black font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setResultsModalOpen(false)}>Cancel</Button>
            <Button 
                className="bg-black text-white hover:bg-slate-800 rounded-none font-black uppercase text-[10px] tracking-widest h-12 px-8"
                onClick={handleSubmitResults}
                disabled={submitting || !results.trim()}
            >
              {submitting ? 'Submitting...' : 'Complete & Submit Results'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
