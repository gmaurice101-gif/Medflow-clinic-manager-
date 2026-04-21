import * as React from 'react';
import { 
  Stethoscope, 
  History as HistoryIcon, 
  Pill, 
  FlaskConical, 
  FileText, 
  Activity,
  Plus,
  Send,
  ClipboardList,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  Trash2,
  Printer,
  Eye,
  ArrowLeft,
  Clock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, serverTimestamp, setDoc, addDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COMMON_LABS = [
  { id: 'fbc', name: 'FBC / FHG', price: 800 },
  { id: 'urinalysis', name: 'Urinalysis', price: 300 },
  { id: 'stool', name: 'Stool for O/C', price: 400 },
  { id: 'salmonella', name: 'Salmonella Typhi Ag Test', price: 600 },
  { id: 'rbs', name: 'Random Blood Sugar (RBS)', price: 200 },
];

const COMMON_PROCEDURES = [
  { id: 'inj', name: 'Injection', price: 200 },
  { id: 'wound', name: 'Wound Dressing', price: 500 },
  { id: 'stitch', name: 'Stitching', price: 1500 },
  { id: 'neb', name: 'Nebulization', price: 400 },
];

const CONSULTATION_FEE = 300;

// Printable Document Component
const ClinicalDocument = React.forwardRef<HTMLDivElement, { visit: any }>(({ visit }, ref) => {
  if (!visit) return null;

  return (
    <div ref={ref} className="p-12 text-slate-900 bg-white min-h-[297mm] font-sans">
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Medflow Clinic Manager</h1>
          <p className="text-sm font-bold text-slate-500 uppercase">Consultation Note • Confidential Patient Information</p>
        </div>
        <div className="text-right">
          <p className="font-black text-xl">{format(visit.updatedAt?.seconds ? new Date(visit.updatedAt.seconds * 1000) : new Date(), 'dd MMM yyyy')}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(visit.updatedAt?.seconds ? new Date(visit.updatedAt.seconds * 1000) : new Date(), 'hh:mm a')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Patient Details</h2>
          <p className="text-2xl font-bold">{visit.patientName}</p>
          <p className="text-sm text-slate-600 font-medium">Patient ID: {visit.patientId}</p>
        </div>
        <div className="text-right">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Facility Details</h2>
          <p className="text-lg font-bold">MedFlow Health Centre</p>
          <p className="text-sm text-slate-600 font-medium">Nairobi, Kenya</p>
        </div>
      </div>

      {/* Clinical Body */}
      <div className="space-y-10">
        <section>
          <h3 className="text-lg font-black uppercase border-b-2 border-slate-100 pb-1 mb-3">Chief Complaint</h3>
          <p className="text-slate-700 leading-relaxed font-semibold italic">"{visit.chiefComplaint || 'N/A'}"</p>
        </section>

        <section>
          <h3 className="text-lg font-black uppercase border-b-2 border-slate-100 pb-1 mb-3">Clinical History</h3>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{visit.patientHistory || 'No history recorded'}</p>
        </section>

        <section>
          <h3 className="text-lg font-black uppercase border-b-2 border-slate-100 pb-1 mb-3">Physical Examination & Systemic Review</h3>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{visit.notes || 'No notes recorded'}</p>
        </section>

        <div className="grid grid-cols-2 gap-12">
          <section>
            <h3 className="text-lg font-black uppercase border-b-2 border-slate-100 pb-1 mb-3">Orders & Procedures</h3>
            <ul className="space-y-1">
              {visit.selectedLabs?.map((l: any, i: number) => (
                <li key={i} className="text-sm font-medium flex items-center gap-2">
                  <div className="size-1 bg-slate-400 rounded-full" />
                  Laboratory: {l.name}
                </li>
              ))}
              {visit.selectedProcedures?.map((p: any, i: number) => (
                <li key={i} className="text-sm font-medium flex items-center gap-2">
                  <div className="size-1 bg-slate-400 rounded-full" />
                  Procedure: {p.name}
                </li>
              ))}
              {!visit.selectedLabs?.length && !visit.selectedProcedures?.length && (
                <li className="text-sm text-slate-400 italic">No orders initiated</li>
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-black uppercase border-b-2 border-slate-100 pb-1 mb-3">Prescription</h3>
            <ul className="space-y-1">
              {visit.medications?.map((m: any, i: number) => (
                <li key={i} className="text-sm font-medium">
                  <span className="font-bold">{m.name}</span> - {m.dosage} ({m.frequency} x {m.duration})
                </li>
              ))}
              {!visit.medications?.length && (
                <li className="text-sm text-slate-400 italic">No medication prescribed</li>
              )}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-auto pt-24">
        <div className="flex justify-between items-end border-t-2 border-slate-900 pt-4">
          <div className="text-[10px] font-black uppercase text-slate-400">Electronic Clinical Document ID: {visit.id || 'draft'}</div>
          <div className="text-right">
            <div className="w-48 h-px bg-slate-950 mb-2 ml-auto" />
            <p className="text-sm font-bold uppercase tracking-tighter italic">Doctor's Digital Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ClinicalDocument.displayName = 'ClinicalDocument';

export default function Consultation() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [activeApt, setActiveApt] = React.useState<any | null>(null);
  const [previousVisits, setPreviousVisits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Clinical Notes state
  const [notes, setNotes] = React.useState('');
  const [patientHistory, setPatientHistory] = React.useState('');
  const [chiefComplaint, setChiefComplaint] = React.useState('');
  
  // Pharmacy/Prescription state
  const [meds, setMeds] = React.useState<any[]>([]);
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [medSearch, setMedSearch] = React.useState('');
  
  // Procedures state
  const [selectedProcedures, setSelectedProcedures] = React.useState<any[]>([]);
  const [procSearch, setProcSearch] = React.useState('');
  
  // Diagnostics state
  const [imagingType, setImagingType] = React.useState('');
  const [labType, setLabType] = React.useState('');
  const [selectedLabs, setSelectedLabs] = React.useState<string[]>([]);

  // Printing logic
  const componentRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleDownloadPDF = async () => {
    if (!componentRef.current) return;
    
    try {
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.style) {
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.color?.includes('oklch')) el.style.color = '#000000';
              if (computedStyle.backgroundColor?.includes('oklch')) el.style.backgroundColor = 'transparent';
              if (computedStyle.borderColor?.includes('oklch')) el.style.borderColor = '#000000';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Record-${viewRecord?.patientName.replace(/\s+/g, '-')}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success("Clinical record saved as PDF");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const [viewRecord, setViewRecord] = React.useState<any | null>(null);

  React.useEffect(() => {
    // Listen for inventory for prescribing
    const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

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
        const first = apts.find((a: any) => a.status === 'Consulting') || apts.find((a: any) => a.status === 'Checked In');
        if (first) {
          handleSelectApt(first);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubInv();
    };
  }, []);

  // Separate effect for history when patient changes
  React.useEffect(() => {
    if (!activeApt?.patientId) return;

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', activeApt.patientId),
      where('status', '==', 'Completed'),
      orderBy('updatedAt', 'desc')
    );

    const unsubHistory = onSnapshot(q, (snap) => {
      setPreviousVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubHistory();
  }, [activeApt?.patientId]);

  const handleSelectApt = (apt: any) => {
    setActiveApt(apt);
    setChiefComplaint(apt.chiefComplaint || '');
    setPatientHistory(apt.patientHistory || '');
    setNotes(apt.notes || '');
    setMeds(apt.medications || []); 
    setSelectedProcedures(apt.selectedProcedures || []);
    setSelectedLabs(apt.selectedLabs?.map((l: any) => l.id) || []);
  };

  const handleSaveDraft = async () => {
    if (!activeApt) return;
    try {
      await updateDoc(doc(db, 'appointments', activeApt.id), {
        notes,
        chiefComplaint,
        patientHistory,
        medications: meds,
        selectedProcedures,
        selectedLabs: selectedLabs.map(id => COMMON_LABS.find(l => l.id === id)).filter(Boolean),
        updatedAt: serverTimestamp()
      });
      toast.success("Consultation progress saved to electronic record");
    } catch (error) {
      handleFirestoreError(error, 'update', `appointments/${activeApt.id}`);
    }
  };

  const handleCreateImagingRequest = async () => {
    if (!activeApt || !imagingType) return;
    try {
      await addDoc(collection(db, 'imagingRequests'), {
        appointmentId: activeApt.id,
        patientId: activeApt.patientId,
        patientName: activeApt.patientName,
        type: imagingType,
        status: 'Requested',
        requestedAt: serverTimestamp(),
      });
      toast.success("Imaging request sent to Radiology");
      setImagingType('');
    } catch (error) {
      handleFirestoreError(error, 'create', 'imagingRequests');
    }
  };

  const createInvoice = async (items: { name: string, price: number }[], type: string) => {
    if (!activeApt) return;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    try {
      await addDoc(collection(db, 'bills'), {
        patientId: activeApt.patientId,
        patientName: activeApt.patientName,
        appointmentId: activeApt.id,
        items,
        total,
        status: 'unpaid',
        type,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleCreateLabRequest = async () => {
    if (!activeApt || (selectedLabs.length === 0 && !labType)) return;
    try {
      const labsToSubmit = selectedLabs.map(id => COMMON_LABS.find(l => l.id === id)).filter(Boolean) as any[];
      if (labType) {
        labsToSubmit.push({ name: labType, price: 500 });
      }

      for (const lab of labsToSubmit) {
        await addDoc(collection(db, 'labRequests'), {
          appointmentId: activeApt.id,
          patientId: activeApt.patientId,
          patientName: activeApt.patientName,
          testName: lab.name,
          status: 'Requested',
          requestedAt: serverTimestamp(),
        });
      }

      const invoiceItems = [
        { name: 'Consultation Fee', price: CONSULTATION_FEE },
        ...labsToSubmit.map(l => ({ name: `Lab: ${l.name}`, price: l.price }))
      ];
      await createInvoice(invoiceItems, 'Laboratory & Consultation');

      toast.success("Lab request sent & Invoice generated");
      setSelectedLabs([]);
      setLabType('');
    } catch (error) {
      handleFirestoreError(error, 'create', 'labRequests');
    }
  };

  const handlePharmacySubmission = async () => {
    if (!activeApt || meds.length === 0) return;
    try {
      await addDoc(collection(db, 'prescriptions'), {
        appointmentId: activeApt.id,
        patientId: activeApt.patientId,
        medications: meds,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      const invoiceItems = meds.map(m => ({ 
        name: `Medication: ${m.name}`, 
        price: (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1) 
      }));
      
      await createInvoice(invoiceItems, 'Pharmacy');
      toast.success("Prescription sent to Pharmacy & Invoice generated");
      setMeds([]);
    } catch (error) {
      handleFirestoreError(error, 'create', 'prescriptions');
    }
  };

  const handleProcedureSubmission = async () => {
    if (!activeApt || selectedProcedures.length === 0) return;
    try {
      const invoiceItems = selectedProcedures.map(p => ({ 
        name: `Procedure: ${p.name}`, 
        price: p.price 
      }));
      
      await createInvoice(invoiceItems, 'Procedures');
      toast.success("Procedures submitted & Invoice generated");
      setSelectedProcedures([]);
    } catch (error) {
      handleFirestoreError(error, 'create', 'procedures');
    }
  };

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
      await updateDoc(doc(db, 'appointments', activeApt.id), {
        status: 'Completed',
        notes: notes,
        chiefComplaint: chiefComplaint,
        patientHistory: patientHistory,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Visit marked as completed");
      setNotes('');
      setPatientHistory('');
      setChiefComplaint('');
      setMeds([]);
      setActiveApt(null);
    } catch (error) {
      handleFirestoreError(error, 'update', `appointments/${activeApt.id}`);
    }
  };

  const toggleLab = (id: string) => {
    setSelectedLabs(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const addMedFromInventory = (item: any) => {
    if (meds.find(m => m.id === item.id)) return;
    setMeds([...meds, { 
      id: item.id, 
      name: item.name, 
      unitPrice: item.unitPrice,
      quantity: 1,
      dosage: '1 tab', 
      frequency: 'Daily', 
      duration: '5 days' 
    }]);
    setMedSearch('');
  };

  const addProcedure = (proc: any) => {
    if (selectedProcedures.find(p => p.id === proc.id)) return;
    setSelectedProcedures([...selectedProcedures, proc]);
    setProcSearch('');
  };

  const updateMedQuantity = (index: number, qty: number) => {
    const newMeds = [...meds];
    newMeds[index].quantity = qty;
    setMeds(newMeds);
  };

  const totalCurrentTreatment = () => {
    const labTotal = selectedLabs.reduce((sum, id) => sum + (COMMON_LABS.find(l => l.id === id)?.price || 0), 0);
    const procTotal = selectedProcedures.reduce((sum, p) => sum + p.price, 0);
    const medTotal = meds.reduce((sum, m) => sum + (m.unitPrice * (m.quantity || 1)), 0);
    return labTotal + procTotal + medTotal + (activeApt ? CONSULTATION_FEE : 0);
  };

  const addMeds = () => {
    setMeds([...meds, { name: 'New Medication', dosage: '1 tab', frequency: 'Daily', duration: '5 days' }]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-auto lg:h-[calc(100vh-10rem)] p-6 lg:p-0">
      {/* Patient Sidebar Info */}
      <div className="lg:col-span-1 space-y-6 overflow-y-auto lg:pr-2">
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
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="queue">
            <TabsList className="w-full rounded-none border-b grid grid-cols-2 h-10">
              <TabsTrigger value="queue" className="data-[state=active]:bg-slate-50 transition-none border-r">Queue</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-slate-50 transition-none">Patient History</TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="m-0">
               <ScrollArea className="h-64">
                {appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').map((p, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center justify-between p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50",
                      activeApt?.id === p.id && "bg-blue-50 border-blue-100 border-l-4 border-l-blue-600"
                    )}
                    onClick={() => handleSelectApt(p)}
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
            </TabsContent>
            <TabsContent value="history" className="m-0">
               <ScrollArea className="h-64">
                    {previousVisits.map((visit, i) => (
                        <div 
                            key={i}
                            className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer group transition-all"
                            onClick={() => setViewRecord(visit)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-slate-800">{format(visit.updatedAt?.seconds ? new Date(visit.updatedAt.seconds * 1000) : new Date(), 'dd MMM yyyy')}</p>
                                <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{visit.chiefComplaint || 'No complaint noted'}"</p>
                        </div>
                    ))}
                    {!activeApt && (
                        <p className="p-8 text-center text-xs text-slate-400 italic">Select a patient to see history</p>
                    )}
                    {activeApt && previousVisits.length === 0 && (
                        <p className="p-8 text-center text-xs text-slate-400 italic">No previous records found</p>
                    )}
               </ScrollArea>
            </TabsContent>
          </Tabs>
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
                Prescribe & Proc
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FlaskConical className="w-4 h-4 mr-2" />
                Labs & Radiology
              </TabsTrigger>
              <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Total & Sign
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-6">
              <TabsContent value="clinical-notes" className="m-0 h-full">
                <Card className="h-full flex flex-col border-slate-200">
                  <ScrollArea className="flex-1">
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-4">
                        <Label className="text-base font-bold text-slate-800">Chief Complaint</Label>
                        <Textarea 
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          placeholder="Why is the patient at the clinic today?" 
                          className="min-h-[100px] border-amber-100 bg-amber-50/30"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-base font-bold text-slate-800">Patient History</Label>
                        <Textarea 
                          value={patientHistory}
                          onChange={(e) => setPatientHistory(e.target.value)}
                          placeholder="Past medical history, allergies, current medications..." 
                          className="min-h-[150px]"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-base font-bold text-slate-800">Systemic Review & Findings</Label>
                        <Textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Examination findings, systemic review..." 
                          className="min-h-[150px]"
                        />
                      </div>
                    </CardContent>
                  </ScrollArea>
                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={handleSaveDraft}>Save Session Draft</Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="m-0 h-full">
                 <div className="grid grid-cols-2 gap-6 h-full">
                    {/* Pharmacy Sector */}
                    <Card className="flex flex-col border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Pill className="text-emerald-600" />
                          Pharmacy Prescription
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Search medication..." 
                            className="pl-10"
                            value={medSearch}
                            onChange={(e) => setMedSearch(e.target.value)}
                          />
                          {medSearch && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {inventory
                                .filter(i => i.name.toLowerCase().includes(medSearch.toLowerCase()))
                                .map(item => (
                                  <div 
                                    key={item.id}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                                    onClick={() => addMedFromInventory(item)}
                                  >
                                    <div>
                                      <p className="font-bold text-sm">{item.name}</p>
                                      <p className="text-[10px] text-slate-500">{item.quantity} in stock • KSh {item.unitPrice}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-emerald-600" />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <ScrollArea className="flex-1 pr-2">
                          <div className="space-y-3">
                            {meds.map((med, i) => (
                              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-bold text-slate-900">{med.name}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                    onClick={() => setMeds(meds.filter((_, idx) => idx !== i))}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Dosage</Label>
                                    <Input 
                                      placeholder="1 tab" 
                                      value={med.dosage} 
                                      onChange={(e) => {
                                        const n = [...meds];
                                        n[i].dosage = e.target.value;
                                        setMeds(n);
                                      }}
                                      className="h-8 text-xs bg-white" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Qty</Label>
                                    <Input 
                                      placeholder="Qty" 
                                      type="number"
                                      value={med.quantity} 
                                      onChange={(e) => updateMedQuantity(i, Number(e.target.value))}
                                      className="h-8 text-xs bg-white" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Frequency</Label>
                                    <Input 
                                      placeholder="e.g. 3 times daily" 
                                      value={med.frequency} 
                                      onChange={(e) => {
                                        const n = [...meds];
                                        n[i].frequency = e.target.value;
                                        setMeds(n);
                                      }}
                                      className="h-8 text-xs bg-white" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Duration</Label>
                                    <Input 
                                      placeholder="e.g. 5 days" 
                                      value={med.duration} 
                                      onChange={(e) => {
                                        const n = [...meds];
                                        n[i].duration = e.target.value;
                                        setMeds(n);
                                      }}
                                      className="h-8 text-xs bg-white" 
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" onClick={handlePharmacySubmission}>
                          Submit to Pharmacy
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Procedures Sector */}
                    <Card className="flex flex-col border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="text-blue-600" />
                          Procedures
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Select common procedure..." 
                            className="pl-10"
                            value={procSearch}
                            onChange={(e) => setProcSearch(e.target.value)}
                          />
                          {procSearch && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {COMMON_PROCEDURES
                                .filter(p => p.name.toLowerCase().includes(procSearch.toLowerCase()))
                                .map(p => (
                                  <div 
                                    key={p.id}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                                    onClick={() => addProcedure(p)}
                                  >
                                    <div>
                                      <p className="font-bold text-sm">{p.name}</p>
                                      <p className="text-[10px] text-slate-500">KSh {p.price}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-blue-600" />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <ScrollArea className="flex-1 pr-2">
                          <div className="space-y-3">
                            {selectedProcedures.map((proc, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{proc.name}</p>
                                  <p className="text-[10px] text-slate-500">Fixed Cost: KSh {proc.price}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-red-400"
                                  onClick={() => setSelectedProcedures(selectedProcedures.filter((_, idx) => idx !== i))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2" onClick={handleProcedureSubmission}>
                          Submit & Charge Procedures
                        </Button>
                      </CardContent>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent value="diagnostics" className="m-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FlaskConical className="text-purple-600" />
                        Common Laboratory Tests
                      </CardTitle>
                      <CardDescription>Select one or more tests to order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                        {COMMON_LABS.map((lab) => (
                          <div 
                            key={lab.id} 
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center",
                              selectedLabs.includes(lab.id) 
                                ? "bg-purple-50 border-purple-600 shadow-sm" 
                                : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                            onClick={() => toggleLab(lab.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                selectedLabs.includes(lab.id) ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300"
                              )}>
                                {selectedLabs.includes(lab.id) && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="font-medium text-slate-700">{lab.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">KSh {lab.price}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Other Lab Tests</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={labType}
                            onChange={(e) => setLabType(e.target.value)}
                            placeholder="Custom test name..." 
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4" onClick={handleCreateLabRequest}>
                        Submit to Lab & Calculate Billing
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="text-orange-600" />
                        Radiology Order
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mb-4">
                        <p className="text-sm text-orange-800">
                          Radiology orders will be immediately visible to the technician. Billing is processed upon imaging completion.
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-0 border border-slate-200 rounded-lg overflow-hidden group">
                        <div className="col-span-3 border-r border-slate-200">
                            <Input 
                                value={imagingType}
                                onChange={(e) => setImagingType(e.target.value)}
                                placeholder="X-RAY CHEST / CT / MRI..." 
                                className="border-none bg-white rounded-none h-12 font-bold uppercase focus-visible:ring-0"
                            />
                        </div>
                        <Button 
                            className="h-12 bg-slate-900 text-white hover:bg-black rounded-none border-none transition-all flex items-center justify-center" 
                            onClick={handleCreateImagingRequest}
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="m-0 h-full">
                <Card className="h-full border-slate-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-slate-50 rounded-2xl space-y-6">
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Clinical Outlook</h4>
                            <div className="space-y-2">
                                <p className="text-sm"><strong>Chief Complaint:</strong> {chiefComplaint || 'N/A'}</p>
                                <p className="text-sm line-clamp-3"><strong>History:</strong> {patientHistory || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Active Orders</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedLabs.map(id => (
                                    <Badge key={id} variant="secondary" className="bg-purple-100 text-purple-700">Lab: {COMMON_LABS.find(l => l.id === id)?.name}</Badge>
                                ))}
                                {selectedProcedures.map(p => (
                                    <Badge key={p.id} variant="secondary" className="bg-blue-100 text-blue-700">Proc: {p.name}</Badge>
                                ))}
                                {meds.map((m, i) => (
                                    <Badge key={i} variant="secondary" className="bg-emerald-100 text-emerald-700">Drug: {m.name}</Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-1">
                        <Card className="bg-slate-950 text-white border-none shadow-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-slate-400 text-xs uppercase tracking-widest">Total Estimated Treatment Cost</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                              <span className="text-3xl font-black">KSh {totalCurrentTreatment().toLocaleString()}</span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-8 font-black uppercase text-[10px]"
                                onClick={() => setViewRecord({
                                    id: activeApt.id,
                                    patientId: activeApt.patientId,
                                    patientName: activeApt.patientName,
                                    chiefComplaint,
                                    patientHistory,
                                    notes,
                                    medications: meds,
                                    selectedLabs: selectedLabs.map(id => COMMON_LABS.find(l => l.id === id)).filter(Boolean),
                                    selectedProcedures,
                                    updatedAt: { seconds: Date.now() / 1000 }
                                })}
                              >
                                  <Eye className="w-3 h-3 mr-2" />
                                  Preview Record
                              </Button>
                            </div>
                            <div className="space-y-2 text-[10px] text-slate-500 uppercase font-bold">
                              <div className="flex justify-between">
                                  <span>Consultation Fee</span>
                                  <span>KSh {CONSULTATION_FEE}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Diagnosis & Tests</span>
                                  <span>KSh {selectedLabs.reduce((sum, id) => sum + (COMMON_LABS.find(l => l.id === id)?.price || 0), 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Procedures & Drugs</span>
                                  <span>KSh {(selectedProcedures.reduce((sum, p) => sum + p.price, 0) + meds.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0)).toLocaleString()}</span>
                              </div>
                            </div>
                            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleCompleteVisit}>
                              Complete & Sign Visit
                            </Button>
                            <p className="text-[10px] text-center text-slate-500 italic">
                                Signing this visit sends all pending bills to the finance department.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
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

      {/* Persistence Modal for History/Viewer */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-[800px] w-[95vw] h-[90vh] flex flex-col p-0 border-none overflow-hidden rounded-2xl shadow-3xl">
          <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Clinical Viewer</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-8 font-black uppercase text-[10px]" 
                onClick={handleDownloadPDF}
              >
                <Download className="w-3 h-3 mr-2" /> Save PDF
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 font-black uppercase text-[10px]" onClick={handlePrint}>
                <Printer className="w-3 h-3 mr-2" /> Print Record
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
            <div className="flex justify-center">
              <div className="bg-white shadow-2xl rounded-sm">
                <ClinicalDocument ref={componentRef} visit={viewRecord} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

