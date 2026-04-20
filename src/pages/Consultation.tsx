import * as React from 'react';
import { 
  Stethoscope, 
  History, 
  Pill, 
  FlaskConical, 
  FileText, 
  Activity,
  Plus,
  Send,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Consultation() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [activeApt, setActiveApt] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Notes state
  const [notes, setNotes] = React.useState('');
  const [meds, setMeds] = React.useState<any[]>([]);

  React.useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'appointments'), 
      where('date', '==', today),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAppointments(apts);
      if (!activeApt && apts.length > 0) {
        // Find first person waiting or consulting
        const first = apts.find((a: any) => a.status === 'Consulting') || apts.find((a: any) => a.status === 'Checked In');
        if (first) setActiveApt(first);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartConsultation = async () => {
    if (!activeApt) return;
    try {
      await updateDoc(doc(db, 'appointments', activeApt.id), {
        status: 'Consulting',
        updatedAt: serverTimestamp()
      });
      toast.success("Consultation started");
    } catch (error) {
      handleFirestoreError(error, 'update', `appointments/${activeApt.id}`);
    }
  };

  const handleCompleteVisit = async () => {
    if (!activeApt) return;
    try {
      // 1. Save visit summary/notes
      // (In a real app we'd have a separate visitSummary collection)
      
      // 2. Clear Prescription if meds added
      if (meds.length > 0) {
        await addDoc(collection(db, 'prescriptions'), {
          appointmentId: activeApt.id,
          patientId: activeApt.patientId,
          medications: meds,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      }

      // 3. Update status
      await updateDoc(doc(db, 'appointments', activeApt.id), {
        status: 'Completed',
        notes: notes,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Visit marked as completed");
      setNotes('');
      setMeds([]);
      setActiveApt(null);
    } catch (error) {
      handleFirestoreError(error, 'update', `appointments/${activeApt.id}`);
    }
  };

  const addMeds = () => {
    setMeds([...meds, { name: 'New Medication', dosage: '1 tab', frequency: 'Daily', duration: '5 days' }]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-10rem)]">
      {/* Patient Sidebar Info */}
      <div className="lg:col-span-1 space-y-6">
        {activeApt ? (
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-2 bg-blue-600"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                  {activeApt.patientName?.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg">{activeApt.patientName}</CardTitle>
                  <CardDescription>Status: {activeApt.status}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeApt.status === 'Checked In' && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleStartConsultation}>
                  Call Patient In
                </Button>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Blood Pressure</p>
                  <p className="text-sm font-bold text-slate-700">{activeApt.vitals?.bp || 'N/A'}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Heart Rate</p>
                  <p className="text-sm font-bold text-slate-700">{activeApt.vitals?.hr || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Chief Complaint</p>
                <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
                  "{activeApt.chiefComplaint || 'No complaint noted'}"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-40 border-2 border-dashed rounded-xl flex items-center justify-center text-slate-400 text-sm">
            Select a patient from the queue
          </div>
        )}

        {/* Queue / Next Patients */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">Today's Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').map((p, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center justify-between p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50",
                    activeApt?.id === p.id && "bg-blue-50 border-blue-100 border-l-4 border-l-blue-600"
                  )}
                  onClick={() => setActiveApt(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold uppercase">
                      {p.patientName?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.patientName}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'hh:mm a') : '...'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] font-normal px-1.5 py-0",
                      p.status === 'Consulting' && "bg-emerald-50 text-emerald-700",
                      p.status === 'Checked In' && "bg-blue-50 text-blue-700"
                    )}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400 italic">No patients in queue</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Consultation Area */}
      <div className="lg:col-span-3 h-full">
        {activeApt?.status === 'Consulting' ? (
          <Tabs defaultValue="clinical-notes" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 w-full bg-slate-100 p-1 rounded-xl shrink-0">
              <TabsTrigger value="clinical-notes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ClipboardList className="w-4 h-4 mr-2" />
                Clinical Notes
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Pill className="w-4 h-4 mr-2" />
                Prescribe
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FlaskConical className="w-4 h-4 mr-2" />
                Diagnostics
              </TabsTrigger>
              <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-6">
              <TabsContent value="clinical-notes" className="m-0 h-full">
                <Card className="h-full flex flex-col border-slate-200">
                  <CardContent className="flex-1 space-y-6 pt-6 overflow-y-auto">
                    <div className="space-y-4">
                      <Label className="text-base font-bold text-slate-800">Symptoms & Observations</Label>
                      <Textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter detailed symptoms, onset, frequency..." 
                        className="min-h-[150px]"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-bold text-slate-800">Physical Examination</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="General Appearance" />
                        <Input placeholder="Pulse Rate" />
                        <Input placeholder="Respiration" />
                        <Input placeholder="Heart Sounds" />
                      </div>
                    </div>
                    <div className="space-y-4 mt-auto pt-6 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="outline">Save Draft</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">Next Stage</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="m-0 h-full">
                 <Card className="h-full border-slate-200">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Current Prescription</h3>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={addMeds}>
                        <Plus className="w-4 h-4 mr-2" /> Add Medication
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {meds.map((med, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{med.name}</p>
                              <p className="text-xs text-slate-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Remove</Button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <Label className="mb-2 block">Pharmacist Instructions</Label>
                      <Input placeholder="Special instructions for dispensing..." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="m-0 h-full">
                <Card className="h-full border-slate-200">
                  <CardContent className="pt-6">
                    <div className="p-6 bg-slate-50 rounded-2xl space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Visit Notes</h4>
                        <p className="text-slate-700 whitespace-pre-wrap">{notes || 'No notes taken'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Prescribed Medication</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {meds.map((m, i) => <li key={i} className="text-slate-700">{m.name} ({m.dosage})</li>)}
                          {meds.length === 0 && <li className="text-slate-400 italic">No medication prescribed</li>}
                        </ul>
                      </div>
                      <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={handleCompleteVisit}>
                        Complete Visit & Sign Records
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed rounded-3xl p-12">
            <Stethoscope className="w-16 h-16 text-slate-200 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No active consultation</h2>
            <p className="text-slate-500 max-w-sm">Please select a patient from the queue and click "Call Patient In" to start the clinical session.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

